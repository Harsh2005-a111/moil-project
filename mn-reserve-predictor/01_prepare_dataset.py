"""
01_prepare_dataset.py (V2 — Scientifically Robust)
====================================================
Builds a realistic labeled dataset for manganese prediction with:
  1. Positive samples — known MOIL/GSI deposits with measurement noise
  2. Hard negatives  — barren locations WITHIN the same geological belt
  3. Easy negatives  — geographically distant barren locations
  4. Near-miss cases — Sausar Group lithology but below ore-grade threshold

Why this matters:
  - V1 had trivially separable classes (100% accuracy = memorization, not learning)
  - V2 forces the model to learn actual geological discrimination patterns
  - Expected realistic AUC: 0.82-0.92 (not 1.00)

Output: data/final_dataset_v2.csv
"""

import pandas as pd
import numpy as np
import os

np.random.seed(42)

# ============================================================
# LOAD RAW DATA
# ============================================================

print("=" * 60)
print("STEP 1: Loading datasets...")
print("=" * 60)

locations_df = pd.read_csv("data/manganese_locations.csv")
features_df  = pd.read_csv("data/satellite_features.csv")

print(f"  Manganese locations loaded : {len(locations_df)} rows")
print(f"  Satellite features loaded  : {len(features_df)} rows")


# ============================================================
# MERGE (INTERSECTION ON mine_id)
# ============================================================

print("\nSTEP 2: Merging datasets on mine_id...")

merged = pd.merge(locations_df, features_df, on="mine_id", how="inner")
merged["lat"] = merged["latitude_y"]
merged["lon"] = merged["longitude_y"]
merged = merged.drop(columns=["latitude_x", "longitude_x", "latitude_y", "longitude_y"])
merged["has_manganese"] = 1

print(f"  Merged positive samples    : {len(merged)}")


# ============================================================
# ADD MEASUREMENT NOISE TO POSITIVES
# ============================================================
# Real satellite data has sensor noise, atmospheric interference,
# cloud shadow residuals, and seasonal variation. We inject
# realistic Gaussian noise to prevent memorization.
# ============================================================

print("\nSTEP 3: Adding measurement noise to positive samples...")

noise_config = {
    "swir_b11_absorption":   0.04,   # +/- 4% reflectance noise
    "swir_b12_absorption":   0.04,
    "ndvi":                  0.05,   # NDVI seasonal + shadow variance
    "land_surface_temp_c":   2.5,    # LST diurnal + seasonal swing
    "rainfall_mm_weekly":    12.0,   # Weather variability
    "soil_moisture":         0.06,
    "emag2_anomaly_nt":      45.0,   # Instrument calibration drift
    "elevation_m":           15.0,   # DEM resolution uncertainty
}

for col, sigma in noise_config.items():
    if col in merged.columns:
        noise = np.random.normal(0, sigma, len(merged))
        merged[col] = merged[col] + noise

# Clamp values to physical ranges
merged["swir_b11_absorption"] = merged["swir_b11_absorption"].clip(0.05, 1.0)
merged["swir_b12_absorption"] = merged["swir_b12_absorption"].clip(0.05, 1.0)
merged["ndvi"]                = merged["ndvi"].clip(0.05, 0.85)
merged["soil_moisture"]       = merged["soil_moisture"].clip(0.05, 0.65)

print(f"  Applied Gaussian noise to {len(noise_config)} features")


# ============================================================
# GENERATE THREE CLASSES OF NEGATIVE SAMPLES
# ============================================================

print("\nSTEP 4: Generating scientifically stratified negatives...")

all_neg_rows = []


# --- CLASS A: HARD NEGATIVES (same belt, barren) ---
# Locations within the Sausar Group / Central Indian Mn Belt
# that happen to be barren (quartzite interbeds, granite intrusions,
# weathered zones with leached-out manganese)
# These have MODERATE SWIR (not zero) but below ore-grade threshold

N_HARD = 25
print(f"  [A] Hard negatives (same belt, barren): {N_HARD}")

hard_neg_regions = [
    # Nagpur district — within MOIL lease but barren interbeds
    {"lat_range": (20.9, 21.35), "lon_range": (78.9, 79.5),  "rock": "Quartzite_Interbed"},
    # Sausar Group — calc-silicate zones (no Mn enrichment)
    {"lat_range": (21.4, 21.8),  "lon_range": (78.5, 79.3),  "rock": "Calc_Silicate"},
    # Balaghat periphery — lateritized overburden
    {"lat_range": (21.6, 22.0),  "lon_range": (79.8, 80.5),  "rock": "Laterite_Overburden"},
]

per_hard = N_HARD // len(hard_neg_regions) + 1

for region in hard_neg_regions:
    for _ in range(per_hard):
        lat = np.random.uniform(*region["lat_range"])
        lon = np.random.uniform(*region["lon_range"])
        
        # Key: MODERATE spectral signatures (not zero, but below ore threshold)
        # This is what makes them HARD to distinguish from real deposits
        swir_b11 = np.random.uniform(0.45, 0.72)   # Overlaps with low-grade positives
        swir_b12 = np.random.uniform(0.40, 0.65)
        ndvi     = np.random.uniform(0.30, 0.48)    # Some stress but not extreme
        lst      = np.random.uniform(33.0, 37.0)    # Similar thermal range
        rainfall = np.random.uniform(30, 55)
        soil_m   = np.random.uniform(0.20, 0.35)
        emag     = np.random.uniform(180, 380)       # Sub-threshold magnetic
        elev     = np.random.uniform(320, 450)

        all_neg_rows.append({
            "mine_id":             f"HARD_{len(all_neg_rows)+1:04d}",
            "name":                f"HardNeg_{region['rock']}_{len(all_neg_rows)+1}",
            "source":              "Hard_Negative",
            "deposit_type":        "None",
            "rock_type":           region["rock"],
            "lat":                 round(lat, 4),
            "lon":                 round(lon, 4),
            "swir_b11_absorption": round(swir_b11, 3),
            "swir_b12_absorption": round(swir_b12, 3),
            "ndvi":                round(ndvi, 3),
            "land_surface_temp_c": round(lst, 1),
            "rainfall_mm_weekly":  round(rainfall, 1),
            "soil_moisture":       round(soil_m, 3),
            "emag2_anomaly_nt":    round(emag, 1),
            "elevation_m":         round(elev, 0),
            "has_manganese":       0
        })


# --- CLASS B: NEAR-MISS NEGATIVES ---
# Same Gondite/Braunite lithology but the deposit was leached,
# sub-economic, or just below cutoff grade.
# These have HIGH SWIR but other indicators don't correlate.

N_NEARMISS = 15
print(f"  [B] Near-miss negatives (right rock, no ore): {N_NEARMISS}")

for i in range(N_NEARMISS):
    lat = np.random.uniform(20.8, 22.2)
    lon = np.random.uniform(78.5, 80.5)
    
    # Key: High SWIR (manganese oxide staining on surface)
    # BUT low magnetic anomaly (no bulk ore body at depth)
    # AND normal NDVI (vegetation not stressed = no geochemical halo)
    swir_b11 = np.random.uniform(0.62, 0.80)  # Looks like Mn on surface!
    swir_b12 = np.random.uniform(0.55, 0.72)
    ndvi     = np.random.uniform(0.38, 0.55)   # Normal vegetation = no deep ore
    lst      = np.random.uniform(32.5, 36.0)
    rainfall = np.random.uniform(35, 55)
    soil_m   = np.random.uniform(0.24, 0.38)
    emag     = np.random.uniform(80, 250)       # LOW magnetics = no ore body
    elev     = np.random.uniform(340, 430)

    all_neg_rows.append({
        "mine_id":             f"NEAR_{i+1:04d}",
        "name":                f"NearMiss_GonditeSurface_{i+1}",
        "source":              "Near_Miss",
        "deposit_type":        "SubEconomic",
        "rock_type":           np.random.choice(["Gondite_Braunite", "Gondite_Series", "Braunite_Series"]),
        "lat":                 round(lat, 4),
        "lon":                 round(lon, 4),
        "swir_b11_absorption": round(swir_b11, 3),
        "swir_b12_absorption": round(swir_b12, 3),
        "ndvi":                round(ndvi, 3),
        "land_surface_temp_c": round(lst, 1),
        "rainfall_mm_weekly":  round(rainfall, 1),
        "soil_moisture":       round(soil_m, 3),
        "emag2_anomaly_nt":    round(emag, 1),
        "elevation_m":         round(elev, 0),
        "has_manganese":       0
    })


# --- CLASS C: EASY NEGATIVES (geographically distant) ---
# These are clearly different geologies — the model SHOULD get these right.

N_EASY = 30
print(f"  [C] Easy negatives (distant geology): {N_EASY}")

easy_regions = [
    {"lat_range": (15.5, 18.5), "lon_range": (73.5, 77.0), "rock": "Deccan_Basalt"},
    {"lat_range": (24.0, 28.0), "lon_range": (78.0, 87.0), "rock": "Alluvium"},
    {"lat_range": (24.5, 28.5), "lon_range": (72.0, 76.5), "rock": "Quartzite_Marble"},
    {"lat_range": (8.0,  13.0), "lon_range": (77.5, 80.5), "rock": "Sedimentary"},
    {"lat_range": (24.0, 27.0), "lon_range": (89.5, 95.0), "rock": "Alluvium"},
]

per_easy = N_EASY // len(easy_regions) + 1

for region in easy_regions:
    for _ in range(per_easy):
        lat = np.random.uniform(*region["lat_range"])
        lon = np.random.uniform(*region["lon_range"])
        
        swir_b11 = np.random.uniform(0.15, 0.48)
        swir_b12 = np.random.uniform(0.12, 0.42)
        ndvi     = np.random.uniform(0.42, 0.78)
        lst      = np.random.uniform(26.0, 33.5)
        rainfall = np.random.uniform(55, 140)
        soil_m   = np.random.uniform(0.32, 0.58)
        emag     = np.random.uniform(20, 180)
        elev     = np.random.uniform(30, 280)

        all_neg_rows.append({
            "mine_id":             f"EASY_{len(all_neg_rows)+1:04d}",
            "name":                f"EasyNeg_{region['rock']}_{len(all_neg_rows)+1}",
            "source":              "Easy_Negative",
            "deposit_type":        "None",
            "rock_type":           region["rock"],
            "lat":                 round(lat, 4),
            "lon":                 round(lon, 4),
            "swir_b11_absorption": round(swir_b11, 3),
            "swir_b12_absorption": round(swir_b12, 3),
            "ndvi":                round(ndvi, 3),
            "land_surface_temp_c": round(lst, 1),
            "rainfall_mm_weekly":  round(rainfall, 1),
            "soil_moisture":       round(soil_m, 3),
            "emag2_anomaly_nt":    round(emag, 1),
            "elevation_m":         round(elev, 0),
            "has_manganese":       0
        })


neg_df = pd.DataFrame(all_neg_rows)
# Trim to exact counts
neg_df = neg_df.head(N_HARD + N_NEARMISS + N_EASY)

print(f"\n  Total negatives generated  : {len(neg_df)}")
print(f"    - Hard (same belt)       : {len(neg_df[neg_df.source=='Hard_Negative'])}")
print(f"    - Near-miss (right rock) : {len(neg_df[neg_df.source=='Near_Miss'])}")
print(f"    - Easy (distant)         : {len(neg_df[neg_df.source=='Easy_Negative'])}")


# ============================================================
# COMBINE, SHUFFLE & SAVE
# ============================================================

print("\nSTEP 5: Building final labeled dataset...")

feature_cols = [
    "mine_id", "name", "source", "deposit_type", "rock_type",
    "lat", "lon",
    "swir_b11_absorption", "swir_b12_absorption",
    "ndvi", "land_surface_temp_c", "rainfall_mm_weekly",
    "soil_moisture", "emag2_anomaly_nt", "elevation_m",
    "has_manganese"
]

pos_df = merged.rename(columns={"name_x": "name"})[feature_cols]
final_df = pd.concat([pos_df, neg_df[feature_cols]], ignore_index=True)

final_df = final_df.sample(frac=1, random_state=42).reset_index(drop=True)

output_path = "data/final_dataset_v2.csv"
final_df.to_csv(output_path, index=False)

# Also overwrite the main one so Step 3 picks it up
final_df.to_csv("data/final_dataset.csv", index=False)

print(f"\n{'='*60}")
print("DATASET SUMMARY (V2 — Robust)")
print(f"{'='*60}")
print(f"  Total samples       : {len(final_df)}")
print(f"  Positive (Mn=1)     : {final_df['has_manganese'].sum()}")
print(f"  Negative (Mn=0)     : {(final_df['has_manganese']==0).sum()}")
print(f"  Hard neg ratio      : {len(neg_df[neg_df.source!='Easy_Negative'])}/{len(neg_df)} ({len(neg_df[neg_df.source!='Easy_Negative'])/len(neg_df)*100:.0f}%)")
print(f"  Columns             : {list(final_df.columns)}")
print(f"  Saved to            : {output_path}")
print(f"{'='*60}")
print("\nDONE. Run 03_train_classifier.py next for realistic evaluation.")
