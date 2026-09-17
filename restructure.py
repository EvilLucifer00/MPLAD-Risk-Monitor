import os
import shutil

# 1. Create Directories
dirs = [
    "data/original_data",
    "data/augmented_data",
    "data/output_results",
    "scripts/generators",
    "scripts/engines"
]
for d in dirs:
    os.makedirs(d, exist_ok=True)

# 2. Move Files
file_moves = {
    # Original Data
    "mplads_completed_works_2026-09-16.csv": "data/original_data/mplads_completed_works_2026-09-16.csv",
    "mplads_mp_summary_2026-09-16.csv": "data/original_data/mplads_mp_summary_2026-09-16.csv",
    "mplads_expenditures_2026-09-16.csv": "data/original_data/mplads_expenditures_2026-09-16.csv",
    "state_districts.json": "data/original_data/state_districts.json",
    "mplads_works_by_category_2026-09-16.json": "data/original_data/mplads_works_by_category_2026-09-16.json",
    
    # Augmented Data
    "processed/cleaned_mp_data.csv": "data/augmented_data/cleaned_mp_data.csv",
    "processed/augmented_completed_works.csv": "data/augmented_data/augmented_completed_works.csv",
    "processed/augmented_expenditures.csv": "data/augmented_data/augmented_expenditures.csv",
    "processed/vendor_registry.csv": "data/augmented_data/vendor_registry.csv",
    
    # Outputs
    "processed/engine1_augmented_results.csv": "data/output_results/engine1_augmented_results.csv",
    "processed/engine2_duplicate_results.csv": "data/output_results/engine2_duplicate_results.csv",
    "processed/engine3_vendor_results.csv": "data/output_results/engine3_vendor_results.csv",
    "processed/engine4_trend_results.csv": "data/output_results/engine4_trend_results.csv",
    "processed/final_composite_risk_scores.csv": "data/output_results/final_composite_risk_scores.csv",
    "processed/shap_feature_importance.png": "data/output_results/shap_feature_importance.png",
    
    # Scripts -> Generators
    "src/data_cleaning.py": "scripts/generators/data_cleaning.py",
    "src/augment_real_works_data.py": "scripts/generators/augment_real_works_data.py",
    "src/augment_vendor_data.py": "scripts/generators/augment_vendor_data.py",
    
    # Scripts -> Engines
    "src/cost_anomaly_engine.py": "scripts/engines/cost_anomaly_engine.py",
    "src/duplicate_work_engine.py": "scripts/engines/duplicate_work_engine.py",
    "src/vendor_collusion_engine.py": "scripts/engines/vendor_collusion_engine.py",
    "src/trend_forecaster_engine.py": "scripts/engines/trend_forecaster_engine.py",
    "src/xgboost_composite_model.py": "scripts/engines/xgboost_composite_model.py"
}

for src, dst in file_moves.items():
    if os.path.exists(src):
        shutil.move(src, dst)
        print(f"Moved {src} -> {dst}")
    else:
        print(f"Warning: {src} not found.")

# 3. Update Paths in Scripts
path_replacements = {
    "../mplads_completed_works_2026-09-16.csv": "../../data/original_data/mplads_completed_works_2026-09-16.csv",
    "../mplads_mp_summary_2026-09-16.csv": "../../data/original_data/mplads_mp_summary_2026-09-16.csv",
    "../mplads_expenditures_2026-09-16.csv": "../../data/original_data/mplads_expenditures_2026-09-16.csv",
    
    "../processed/cleaned_mp_data.csv": "../../data/augmented_data/cleaned_mp_data.csv",
    "../processed/augmented_completed_works.csv": "../../data/augmented_data/augmented_completed_works.csv",
    "../processed/augmented_expenditures.csv": "../../data/augmented_data/augmented_expenditures.csv",
    "../processed/vendor_registry.csv": "../../data/augmented_data/vendor_registry.csv",
    
    "../processed/engine1_augmented_results.csv": "../../data/output_results/engine1_augmented_results.csv",
    "../processed/engine2_duplicate_results.csv": "../../data/output_results/engine2_duplicate_results.csv",
    "../processed/engine3_vendor_results.csv": "../../data/output_results/engine3_vendor_results.csv",
    "../processed/engine4_trend_results.csv": "../../data/output_results/engine4_trend_results.csv",
    "../processed/final_composite_risk_scores.csv": "../../data/output_results/final_composite_risk_scores.csv",
    "../processed/shap_feature_importance.png": "../../data/output_results/shap_feature_importance.png"
}

scripts = list(file_moves.values())
scripts = [s for s in scripts if s.endswith('.py')]

for script in scripts:
    if os.path.exists(script):
        with open(script, 'r', encoding='utf-8') as f:
            content = f.read()
            
        for old_path, new_path in path_replacements.items():
            content = content.replace(old_path, new_path)
            
        with open(script, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated paths in {script}")

# 4. Clean up old directories
try:
    if os.path.exists('src') and not os.listdir('src'):
        os.rmdir('src')
    if os.path.exists('processed') and not os.listdir('processed'):
        os.rmdir('processed')
    print("Cleaned up old empty directories.")
except Exception as e:
    pass
print("Restructuring Complete.")
