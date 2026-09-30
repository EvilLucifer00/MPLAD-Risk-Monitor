import pandas as pd
import os
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, confusion_matrix

def run_cost_anomaly_engine(input_csv, output_csv):
    print(f"Loading augmented data from {input_csv}...")
    try:
        df = pd.read_csv(input_csv)
    except FileNotFoundError:
        print(f"Error: Could not find {input_csv}. Please run augment_real_works_data.py first.")
        return

    print("Selecting features for Anomaly Detection...")
    
    # Features engineered in the augmented dataset that point to cost anomalies
    features = [
        'unit_cost',
        'sor_rate',
        'expected_cost',
        'cost_deviation_pct'
    ]

    # Drop any rows with missing values in these features
    df = df.dropna(subset=features).copy()
    X = df[features]
    
    print("Scaling features...")
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    print("Running Isolation Forest (Cost Anomaly Detector)...")
    # contamination=0.05 because we injected ~5% anomalies
    iso_forest = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
    
    df['Anomaly_Label'] = iso_forest.fit_predict(X_scaled)
    df['Anomaly_Score'] = iso_forest.decision_function(X_scaled)

    anomalies = df[df['Anomaly_Label'] == -1].sort_values(by='Anomaly_Score')

    print(f"\n--- Engine 1 Results (Work-Level) ---")
    print(f"Total Works analyzed: {len(df)}")
    print(f"Total Anomalies flagged by Engine: {len(anomalies)}")
    
    # If the synthetic 'is_anomaly_injected' column exists, let's see how well it did!
    if 'is_anomaly_injected' in df.columns:
        # Convert Isolation Forest output (-1 for anomaly, 1 for normal) to True/False
        df['Predicted_Anomaly'] = df['Anomaly_Label'] == -1
        print("\n--- Detection Engine Evaluation vs Ground Truth ---")
        print(confusion_matrix(df['is_anomaly_injected'], df['Predicted_Anomaly']))
        print(classification_report(df['is_anomaly_injected'], df['Predicted_Anomaly'], target_names=['Normal', 'Anomaly']))

    print("\nTop 5 Most Anomalous Records Flagged:")
    display_cols = ['Work ID', 'category', 'sanction_amount', 'cost_deviation_pct', 'Anomaly_Score']
    if 'is_anomaly_injected' in df.columns: 
        display_cols.append('is_anomaly_injected')
        
    print(anomalies[display_cols].head())

    # Create directory if it doesn't exist
    out_dir = os.path.dirname(output_csv)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)
    
    # Save the new csv with anomaly scores
    df.to_csv(output_csv, index=False)
    print(f"\nEngine results saved to {output_csv}")
    return df

if __name__ == '__main__':
    import sys
    # Parametrized to match the CLI pattern of the other 3 engines
    # (originally hardcoded to '../../data/augmented_data/...' paths):
    #   python cost_anomaly_detector.py input.csv output.csv
    input_path = sys.argv[1] if len(sys.argv) > 1 else '../../data/augmented_data/augmented_completed_works.csv'
    output_path = sys.argv[2] if len(sys.argv) > 2 else '../../data/output_results/engine1_augmented_results.csv'

    run_cost_anomaly_engine(input_path, output_path)
