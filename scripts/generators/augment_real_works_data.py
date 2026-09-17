import pandas as pd
import numpy as np
import uuid
import os
import re

def infer_category_and_unit(description):
    desc = str(description).lower()
    if any(keyword in desc for keyword in ['road', 'cc road', 'path']):
        return 'Road Construction', 'sq_meters'
    elif any(keyword in desc for keyword in ['drainage', 'drain', 'under ground']):
        return 'Drainage', 'meters'
    elif any(keyword in desc for keyword in ['school', 'class', 'room', 'building']):
        return 'Education', 'sq_meters'
    elif any(keyword in desc for keyword in ['borewell', 'water', 'pump', 'tank']):
        return 'Drinking Water', 'number'
    elif any(keyword in desc for keyword in ['solar', 'light']):
        return 'Solar Lighting', 'number'
    elif any(keyword in desc for keyword in ['health', 'hospital', 'ambulance']):
        return 'Health', 'number'
    elif any(keyword in desc for keyword in ['shed', 'community', 'hall', 'mandapam']):
        return 'Community Building', 'sq_meters'
    else:
        return 'Other Construction', 'sq_meters'

def get_realistic_sor_rate(category):
    rates = {
        'Road Construction': (2000, 3500),
        'Drainage': (1500, 3000),
        'Education': (15000, 25000),
        'Drinking Water': (80000, 150000),
        'Solar Lighting': (15000, 30000),
        'Health': (1500000, 2500000),
        'Community Building': (12000, 20000),
        'Other Construction': (2000, 5000)
    }
    low, high = rates.get(category, (1000, 5000))
    return np.random.uniform(low, high)

def augment_data(input_csv, output_csv, anomaly_rate=0.05):
    print(f"Loading real data from {input_csv}...")
    df = pd.read_csv(input_csv)
    
    # Filter out empty or zero final amounts
    df['Final Amount (₹)'] = pd.to_numeric(df['Final Amount (₹)'], errors='coerce')
    df = df[df['Final Amount (₹)'] > 0].copy()
    
    print(f"Processing {len(df)} records...")
    
    # 1. Infer Category and Unit
    inferred = df['Work Description'].apply(infer_category_and_unit)
    df['Inferred Category'] = [x[0] for x in inferred]
    df['unit'] = [x[1] for x in inferred]
    
    # 2. Inject Anomalies (True/False mask)
    np.random.seed(42) # For reproducibility
    is_anomaly = np.random.rand(len(df)) < anomaly_rate
    df['is_anomaly_injected'] = is_anomaly
    
    # Initialize new columns
    sor_rates = []
    quantities = []
    unit_costs = []
    
    for idx, row in df.iterrows():
        final_amt = row['Final Amount (₹)']
        category = row['Inferred Category']
        anomaly = row['is_anomaly_injected']
        
        base_sor = get_realistic_sor_rate(category)
        
        if not anomaly:
            # NORMAL WORK
            variance = np.random.uniform(-0.10, 0.15)
            unit_cost = base_sor * (1 + variance)
            quantity = max(1, final_amt / unit_cost) 
            sor_rate = base_sor
        else:
            # ANOMALOUS WORK (Fraud: Over-invoicing)
            escalation_factor = np.random.uniform(1.5, 4.0) 
            sor_rate = base_sor
            unit_cost = base_sor * escalation_factor
            quantity = max(1, final_amt / unit_cost)

        sor_rates.append(sor_rate)
        quantities.append(quantity)
        unit_costs.append(unit_cost)

    df['sor_rate'] = sor_rates
    df['quantity'] = quantities
    df['unit_cost'] = unit_costs
    
    # Calculate derived features
    df['expected_cost'] = df['quantity'] * df['sor_rate']
    df['cost_deviation_pct'] = (df['unit_cost'] - df['sor_rate']) / df['sor_rate']
    df['sor_match_confidence'] = np.random.uniform(0.70, 1.0, len(df))
    
    # Rename for standardizing
    df.rename(columns={'Category': 'Original Category', 'Inferred Category': 'category', 'Constituency': 'district', 'Final Amount (₹)': 'sanction_amount'}, inplace=True)
    
    # Rounding
    df['quantity'] = df['quantity'].round(2)
    df['sor_rate'] = df['sor_rate'].round(2)
    df['unit_cost'] = df['unit_cost'].round(2)
    df['expected_cost'] = df['expected_cost'].round(2)
    df['cost_deviation_pct'] = df['cost_deviation_pct'].round(4)
    df['sor_match_confidence'] = df['sor_match_confidence'].round(3)
    
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(output_csv), exist_ok=True)
    
    # Reorder columns slightly for readability
    cols_to_front = [
        'Work ID', 'State', 'district', 'category', 'quantity', 'unit', 
        'sanction_amount', 'unit_cost', 'sor_rate', 'expected_cost', 
        'cost_deviation_pct', 'sor_match_confidence', 'is_anomaly_injected'
    ]
    other_cols = [c for c in df.columns if c not in cols_to_front]
    df = df[cols_to_front + other_cols]

    print("Saving augmented dataset...")
    df.to_csv(output_csv, index=False)
    
    print(f"Generated {len(df)} records.")
    print(f"Injected {df['is_anomaly_injected'].sum()} anomalies.")
    print(f"Saved to {output_csv}")

if __name__ == '__main__':
    input_path = '../../data/original_data/mplads_completed_works_2026-09-16.csv'
    output_path = '../../data/augmented_data/augmented_completed_works.csv'
    
    augment_data(input_path, output_path)
