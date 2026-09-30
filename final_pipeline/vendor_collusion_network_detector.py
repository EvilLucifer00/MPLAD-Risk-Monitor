
from __future__ import annotations

import logging
import pickle
from dataclasses import dataclass, field
from itertools import combinations
from typing import Optional

import numpy as np
import pandas as pd
import networkx as nx

logger = logging.getLogger("vendor_collusion_network_detector")
logging.basicConfig(level=logging.INFO)


@dataclass
class VendorCollusionConfig:
    min_shared_channels: int = 2

    louvain_resolution: float = 1.0
    louvain_seed: int = 42

    thin_capital_percentile: float = 0.10

    w_clustering_coeff: float = 0.10
    w_within_community_frac: float = 0.05
    w_channel_concentration: float = 0.10
    w_capital_to_volume: float = 0.15
    w_blacklisted: float = 0.05
    w_shell_company: float = 0.15
    w_capture_share: float = 0.40

    risk_score_threshold: float = 0.65
    top_k: Optional[int] = None


class VendorCollusionNetworkDetector:

    EXP_REQUIRED_COLS = {
        "MP Name", "Constituency", "State", "IDA", "Vendor",
        "Expenditure Amount (₹)", "Expenditure Date",
    }
    REG_REQUIRED_COLS = {
        "Vendor", "Paid_Up_Capital", "Registration_Date", "Is_Blacklisted", "Is_Shell_Company",
    }

    def __init__(self, config: Optional[VendorCollusionConfig] = None):
        self.cfg = config or VendorCollusionConfig()

    def _validate(self, exp: pd.DataFrame, reg: pd.DataFrame) -> None:
        missing_exp = self.EXP_REQUIRED_COLS - set(exp.columns)
        if missing_exp:
            raise ValueError(f"expenditures dataframe missing required columns: {missing_exp}")
        missing_reg = self.REG_REQUIRED_COLS - set(reg.columns)
        if missing_reg:
            raise ValueError(f"vendor_registry dataframe missing required columns: {missing_reg}")
        if reg["Vendor"].duplicated().any():
            raise ValueError("vendor_registry must have one row per Vendor (no duplicates).")

    def _channel_concentration_features(self, exp: pd.DataFrame) -> pd.DataFrame:
        exp = exp.copy()
        exp["channel"] = exp["MP Name"] + " || " + exp["IDA"]

        grp = exp.groupby("Vendor")
        n_transactions = grp.size().rename("num_transactions")
        total_amount = grp["Expenditure Amount (₹)"].sum().rename("total_amount")
        n_mps = grp["MP Name"].nunique().rename("num_distinct_mps")
        n_idas = grp["IDA"].nunique().rename("num_distinct_idas")
        n_constituencies = grp["Constituency"].nunique().rename("num_distinct_constituencies")

        mp_names = grp["MP Name"].apply(lambda s: "; ".join(sorted(s.unique()))).rename("mp_names")

        def herfindahl(s: pd.Series) -> float:
            counts = s.value_counts()
            shares = counts / counts.sum()
            return float((shares ** 2).sum())

        channel_concentration = grp["channel"].apply(herfindahl).rename("channel_concentration_hhi")
        top_channel_share = grp["channel"].apply(
            lambda s: s.value_counts().iloc[0] / len(s)
        ).rename("top_channel_share")

        return pd.concat(
            [n_transactions, total_amount, n_mps, n_idas, n_constituencies, mp_names,
             channel_concentration, top_channel_share],
            axis=1,
        ).reset_index()

    def _capture_share_features(self, exp: pd.DataFrame) -> pd.DataFrame:
        mp_totals = exp.groupby("MP Name")["Expenditure Amount (₹)"].sum()
        ida_totals = exp.groupby("IDA")["Expenditure Amount (₹)"].sum()

        by_mp = exp.groupby(["Vendor", "MP Name"])["Expenditure Amount (₹)"].sum().reset_index()
        by_mp["mp_total"] = by_mp["MP Name"].map(mp_totals)
        by_mp["mp_capture_share"] = by_mp["Expenditure Amount (₹)"] / by_mp["mp_total"]
        max_mp_share = by_mp.groupby("Vendor")["mp_capture_share"].max().rename("max_mp_capture_share")

        primary_mp_idx = by_mp.groupby("Vendor")["mp_capture_share"].idxmax()
        primary_mp = (
            by_mp.loc[primary_mp_idx, ["Vendor", "MP Name"]]
            .set_index("Vendor")["MP Name"]
            .rename("primary_mp")
        )

        by_ida = exp.groupby(["Vendor", "IDA"])["Expenditure Amount (₹)"].sum().reset_index()
        by_ida["ida_total"] = by_ida["IDA"].map(ida_totals)
        by_ida["ida_capture_share"] = by_ida["Expenditure Amount (₹)"] / by_ida["ida_total"]
        max_ida_share = by_ida.groupby("Vendor")["ida_capture_share"].max().rename("max_ida_capture_share")

        return pd.concat([max_mp_share, primary_mp, max_ida_share], axis=1).reset_index()

    def _build_vendor_vendor_graph(self, exp: pd.DataFrame) -> nx.Graph:
        exp = exp.copy()
        exp["channel"] = exp["MP Name"] + " || " + exp["IDA"]

        G = nx.Graph()
        G.add_nodes_from(exp["Vendor"].unique())

        edge_weights: dict[tuple[str, str], int] = {}
        for _, vendors in exp.groupby("channel")["Vendor"].unique().items():
            if len(vendors) < 2:
                continue
            for a, b in combinations(sorted(vendors), 2):
                key = (a, b)
                edge_weights[key] = edge_weights.get(key, 0) + 1

        for (a, b), w in edge_weights.items():
            if w >= self.cfg.min_shared_channels:
                G.add_edge(a, b, weight=w)

        logger.info(
            "Vendor-vendor projection graph: %d nodes, %d edges",
            G.number_of_nodes(), G.number_of_edges(),
        )
        return G

    def _graph_features(self, G: nx.Graph) -> pd.DataFrame:
        n = G.number_of_nodes()
        if n == 0:
            return pd.DataFrame(columns=[
                "Vendor", "graph_degree", "graph_weighted_degree",
                "clustering_coefficient", "community_id", "community_size",
                "community_density", "within_community_edge_fraction",
            ])

        degree = dict(G.degree())
        weighted_degree = dict(G.degree(weight="weight"))
        clustering = nx.clustering(G, weight="weight")

        logger.info("Running Louvain community detection...")
        communities = nx.algorithms.community.louvain_communities(
            G, weight="weight", resolution=self.cfg.louvain_resolution, seed=self.cfg.louvain_seed
        )
        node_to_community = {}
        community_size = {}
        community_density = {}
        for cid, members in enumerate(communities):
            for node in members:
                node_to_community[node] = cid
            community_size[cid] = len(members)
            sub = G.subgraph(members)
            community_density[cid] = nx.density(sub) if len(members) > 1 else 0.0
        logger.info("Found %d communities", len(communities))

        within_frac = {}
        for node in G.nodes():
            nbrs = list(G.neighbors(node))
            if not nbrs:
                within_frac[node] = 0.0
                continue
            same_comm = sum(1 for nb in nbrs if node_to_community[nb] == node_to_community[node])
            within_frac[node] = same_comm / len(nbrs)

        rows = []
        for node in G.nodes():
            cid = node_to_community[node]
            rows.append({
                "Vendor": node,
                "graph_degree": degree[node],
                "graph_weighted_degree": weighted_degree[node],
                "clustering_coefficient": clustering[node],
                "community_id": cid,
                "community_size": community_size[cid],
                "community_density": community_density[cid],
                "within_community_edge_fraction": within_frac[node],
            })
        return pd.DataFrame(rows)

    def _registry_features(self, reg: pd.DataFrame, exp_features: pd.DataFrame) -> pd.DataFrame:
        reg = reg.copy()
        reg["Registration_Date"] = pd.to_datetime(reg["Registration_Date"])
        ref_date = reg["Registration_Date"].max()
        reg["registration_age_days"] = (ref_date - reg["Registration_Date"]).dt.days

        merged = reg.merge(
            exp_features[["Vendor", "total_amount"]], on="Vendor", how="left"
        )
        merged["total_amount"] = merged["total_amount"].fillna(0.0)
        merged["capital_to_volume_ratio"] = merged["Paid_Up_Capital"] / merged["total_amount"].replace(0, np.nan)
        merged["capital_to_volume_ratio"] = merged["capital_to_volume_ratio"].fillna(merged["capital_to_volume_ratio"].max())

        thin_cutoff = merged["Paid_Up_Capital"].quantile(self.cfg.thin_capital_percentile)
        merged["is_thin_capital"] = merged["Paid_Up_Capital"] <= thin_cutoff

        return merged[[
            "Vendor", "Paid_Up_Capital", "registration_age_days",
            "Is_Blacklisted", "Is_Shell_Company", "capital_to_volume_ratio", "is_thin_capital",
        ]]

    @staticmethod
    def _rank_normalise(s: pd.Series) -> pd.Series:
        if s.nunique() <= 1:
            return pd.Series(0.0, index=s.index)
        return s.rank(pct=True)

    def fit_predict(self, expenditures: pd.DataFrame, vendor_registry: pd.DataFrame) -> pd.DataFrame:
        self._validate(expenditures, vendor_registry)

        logger.info("Computing channel-concentration features for %d vendors...",
                    expenditures["Vendor"].nunique())
        concentration = self._channel_concentration_features(expenditures)
        capture_share = self._capture_share_features(expenditures)

        G = self._build_vendor_vendor_graph(expenditures)
        graph_feats = self._graph_features(G)

        registry_feats = self._registry_features(vendor_registry, concentration)

        out = concentration.merge(capture_share, on="Vendor", how="left")
        out = out.merge(graph_feats, on="Vendor", how="left")
        out = out.merge(registry_feats, on="Vendor", how="left")

        for col, default in [
            ("graph_degree", 0), ("graph_weighted_degree", 0), ("clustering_coefficient", 0.0),
            ("community_id", -1), ("community_size", 1), ("community_density", 0.0),
            ("within_community_edge_fraction", 0.0),
        ]:
            out[col] = out[col].fillna(default)

        cfg = self.cfg
        out["collusion_risk_score"] = (
            cfg.w_clustering_coeff * self._rank_normalise(out["clustering_coefficient"])
            + cfg.w_within_community_frac * self._rank_normalise(out["within_community_edge_fraction"])
            + cfg.w_channel_concentration * self._rank_normalise(out["channel_concentration_hhi"])
            + cfg.w_capital_to_volume * (1.0 - self._rank_normalise(out["capital_to_volume_ratio"]))
            + cfg.w_blacklisted * out["Is_Blacklisted"].astype(float)
            + cfg.w_shell_company * out["Is_Shell_Company"].astype(float)
            + cfg.w_capture_share * self._rank_normalise(
                out[["max_mp_capture_share", "max_ida_capture_share"]].max(axis=1)
            )
        )

        if cfg.top_k is not None:
            cutoff_score = out["collusion_risk_score"].nlargest(cfg.top_k).min()
            out["is_flagged_collusion"] = out["collusion_risk_score"] >= cutoff_score
        else:
            out["is_flagged_collusion"] = out["collusion_risk_score"] >= cfg.risk_score_threshold

        out = out.sort_values("collusion_risk_score", ascending=False).reset_index(drop=True)
        out["risk_rank"] = np.arange(1, len(out) + 1)

        n_flagged = int(out["is_flagged_collusion"].sum())
        logger.info("Flagged %d/%d vendors as collusion risks.", n_flagged, len(out))

        return out


def validate_against_ground_truth(
    vendor_features: pd.DataFrame, expenditures: pd.DataFrame, label_col: str = "Is_Collusion_Injected"
) -> None:
    if label_col not in expenditures.columns:
        logger.info("No ground-truth column '%s' found; skipping validation.", label_col)
        return

    truth = expenditures.groupby("Vendor")[label_col].any().rename("has_injected_collusion")
    merged = vendor_features.merge(truth, on="Vendor", how="left")
    merged["has_injected_collusion"] = merged["has_injected_collusion"].fillna(False)

    n_positive = int(merged["has_injected_collusion"].sum())
    print(f"\n=== Validation against ground truth ({n_positive} known-colluding vendors) ===")
    positives = merged[merged["has_injected_collusion"]].sort_values("risk_rank")
    print(positives[["Vendor", "risk_rank", "collusion_risk_score", "is_flagged_collusion"]].to_string(index=False))

    for k in (5, 10, 20, 50):
        top_k = merged.nsmallest(k, "risk_rank")
        recall_at_k = top_k["has_injected_collusion"].sum() / max(n_positive, 1)
        print(f"Recall@{k}: {recall_at_k:.2%}  ({top_k['has_injected_collusion'].sum()}/{n_positive} found in top {k})")


if __name__ == "__main__":
    import sys

    exp_csv = sys.argv[1] if len(sys.argv) > 1 else "augmented_expenditures.csv"
    reg_csv = sys.argv[2] if len(sys.argv) > 2 else "vendor_registry.csv"
    output_csv = sys.argv[3] if len(sys.argv) > 3 else "vendor_collusion_output.csv"
    output_pkl = sys.argv[4] if len(sys.argv) > 4 else "vendor_collusion_detector.pkl"

    print(f"Loading {exp_csv} and {reg_csv} ...")
    exp = pd.read_csv(exp_csv)
    reg = pd.read_csv(reg_csv)

    detector = VendorCollusionNetworkDetector()
    vendor_features = detector.fit_predict(exp, reg)
    vendor_features.to_csv(output_csv, index=False)

    with open(output_pkl, "wb") as f:
        pickle.dump(detector, f)
    print(f"Saved fitted detector (config) -> {output_pkl}")

    print(f"\nSaved -> {output_csv}")
    print(f"Rows: {len(vendor_features)}  |  Flagged: {int(vendor_features['is_flagged_collusion'].sum())}")
    print("\nTop 10 highest-risk vendors:")
    print(vendor_features.head(10).to_string(index=False))

    validate_against_ground_truth(vendor_features, exp)
