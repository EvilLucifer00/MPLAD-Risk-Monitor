from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Optional, Sequence

import numpy as np
import pandas as pd
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components
from sklearn.neighbors import BallTree

logger = logging.getLogger("duplicate_ghost_work_detector")
logging.basicConfig(level=logging.INFO)

EARTH_RADIUS_KM = 6371.0088

GEO_PRECISION_TIERS = {
    "exact":                   {"radius_km": 0.5,  "geo_weight_scale": 1.00},
    "unique_or_small_cluster": {"radius_km": 1.0,  "geo_weight_scale": 0.85},
    "shared_site":             {"radius_km": 5.0,  "geo_weight_scale": 0.45},
    "coarse_region_centroid":  {"radius_km": 25.0, "geo_weight_scale": 0.12},
}
DEFAULT_PRECISION_TIER = "coarse_region_centroid"


@dataclass
class DetectorConfig:
    geo_radius_km: float = 0.5
    dbscan_min_samples: int = 2
    dbscan_eps_km: Optional[float] = None
    precision_tiers: dict = field(default_factory=lambda: dict(GEO_PRECISION_TIERS))
    use_precision_aware_geo: bool = True
    pair_chunk_size: int = 200_000

    embed_model_name: str = "all-MiniLM-L6-v2"
    semantic_threshold: float = 0.82
    batch_size: int = 128
    device: Optional[str] = None

    cost_tolerance_pct: float = 0.15
    date_tolerance_days: float = 45.0

    w_semantic: float = 0.55
    w_cost: float = 0.20
    w_date: float = 0.10
    w_geo_proximity: float = 0.15

    duplicate_score_threshold: float = 0.65


class SBERTEncoder:
    """Thin wrapper around sentence-transformers with lazy import + caching."""

    def __init__(self, model_name: str, device: Optional[str], batch_size: int):
        self.model_name = model_name
        self.device = device
        self.batch_size = batch_size
        self._model = None

    def _load(self):
        if self._model is None:
            from sentence_transformers import SentenceTransformer
            logger.info("Loading Sentence-BERT model '%s'...", self.model_name)
            self._model = SentenceTransformer(self.model_name, device=self.device)
        return self._model

    def encode(self, texts: Sequence[str]) -> np.ndarray:
        model = self._load()
        emb = model.encode(
            list(texts),
            batch_size=self.batch_size,
            show_progress_bar=False,
            normalize_embeddings=True,
            convert_to_numpy=True,
        )
        return emb.astype(np.float32)


class DuplicateGhostWorkDetector:
    """
    Detects duplicate / ghost MPLADS works by combining:
      - Sentence-BERT semantic similarity of work descriptions
      - Geospatial proximity (haversine radius query for pair-scoring;
        real sklearn.cluster.DBSCAN for the dashboard-facing
        geo_cluster_id — see `_geo_cluster_labels`)
      - Cost and date corroboration

    Usage
    -----
        det = DuplicateGhostWorkDetector()
        work_features, pair_evidence = det.fit_predict(df)

    `df` must contain columns:
        work_id, description, latitude, longitude, cost, sanction_date
    (sanction_date should be datetime64 or parseable by pd.to_datetime)
    """

    REQUIRED_COLS = {"work_id", "description", "latitude", "longitude", "cost", "sanction_date"}
    OPTIONAL_COLS = {"geo_precision"}

    def __init__(self, config: Optional[DetectorConfig] = None, encoder: Optional[SBERTEncoder] = None):
        self.cfg = config or DetectorConfig()
        self.encoder = encoder or SBERTEncoder(
            self.cfg.embed_model_name, self.cfg.device, self.cfg.batch_size
        )

    def _validate(self, df: pd.DataFrame) -> None:
        missing = self.REQUIRED_COLS - set(df.columns)
        if missing:
            raise ValueError(f"Input dataframe missing required columns: {missing}")
        if df["work_id"].duplicated().any():
            raise ValueError("work_id must be unique per row.")
        if "geo_precision" in df.columns:
            unknown = set(df["geo_precision"].dropna().unique()) - set(self.cfg.precision_tiers)
            if unknown:
                logger.warning(
                    "geo_precision values %s are not in configured tiers %s; "
                    "these rows will fall back to '%s'.",
                    unknown, list(self.cfg.precision_tiers), DEFAULT_PRECISION_TIER,
                )

    def _resolved_precision(self, df: pd.DataFrame) -> pd.Series:
        """Per-row precision tier, defaulting unknown/missing to the most
        conservative tier rather than the most trusting one."""
        if "geo_precision" in df.columns and self.cfg.use_precision_aware_geo:
            return df["geo_precision"].apply(
                lambda v: v if v in self.cfg.precision_tiers else DEFAULT_PRECISION_TIER
            )
        return pd.Series([DEFAULT_PRECISION_TIER] * len(df), index=df.index)

    def _geo_candidate_pairs(self, df: pd.DataFrame, precision: pd.Series) -> np.ndarray:
        """
        BallTree haversine radius query. Returns an (m, 2) int array of row-index
        pairs (i < j) that are candidates for duplication given each row's
        precision tier. This is the O(n log n) blocking step.

        Precision-aware behaviour: each row is searched at ITS OWN tier radius
        (the coarser of the two rows in a pair ends up governing whether the
        pair is found at all, since a query from a coarse-tier point reaches
        further). If `use_precision_aware_geo` is False, every row uses the
        flat `cfg.geo_radius_km`, matching the original behaviour.
        """
        if len(df) == 0:
            return np.empty((0, 2), dtype=int)

        coords_rad = np.radians(df[["latitude", "longitude"]].to_numpy())
        tree = BallTree(coords_rad, metric="haversine")

        if self.cfg.use_precision_aware_geo:
            radii_km = precision.map(lambda t: self.cfg.precision_tiers[t]["radius_km"]).to_numpy()
        else:
            radii_km = np.full(len(df), self.cfg.geo_radius_km)
        radii_rad = radii_km / EARTH_RADIUS_KM

        neighbors = tree.query_radius(coords_rad, r=radii_rad)

        pairs = []
        for i, neigh in enumerate(neighbors):
            for j in neigh:
                if j > i:
                    pairs.append((i, j))
        if not pairs:
            return np.empty((0, 2), dtype=int)
        return np.array(pairs, dtype=int)

    def _geo_cluster_labels(self, df: pd.DataFrame) -> np.ndarray:
        """
        REAL sklearn.cluster.DBSCAN over haversine distance, purely for
        dashboard grouping ('these N works sit at effectively the same
        site'). -1 = noise (DBSCAN's own convention, kept as-is).

        This is deliberately separate from `_geo_candidate_pairs`, which
        drives pair SCORING and needs a per-row radius that varies by
        `geo_precision` tier — a single global `eps` (as true DBSCAN
        requires) can't express that. For a descriptive cluster label,
        one sensible eps is fine, so real DBSCAN is used here directly:
        it correctly distinguishes core points (>= min_samples neighbours
        within eps) from border/noise points, which the earlier
        connected-components version did not.

        `cfg.dbscan_eps_km` sets that single eps; by default it's the
        widest configured precision-tier radius, so the cluster labels
        stay at least as inclusive as the coarsest pair-scoring radius.
        """
        from sklearn.cluster import DBSCAN

        n = len(df)
        if n == 0:
            return np.array([], dtype=int)

        eps_km = self.cfg.dbscan_eps_km
        if eps_km is None:
            eps_km = max(t["radius_km"] for t in self.cfg.precision_tiers.values())
        eps_rad = eps_km / EARTH_RADIUS_KM

        coords_rad = np.radians(df[["latitude", "longitude"]].to_numpy())
        db = DBSCAN(
            eps=eps_rad,
            min_samples=self.cfg.dbscan_min_samples,
            metric="haversine",
            algorithm="ball_tree",
        )
        labels = db.fit_predict(coords_rad)
        return labels

    def _score_pairs(
        self, df: pd.DataFrame, pairs: np.ndarray, embeddings: np.ndarray, precision: pd.Series
    ) -> pd.DataFrame:
        if len(pairs) == 0:
            return pd.DataFrame(
                columns=[
                    "work_id_a", "work_id_b", "semantic_similarity",
                    "cost_similarity", "date_proximity", "geo_proximity",
                    "geo_distance_km", "geo_precision_pair", "duplicate_score",
                ]
            )

        i_all, j_all = pairs[:, 0], pairs[:, 1]
        cfg = self.cfg
        work_ids = df["work_id"].to_numpy()
        cost_arr = df["cost"].to_numpy()
        dates = pd.to_datetime(df["sanction_date"]).to_numpy()
        lat_arr = np.radians(df["latitude"].to_numpy())
        lon_arr = np.radians(df["longitude"].to_numpy())
        precision_arr = precision.to_numpy()

        chunks = []
        n_pairs = len(i_all)
        for start in range(0, n_pairs, cfg.pair_chunk_size):
            end = min(start + cfg.pair_chunk_size, n_pairs)
            i_idx, j_idx = i_all[start:end], j_all[start:end]

            sem_sim = np.einsum("ij,ij->i", embeddings[i_idx], embeddings[j_idx])
            sem_sim = np.clip(sem_sim, -1.0, 1.0)

            keep = sem_sim >= cfg.semantic_threshold * 0.85
            if not keep.any():
                continue
            i_idx, j_idx, sem_sim = i_idx[keep], j_idx[keep], sem_sim[keep]

            cost_a, cost_b = cost_arr[i_idx], cost_arr[j_idx]
            denom = np.maximum(np.maximum(cost_a, cost_b), 1e-6)
            rel_gap = np.abs(cost_a - cost_b) / denom
            cost_sim = np.clip(1.0 - rel_gap / cfg.cost_tolerance_pct, 0.0, 1.0)

            gap_days = np.abs((dates[i_idx] - dates[j_idx]) / np.timedelta64(1, "D"))
            date_prox = np.clip(1.0 - gap_days / cfg.date_tolerance_days, 0.0, 1.0)

            dlat = lat_arr[i_idx] - lat_arr[j_idx]
            dlon = lon_arr[i_idx] - lon_arr[j_idx]
            a = np.sin(dlat / 2) ** 2 + np.cos(lat_arr[i_idx]) * np.cos(lat_arr[j_idx]) * np.sin(dlon / 2) ** 2
            dist_km = 2 * EARTH_RADIUS_KM * np.arcsin(np.sqrt(np.clip(a, 0, 1)))

            if cfg.use_precision_aware_geo:
                tier_a = precision_arr[i_idx]
                tier_b = precision_arr[j_idx]
                radius_a = np.array([cfg.precision_tiers[t]["radius_km"] for t in tier_a])
                radius_b = np.array([cfg.precision_tiers[t]["radius_km"] for t in tier_b])
                pair_radius_km = np.maximum(radius_a, radius_b)
                weight_a = np.array([cfg.precision_tiers[t]["geo_weight_scale"] for t in tier_a])
                weight_b = np.array([cfg.precision_tiers[t]["geo_weight_scale"] for t in tier_b])
                pair_geo_weight_scale = np.minimum(weight_a, weight_b)
                pair_tier_label = np.where(radius_a >= radius_b, tier_a, tier_b)
            else:
                pair_radius_km = np.full(len(i_idx), cfg.geo_radius_km)
                pair_geo_weight_scale = np.ones(len(i_idx))
                pair_tier_label = np.full(len(i_idx), "n/a", dtype=object)

            geo_prox = np.clip(1.0 - dist_km / pair_radius_km, 0.0, 1.0)
            effective_w_geo = cfg.w_geo_proximity * pair_geo_weight_scale

            duplicate_score = (
                cfg.w_semantic * sem_sim
                + cfg.w_cost * cost_sim
                + cfg.w_date * date_prox
                + effective_w_geo * geo_prox
            )

            chunks.append(pd.DataFrame(
                {
                    "work_id_a": work_ids[i_idx],
                    "work_id_b": work_ids[j_idx],
                    "semantic_similarity": sem_sim,
                    "cost_similarity": cost_sim,
                    "date_proximity": date_prox,
                    "geo_proximity": geo_prox,
                    "geo_distance_km": dist_km,
                    "geo_precision_pair": pair_tier_label,
                    "duplicate_score": duplicate_score,
                }
            ))

        if not chunks:
            return pd.DataFrame(
                columns=[
                    "work_id_a", "work_id_b", "semantic_similarity",
                    "cost_similarity", "date_proximity", "geo_proximity",
                    "geo_distance_km", "geo_precision_pair", "duplicate_score",
                ]
            )
        result = pd.concat(chunks, ignore_index=True)
        return result.sort_values("duplicate_score", ascending=False).reset_index(drop=True)

    def _group_duplicates(self, df: pd.DataFrame, pair_scores: pd.DataFrame) -> pd.DataFrame:
        n = len(df)
        work_id_to_idx = {wid: i for i, wid in enumerate(df["work_id"])}

        flagged = pair_scores[pair_scores["duplicate_score"] >= self.cfg.duplicate_score_threshold]

        if flagged.empty:
            return pd.DataFrame(
                {
                    "work_id": df["work_id"],
                    "duplicate_score": 0.0,
                    "is_duplicate_flagged": False,
                    "duplicate_group_id": -1,
                    "duplicate_group_size": 1,
                    "best_match_work_id": None,
                }
            )

        i_idx = flagged["work_id_a"].map(work_id_to_idx).to_numpy()
        j_idx = flagged["work_id_b"].map(work_id_to_idx).to_numpy()
        rows = np.concatenate([i_idx, j_idx])
        cols = np.concatenate([j_idx, i_idx])
        data = np.ones(len(rows), dtype=np.int8)
        graph = coo_matrix((data, (rows, cols)), shape=(n, n))
        _, labels = connected_components(graph, directed=False)

        max_score = np.zeros(n, dtype=float)
        best_match = np.full(n, None, dtype=object)
        for _, row in flagged.iterrows():
            a, b, s = work_id_to_idx[row.work_id_a], work_id_to_idx[row.work_id_b], row.duplicate_score
            if s > max_score[a]:
                max_score[a], best_match[a] = s, row.work_id_b
            if s > max_score[b]:
                max_score[b], best_match[b] = s, row.work_id_a

        group_sizes = pd.Series(labels).map(pd.Series(labels).value_counts())
        is_flagged = max_score >= self.cfg.duplicate_score_threshold
        group_id_out = np.where(is_flagged, labels, -1)
        group_size_out = np.where(is_flagged, group_sizes.to_numpy(), 1)

        return pd.DataFrame(
            {
                "work_id": df["work_id"].to_numpy(),
                "duplicate_score": max_score,
                "is_duplicate_flagged": is_flagged,
                "duplicate_group_id": group_id_out,
                "duplicate_group_size": group_size_out,
                "best_match_work_id": best_match,
            }
        )

    def fit_predict(self, df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
        """
        Parameters
        ----------
        df : DataFrame with columns work_id, description, latitude, longitude,
             cost, sanction_date

        Returns
        -------
        work_features : one row per input work — feed straight into E1
                         (composite XGBoost risk scorer) as extra columns.
        pair_evidence  : one row per flagged pair — for SHAP-style explanation
                         and for the authority dashboards to show "why".
        """
        self._validate(df)
        df = df.reset_index(drop=True)
        precision = self._resolved_precision(df)

        if self.cfg.use_precision_aware_geo:
            logger.info(
                "geo_precision tier distribution: %s",
                precision.value_counts().to_dict(),
            )

        logger.info("Encoding %d descriptions with Sentence-BERT...", len(df))
        embeddings = self.encoder.encode(df["description"].fillna("").tolist())

        logger.info("Building geo candidate pairs (precision-aware radius)...")
        pairs = self._geo_candidate_pairs(df, precision)
        logger.info(
            "Geo blocking produced %d candidate pairs out of %d possible (%.4f%% of n^2)",
            len(pairs), len(df) * (len(df) - 1) // 2,
            100 * len(pairs) / max(1, len(df) * (len(df) - 1) // 2),
        )

        pair_scores = self._score_pairs(df, pairs, embeddings, precision)
        work_features = self._group_duplicates(df, pair_scores)
        work_features["geo_cluster_id"] = self._geo_cluster_labels(df)

        n_flagged = int(work_features["is_duplicate_flagged"].sum())
        logger.info("Flagged %d/%d works as duplicate/ghost candidates.", n_flagged, len(df))

        return work_features, pair_scores[pair_scores["duplicate_score"] >= self.cfg.duplicate_score_threshold]


def combine_outputs(work_features: pd.DataFrame, pair_evidence: pd.DataFrame) -> pd.DataFrame:
    evidence_cols = [
        "semantic_similarity", "cost_similarity", "date_proximity",
        "geo_proximity", "geo_distance_km", "geo_precision_pair",
    ]
    if pair_evidence.empty:
        out = work_features.copy()
        for c in evidence_cols:
            out[c] = np.nan
        return out

    ev_ab = pair_evidence.rename(columns={"work_id_a": "work_id", "work_id_b": "best_match_work_id"})
    ev_ba = pair_evidence.rename(columns={"work_id_b": "work_id", "work_id_a": "best_match_work_id"})
    lookup = pd.concat([ev_ab, ev_ba], ignore_index=True).drop_duplicates(
        subset=["work_id", "best_match_work_id"]
    )

    return work_features.merge(
        lookup[["work_id", "best_match_work_id"] + evidence_cols],
        on=["work_id", "best_match_work_id"],
        how="left",
    )


if __name__ == "__main__":
    import sys

    input_csv = sys.argv[1] if len(sys.argv) > 1 else "engine_d2_training_full_labeled.csv"
    output_csv = sys.argv[2] if len(sys.argv) > 2 else "duplicate_ghost_work_output.csv"

    print(f"Loading {input_csv} ...")
    df = pd.read_csv(input_csv)
    df["sanction_date"] = pd.to_datetime(df["sanction_date"])

    detector = DuplicateGhostWorkDetector()
    work_features, pair_evidence = detector.fit_predict(df)

    combined = combine_outputs(work_features, pair_evidence)
    combined.to_csv(output_csv, index=False)

    print(f"\nSaved combined output -> {output_csv}")
    print(f"Rows: {len(combined)}  |  Flagged: {int(combined['is_duplicate_flagged'].sum())}")
    print("\nColumns in output file:")
    print(list(combined.columns))
    print("\nSample flagged rows:")
    print(combined[combined["is_duplicate_flagged"]].head(5).to_string(index=False))
