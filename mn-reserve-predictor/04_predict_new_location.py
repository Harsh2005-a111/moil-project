"""
04_predict_new_location.py
===========================
Step 4 of the Manganese Reserve Predictor Pipeline.

What this script does:
  1. Accepts a new latitude / longitude (user input or from dataset)
  2. Downloads the Sentinel-2 image for that location (using Copernicus API)
  3. Extracts spectral features from the image (SWIR B11/B12, NDVI, LST proxy)
  4. Loads the trained Random Forest model
  5. Predicts manganese probability for the location
  6. Displays the Sentinel-2 image with a prediction overlay panel

Prerequisites:
  - Run 01_prepare_dataset.py  first
  - Run 03_train_classifier.py first
  - Valid Copernicus account (register free at dataspace.copernicus.eu)

Usage:
  python 04_predict_new_location.py
  (Enter lat/lon when prompted)
"""

import requests
import getpass
import os
import numpy as np
import pandas as pd
import rasterio
import joblib
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.gridspec import GridSpec

# ============================================================
# 1. COPERNICUS CREDENTIALS
# ============================================================

print("=" * 60)
print("MANGANESE RESERVE PREDICTOR — New Location Inference")
print("=" * 60)

CLIENT_ID     = getpass.getpass("\nEnter Copernicus Client ID: ")
CLIENT_SECRET = getpass.getpass("Enter Copernicus Client Secret: ")

TOKEN_URL   = (
    "https://identity.dataspace.copernicus.eu/"
    "auth/realms/CDSE/protocol/openid-connect/token"
)
PROCESS_URL = "https://sh.dataspace.copernicus.eu/api/v1/process"

print("\nAuthenticating...")
token_resp = requests.post(
    TOKEN_URL,
    data={
        "grant_type":    "client_credentials",
        "client_id":     CLIENT_ID,
        "client_secret": CLIENT_SECRET,
    },
    timeout=30
)

if token_resp.status_code != 200:
    print("Authentication failed:", token_resp.text)
    raise Exception("Could not obtain access token.")

ACCESS_TOKEN = token_resp.json()["access_token"]
print("✓ Authentication successful!")


# ============================================================
# 2. USER INPUT — LAT / LON
# ============================================================

print("\nEnter the location to predict manganese probability:")
try:
    lat = float(input("  Latitude  (e.g. 21.8167): ").strip())
    lon = float(input("  Longitude (e.g. 80.1833): ").strip())
except ValueError:
    print("Invalid input. Using default: Balaghat Mine (21.8167, 80.1833)")
    lat, lon = 21.8167, 80.1833

location_id = f"predict_{str(lat).replace('.','_')}_{str(lon).replace('.','_')}"
print(f"\nPredicting for: ({lat}, {lon}) — ID: {location_id}")


# ============================================================
# 3. DOWNLOAD SENTINEL-2 IMAGE
# ============================================================

BUFFER     = 0.025
RESOLUTION = 10
START_DATE = "2025-01-01T00:00:00Z"
END_DATE   = "2025-12-31T23:59:59Z"

EVALSCRIPT = """
//VERSION=3
function setup() {
    return {
        input: [{ bands: ["B02","B03","B04","B08","B11","B12"] }],
        output: { bands: 6, sampleType: "FLOAT32" }
    };
}
function evaluatePixel(sample) {
    return [sample.B02, sample.B03, sample.B04, sample.B08, sample.B11, sample.B12];
}
"""

west  = lon - BUFFER
south = lat - BUFFER
east  = lon + BUFFER
north = lat + BUFFER

width  = int((east - west)   * 111320 * np.cos(np.radians(lat)) / RESOLUTION)
height = int((north - south) * 111320 / RESOLUTION)

print(f"\nDownloading Sentinel-2 image ({width}x{height} px)...")

request_body = {
    "input": {
        "bounds": {
            "bbox": [west, south, east, north],
            "properties": {"crs": "http://www.opengis.net/def/crs/EPSG/0/4326"}
        },
        "data": [{
            "type": "sentinel-2-l2a",
            "dataFilter": {
                "timeRange": {"from": START_DATE, "to": END_DATE},
                "maxCloudCoverage": 10
            },
            "processing": {"upsampling": "BILINEAR", "downsampling": "BILINEAR"}
        }]
    },
    "output": {
        "width": width,
        "height": height,
        "responses": [{"identifier": "default", "format": {"type": "image/tiff"}}]
    },
    "evalscript": EVALSCRIPT
}

response = requests.post(
    PROCESS_URL,
    headers={"Authorization": f"Bearer {ACCESS_TOKEN}", "Content-Type": "application/json"},
    json=request_body,
    timeout=300
)

print(f"  Copernicus API status: {response.status_code}")

os.makedirs(f"sentinel_images/{location_id}", exist_ok=True)
tif_path = f"sentinel_images/{location_id}/sentinel2.tif"

sentinel_available = False
image = None

if response.status_code == 200:
    with open(tif_path, "wb") as f:
        f.write(response.content)
    print(f"✓ Image saved: {tif_path}")
    sentinel_available = True
else:
    print(f"⚠ Could not download image: {response.text[:200]}")
    print("  Proceeding with feature-only prediction...")


# ============================================================
# 4. EXTRACT SPECTRAL FEATURES FROM IMAGE
# ============================================================

if sentinel_available:
    print("\nExtracting spectral features from image bands...")

    with rasterio.open(tif_path) as src:
        image = src.read()  # shape: (6, H, W)

    # Band order: B02, B03, B04, B08, B11, B12
    b02 = image[0].astype(float)
    b03 = image[1].astype(float)
    b04 = image[2].astype(float)
    b08 = image[3].astype(float)
    b11 = image[4].astype(float)
    b12 = image[5].astype(float)

    # Compute indices per pixel, then take median
    with np.errstate(divide="ignore", invalid="ignore"):
        ndvi_map  = np.where((b08 + b04) > 0, (b08 - b04) / (b08 + b04), np.nan)
        swir_b11  = np.nanmedian(b11)
        swir_b12  = np.nanmedian(b12)
        ndvi_val  = np.nanmedian(ndvi_map)

    # LST proxy: higher SWIR + lower NDVI → warmer surface
    lst_proxy = 28.0 + (swir_b11 * 12.0) - (ndvi_val * 6.0)

    print(f"  SWIR B11 (median)  : {swir_b11:.4f}")
    print(f"  SWIR B12 (median)  : {swir_b12:.4f}")
    print(f"  NDVI (median)      : {ndvi_val:.4f}")
    print(f"  LST proxy          : {lst_proxy:.1f} °C")

else:
    # Fallback — use user-provided or default values
    print("\nEnter satellite feature values manually (or press Enter for defaults):")
    swir_b11 = float(input("  SWIR B11 absorption (0.05–1.0, high=Mn, default 0.75): ").strip() or 0.75)
    swir_b12 = float(input("  SWIR B12 absorption (0.05–1.0, default 0.68)         : ").strip() or 0.68)
    ndvi_val = float(input("  NDVI (0.1–0.8, low=stress=Mn, default 0.32)          : ").strip() or 0.32)
    lst_proxy = 28.0 + (swir_b11 * 12.0) - (ndvi_val * 6.0)
    ndvi_map  = None


# ============================================================
# 5. BUILD FEATURE VECTOR
# ============================================================

print("\nBuilding prediction feature vector...")

# Additional context features — use regional averages for Central India
rainfall_mm  = float(input("  Weekly rainfall mm (default 40): ").strip() or 40.0)
soil_moisture = float(input("  Soil moisture 0–1 (default 0.25): ").strip() or 0.25)
emag_anomaly  = float(input("  Magnetic anomaly nT (default 420): ").strip() or 420.0)
elevation_m   = float(input("  Elevation m (default 400): ").strip() or 400.0)
rock_type_str = input("  Rock type (e.g. Gondite_Braunite, default): ").strip() or "Gondite_Braunite"

# Load label encoder
le = joblib.load("models/label_encoder.pkl")
known_classes = list(le.classes_)

if rock_type_str not in known_classes:
    print(f"  ⚠ Rock type '{rock_type_str}' not in training set. Using 'Gondite_Braunite'.")
    rock_type_str = "Gondite_Braunite"

rock_type_enc = le.transform([rock_type_str])[0]

feature_vector = pd.DataFrame([{
    "swir_b11_absorption": swir_b11,
    "swir_b12_absorption": swir_b12,
    "ndvi":                ndvi_val,
    "land_surface_temp_c": lst_proxy,
    "rainfall_mm_weekly":  rainfall_mm,
    "soil_moisture":       soil_moisture,
    "emag2_anomaly_nt":    emag_anomaly,
    "elevation_m":         elevation_m,
    "rock_type_enc":       rock_type_enc,
}])

print(f"\n  Feature vector:\n{feature_vector.T}")


# ============================================================
# 6. LOAD MODEL & PREDICT
# ============================================================

print("\nLoading trained model...")
model = joblib.load("models/mn_classifier.pkl")

prob = model.predict_proba(feature_vector)[0][1]
pred = model.predict(feature_vector)[0]

label = "[+] MANGANESE LIKELY" if pred == 1 else "[-] UNLIKELY / BARREN"
color = "#16A34A" if pred == 1 else "#DC2626"

print(f"\n{'='*60}")
print(f"  PREDICTION RESULT")
print(f"  Location   : ({lat}, {lon})")
print(f"  Probability: {prob*100:.1f}% manganese")
print(f"  Decision   : {label}")
print(f"{'='*60}")


# ============================================================
# 7. VISUALISE — SENTINEL IMAGE + PREDICTION PANEL
# ============================================================

print("\nGenerating visualisation...")

fig = plt.figure(figsize=(16, 7), facecolor="#0F172A")
gs  = GridSpec(1, 2, figure=fig, width_ratios=[1.6, 1], wspace=0.04)

# --- LEFT: Sentinel-2 True Colour ---
ax_img = fig.add_subplot(gs[0])
ax_img.set_facecolor("#1E293B")

if sentinel_available and image is not None:
    red   = image[2].astype(float)
    green = image[1].astype(float)
    blue  = image[0].astype(float)

    rgb = np.stack([red, green, blue], axis=-1)
    rgb = np.nan_to_num(rgb)
    lo  = np.percentile(rgb, 2)
    hi  = np.percentile(rgb, 98)
    rgb = np.clip((rgb - lo) / (hi - lo + 1e-10), 0, 1)

    ax_img.imshow(rgb)
    ax_img.set_title(
        f"Sentinel-2 True Colour — ({lat}, {lon})",
        color="white", fontsize=12, fontweight="bold", pad=10
    )

    # SWIR overlay for Mn signature (B11 band)
    swir_layer = np.nan_to_num(image[4].astype(float))
    lo_s  = np.percentile(swir_layer, 10)
    hi_s  = np.percentile(swir_layer, 90)
    norm  = np.clip((swir_layer - lo_s) / (hi_s - lo_s + 1e-10), 0, 1)
    mn_mask = norm > 0.70
    overlay = np.zeros((*mn_mask.shape, 4))
    overlay[mn_mask] = [0.09, 0.62, 0.46, 0.55]  # green-teal highlight
    ax_img.imshow(overlay)

    patch = mpatches.Patch(color="#1D9E75", alpha=0.6, label="High SWIR — Mn Signature Zone")
    ax_img.legend(handles=[patch], loc="lower left", fontsize=9,
                  facecolor="#0F172A", edgecolor="#334155", labelcolor="white")
else:
    ax_img.text(
        0.5, 0.5,
        "Sentinel-2 image\nnot available\n(check Copernicus credentials)",
        ha="center", va="center", color="#94A3B8", fontsize=12,
        transform=ax_img.transAxes
    )
    ax_img.set_title(f"({lat}, {lon})", color="white", fontsize=12, pad=10)

ax_img.axis("off")

# --- RIGHT: Prediction Panel ---
ax_pred = fig.add_subplot(gs[1])
ax_pred.set_facecolor("#1E293B")
ax_pred.axis("off")

# Probability bar
bar_x = [0.15, 0.85]
ax_pred.barh([0.75], [prob],      left=0,    height=0.05, color=color,   alpha=0.9)
ax_pred.barh([0.75], [1 - prob],  left=prob, height=0.05, color="#334155", alpha=0.6)
ax_pred.set_xlim(0, 1)
ax_pred.set_ylim(0, 1)

ax_pred.text(0.5, 0.95, "AI PREDICTION", ha="center", va="top",
             color="#94A3B8", fontsize=10, fontweight="bold",
             transform=ax_pred.transAxes)

ax_pred.text(0.5, 0.85, f"{prob*100:.1f}%", ha="center", va="top",
             color=color, fontsize=36, fontweight="bold",
             transform=ax_pred.transAxes)

ax_pred.text(0.5, 0.72, "Manganese Probability", ha="center", va="top",
             color="#CBD5E1", fontsize=11, transform=ax_pred.transAxes)

ax_pred.text(0.5, 0.62, label.split(" ", 1)[1], ha="center", va="top",
             color=color, fontsize=13, fontweight="bold",
             transform=ax_pred.transAxes)

# Feature summary
features_display = [
    ("SWIR B11",     f"{swir_b11:.3f}"),
    ("SWIR B12",     f"{swir_b12:.3f}"),
    ("NDVI",         f"{ndvi_val:.3f}"),
    ("LST (°C)",     f"{lst_proxy:.1f}"),
    ("Rainfall mm",  f"{rainfall_mm:.0f}"),
    ("Soil Moisture",f"{soil_moisture:.2f}"),
    ("Mag. Anomaly", f"{emag_anomaly:.0f} nT"),
    ("Rock Type",    rock_type_str.replace("_", " ")),
]

y_start = 0.50
for i, (k, v) in enumerate(features_display):
    y = y_start - i * 0.055
    ax_pred.text(0.08, y, k,  color="#94A3B8", fontsize=9.5, transform=ax_pred.transAxes)
    ax_pred.text(0.92, y, v,  color="#F1F5F9", fontsize=9.5, ha="right", fontweight="600",
                 transform=ax_pred.transAxes)
    ax_pred.axhline(y=y * ax_pred.get_ylim()[1] - 0.018,
                    xmin=0.06, xmax=0.94, color="#334155", lw=0.5, alpha=0.5)

ax_pred.text(0.5, 0.03,
             f"Lat: {lat}  |  Lon: {lon}",
             ha="center", va="bottom", color="#475569", fontsize=9,
             transform=ax_pred.transAxes)

output_fig = f"outputs/prediction_{location_id}.png"
plt.savefig(output_fig, dpi=150, bbox_inches="tight", facecolor="#0F172A")
plt.show()

print(f"\nDONE. Prediction complete!")
print(f"   Output saved to: {output_fig}")
