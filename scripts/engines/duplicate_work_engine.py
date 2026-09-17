import pandas as pd
import numpy as np
import os
import uuid
import hashlib
from sklearn.cluster import DBSCAN
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

try:
    from sentence_transformers import SentenceTransformer
    BERT_AVAILABLE = True
except ImportError:
    BERT_AVAILABLE = False
    print("WARNING: 'sentence-transformers' library is not installed or failed to load.")
    print("Falling back to ultra-fast TF-IDF for text similarity.")
    print("To enable BERT embeddings, please manually run: pip install sentence-transformers")

def generate_simulated_features(df):
    print("Simulating Geo-Coordinates and Image Hashes...")
    np.random.seed(42)
    
    # Simulate a base lat/lon for each district to make DBSCAN meaningful
    unique_districts = df['district'].dropna().unique()
    district_base_coords = {
        d: (np.random.uniform(8.0, 37.0), np.random.uniform(68.0, 97.0)) # Rough India bounding box
        for d in unique_districts
    }
    
    lats = []
    lons = []
    image_hashes = []
    
    for _, row in df.iterrows():
        # 1. Geo-coordinates (Base district + small random noise for exact location)
        d = row['district']
        base_lat, base_lon = district_base_coords.get(d, (20.0, 80.0))
        lat = base_lat + np.random.uniform(-0.1, 0.1)
        lon = base_lon + np.random.uniform(-0.1, 0.1)
        lats.append(lat)
        lons.append(lon)
        
        # 2. Image Hashes (pHash simulation)
        # We create a random hash for normal works
        random_hash = hashlib.md5(str(uuid.uuid4()).encode()).hexdigest()[:16]
        image_hashes.append(random_hash)
        
    df['latitude'] = lats
    df['longitude'] = lons
    df['image_hash'] = image_hashes
    
    # 3. Force anomalies for our injected "Fraud" rows to test the engine
    # We will grab a few normal hashes and assign them to the anomalous rows
    # to simulate the exact same image being uploaded for different works.
    if 'is_anomaly_injected' in df.columns:
        anomalies = df[df['is_anomaly_injected'] == True].index
        normal_hashes = df.loc[df['is_anomaly_injected'] == False, 'image_hash'].values
        
        if len(normal_hashes) > 0 and len(anomalies) > 0:
            for idx in anomalies:
                # Force collision with a random normal hash
                forced_collision = np.random.choice(normal_hashes)
                df.at[idx, 'image_hash'] = forced_collision
                
                # Force geo-collision (same exact location)
                normal_idx = df[df['image_hash'] == forced_collision].index[0]
                df.at[idx, 'latitude'] = df.at[normal_idx, 'latitude'] + np.random.uniform(-0.0001, 0.0001)
                df.at[idx, 'longitude'] = df.at[normal_idx, 'longitude'] + np.random.uniform(-0.0001, 0.0001)

    return df

def run_engine_2(input_csv, output_csv):
    print(f"Loading data from {input_csv}...")
    try:
        df = pd.read_csv(input_csv)
    except FileNotFoundError:
        print(f"Error: Could not find {input_csv}.")
        return

    # Simulate missing SIH advanced features
    df = generate_simulated_features(df)
    
    print("\nStarting Triple-Detection Pipeline...")
    
    df['Text_Similarity_Anomaly'] = False
    df['Geo_Cluster_Anomaly'] = False
    df['Image_Forensic_Anomaly'] = False
    
    # ---------------------------------------------------------
    # A. IMAGE FORENSICS (Hash Collision)
    # ---------------------------------------------------------
    print("Running Image Forensics (pHash collision detection)...")
    # Find hashes that appear more than once
    hash_counts = df['image_hash'].value_counts()
    duplicate_hashes = hash_counts[hash_counts > 1].index
    df.loc[df['image_hash'].isin(duplicate_hashes), 'Image_Forensic_Anomaly'] = True
    print(f"-> Found {df['Image_Forensic_Anomaly'].sum()} works with duplicate image hashes.")

    # ---------------------------------------------------------
    # B & C. GEO-CLUSTERING & TEXT SIMILARITY (Grouped by District)
    # ---------------------------------------------------------
    if BERT_AVAILABLE:
        print("Loading Sentence-BERT model (this may take a moment)...")
        model = SentenceTransformer('all-MiniLM-L6-v2')
    
    districts = df['district'].dropna().unique()
    print(f"Processing Text Similarity & Geo-Clustering across {len(districts)} districts...")
    
    # For progress tracking
    total_text_anomalies = 0
    total_geo_anomalies = 0

    for district in districts:
        district_mask = df['district'] == district
        district_df = df[district_mask]
        
        if len(district_df) < 2:
            continue
            
        indices = district_df.index
        
        # -- Geo-Clustering (DBSCAN) --
        # eps 0.001 is roughly 100 meters. min_samples 2 means any 2 works within 100m is a cluster
        coords = district_df[['latitude', 'longitude']].values
        db = DBSCAN(eps=0.001, min_samples=2).fit(coords)
        
        # Labels != -1 means it belongs to a tight cluster
        is_geo_clustered = db.labels_ != -1
        df.loc[indices[is_geo_clustered], 'Geo_Cluster_Anomaly'] = True
        total_geo_anomalies += sum(is_geo_clustered)
        
        # -- Text Similarity (BERT or TF-IDF) --
        descriptions = district_df['Work Description'].fillna('').values
        
        if BERT_AVAILABLE:
            embeddings = model.encode(descriptions)
            sim_matrix = cosine_similarity(embeddings)
        else:
            vectorizer = TfidfVectorizer(stop_words='english')
            try:
                tfidf_matrix = vectorizer.fit_transform(descriptions)
                sim_matrix = cosine_similarity(tfidf_matrix)
            except ValueError:
                # Happens if descriptions are empty or all stop words
                continue
                
        # Find highly similar pairs (> 85% similarity)
        # We fill the diagonal with 0 to ignore self-similarity
        np.fill_diagonal(sim_matrix, 0)
        
        # Find works that have at least one other work > 85% similar
        is_text_similar = (sim_matrix > 0.85).any(axis=1)
        df.loc[indices[is_text_similar], 'Text_Similarity_Anomaly'] = True
        total_text_anomalies += sum(is_text_similar)

    print(f"-> Found {total_geo_anomalies} works suspiciously close to each other.")
    print(f"-> Found {total_text_anomalies} works with near-identical descriptions in the same district.")

    # ---------------------------------------------------------
    # COMPOSITE SCORING
    # ---------------------------------------------------------
    print("\nCalculating Composite Duplicate Risk...")
    df['Composite_Duplicate_Risk'] = (
        df['Text_Similarity_Anomaly'].astype(int) + 
        df['Geo_Cluster_Anomaly'].astype(int) + 
        df['Image_Forensic_Anomaly'].astype(int)
    )
    
    # 3 = Critical Risk (all 3 triggered), 2 = High Risk, 1 = Low Risk, 0 = Normal
    high_risk = df[df['Composite_Duplicate_Risk'] >= 2]
    
    print(f"\n--- Engine 2 Results ---")
    print(f"Total Works analyzed: {len(df)}")
    print(f"High/Critical Risk Ghost Works Detected: {len(high_risk)}")
    
    print("\nTop Ghost Works Detected (Composite Risk >= 2):")
    display_cols = ['Work ID', 'category', 'Composite_Duplicate_Risk', 'Text_Similarity_Anomaly', 'Image_Forensic_Anomaly']
    print(high_risk[display_cols].head())

    os.makedirs(os.path.dirname(output_csv), exist_ok=True)
    df.to_csv(output_csv, index=False)
    print(f"\nEngine 2 results saved to {output_csv}")

if __name__ == '__main__':
    input_path = '../../data/output_results/engine1_augmented_results.csv'
    output_path = '../../data/output_results/engine2_duplicate_results.csv'
    
    run_engine_2(input_path, output_path)
