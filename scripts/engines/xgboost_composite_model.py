import pandas as pd
import numpy as np
import os
import matplotlib.pyplot as plt
import xgboost as xgb

try:
    import shap
except ImportError:
    print("WARNING: 'shap' library not found. SHAP explainability will be skipped.")
    shap = None

def run_composite_model():
    print("Loading data from all 4 Engines...")
    try:
        # Engine 1 & 2 operate at the Work level (tied to District)
        # We'll use Engine 2's output since it contains Engine 1's output as well (augmented pipeline)
        df_works = pd.read_csv('../../data/output_results/engine2_duplicate_results.csv')
        
        # Engine 3 & 4 operate at the MP level (tied to Constituency/District)
        df_cartel = pd.read_csv('../../data/output_results/engine3_vendor_results.csv')
        df_trend = pd.read_csv('../../data/output_results/engine4_trend_results.csv')
        
        # And the base expenditures to map MP -> Constituency
        df_exp = pd.read_csv('../../data/augmented_data/augmented_expenditures.csv')
    except FileNotFoundError as e:
        print(f"Error loading files: {e}")
        return

    print("Aggregating Engine 1 & 2 Anomalies by District...")
    
    # Engine 1: Cost Anomalies
    if 'Isolation_Forest_Anomaly' in df_works.columns:
        cost_anomalies = df_works.groupby('district')['Isolation_Forest_Anomaly'].sum().reset_index()
    else:
        cost_anomalies = pd.DataFrame({'district': df_works['district'].unique(), 'Isolation_Forest_Anomaly': 0})
        
    # Engine 2: Ghost Works (Composite_Duplicate_Risk >= 2)
    df_works['Is_Ghost_Work'] = df_works['Composite_Duplicate_Risk'] >= 2
    ghost_works = df_works.groupby('district')['Is_Ghost_Work'].sum().reset_index()
    
    print("Mapping MPs to their Constituencies (Districts)...")
    # Get mapping from Expenditures
    mp_district_map = df_exp[['MP Name', 'Constituency']].drop_duplicates()
    
    # Merge Engine 3 (Cartel) and Engine 4 (Trend)
    df_mp = pd.merge(df_cartel, df_trend, on='MP Name', how='outer').fillna(0)
    df_mp = pd.merge(df_mp, mp_district_map, on='MP Name', how='left')
    
    # Merge Work-Level Anomalies (Engine 1 & 2) into the MP data using Constituency -> district
    df_mp = pd.merge(df_mp, cost_anomalies, left_on='Constituency', right_on='district', how='left').fillna(0)
    df_mp = pd.merge(df_mp, ghost_works, left_on='Constituency', right_on='district', how='left').fillna(0)
    
    # Drop redundant district columns
    if 'district_x' in df_mp.columns: df_mp = df_mp.drop(columns=['district_x'])
    if 'district_y' in df_mp.columns: df_mp = df_mp.drop(columns=['district_y'])
    if 'district' in df_mp.columns: df_mp = df_mp.drop(columns=['district'])

    print("Generating Features and Target Label...")
    # Features for XGBoost
    features = [
        'Isolation_Forest_Anomaly',  # Engine 1: Count of Cost Anomalies
        'Is_Ghost_Work',             # Engine 2: Count of Ghost Works
        'Collusion_Risk_Score',      # Engine 3: Cartel Score
        'Trend_Anomaly_Score'        # Engine 4: Fund Dump Score
    ]
    
    # Target Label (Did we inject fraud for this MP/District?)
    # If any of the scores are severely high (since we injected extreme values), we label them True_Fraud = 1
    # This simulates a historical dataset of caught fraudsters
    df_mp['True_Fraud_Label'] = (
        (df_mp['Is_Ghost_Work'] >= 1) | 
        (df_mp['Collusion_Risk_Score'] >= 4) | 
        (df_mp['Fund_Dump_Anomaly'] == True)
    ).astype(int)
    
    X = df_mp[features]
    y = df_mp['True_Fraud_Label']
    
    print(f"Training XGBoost Classifier on {len(X)} MPs...")
    model = xgb.XGBClassifier(
        n_estimators=100, 
        max_depth=4, 
        learning_rate=0.1, 
        random_state=42,
        eval_metric='logloss'
    )
    model.fit(X, y)
    
    # Predict Probability of Fraud (0.0 to 1.0)
    df_mp['Final_Risk_Probability'] = model.predict_proba(X)[:, 1]
    
    # Convert to 0-100 Score
    df_mp['Composite_Risk_Score'] = (df_mp['Final_Risk_Probability'] * 100).round(2)
    
    high_risk = df_mp[df_mp['Composite_Risk_Score'] > 80].sort_values(by='Composite_Risk_Score', ascending=False)
    
    print("\n--- Final XGBoost Composite Results ---")
    print(f"Total MPs Scored: {len(df_mp)}")
    print(f"Critical Risk MPs (>80% Probability): {len(high_risk)}")
    
    if len(high_risk) > 0:
        print("\nTop 10 Most Corrupt MPs Detected:")
        display_cols = ['MP Name', 'Constituency', 'Composite_Risk_Score'] + features
        print(high_risk[display_cols].head(10))

    if shap is not None:
        print("\nGenerating SHAP Explanations (Feature Importance)...")
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(X)
        
        # Save Global Feature Importance Plot
        plt.figure(figsize=(10, 6))
        shap.summary_plot(shap_values, X, show=False)
        plt.title('SHAP Feature Importance (What drives the Fraud Score?)')
        plt.tight_layout()
        plot_path = '../../data/output_results/shap_feature_importance.png'
        plt.savefig(plot_path)
        print(f"Saved SHAP plot to {plot_path}")
        
        # Attach Top Driving Feature to the CSV for the Dashboard
        feature_names = np.array(features)
        top_features = []
        for i in range(len(X)):
            # Get index of highest positive SHAP value for this instance
            top_idx = np.argmax(shap_values[i])
            if shap_values[i][top_idx] > 0:
                top_features.append(feature_names[top_idx])
            else:
                top_features.append("None")
        df_mp['Primary_Risk_Driver'] = top_features
        
    out_csv = '../../data/output_results/final_composite_risk_scores.csv'
    df_mp.to_csv(out_csv, index=False)
    print(f"\nFinal Composite Risk Dashboard saved to {out_csv}")

if __name__ == '__main__':
    run_composite_model()
