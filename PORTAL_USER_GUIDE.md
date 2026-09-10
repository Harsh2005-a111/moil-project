# 📖 MOIL Smart Mining Intelligence Platform — User Operations Manual

Welcome to the **MOIL Smart Mining Intelligence Platform** operational user guide. This document provides step-by-step instructions, architectural workflows, output interpretation guides, and best practices for mine geologists, exploration managers, and statutory reporting officers.

---

## 📑 Table of Contents
1. [Portal Architecture & Core Concepts](#1-portal-architecture--core-concepts)
2. [Module 1: Satellite Mineral Exploration (`/satellite`)](#2-module-1-satellite-mineral-exploration)
   - [Workflow A: Regional Preset & Coordinate Scanning (Option 1)](#workflow-a-regional-preset--coordinate-scanning-option-1)
   - [Workflow B: Custom Satellite Image Upload (Option 2)](#workflow-b-custom-satellite-image-upload-option-2)
3. [Interpreting Exploration Outputs](#3-interpreting-exploration-outputs)
   - [IBM 3-Tier Statutory Mineral Grading](#ibm-3-tier-statutory-mineral-grading)
   - [Ensemble Uncertainty Gauge & Confidence Bounds](#ensemble-uncertainty-gauge--confidence-bounds)
   - [Diagnostic Multi-Spectral Radar & Plume Heatmap](#diagnostic-multi-spectral-radar--plume-heatmap)
4. [Module 2: Reserve Ingestion & Block Modeling (`/reserves`)](#4-module-2-reserve-ingestion--block-modeling)
5. [Module 3: Subsurface Borehole Core Viewer (`/boreholes`)](#5-module-3-subsurface-borehole-core-viewer)
6. [Module 4: Production Shortfall & Risk Simulator (`/simulator`)](#6-module-4-production-shortfall--risk-simulator)
7. [Module 5: Pit-to-Smelter Logistics & Freight Dispatch](#7-module-5-pit-to-smelter-logistics--freight-dispatch)
8. [Generating Statutory IBM / UNFC PDF Dossiers](#8-generating-statutory-ibm--unfc-pdf-dossiers)
9. [Troubleshooting, Error Handling & FAQs](#9-troubleshooting-error-handling--faqs)

---

## 1. Portal Architecture & Core Concepts

The platform integrates multi-sensor Earth observation, geostatistical interpolation, and gradient-boosted operational analytics into a unified exploration-to-smelter ecosystem:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       PORTAL OPERATIONAL ARCHITECTURE                       │
├────────────────────────────────┬────────────────────────────────────────────┤
│ 🛰️ SATELLITE ENGINE            │ 🕳️ SUBSURFACE BOREHOLE ENGINE              │
│ • Sentinel-2 L2A BOA (10m)     │ • 3D Core Lithology & IDW Interpolation    │
│ • NOAA EMAG2v3 Crustal Magnetics│ • UNFC 111/121/122 Resource Block Modeling │
│ • NASA SRTM v3 Digital Elevation│ • Grade-Tonnage Cutoff Optimization Curves  │
├────────────────────────────────┼────────────────────────────────────────────┤
│ ⚖️ IBM STATUTORY COMPLIANCE     │ 🚛 SHORTFALL & LOGISTICS ENGINE            │
│ • MCDR 2017 (10% Mn Cutoff)    │ • LightGBM + HistGradientBoosting Risk     │
│ • 3-Tier Statutory Ore Badging │ • Net Smelter Return (NSR) Route Optimizer │
│ • 150-Tree Uncertainty Bounds  │ • Automated SHAP Prescriptive Action SOPs  │
└────────────────────────────────┴────────────────────────────────────────────┘
```

---

## 2. Module 1: Satellite Mineral Exploration

### Commodity Context and Non-Mn Sites

The portal first checks whether the submitted coordinates match a registered commodity context. A verified non-Mn site, such as Gevra Coal Mine, is shown as **Manganese analysis not applicable** and does not receive an Mn grade or reserve estimate. This guard is separate from the Sentinel-2 spectral model because SWIR/NIR signatures can overlap between Mn ore, coal overburden, iron-bearing material, laterite, soil, and exposed mine surfaces.

For coordinates without authoritative commodity context, the portal reports an exploration-screening result only. Satellite indicators and ML probability do not certify reserves; drilling and laboratory assays are required for a statutory resource or reserve declaration.

Access the **Satellite Mineral Exploration** tab from the top navigation bar.

### Workflow A: Regional Preset & Coordinate Scanning (Option 1)

Use this workflow when targeting a known mine, an exploratory lease, or arbitrary greenfield coordinates.

1. **Select an Exploration Mine Preset** or enter custom coordinates:
   - Click any mine in the **Select Exploration Mine** dropdown (e.g., *Balaghat Mine*, *Ukwa Mine*, *Dongri Buzurg*, *Mansar*).
   - *Alternative:* Manually type the target **Latitude** (e.g., `21.8906`) and **Longitude** (e.g., `80.1983`) in decimal degrees.
2. **Instant Satellite Scene Display**:
   - The right-hand preview window automatically retrieves and displays the authentic Sentinel-2 high-resolution multi-spectral scene (`512 × 512 px`, 10 m/pixel, ~5.1 km × 5.1 km coverage).
   - The preview header indicates the sensor provenance (`Microsoft Planetary Computer STAC / Sentinel-2 L2A`) and active geological craton.
3. **Select Geological Mode**:
   - **Multi-Sensor Fusion (Recommended)**: Fuses Sentinel-2 SWIR/NIR absorption with NOAA EMAG2v3 magnetic anomaly and SRTM elevation.
   - **Optical-Only**: Operates solely on optical and near-infrared reflectance.
4. **Initiate Scan**:
   - Click **Run ML Exploration Scan**.
   - The system executes spatial-tectonic domain resolution, computes distance to the nearest manganese horizon, synthesizes diagnostic spectral proxies, and queries the 150-tree Random Forest ensemble.
5. **View Results**:
   - The analysis panel renders the **IBM Ore Classification Banner**, **Estimated Manganese Grade (%)**, **Available Reserves (kt)**, **95% Confidence Interval**, and **UNFC-2009 Classification (G4 Reconnaissance)**.

---

### Workflow B: Custom Satellite Image Upload (Option 2)

Use this workflow when you possess your own remote sensing raster (orthomosaic, GeoTIFF, Sentinel-2 composite, drone survey, or clipped high-resolution tile).

1. **Prepare Your Raster**:
   - Supported formats: `.tif`, `.tiff`, `.png`, `.jpg`, `.jpeg`.
   - Optimal resolution: 512 × 512 px to 2048 × 2048 px (~2 km × 2 km to 10 km × 10 km).
2. **Upload into the Dropzone**:
   - Drag and drop your image directly onto the right-hand **Dropzone** area, or click **Browse Files** to select.
   - The viewport updates instantly with image metadata: dimensions ($W 	imes H$ px), file size, and status `Ready for spectral analysis`.
3. **Fill Optional Context Coordinates**:
   - If your GeoTIFF or image has known spatial coordinates, enter the central Latitude and Longitude in the left-hand panel. This enables macro-tectonic craton priors and magnetic anomaly integration.
4. **Execute Spectral Ingestion**:
   - Click **Ingest & Run Spectral ML Model**.
   - The backend decomposes the channels, applies the manganese diagnostic absorption index, maps localized reflectance variance, and runs ML inference.
5. **Interactive Heatmap Overlay**:
   - Toggle the **Show Hydrothermal Plume Anomaly Overlay** switch.
   - The satellite image dynamically overlays the mineral potential heatmap (color-coded from low/barren green to high-grade magenta).
   - Use the **Opacity Slider** (0% to 100%) to visually inspect ground features beneath the anomaly plume.

---

## 3. Interpreting Exploration Outputs

### IBM 3-Tier Statutory Mineral Grading

The platform strictly adheres to the **Indian Bureau of Mines (IBM)** thresholds under the **Mineral Conservation and Development Rules (MCDR 2017)**:

| Displayed Badge | Grade Range | IBM Classification | Operational Action |
|:---|:---|:---|:---|
| 🟢 **Tier 1: High / Medium Grade Ore** | **≥ 25.0% Mn** (avg 38%–44%) | Marketable Saleable Ore | Direct dispatch to blast furnaces / ferromanganese smelters. High economic NSR. |
| 🟡 **Tier 2: Low Grade / Siliceous Ore** | **10.0% – 25.0% Mn** | Beneficiable / Mineral Reject | Requires jigging, dense-media separation, or magnetic spiral concentration. Eligible for beneficiation blending. |
| ⚪ **Tier 3: Mineral Waste / Overburden** | **< 10.0% Mn** | Sub-grade / Barren Overburden | Sterilized ground or mine overburden. Zero commercial reserve credit. Pit backfilling or waste dump. |

> [!NOTE]
> Under the updated statutory pipeline, **Tier 2 (10.0%–25.0% Mn)** is **NEVER** marked as "Barren". It generates valid beneficiable reserve tonnages and auto-fills downstream planning hubs.

### Ensemble Uncertainty Gauge & Confidence Bounds

Point estimates can be misleading. The portal reports the variance across all 150 regularized decision trees:

$$\mu = \frac{1}{M}\sum_{i=1}^M \hat{y}_i, \quad \sigma = \sqrt{\frac{1}{M}\sum_{i=1}^M (\hat{y}_i - \mu)^2}, \quad \text{SE} = \frac{\sigma}{\sqrt{M}}$$

- **95% Confidence Interval**: Displayed as $\mu \pm 1.96 \cdot \text{SE}$.
- **Confidence Quality Rating**:
  - **High (± < 3.5%)**: Tightly clustered trees; high geophysical and spectral consensus.
  - **Moderate (± 3.5%–7.0%)**: Suitable for reconnaissance; recommend confirmation drillholes.
  - **Epistemic Uncertainty (± > 7.0%)**: Transition zone or heavy overburden masking; ground geophysical IP survey mandated.

### Diagnostic Multi-Spectral Radar & Plume Heatmap

- **SWIR-1 (B11) Absorption**: Quantifies diagnostic absorption dips at 1.610 µm characteristic of manganite, pyrolusite, and psilomelane.
- **SWIR-2 / SWIR-1 Ratio**: Distinguishes manganese hydroxide horizons from aluminous clay and silica gangue.
- **NDRE (Red Edge) & Moisture Index**: Filters out dense agricultural vegetation canopy and standing surface water to eliminate false positives.

---

## 4. Module 2: Reserve Ingestion & Block Modeling

1. **Auto-Fill from Satellite Discovery**:
   - Click **Send to Reserve Ingestion Hub** from the Satellite exploration results panel.
   - The parameters (Target Mine, Ore Grade, Available Tonnage, UNFC Category) automatically populate the Reserve Ingestion dashboard.
2. **Configure Block Parameters**:
   - Adjust **Cutoff Grade (%)** (default statutory cutoff: 10.0%).
   - Set **Bench Depth Slice** (0 to 150 meters).
   - Enter ground survey inputs (Induced Polarization Chargeability in mV/V and Resistivity in Ω·m).
3. **Calculate Mineable Reserves**:
   - The platform calculates:
     - **In-Situ Geological Reserves (kt)**
     - **Mineable Recovery (kt)** after bench slope and mining loss factors (80%–85%)
     - **Market Value (₹ Crores)** based on prevailing international ferro-alloy basket benchmarks.

---

## 5. Module 3: Subsurface Borehole Core Viewer

1. **Select Core Presets**:
   - Choose from deep stratigraphy presets (e.g., *Balaghat Central Pit BH-04*, *Ukwa North Drift BH-12*).
2. **Inspect Lithological Strata**:
   - Explore the interactive vertical core column from collar (0 m) to bottom-of-hole (120 m+).
   - Strata color-coding:
     - 🟣 **High-Grade Braunite / Pyrolusite Zone** (≥ 40% Mn)
     - 🟡 **Manganiferous Quartzite / Gondite** (15%–30% Mn)
     - ⚪ **Schist / Gneiss Country Rock Overburden** (< 5% Mn)
3. **IDW Block Model Interpolation**:
   - View cross-sectional orebody wireframes generated via Inverse Distance Weighting:
     $$\hat{Z}(s_0) = \frac{\sum_{i=1}^n w_i Z(s_i)}{\sum_{i=1}^n w_i}, \quad w_i = \frac{1}{d(s_0, s_i)^p}$$
   - Validate strike continuity and dip direction before issuing drilling tenders.

---

## 6. Module 4: Production Shortfall & Risk Simulator

1. **Load Current Mine Shift Telemetry**:
   - Target Production Target (MT), Blasting Cycles, Excavator Fleet Availability, and Railhead Allocation.
2. **Simulate Stress Scenarios**:
   - Select predefined scenarios: *Severe Monsoon Inundation*, *Drill Rig Outage*, *High-Silica Feed Degradation*.
3. **Review AI Prescriptive Actions (SHAP Explanations)**:
   - The LightGBM risk classifier flags predicted shortfall probability and severity.
   - Prescriptive SOP recommendations are dynamically ranked by impact (e.g., *Deploy dewatering pumps in Sump 3*, *Switch blending feed to Bench B-04*).

---

## 7. Module 5: Pit-to-Smelter Logistics & Freight Dispatch

1. **Monitor Destination Smelters**:
   - Real-time demand tracking for Bhilai Steel Plant, Rourkela, Vizag Steel, and Chandrapur Ferro-Alloy Plant.
2. **Optimize Net Smelter Return (NSR)**:
   $$\text{NSR} = \text{Ore Price}(\text{Grade}) - \text{Mining Cost} - \text{Beneficiation Cost} - \text{Rail/Road Freight}$$
3. **Dispatch Recommendation**:
   - Selects optimal rakes vs. road truck combinations to minimize demurrage penalties and maximize net realization per ton.

---

## 8. Generating Statutory IBM / UNFC PDF Dossiers

1. Once analysis is completed in the **Satellite Scanner**, click **Export IBM Statutory Dossier (PDF)**.
2. The browser renders an official **IBM Form 'K' / UNFC-2009 Compliant Technical Report** including:
   - High-resolution Sentinel-2 satellite scene with coordinates grid.
   - Full 150-tree uncertainty bounds ($\mu \pm 1.96 \cdot 	ext{SE}$).
   - IBM 3-Tier classification banner with industrial utilization directives.
   - Diagnostic multi-spectral band table (B02 through B12).
   - Statutory compliance disclaimers (UNFC Category 334 G4 Reconnaissance; physical core drilling required prior to mining lease granting under MMDR Amendment Act 2021).
3. Save or print directly for submission to the Indian Bureau of Mines or Ministry of Steel.

---

## 9. Troubleshooting, Error Handling & FAQs

### Common Inquiries

| Issue / Symptom | Root Cause | Solution |
|:---|:---|:---|
| **Urban / Alluvial Lockout Banner Appears** | Selected coordinates fall within a non-mining metropolitan zone (e.g., Delhi NCR, Mumbai) or thick Indo-Gangetic alluvium. | The system correctly prevents false positives under MMDR Act Section 4(1). Select coordinates within proven mineralized belts (Sausar, Dharwar, Singhbhum, Eastern Ghats). |
| **Why is 18% Mn classified as viable ore?** | Under Indian Bureau of Mines (IBM) statutory guidelines, 10.0%–25.0% Mn is classified as **Tier 2: Beneficiable / Mineral Reject Ore** (MCDR 2017). | Tier 2 ore is not barren; it is upgraded via jigging and heavy media plants into commercial concentrates. |
| **Custom image upload shows "Ready for spectral analysis" but preview is blank?** | The image file format or dimensions are unsupported. | Ensure the file is a standard GeoTIFF, PNG, or JPEG under 25 MB. Minimum dimensions: 256 × 256 px. |
| **Confidence interval is wide (± > 7%)** | High spectral ambiguity (cloud shadow, heavy crop cover, or alluvium). | Upload cloud-free dry-season imagery (November–March) or perform ground magnetic verification. |

---

*Manual maintained by MOIL Technical Exploration & Geostatistical Systems Division.*  
*Compliant with IBM MCDR 2017 & UNFC-2009 Standards.*
