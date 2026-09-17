import pandas as pd
import networkx as nx
from networkx.algorithms import bipartite
import os

def run_engine_3(expenditures_csv, registry_csv, output_csv):
    print("Loading data...")
    try:
        df_exp = pd.read_csv(expenditures_csv)
        df_reg = pd.read_csv(registry_csv)
    except FileNotFoundError as e:
        print(f"Error loading files: {e}")
        return

    print("Building Bipartite Graph (MPs -> Vendors)...")
    grouped = df_exp.groupby(['MP Name', 'Vendor'])['Expenditure Amount (₹)'].sum().reset_index()
    mp_totals = grouped.groupby('MP Name')['Expenditure Amount (₹)'].sum().to_dict()
    
    B = nx.Graph()
    for _, row in grouped.iterrows():
        mp = row['MP Name']
        vendor = row['Vendor']
        weight = row['Expenditure Amount (₹)']
        
        B.add_node(mp, bipartite=0)
        B.add_node(vendor, bipartite=1)
        B.add_edge(mp, vendor, weight=weight)
        
    mps = {n for n, d in B.nodes(data=True) if d['bipartite'] == 0}
    vendors = {n for n, d in B.nodes(data=True) if d['bipartite'] == 1}
    
    print(f"Bipartite Graph created with {len(mps)} MPs and {len(vendors)} Vendors.")
    
    # ---------------------------------------------------------
    # A. Detect Simple Monopolies
    # ---------------------------------------------------------
    print("Analyzing Simple Monopolies...")
    results = {}
    
    for mp in mps:
        neighbors = list(B.neighbors(mp))
        if not neighbors:
            continue
            
        max_vendor = max(neighbors, key=lambda v: B[mp][v]['weight'])
        max_spent = B[mp][max_vendor]['weight']
        total_spent = mp_totals[mp]
        dominance_pct = max_spent / total_spent if total_spent > 0 else 0
        is_monopoly = dominance_pct > 0.70
        
        vendor_matches = df_reg[df_reg['Vendor'] == max_vendor]
        is_shell = False
        is_blacklisted = False
        if not vendor_matches.empty:
            vendor_info = vendor_matches.iloc[0]
            is_shell = vendor_info['Is_Shell_Company']
            is_blacklisted = vendor_info['Is_Blacklisted']
            
        risk_score = int(is_monopoly) + int(is_shell) + int(is_blacklisted)
        
        results[mp] = {
            'MP Name': mp,
            'Top_Vendor': max_vendor,
            'Vendor_Dominance_Pct': round(dominance_pct * 100, 2),
            'Is_Monopoly_Flag': is_monopoly,
            'Vendor_Is_Shell': is_shell,
            'Vendor_Is_Blacklisted': is_blacklisted,
            'In_Cartel_Cluster': False,
            'Collusion_Risk_Score': risk_score
        }
        
    # ---------------------------------------------------------
    # B. Dense Community Detection (Cartel Clusters)
    # ---------------------------------------------------------
    print("Projecting Graph to find MP-MP Cartel Communities...")
    
    # Create MP-MP projection. Two MPs are connected if they share vendors.
    # We want to find MPs that share MULTIPLE vendors heavily.
    # To keep it performant, we only project MPs.
    MP_Graph = bipartite.projected_graph(B, mps)
    
    # Find cliques (densely connected groups of MPs)
    cliques = list(nx.find_cliques(MP_Graph))
    
    # Filter for interesting cliques (e.g., at least 3 MPs sharing vendors)
    large_cliques = [c for c in cliques if len(c) >= 3]
    
    for clique in large_cliques:
        # Check if the vendors they share are red-flagged (Shell/Blacklisted)
        # Find the intersection of their vendors
        shared_vendors = set.intersection(*[set(B.neighbors(mp)) for mp in clique])
        
        if len(shared_vendors) > 0:
            # Check if any shared vendor is a shell or blacklisted
            for sv in shared_vendors:
                v_matches = df_reg[df_reg['Vendor'] == sv]
                if not v_matches.empty:
                    v_info = v_matches.iloc[0]
                    if v_info['Is_Shell_Company'] or v_info['Is_Blacklisted']:
                        # Found a Cartel!
                        for mp in clique:
                            results[mp]['In_Cartel_Cluster'] = True
                            # Give max risk score (e.g. 5) for cartel involvement
                            results[mp]['Collusion_Risk_Score'] += 3 
                        break
    
    results_df = pd.DataFrame(list(results.values()))
    
    high_risk = results_df[results_df['Collusion_Risk_Score'] >= 2].sort_values(by='Collusion_Risk_Score', ascending=False)
    
    print(f"\n--- Engine 3 Results ---")
    print(f"Total MPs Analyzed: {len(results_df)}")
    print(f"High Risk Collusion Networks Detected: {len(high_risk)}")
    
    if len(high_risk) > 0:
        print("\nTop Collusion Networks (Monopoly + Shell/Blacklisted + Cartel):")
        print(high_risk[['MP Name', 'Top_Vendor', 'Vendor_Dominance_Pct', 'In_Cartel_Cluster', 'Collusion_Risk_Score']].head(10))
    
    os.makedirs(os.path.dirname(output_csv), exist_ok=True)
    results_df.to_csv(output_csv, index=False)
    print(f"\nEngine 3 results saved to {output_csv}")

if __name__ == '__main__':
    in_exp = '../../data/augmented_data/augmented_expenditures.csv'
    in_reg = '../../data/augmented_data/vendor_registry.csv'
    out_csv = '../../data/output_results/engine3_vendor_results.csv'
    
    run_engine_3(in_exp, in_reg, out_csv)
