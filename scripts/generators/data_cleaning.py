import pandas as pd
import numpy as np
import os

def clean_data(input_csv, output_csv):
    print(f"Loading data from {input_csv}...")
    try:
        df = pd.read_csv(input_csv)
    except FileNotFoundError:
        print(f"Error: Could not find {input_csv}. Please ensure your data is placed there.")
        return

    print("Cleaning data...")
    # Clean string 'N/A' to np.nan
    df.replace('N/A', np.nan, inplace=True)
    
    # Ensure numeric columns are properly typed
    numeric_cols = [
        'Allocated Amount (₹)', 'Amount Recommended (₹)', 'Total Expenditure (₹)',
        'Completed Works', 'Recommended Works', 'Completion Rate %', 
        'Balance Not Yet Paid to Vendors (₹)'
    ]
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
        
    # Create necessary output directories if they don't exist
    os.makedirs(os.path.dirname(output_csv), exist_ok=True)

    df.to_csv(output_csv, index=False)
    print(f"Cleaned data saved to {output_csv}")

if __name__ == '__main__':
    # Standard folder structure paths
    input_path = '../../data/original_data/mplads_mp_summary_2026-09-16.csv'
    output_path = '../../data/augmented_data/cleaned_mp_data.csv'
    
    # Execute the cleaning
    clean_data(input_path, output_path)
