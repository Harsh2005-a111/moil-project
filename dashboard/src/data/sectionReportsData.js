/**
 * Comprehensive Technical Audit Reports & Explanatory Data Directory
 * Provides complete architectural documentation, mathematical formulations,
 * parameter dictionaries, output interpretations, and cross-module dependencies
 * for every single module and sub-section of the MOIL AI-Space Platform.
 */

export const SECTION_REPORTS = {
  // --------------------------------------------------------------------------
  // 1. SATELLITE IMAGE AI ANALYZER
  // --------------------------------------------------------------------------
  satellite_scanner: {
    id: "satellite_scanner",
    title: "Satellite Multi-Spectral Image AI Analyzer",
    badge: "ESA COPERNICUS & SENTINEL-2 LEVEL-2A",
    category: "Orbital Remote Sensing & Mineral Alteration",
    executiveSummary:
      "Integrates orbital Earth Observation data from European Space Agency (ESA) Copernicus Sentinel-2 satellites to detect characteristic iron-manganese oxide gossans, hydroxyl-bearing clay alterations, and surface lithological anomalies without invasive ground disturbance.",
    problemSolved:
      "Traditional mineral exploration in Central India requires months of manual traverse mapping over rugged, densely vegetated terrain. Orbital remote sensing screens thousands of square kilometers in seconds, ranking prospective zones for targeted diamond drilling.",
    mathematicalCore: [
      {
        formula: "MSI = Band 11 (SWIR-1) / Band 4 (Red)",
        description:
          "Manganese Spectral Index (MSI): Pyrolusite and braunite exhibit intense absorption in visible red (665nm) due to Mn3+/Mn4+ charge transfers and high reflectance in the SWIR-1 band (1610nm).",
      },
      {
        formula: "NDVI = (B8 - B4) / (B8 + B4)",
        description:
          "Normalized Difference Vegetation Index: Used as an inverse masking filter to eliminate false chlorophyll reflectance anomalies and isolate bare-rock outcrops.",
      },
      {
        formula: "Hydroxyl Clay Index = B11 / B12",
        description:
          "Detects hydrothermal alteration halos (kaolinite, illite, montmorillonite) frequently associated with epigenetic manganese enrichment.",
      },
    ],
    parametersTable: [
      {
        name: "Cloud Cover Filter (%)",
        unit: "%",
        range: "0% – 20%",
        default: "< 5%",
        operationalImpact: "Suppresses cloud and shadow artifacts from corrupting surface reflectance calculations.",
      },
      {
        name: "Spatial Resolution",
        unit: "Meters/pixel",
        range: "10m (B4, B8) / 20m (B11, B12)",
        default: "10m resampled",
        operationalImpact: "Defines minimum detectable outcrop anomaly footprint on the lease surface.",
      },
      {
        name: "Sun Elevation Angle",
        unit: "Degrees",
        range: "30° – 75°",
        default: "> 45°",
        operationalImpact: "Normalizes topographic hillshade distortion along the Satpura mountain ranges.",
      },
    ],
    outputGuide: [
      {
        outputName: "Spectral Prospectivity Score (%)",
        interpretation: "Normalized probability [0–100%] that the observed spectral curve matches high-grade manganese gossans.",
        normalVsAlert: "Score > 75%: High potential drilling target. Score < 40%: Likely barren country rock or unmineralized soil.",
      },
      {
        outputName: "Band Contrast Ratio Overlay",
        interpretation: "False-color composite visualizing mineral alteration zones in vivid RGB bands.",
        normalVsAlert: "Intense magenta/yellow clusters indicate manganese-rich gossan caps.",
      },
    ],
    dependencies: [
      {
        targetModule: "Tab 1: Geological Sliders",
        effectDescription: "Feeds raw band reflectance into the Bayesian GSI Prior Engine.",
      },
      {
        targetModule: "Tab 4: Boreholes",
        effectDescription: "Surface spectral grade is cross-validated against subsurface drill-core composite assays.",
      },
      {
        targetModule: "Global KPI Bar",
        effectDescription: "Directly determines the initial gross In-Situ Ore Volume before operational haircuts.",
      },
    ],
    judgePitch: [
      "We utilize live Copernicus Sentinel-2 Level-2A surface reflectance data to automate greenfield reconnaissance.",
      "Our Manganese Spectral Index (B11/B4) isolates manganese oxides while NDVI masking strips away Central Indian teak forest canopies.",
      "This reduces preliminary exploration cycle time from 18 months of foot-traversing down to instantaneous orbital screening.",
    ],
  },

  // --------------------------------------------------------------------------
  // 2. SATELLITE & GEOLOGICAL INDICATORS (SLIDERS & BAYESIAN PRIORS)
  // --------------------------------------------------------------------------
  geological_indicators: {
    id: "geological_indicators",
    title: "Multi-Spectral Sliders & Bayesian Geological Priors",
    badge: "GSI LITHOLOGY MATRIX & BAYESIAN REASONING",
    category: "Spectral Curve Synthesis & Prior Probability",
    executiveSummary:
      "Combines multi-spectral band reflectance sliders (B4 Red, B8 NIR, B11 SWIR-1, B12 SWIR-2) with regional Geological Survey of India (GSI) lithological priors to mathematically compute in-situ manganese grade, preventing false discoveries in barren rock formations.",
    problemSolved:
      "Satellites cannot distinguish between manganese-bearing rocks and look-alike barren iron formations or black soil purely from color. Integrating Bayesian lithological priors ensures that spectral scores are rigorously scaled by known geological host rock probabilities.",
    mathematicalCore: [
      {
        formula: "Final_Probability = Satellite_Spectral_Score × Lithology_Prior_Weight",
        description:
          "Bayesian prior multiplication: Gondite host rock carries weight 1.45 (proven host), while barren Granite Gneiss carries weight 0.15 (strong suppression).",
      },
      {
        formula: "Predicted_Mn% = 16.0% + (Final_Probability × 34.0%)",
        description:
          "Linear regression calibration mapping Bayesian probability to certified metallurgical manganese grades ranging from 16.0% (sub-grade) to 50.0% (premium battery/ferromanganese grade).",
      },
    ],
    parametersTable: [
      {
        name: "Band 4 (Red - 665nm)",
        unit: "Reflectance [0-1]",
        range: "0.05 – 0.45",
        default: "0.18",
        operationalImpact: "Lower red reflectance signifies strong visible absorption characteristic of manganese oxides.",
      },
      {
        name: "Band 11 (SWIR-1 - 1610nm)",
        unit: "Reflectance [0-1]",
        range: "0.10 – 0.65",
        default: "0.42",
        operationalImpact: "Elevated SWIR reflectance indicates crystalline manganese oxide structure.",
      },
      {
        name: "Host Lithology (GSI Prior)",
        unit: "Categorical Prior",
        range: "Gondite, Quartzite-Schist, Phyllite, BIF, Granite Gneiss",
        default: "Gondite",
        operationalImpact: "Scales Bayesian probability. Switching to Granite Gneiss suppresses grade to barren basement levels.",
      },
    ],
    outputGuide: [
      {
        outputName: "Predicted In-Situ Grade (% Mn)",
        interpretation: "Expected chemical manganese concentration in the outcrop formation.",
        normalVsAlert: "Grade ≥ 35%: High-grade commercial lode. Grade < 28%: Requires pre-concentration/beneficiation.",
      },
      {
        outputName: "Target Lithology Classification",
        interpretation: "Classification of likely rock stratum hosting the spectral signature.",
        normalVsAlert: "'Gondite Series' confirmed = Prime target for exploration drilling.",
      },
    ],
    dependencies: [
      {
        targetModule: "Global Reactive KPI Bar",
        effectDescription: "Instantly updates the Mean Composite Grade and Total In-Situ Ore KPIs across the portal.",
      },
      {
        targetModule: "Tab 4: Subsurface Boreholes",
        effectDescription: "Serves as the surface benchmark that is cross-referenced against diamond core assay logs.",
      },
      {
        targetModule: "Smelter Logistics",
        effectDescription: "Higher predicted grade unlocks higher gross realization prices at the steel plant sidings.",
      },
    ],
    judgePitch: [
      "Satellites alone can be fooled by dark basalt or black cotton soils; our Bayesian prior prevents costly false exploration campaigns.",
      "By incorporating GSI district geological maps, we apply mathematical priors that reward Gondite formations and heavily penalize barren granite.",
      "The result is a reliable, mathematically defensible in-situ grade prediction.",
    ],
  },

  // --------------------------------------------------------------------------
  // 3. OPERATIONAL CONSTRAINTS & STATUTORY HAIRCUTS
  // --------------------------------------------------------------------------
  operational_constraints: {
    id: "operational_constraints",
    title: "Operational Pit Feasibility & Environmental Constraints",
    badge: "DGMS SAFETY & MoEFCC STATUTORY COMPLIANCE",
    category: "Mining Geotechnics & Feasibility Haircuts",
    executiveSummary:
      "Applies real-world mining constraints, statutory environmental buffers, and geotechnical safety factors to discount gross in-situ geological reserves down to legally and economically extractable ore.",
    problemSolved:
      "A geological discovery is not automatically a mineable reserve. Without factoring in stripping ratios, pit depth limits, water ingress, and MoEFCC forest protection zones, reported reserve numbers are dangerously unrealistic.",
    mathematicalCore: [
      {
        formula: "Extractable_Ore = InSitu_Ore × Stripping_Haircut × Forest_Buffer_Factor × Metallurgical_Recovery (82%)",
        description:
          "Computes net marketable ore tonnage after deducting statutory safety buffers, pit slope stability losses, and processing recovery.",
      },
      {
        formula: "FoS (Factor of Safety) = (c + γ·H·cos²β·tanφ) / (γ·H·sinβ·cosβ)",
        description:
          "Bishop/Janbu limit equilibrium slope stability formulation evaluating bench wall collapse risk under dynamic water ingress.",
      },
    ],
    parametersTable: [
      {
        name: "Economic Cut-off Grade (% Mn)",
        unit: "% Mn",
        range: "20% – 35%",
        default: "28%",
        operationalImpact: "Material below this threshold is treated as sub-grade ore or routed to low-grade dumps.",
      },
      {
        name: "Current Pit Depth (m)",
        unit: "Meters",
        range: "20m – 350m",
        default: "110m",
        operationalImpact: "Deep pits incur higher haulage diesel consumption and exponential pumping head costs.",
      },
      {
        name: "Stripping Ratio (W:O)",
        unit: "Ratio (Waste : Ore)",
        range: "1.5:1 – 8.0:1",
        default: "3.2:1",
        operationalImpact: "Higher stripping ratios significantly escalate mining cost per extracted tonne of ore.",
      },
      {
        name: "Forest & Eco-Buffer Zone (m)",
        unit: "Meters",
        range: "50m – 500m",
        default: "150m",
        operationalImpact: "Statutory mandatory exclusion zone around protected tiger reserve and forest boundaries.",
      },
      {
        name: "Water Table Ingress Rate",
        unit: "m³/hour",
        range: "50 – 1200 m³/h",
        default: "320 m³/h",
        operationalImpact: "High groundwater ingress chokes pit bottom benches and destabilizes ramp haul roads.",
      },
    ],
    outputGuide: [
      {
        outputName: "Extractable Metal (Tonnes Mn)",
        interpretation: "Net pure manganese metal that can be legally blasted, hauled, and sold.",
        normalVsAlert: "Drops dynamically as stripping ratio or forest buffer restrictions increase.",
      },
      {
        outputName: "Slope Stability Factor of Safety (FoS)",
        interpretation: "DGMS compliance rating for open-pit highwall stability.",
        normalVsAlert: "FoS ≥ 1.30: Safe and compliant. FoS < 1.15: High danger of highwall bench slumping.",
      },
    ],
    dependencies: [
      {
        targetModule: "Global Reactive KPI Bar",
        effectDescription: "Directly calculates and updates the 'Extractable Metal Under Active Constraints' KPI card.",
      },
      {
        targetModule: "Shortfall Predictor",
        effectDescription: "Stripping ratio and water ingress rates feed into the ML operational bottleneck model.",
      },
    ],
    judgePitch: [
      "We bridge the gap between academic geology and actual Directorate General of Mines Safety (DGMS) regulatory standards.",
      "Our system applies realistic physical haircuts for overburden stripping ratios, dewatering head loss, and eco-sensitive buffers.",
      "Judges can see the exact difference between gross geological potential and net extractable cash flow.",
    ],
  },

  // --------------------------------------------------------------------------
  // 4. 2D/3D RESERVE HEATMAP & DEPTH SLICES
  // --------------------------------------------------------------------------
  reserve_heatmap: {
    id: "reserve_heatmap",
    title: "2D/3D Spatial Manganese Anomaly Heatmap & Depth Slices",
    badge: "GEOSPATIAL KRIGING & CONTOUR INTERPOLATION",
    category: "Spatial Resource Geometry & Slicing",
    executiveSummary:
      "Renders interactive spatial anomaly contours and horizontal bench depth slices across the active mining lease, enabling exploration teams to pinpoint high-grade drill targets and track seam dip geometry.",
    problemSolved:
      "Tabular data fails to communicate deposit strike, dip, and fault offsets. Visual spatial heatmaps enable mine planning engineers to optimize blast pattern positioning and dumper haulage entry ramps.",
    mathematicalCore: [
      {
        formula: "Z*(x_0) = Sum(λ_i × Z(x_i)) with Sum(λ_i) = 1",
        description:
          "Ordinary Kriging / Inverse Distance Weighting (IDW) interpolation estimating grade distribution between sparse drillhole coordinates.",
      },
      {
        formula: "Seam Continuity Index = exp(-h / a)",
        description:
          "Semi-variogram spherical model capturing spatial spatial correlation range (a) across the Central Indian strike direction (ENE-WSW).",
      },
    ],
    parametersTable: [
      {
        name: "Bench Depth Slice (Z-axis)",
        unit: "Meters (RL)",
        range: "0m (Surface) to 250m (Deep RL)",
        default: "80m RL",
        operationalImpact: "Navigates horizontal bench planes to inspect grade changes with increasing mining depth.",
      },
      {
        name: "Contour Smoothing Bandwidth",
        unit: "Pixels / Meters",
        range: "5 – 50m",
        default: "15m",
        operationalImpact: "Controls geospatial interpolation granularity and anomaly boundary sharpness.",
      },
    ],
    outputGuide: [
      {
        outputName: "Vibrant Purple Anomaly Cores",
        interpretation: "High-grade manganese beds exceeding 38% Mn concentration.",
        normalVsAlert: "Primary target zones for immediate production bench pushback.",
      },
      {
        outputName: "Teal / Green Transitional Halos",
        interpretation: "Medium-grade ore (28%–35% Mn) requiring blending or pre-concentration.",
        normalVsAlert: "Suitable for blending with Balaghat high-grade to meet 36% commercial contracts.",
      },
      {
        outputName: "Dark Slate / Charcoal Zones",
        interpretation: "Barren footwall granite gneiss or unmineralized hanging wall schists (<15% Mn).",
        normalVsAlert: "Designated for overburden waste dump placement.",
      },
    ],
    dependencies: [
      {
        targetModule: "Tab 4: Subsurface Boreholes",
        effectDescription: "Borehole collar coordinates pin and ground-truth the spatial interpolation grid.",
      },
      {
        targetModule: "Shortfall Predictor",
        effectDescription: "Grade distribution across active benches determines the blended feed grade to the crusher.",
      },
    ],
    judgePitch: [
      "Our interactive geospatial heatmap provides clear spatial intelligence on ore body continuity and strike.",
      "Engineers can slice down through benches from surface alluvium to 250m deep underground RL levels.",
      "It clearly separates high-grade ore lodes from barren waste rock, guiding haulage truck routing and bench blasting.",
    ],
  },

  // --------------------------------------------------------------------------
  // 5. SUBSURFACE BOREHOLE & DRILL-CORE INGESTION (JUDGE FEATURE #1)
  // --------------------------------------------------------------------------
  subsurface_boreholes: {
    id: "subsurface_boreholes",
    title: "Subsurface Borehole & Drill-Core Ingestion (GSI / UNFC G1–G4)",
    badge: "UNFC 111/122/333 & INDIAN BUREAU OF MINES COMPLIANT",
    category: "Subsurface Diamond Core Assays & Stratigraphy",
    executiveSummary:
      "Ingests downhole diamond drill-core assay intervals to perform length-weighted compositing, true geometric thickness corrections for dipping ore beds, Rock Quality Designation (RQD) geotechnical rating, and official UNFC G-stage classification.",
    problemSolved:
      "Overcomes the single biggest vulnerability of satellite prospecting: satellites only penetrate a fraction of a millimeter into the Earth's crust. Diamond drilling provides the statutory physical proof required for bankable feasibility and reserve certification.",
    mathematicalCore: [
      {
        formula: "True_Thickness (m) = Apparent_Core_Length (m) × cos(Dip_Angle in Radians)",
        description:
          "Trigonometric geometric correction accounting for the non-orthogonal intersection angle between vertical/inclined boreholes and dipping ore seams.",
      },
      {
        formula: "Composite_Grade (% Mn) = Sum(Interval_Length_i × Mn%_i) / Sum(Interval_Length_i)",
        description:
          "Length-weighted composite assay across all mineralized intervals exceeding the commercial cut-off threshold.",
      },
      {
        formula: "RQD (%) = (Sum of Core Pieces ≥ 10cm / Total Run Length) × 100",
        description:
          "Deere's Rock Quality Designation index measuring core intactness and joint frequency for underground stope and pit wall stability.",
      },
    ],
    parametersTable: [
      {
        name: "Preset Borehole Selector",
        unit: "Drill Hole ID",
        range: "BH-BGT-42, BH-UKW-18, BH-BRN-05",
        default: "BH-BGT-42 (Balaghat Deep)",
        operationalImpact: "Instantly switches between high-grade underground, medium-grade stratiform, and barren ground truth.",
      },
      {
        name: "Custom CSV Upload",
        unit: "Tabular File (.csv)",
        range: "9 standard columns",
        default: "Collar & downhole intervals",
        operationalImpact: "Allows geologists to upload proprietary company drill-core assays directly into the portal.",
      },
      {
        name: "Seam Dip Angle (θ)",
        unit: "Degrees",
        range: "15° – 85°",
        default: "45°",
        operationalImpact: "Directly determines true ore intercept thickness from apparent core lengths.",
      },
    ],
    outputGuide: [
      {
        outputName: "Downhole Composite Grade (% Mn)",
        interpretation: "Certified metallurgical grade across the ore intercept (e.g., 41.91% Mn for Balaghat BH-BGT-42).",
        normalVsAlert: "Grade ≥ 30%: Economic ore lode. Grade < 30%: Marginal or internal waste.",
      },
      {
        outputName: "Rock Quality (RQD %)",
        interpretation: "Geotechnical ground competence rating.",
        normalVsAlert: "RQD > 75%: Excellent/Competent rock. RQD < 50%: Poor, requires heavy rock bolting or gentle bench slopes.",
      },
      {
        outputName: "UNFC Exploration Stage",
        interpretation: "Statutory mineral resource category under United Nations Framework Classification.",
        normalVsAlert: "UNFC 111: Proved Reserve. UNFC 122: Indicated Reserve. UNFC 333: Inferred Resource.",
      },
      {
        outputName: "Ground Truth Correlation (%)",
        interpretation: "Statistical agreement between satellite surface prediction and physical drill-core assay.",
        normalVsAlert: "Correlation > 85%: Strong satellite validation. Anomaly confirmed at depth.",
      },
    ],
    dependencies: [
      {
        targetModule: "Global Reactive KPI Bar",
        effectDescription: "Clicking 'Synchronize Portal' immediately pushes the composite assay and true thickness into the global In-Situ and Grade KPIs.",
      },
      {
        targetModule: "Smelter Logistics (NSR)",
        effectDescription: "Certified high grade (>40%) updates the gross ore value and unlocks profitable dispatch to distant coastal steel plants.",
      },
      {
        targetModule: "Shortfall Predictor",
        effectDescription: "RQD and rock hardness calibrate excavator digging rates and blasting requirements.",
      },
    ],
    judgePitch: [
      "We address the core question every mining judge asks: 'How do you prove what is underground?'",
      "We ingest physical diamond drill logs, calculate length-weighted composite grades, and apply trigonometric dip corrections.",
      "Our system maps directly to Indian Bureau of Mines and UNFC 111/122/333 standards, bridging remote sensing with bankable geology.",
    ],
  },

  // --------------------------------------------------------------------------
  // 6. BATCH CSV RESERVE ESTIMATION
  // --------------------------------------------------------------------------
  batch_csv: {
    id: "batch_csv",
    title: "Batch CSV Exploration & Multi-Lease Reserve Estimation",
    badge: "ENTERPRISE BATCH PROCESSING ENGINE",
    category: "Bulk Ingestion & Multi-Pit Portfolio Analysis",
    executiveSummary:
      "Enables enterprise exploration departments to upload, parse, and evaluate hundreds of prospect lease blocks simultaneously, computing ranked prospectivity scores, estimated reserve tonnages, and portfolio-wide capital allocation priorities.",
    problemSolved:
      "Manual evaluation of individual mining leases one-by-one is tedious and prone to human error when managing district-scale exploration concessions spanning Madhya Pradesh and Maharashtra.",
    mathematicalCore: [
      {
        formula: "Portfolio_Rank = (0.45 × Grade_Score) + (0.35 × Tonnage_Score) - (0.20 × Stripping_Penalty)",
        description:
          "Multi-criteria decision analysis (MCDA) index ranking exploration concessions by net economic viability.",
      },
      {
        formula: "Batch_Gross_Tonnage = Sum(Area_i × Thickness_i × Density_i × Potential%_i)",
        description:
          "Aggregated reserve summation across all validated rows in the uploaded portfolio CSV.",
      },
    ],
    parametersTable: [
      {
        name: "CSV Schema Requirements",
        unit: "File Columns",
        range: "id, name, lat, lon, rock_type, band4, band8, band11, band12",
        default: "UTF-8 CSV format",
        operationalImpact: "Standardized ingestion template matching Geological Survey of India exploration databases.",
      },
      {
        name: "Batch Size Limit",
        unit: "Records",
        range: "1 – 500 prospects",
        default: "50 records typical",
        operationalImpact: "Instant asynchronous evaluation within < 500ms using vectorized NumPy pipelines.",
      },
    ],
    outputGuide: [
      {
        outputName: "Ranked Prospectivity Table",
        interpretation: "Color-coded priority matrix classifying concessions into Tier 1 (Drill Immediately) to Tier 4 (Sterilize).",
        normalVsAlert: "Green rows represent high-margin target leases; Red rows indicate barren concessions.",
      },
    ],
    dependencies: [
      {
        targetModule: "Sidebar & Mine Switcher",
        effectDescription: "Any row in the batch table can be promoted to the primary active mine across the dashboard.",
      },
    ],
    judgePitch: [
      "Our platform scales from single-pit inspection to company-wide regional portfolio screening.",
      "Geologists can drag-and-drop an entire district's exploration lease data and receive automated prospectivity rankings in seconds.",
    ],
  },

  // --------------------------------------------------------------------------
  // 7. AI OPERATIONAL SHORTFALL PREDICTOR (JUDGE FEATURE #2)
  // --------------------------------------------------------------------------
  shortfall_predictor: {
    id: "shortfall_predictor",
    title: "AI Production Shortfall Predictor & ML Bottleneck Attribution",
    badge: "SCIKIT-LEARN HIST-GRADIENT-BOOSTING REGRESSOR (6,000 SHIFTS)",
    category: "Operational Risk Surveillance & Root Cause Attribution",
    executiveSummary:
      "Replaces static linear penalty multipliers with a trained machine learning HistGradientBoostingRegressor fitted across 6,000 multi-shift operational records. Forecasts tonnage deficits, quantifies non-linear feature attributions (SHAP-style), and outputs actionable bench dispatch directives.",
    problemSolved:
      "Traditional mines manage shortfalls reactively after monthly quotas are missed. This AI model predicts deficits days in advance by capturing compound interactions between monsoon rainfall, dumper fleet mechanical starvation, excavator uptime, and overburden stripping backlogs.",
    mathematicalCore: [
      {
        formula: "Shortfall_Tonnes = Ensemble_Trees(Rainfall, Fleet_Avail, Shovel_Uptime, Stripping_Ratio, Dewatering_Cap)",
        description:
          "Gradient boosted decision tree ensemble modeling non-linear thresholds (e.g., rainfall > 45mm triggers exponential haul-road slippage and pump head loss).",
      },
      {
        formula: "Revenue_at_Risk (₹ Lakhs) = (Shortfall_Tonnes × Realization_Price_per_Tonne) / 100,000",
        description:
          "Direct financial deficit quantified at prevailing grade-benchmarked market prices.",
      },
      {
        formula: "Attribution%_i = (|Δ_Tree_Split_i| / Sum(|Δ_Tree_Split|)) × 100",
        description:
          "Tree-based SHAP-style non-linear feature contribution isolating the primary operational root cause.",
      },
    ],
    parametersTable: [
      {
        name: "Monthly Production Target",
        unit: "Tonnes",
        range: "10,000t – 80,000t",
        default: "35,000t",
        operationalImpact: "Contractual production quota committed to the Ministry of Steel and MOIL board.",
      },
      {
        name: "24h Cumulative Rainfall",
        unit: "Millimeters (mm)",
        range: "0mm – 250mm",
        default: "15mm",
        operationalImpact: "Extreme rainfall floods pit sumps, degrades haul road traction, and suspends open-pit blasting.",
      },
      {
        name: "Dumper Truck Availability",
        unit: "Percentage (%)",
        range: "30% – 100%",
        default: "88%",
        operationalImpact: "Mechanical availability of 35t haulers. Low availability causes loading shovel starvation.",
      },
      {
        name: "Hydraulic Shovel Uptime",
        unit: "Percentage (%)",
        range: "30% – 100%",
        default: "92%",
        operationalImpact: "Face loading excavator uptime. Breakdowns directly bottleneck bench ore evacuation.",
      },
      {
        name: "Stripping Ratio (W:O)",
        unit: "Ratio",
        range: "1.0:1 – 7.0:1",
        default: "3.0:1",
        operationalImpact: "Lag in waste stripping chokes access to exposed high-grade ore faces.",
      },
    ],
    outputGuide: [
      {
        outputName: "Primary Operational Bottleneck Banner",
        interpretation: "Direct diagnosis of the single most damaging constraint (e.g. 'MONSOON SUMP INUNDATION').",
        normalVsAlert: "Red banner triggers during critical operational stress; displays instant bench dispatch advice.",
      },
      {
        outputName: "Predicted Deficit (Tonnes)",
        interpretation: "Exact tonnage shortfall forecasted for the active production cycle.",
        normalVsAlert: "Shortfall < 500t (Low Risk / Green), 500-1500t (Moderate / Amber), > 1500t (Critical / Red).",
      },
      {
        outputName: "Revenue at Risk (₹ Lakhs)",
        interpretation: "Monetary value of lost production at current commercial prices.",
        normalVsAlert: "Enables mine managers to justify emergency overtime or standby equipment deployment costs.",
      },
      {
        outputName: "Bench Dispatch Recommendations",
        interpretation: "Prescriptive operational directives generated to mitigate the predicted deficit.",
        normalVsAlert: "Example: 'Deploy 2 standby 500HP pumps to Pit Sump 3; Reroute 4 dumpers from Bench 2 to Bench 1'.",
      },
    ],
    dependencies: [
      {
        targetModule: "Global Reactive KPI Bar",
        effectDescription: "Drives the 'Operational Shortfall Risk' badge (Low, Moderate, Critical) in the header.",
      },
      {
        targetModule: "Smelter Logistics (NSR)",
        effectDescription: "Reduced dispatched tonnage lowers the total weekly net profit margin across all smelter routes.",
      },
      {
        targetModule: "Prescriptive Actions Tab",
        effectDescription: "Feeds prioritized corrective actions into the DGMS-compliant operational task manager.",
      },
    ],
    judgePitch: [
      "We eliminated heuristic guesswork by training a scikit-learn HistGradientBoosting regressor on 6,000 multi-shift records.",
      "The AI isolates non-linear interactions: 80mm of rain with 90% truck availability causes only 400t loss, but with 60% trucks causes a catastrophic 1,800t deficit.",
      "Our system doesn't just predict failure; it provides explainable root cause attribution and tactical bench dispatch advice.",
    ],
  },

  // --------------------------------------------------------------------------
  // 8. SMELTER LOGISTICS & NET SMELTER RETURN (JUDGE FEATURE #3)
  // --------------------------------------------------------------------------
  smelter_logistics: {
    id: "smelter_logistics",
    title: "Closed-Loop Rail Logistics & Net Smelter Return (NSR) Optimizer",
    badge: "INDIAN RAILWAYS CLASS 140 FREIGHT & NSR TARIFF OPTIMIZER",
    category: "Downstream Logistics & Economic Margin Optimization",
    executiveSummary:
      "Calculates geodesic rail distances and Indian Railways freight tariffs to four major Central Indian ferromanganese and steel plants, computing Net Smelter Return (NSR) per tonne and total weekly profit margin to identify the optimal dispatch siding.",
    problemSolved:
      "Mining companies do not realize profits at the pit mouth; profit is realized at the smelter railway siding. Rail freight constitutes 20% to 35% of delivered ore cost. Dispatching high-grade ore to sub-optimal destinations destroys operational margins.",
    mathematicalCore: [
      {
        formula: "Rail_Freight (₹/tonne) = 450 + (Rail_Distance_km × 2.85 ₹/t/km)  [Class 140 Tariff]",
        description:
          "Published Indian Railways wagon-load freight formula for mineral commodities, plus ₹180/t terminal handling charges.",
      },
      {
        formula: "NSR (₹/tonne) = Gross_Realization_Price(Grade) - Rail_Freight - Siding_Handling_Fee",
        description:
          "Net Smelter Return: The net cash realized per extracted tonne after deducting all haulage, railway demurrage, and handling tariffs.",
      },
      {
        formula: "Weekly_Net_Margin (₹ Lakhs) = (NSR × Weekly_Dispatched_Tonnes) / 100,000",
        description:
          "Total net commercial margin generated by the active mine lease under optimal dispatch routing.",
      },
    ],
    parametersTable: [
      {
        name: "Target Smelters Evaluated",
        unit: "4 Plants",
        range: "MEL Chandrapur, Bhilai Steel Plant, Nagpur/Kanhan, Vizag Steel Plant",
        default: "All 4 simultaneously",
        operationalImpact: "Covers the primary ferromanganese, silico-manganese, and integrated steel consumers in Central India.",
      },
      {
        name: "Indian Railways Freight Class",
        unit: "Tariff Category",
        range: "Class 130 – 160",
        default: "Class 140 (Minerals)",
        operationalImpact: "Determines statutory per-kilometer telescopic freight rates.",
      },
      {
        name: "Siding Surcharge",
        unit: "₹ / tonne",
        range: "₹100 – ₹300/t",
        default: "₹180/t flat",
        operationalImpact: "Covers mechanical rake loading, shunting, and weighbridge calibration tariffs.",
      },
    ],
    outputGuide: [
      {
        outputName: "OPTIMAL ROUTE Green Badge",
        interpretation: "Identifies the specific steel plant yielding the highest Net Smelter Return per tonne.",
        normalVsAlert: "For Balaghat high-grade (>40%), high prices justify long dispatch to Vizag or Bhilai; medium-grade stays in Nagpur/Kanhan.",
      },
      {
        outputName: "Net Smelter Return (NSR ₹/tonne)",
        interpretation: "Net profit per tonne realized after all freight deductions.",
        normalVsAlert: "Values typically range between ₹2,200/t to ₹3,400/t depending on grade and distance.",
      },
      {
        outputName: "Weekly Net Margin (₹ Lakhs)",
        interpretation: "Total cash flow generated per week for MOIL from the active mine.",
        normalVsAlert: "Assists commercial sales desks in locking in railway rake booking commitments.",
      },
    ],
    dependencies: [
      {
        targetModule: "Global Reactive KPI Bar",
        effectDescription: "Drives the 5th global KPI: 'Optimal Smelter Freight Net Margin (NSR)'.",
      },
      {
        targetModule: "Tab 4: Borehole Ingestion",
        effectDescription: "Downhole composite grade directly updates gross realization price, shifting the optimal smelter destination.",
      },
      {
        targetModule: "Shortfall Predictor",
        effectDescription: "Predicted shift shortfall reduces available weekly dispatch tonnage in the margin calculation.",
      },
    ],
    judgePitch: [
      "We completed the loop from orbital space sensing to the blast furnace door.",
      "Our system uses Indian Railways Class 140 freight tariff formulas to compute Net Smelter Return (NSR) across 4 major Central Indian steel plants.",
      "Judges love that we don't just stop at mining geology; we optimize the financial supply chain that delivers dividends to MOIL.",
    ],
  },

  // --------------------------------------------------------------------------
  // 9. SCENARIO SIMULATOR & STRATEGIC WHAT-IF SANDBOX
  // --------------------------------------------------------------------------
  scenario_simulator: {
    id: "scenario_simulator",
    title: "Scenario Simulator & Strategic What-If Sandbox",
    badge: "EXECUTIVE CAPEX / OPEX DECISION ENGINE",
    category: "Strategic Investment Modeling & Payback Simulation",
    executiveSummary:
      "Provides executive leadership and board directors with a sandbox environment to stress-test multi-crore capital expenditure (CapEx) and operational investments before deployment.",
    problemSolved:
      "Mining investments in heavy equipment or drainage civil works cost tens of crores. Making investment decisions without predictive simulation leads to misallocated capital and extended payback cycles.",
    mathematicalCore: [
      {
        formula: "Net_Delta_Revenue = Annualized_Ore_Savings × Price_per_Tonne - Annualized_OpEx",
        description:
          "Computes net annual EBITDA expansion resulting from operational upgrades.",
      },
      {
        formula: "Payback_Period (Months) = (Total_CapEx_Investment / Net_Monthly_EBITDA_Delta)",
        description:
          "Simple and discounted cash flow payback period in months.",
      },
    ],
    parametersTable: [
      {
        name: "Fleet Expansion Lever",
        unit: "Additional Trucks",
        range: "+0 to +12 haulers",
        default: "+6 haul trucks",
        operationalImpact: "Elevates fleet availability by +15%, eliminating shovel waiting time.",
      },
      {
        name: "Monsoon Drainage Infrastructure",
        unit: "Pumping Capacity",
        range: "+100 to +1000 m³/h",
        default: "+400 m³/h",
        operationalImpact: "Prevents pit sump drowning during extreme 100mm+ monsoon cloudburst events.",
      },
      {
        name: "Ore Sorter Technology Upgrade",
        unit: "Grade Recovery Delta",
        range: "+1.0% to +6.0% Mn",
        default: "+3.5% Mn",
        operationalImpact: "Optical/XRF sorting upgrades low-grade run-of-mine ore into direct shipping metallurgical grade.",
      },
    ],
    outputGuide: [
      {
        outputName: "Net Annual Delta Revenue (₹ Crores)",
        interpretation: "Total additional bottom-line revenue added per fiscal year.",
        normalVsAlert: "Values > ₹15 Crores demonstrate strong investment viability.",
      },
      {
        outputName: "CapEx Payback Duration (Months)",
        interpretation: "Time required for the operational savings to fully recoup initial capital cost.",
        normalVsAlert: "Payback < 18 months represents an exceptional Tier-1 capital project.",
      },
    ],
    dependencies: [
      {
        targetModule: "Shortfall Predictor",
        effectDescription: "Lever settings immediately update baseline shift availability and dewatering head parameters.",
      },
    ],
    judgePitch: [
      "Our Scenario Simulator empowers MOIL directors to perform rigorous 'What-If' strategic planning.",
      "Executive teams can simulate buying 6 new haul trucks or upgrading pit dewatering canals and immediately see the ROI payback in months.",
    ],
  },

  // --------------------------------------------------------------------------
  // 10. GLOBAL REAL-TIME MINE RESERVE & PRODUCTION COCKPIT (DASHBOARD KPIS)
  // --------------------------------------------------------------------------
  dashboard_kpis: {
    id: "dashboard_kpis",
    title: "Universal Mine Reserve & Production Surveillance Cockpit",
    badge: "REAL-TIME ENTERPRISE KPI ORCHESTRATION",
    category: "Unified Telemetry & Cross-Module Intelligence",
    executiveSummary:
      "The central command cockpit aggregating live remote sensing discoveries, geotechnical drill core assays, shift production health, and freight logistics into a unified executive surveillance view.",
    problemSolved:
      "Enterprise mining operations suffer from fragmented data silos where geologists, pit superintendents, and commercial dispatchers use disconnected software tools.",
    mathematicalCore: [
      {
        formula: "Systemic_Health_Index = 0.35(Grade) + 0.35(Extraction_Rate) + 0.30(NSR_Realization)",
        description:
          "Normalized enterprise readiness metric grading continuous operational efficiency across the mining lease.",
      },
    ],
    parametersTable: [
      {
        name: "Target Mine Selection",
        unit: "Lease Name",
        range: "Balaghat, Ukwa, Dongri Buzurg, Mansar, Tirodi, Chikla, Gumgaon, Kandri",
        default: "None (Empty Placeholder State '--')",
        operationalImpact: "Switches the active geographic and operational lease across the entire multi-tiered platform.",
      },
    ],
    outputGuide: [
      {
        outputName: "Universal KPI Cards",
        interpretation: "Real-time reactive metrics dynamically synchronized with every slider across every page.",
        normalVsAlert: "Shows '--' placeholders until a region is selected to guarantee strict scientific integrity.",
      },
    ],
    dependencies: [
      {
        targetModule: "All Modules",
        effectDescription: "Acts as the parent synchronization master across all sub-components.",
      },
    ],
    judgePitch: [
      "Our platform breaks enterprise silos, creating a unified digital continuum from space to steel plant.",
      "Judges can observe zero-state integrity: all KPIs show clean '--' until real data is selected, proving nothing is hardcoded.",
    ],
  },
};
