import pandas as pd
import numpy as np
import os
import warnings

# Suppress ARIMA convergence warnings for clean output
warnings.filterwarnings("ignore")

try:
    from statsmodels.tsa.arima.model import ARIMA
except ImportError:
    print("ERROR: 'statsmodels' library is missing. Please run: pip install statsmodels")
    exit(1)

def run_engine_4(input_csv, output_csv):
    print(f"Loading data from {input_csv}...")
    try:
        df = pd.read_csv(input_csv)
    except FileNotFoundError:
        print(f"Error: Could not find {input_csv}")
        return

    print("Aggregating expenditures into Monthly Time-Series per MP...")
    df['Expenditure Date'] = pd.to_datetime(df['Expenditure Date'], errors='coerce')
    df = df.dropna(subset=['Expenditure Date'])
    
    # Create Year-Month column for aggregation
    df['YearMonth'] = df['Expenditure Date'].dt.to_period('M')
    
    # Aggregate
    monthly_data = df.groupby(['MP Name', 'YearMonth'])['Expenditure Amount (₹)'].sum().reset_index()
    monthly_data['YearMonth'] = monthly_data['YearMonth'].dt.to_timestamp()
    
    unique_mps = monthly_data['MP Name'].unique()
    
    print("Injecting 'Election Fund Dump' Anomaly (Fraud)...")
    np.random.seed(42)
    corrupt_mps = np.random.choice(unique_mps, size=5, replace=False)
    
    # Inject a massive spike in the last recorded month for these 5 MPs
    for mp in corrupt_mps:
        mp_data = monthly_data[monthly_data['MP Name'] == mp].sort_values('YearMonth')
        if not mp_data.empty:
            last_idx = mp_data.index[-1]
            # Inject a 5 Crore spike
            monthly_data.at[last_idx, 'Expenditure Amount (₹)'] += 50000000 
            
    print(f"Injected 5 Crore fund dumps into {len(corrupt_mps)} MPs.\n")
    
    print("Running ARIMA Forecaster across all MPs to detect anomalies...")
    
    results = []
    anomalies_detected = 0
    
    # To keep hackathon execution fast, we'll only process MPs that have at least 6 months of data
    for idx, mp in enumerate(unique_mps):
        if idx % 100 == 0 and idx > 0:
            print(f"Processed {idx} / {len(unique_mps)} MPs...")
            
        mp_ts = monthly_data[monthly_data['MP Name'] == mp].sort_values('YearMonth')
        
        # Need enough data points to fit an ARIMA model
        if len(mp_ts) < 6:
            results.append({
                'MP Name': mp,
                'Trend_Anomaly_Score': 0,
                'Fund_Dump_Anomaly': False
            })
            continue
            
        # Time series array
        y = mp_ts['Expenditure Amount (₹)'].values
        
        # We want to see if the LAST month is anomalous. 
        # So we train the model on all months EXCEPT the last one, and forecast the last one.
        y_train = y[:-1]
        y_test_actual = y[-1]
        
        try:
            # Fit simple ARIMA(1,0,0) (Autoregressive)
            model = ARIMA(y_train, order=(1,0,0))
            model_fit = model.fit()
            
            # Forecast the next step (the last month)
            forecast_obj = model_fit.get_forecast(steps=1)
            predicted_mean = forecast_obj.predicted_mean[0]
            
            # Get the upper bound of the 99% confidence interval
            conf_int = forecast_obj.conf_int(alpha=0.01)
            upper_bound = conf_int[0][1]
            
            # If the actual spending exceeds the 99% upper bound, it's an anomaly!
            is_anomaly = y_test_actual > upper_bound
            
            # Calculate severity score (how many times larger than the upper bound)
            severity = (y_test_actual / upper_bound) if upper_bound > 0 else 0
            score = min(int(severity), 5) if is_anomaly else 0 # Max score of 5
            
            if is_anomaly:
                anomalies_detected += 1
                
            results.append({
                'MP Name': mp,
                'Trend_Anomaly_Score': score,
                'Fund_Dump_Anomaly': is_anomaly
            })
            
        except Exception as e:
            # ARIMA can fail to converge on perfectly flat data
            results.append({
                'MP Name': mp,
                'Trend_Anomaly_Score': 0,
                'Fund_Dump_Anomaly': False
            })

    results_df = pd.DataFrame(results)
    
    print(f"\n--- Engine 4 Results ---")
    print(f"Total MPs Analyzed (with sufficient history): {len(results_df[results_df['Trend_Anomaly_Score'] >= 0])}")
    print(f"Total 'Fund Dump' Anomalies Detected: {anomalies_detected}")
    
    high_risk = results_df[results_df['Fund_Dump_Anomaly'] == True].sort_values(by='Trend_Anomaly_Score', ascending=False)
    if len(high_risk) > 0:
        print("\nTop Fund Dump Anomalies (Spikes exceeding 99% Confidence Interval):")
        print(high_risk.head(10))

    os.makedirs(os.path.dirname(output_csv), exist_ok=True)
    results_df.to_csv(output_csv, index=False)
    print(f"\nEngine 4 results saved to {output_csv}")

if __name__ == '__main__':
    in_exp = '../../data/augmented_data/augmented_expenditures.csv'
    out_csv = '../../data/output_results/engine4_trend_results.csv'
    
    run_engine_4(in_exp, out_csv)
