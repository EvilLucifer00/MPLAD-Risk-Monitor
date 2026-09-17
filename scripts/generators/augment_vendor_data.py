import pandas as pd
import numpy as np
import os
import uuid
from datetime import datetime, timedelta

def augment_vendor_data(input_csv, out_expenditures, out_registry):
    print(f"Loading expenditures from {input_csv}...")
    df = pd.read_csv(input_csv)
    
    # Fix column name if needed due to encoding
    if 'Expenditure Amount (?)' in df.columns:
        df.rename(columns={'Expenditure Amount (?)': 'Expenditure Amount (₹)'}, inplace=True)
        
    df['Expenditure Amount (₹)'] = pd.to_numeric(df['Expenditure Amount (₹)'], errors='coerce')
    df = df[df['Expenditure Amount (₹)'] > 0].copy()
    
    # Ensure every row has a vendor
    df['Vendor'] = df['Vendor'].fillna('Unknown_Vendor_' + pd.Series(np.random.randint(1, 1000, size=len(df))).astype(str))
    
    unique_vendors = df['Vendor'].unique()
    print(f"Found {len(unique_vendors)} unique vendors. Generating Registry...")
    
    # Generate Vendor Registry
    registry_data = []
    np.random.seed(42)
    
    for vendor in unique_vendors:
        capital = np.random.uniform(500000, 50000000)
        days_old = np.random.randint(365, 3650)
        reg_date = datetime.now() - timedelta(days=days_old)
        is_blacklisted = np.random.rand() < 0.01
        
        registry_data.append({
            'Vendor': vendor,
            'Paid_Up_Capital': round(capital, 2),
            'Registration_Date': reg_date.strftime('%Y-%m-%d'),
            'Is_Blacklisted': is_blacklisted,
            'Is_Shell_Company': False
        })
        
    registry_df = pd.DataFrame(registry_data)
    
    print("Injecting Dense Cartel Community (Fraud)...")
    unique_mps = df['MP Name'].unique()
    
    # 1. Simple Monopolies (as before)
    monopoly_mps = np.random.choice(unique_mps, size=3, replace=False)
    shadow_corp = 'SHADOW_CORP_MONOPOLY'
    
    registry_df = pd.concat([registry_df, pd.DataFrame([{
        'Vendor': shadow_corp,
        'Paid_Up_Capital': 5000,
        'Registration_Date': (datetime.now() - timedelta(days=2)).strftime('%Y-%m-%d'),
        'Is_Blacklisted': False,
        'Is_Shell_Company': True
    }])], ignore_index=True)
    
    # 2. Dense Cartel Cluster
    # Remove monopoly MPs from choices
    remaining_mps = [m for m in unique_mps if m not in monopoly_mps]
    cartel_mps = np.random.choice(remaining_mps, size=3, replace=False)
    
    cartel_vendors = ['CARTEL_CORP_A', 'CARTEL_CORP_B', 'CARTEL_CORP_C']
    for cv in cartel_vendors:
        registry_df = pd.concat([registry_df, pd.DataFrame([{
            'Vendor': cv,
            'Paid_Up_Capital': 10000,
            'Registration_Date': (datetime.now() - timedelta(days=5)).strftime('%Y-%m-%d'),
            'Is_Blacklisted': True, # We'll make them blacklisted for extra severity
            'Is_Shell_Company': True
        }])], ignore_index=True)
    
    df['Is_Collusion_Injected'] = False
    
    # Inject Monopoly
    for mp in monopoly_mps:
        mp_indices = df[df['MP Name'] == mp].index
        num_to_corrupt = int(len(mp_indices) * 0.90)
        if num_to_corrupt > 0:
            corrupt_indices = np.random.choice(mp_indices, size=num_to_corrupt, replace=False)
            df.loc[corrupt_indices, 'Vendor'] = shadow_corp
            df.loc[corrupt_indices, 'Is_Collusion_Injected'] = True

    # Inject Cartel Community
    # Each Cartel MP will randomly use one of the 3 Cartel Vendors for 95% of their transactions.
    # This heavily interlinks the 3 MPs to the exact same 3 vendors.
    for mp in cartel_mps:
        mp_indices = df[df['MP Name'] == mp].index
        num_to_corrupt = int(len(mp_indices) * 0.95)
        if num_to_corrupt > 0:
            corrupt_indices = np.random.choice(mp_indices, size=num_to_corrupt, replace=False)
            # Assign randomly from the 3 cartel vendors
            df.loc[corrupt_indices, 'Vendor'] = np.random.choice(cartel_vendors, size=num_to_corrupt)
            df.loc[corrupt_indices, 'Is_Collusion_Injected'] = True

    os.makedirs(os.path.dirname(out_expenditures), exist_ok=True)
    
    print("Saving Augmented Expenditures...")
    df.to_csv(out_expenditures, index=False)
    
    print("Saving Simulated Vendor Registry...")
    registry_df.to_csv(out_registry, index=False)
    
    print(f"Injected Monopolies for {len(monopoly_mps)} MPs.")
    print(f"Injected Cartel Community for {len(cartel_mps)} MPs sharing {len(cartel_vendors)} Vendors.")

if __name__ == '__main__':
    input_path = '../../data/original_data/mplads_expenditures_2026-09-16.csv'
    out_exp = '../../data/augmented_data/augmented_expenditures.csv'
    out_reg = '../../data/augmented_data/vendor_registry.csv'
    
    augment_vendor_data(input_path, out_exp, out_reg)
