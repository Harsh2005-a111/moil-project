"""
borehole_engine.py
==================
Subsurface Borehole & Drill-Core Ingestion Engine for MOIL.
Processes diamond core assay logs (CSV / LAS), computes downhole composite grades,
geotechnical RQD competence, GSI / UNFC exploration stage progression (G4 -> G1),
and performs cross-validation against surface satellite predictions.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional


# Presets for high-impact demo
MOIL_BOREHOLE_PRESETS = {
    "BH-BGT-42": {
        "hole_id": "BH-BGT-42 (Balaghat Deep Lode)",
        "mine_name": "Balaghat Mine (Madhya Pradesh)",
        "collar_x": 180.5,
        "collar_y": 320.0,
        "elevation_m": 345.0,
        "total_depth_m": 120.0,
        "drill_grid_spacing_m": 45.0,  # <= 50m -> G1 Detailed Reserve
        "drilling_method": "HQ Diamond Core Wireline",
        "intervals": [
            {"from_m": 0.0, "to_m": 14.0, "lithology": "Overburden / Weathered Laterite", "mn_pct": 3.4, "fe_pct": 32.0, "sio2_pct": 41.2, "rqd_pct": 42.0},
            {"from_m": 14.0, "to_m": 38.0, "lithology": "Mansar Muscovite-Biotite Schist", "mn_pct": 16.8, "fe_pct": 14.5, "sio2_pct": 52.0, "rqd_pct": 68.0},
            {"from_m": 38.0, "to_m": 62.0, "lithology": "Braunite Massive Ore Lode (Primary)", "mn_pct": 44.2, "fe_pct": 6.8, "sio2_pct": 8.5, "rqd_pct": 91.0},
            {"from_m": 62.0, "to_m": 88.0, "lithology": "Gondite / Braunite High-Grade Bed", "mn_pct": 39.8, "fe_pct": 8.2, "sio2_pct": 14.0, "rqd_pct": 86.0},
            {"from_m": 88.0, "to_m": 120.0, "lithology": "Tirodi Granite Gneiss (Footwall)", "mn_pct": 4.1, "fe_pct": 5.2, "sio2_pct": 68.5, "rqd_pct": 94.0},
        ]
    },
    "BH-UKW-18": {
        "hole_id": "BH-UKW-18 (Ukwa North Outcrop)",
        "mine_name": "Ukwa Mine (Balaghat District)",
        "collar_x": 140.0,
        "collar_y": 210.0,
        "elevation_m": 410.0,
        "total_depth_m": 90.0,
        "drill_grid_spacing_m": 120.0,  # 100-200m -> G2 Pre-Feasibility
        "drilling_method": "NQ Diamond Core",
        "intervals": [
            {"from_m": 0.0, "to_m": 18.0, "lithology": "Alluvial Soil & Scree", "mn_pct": 2.1, "fe_pct": 24.0, "sio2_pct": 48.0, "rqd_pct": 38.0},
            {"from_m": 18.0, "to_m": 42.0, "lithology": "Quartz-Mica Schist (Hanging Wall)", "mn_pct": 14.2, "fe_pct": 12.0, "sio2_pct": 58.0, "rqd_pct": 62.0},
            {"from_m": 42.0, "to_m": 74.0, "lithology": "Tabular Braunite Ore Band", "mn_pct": 37.6, "fe_pct": 9.4, "sio2_pct": 16.5, "rqd_pct": 84.0},
            {"from_m": 74.0, "to_m": 90.0, "lithology": "Quartzite Footwall Basement", "mn_pct": 5.0, "fe_pct": 4.5, "sio2_pct": 74.0, "rqd_pct": 92.0},
        ]
    },
    "BH-BRN-05": {
        "hole_id": "BH-BRN-05 (Sterilized Barren Ground)",
        "mine_name": "Deccan Trap Peripheral Reconnaissance",
        "collar_x": 80.0,
        "collar_y": 90.0,
        "elevation_m": 290.0,
        "total_depth_m": 80.0,
        "drill_grid_spacing_m": 500.0,  # > 400m -> G4 Reconnaissance / Sterilized
        "drilling_method": "Reverse Circulation (RC)",
        "intervals": [
            {"from_m": 0.0, "to_m": 35.0, "lithology": "Deccan Basalt Flow Unit 1", "mn_pct": 0.8, "fe_pct": 14.2, "sio2_pct": 48.0, "rqd_pct": 72.0},
            {"from_m": 35.0, "to_m": 80.0, "lithology": "Massive Granite Gneiss", "mn_pct": 0.5, "fe_pct": 3.8, "sio2_pct": 71.0, "rqd_pct": 95.0},
        ]
    }
}


def analyze_borehole_log(
    hole_data: Dict[str, Any],
    cutoff_grade_pct: float = 30.0,
    surface_predicted_grade_pct: Optional[float] = None
) -> Dict[str, Any]:
    """
    Parses intervals, computes true mineralized intercept, downhole composites,
    geotechnical RQD rock stability, and UNFC G-stage classification.
    """
    hole_id = hole_data.get("hole_id", "BH-CUSTOM-01")
    mine_name = hole_data.get("mine_name", "MOIL Exploration Sector")
    total_depth = float(hole_data.get("total_depth_m", 100.0))
    grid_spacing = float(hole_data.get("drill_grid_spacing_m", 100.0))
    intervals = hole_data.get("intervals", [])

    if not intervals:
        raise ValueError("Borehole log contains no assay intervals.")

    total_intercept_thickness = 0.0
    weighted_grade_sum = 0.0
    weighted_rqd_sum = 0.0
    ore_interval_count = 0

    processed_intervals = []
    for intv in intervals:
        from_m = float(intv.get("from_m", 0.0))
        to_m = float(intv.get("to_m", from_m + 1.0))
        thickness = max(0.1, to_m - from_m)
        mn_pct = float(intv.get("mn_pct", 0.0))
        fe_pct = float(intv.get("fe_pct", 0.0))
        sio2_pct = float(intv.get("sio2_pct", 0.0))
        rqd_pct = float(intv.get("rqd_pct", 50.0))
        lithology = intv.get("lithology", "Unclassified")

        is_economic_ore = mn_pct >= cutoff_grade_pct
        if is_economic_ore:
            total_intercept_thickness += thickness
            weighted_grade_sum += thickness * mn_pct
            weighted_rqd_sum += thickness * rqd_pct
            ore_interval_count += 1

        processed_intervals.append({
            "from_m": from_m,
            "to_m": to_m,
            "thickness_m": round(thickness, 1),
            "lithology": lithology,
            "mn_pct": round(mn_pct, 1),
            "fe_pct": round(fe_pct, 1),
            "sio2_pct": round(sio2_pct, 1),
            "rqd_pct": round(rqd_pct, 1),
            "is_economic_ore": is_economic_ore,
            "geotech_quality": "Excellent" if rqd_pct >= 90 else "Good" if rqd_pct >= 75 else "Fair" if rqd_pct >= 50 else "Poor",
        })

    # Composite metrics
    if total_intercept_thickness > 0:
        composite_grade_pct = round(weighted_grade_sum / total_intercept_thickness, 2)
        composite_rqd_pct = round(weighted_rqd_sum / total_intercept_thickness, 1)
        is_mineralized = True
    else:
        # If no interval met cutoff, report maximum intercept
        max_intv = max(processed_intervals, key=lambda x: x["mn_pct"])
        composite_grade_pct = round(max_intv["mn_pct"], 2)
        composite_rqd_pct = round(max_intv["rqd_pct"], 1)
        is_mineralized = False

    # UNFC & GSI Stage Progression Framework (Indian Mineral Evidence Standards)
    if not is_mineralized or composite_grade_pct < 15.0:
        unfc_code = "UNFC 777"
        unfc_stage = "Sterilized Non-Mineralized Country Rock"
        gsi_stage = "Sterilized Ground (Excluded from Mining Lease)"
        exploration_status = "STERILIZED — Direct exploration funds to other sectors"
        confidence_pct = 95.0
    elif grid_spacing <= 50.0:
        unfc_code = "UNFC 111"
        unfc_stage = "Proven Mineral Reserve (G1 Detailed Mining Grid)"
        gsi_stage = "G1 Detailed Exploration / Active Production Face"
        exploration_status = "READY FOR COMMERCIAL EXTRACTION — 50m close-grid confirmed"
        confidence_pct = 94.0
    elif grid_spacing <= 150.0:
        unfc_code = "UNFC 221"
        unfc_stage = "Probable Mineral Resource (G2 Pre-Feasibility)"
        gsi_stage = "G2 Pre-Feasibility Study (100m–150m Grid)"
        exploration_status = "ADVANCED DRILLING — Infill drilling required to convert to G1"
        confidence_pct = 78.0
    elif grid_spacing <= 350.0:
        unfc_code = "UNFC 333"
        unfc_stage = "Inferred Mineral Resource (G3 Prospecting)"
        gsi_stage = "G3 Prospecting / Scout Boreholes (200m–350m Grid)"
        exploration_status = "SCOUT DRILLING POSITIVE — Commission systematic grid"
        confidence_pct = 58.0
    else:
        unfc_code = "UNFC 334"
        unfc_stage = "Reconnaissance Resource (G4)"
        gsi_stage = "G4 Regional Reconnaissance (> 400m Spacing)"
        exploration_status = "EARLY RECONNAISSANCE — First borehole intersection"
        confidence_pct = 42.0

    # Cross-validation with surface satellite remote sensing
    correlation_metrics = None
    if surface_predicted_grade_pct is not None and is_mineralized:
        error = abs(composite_grade_pct - surface_predicted_grade_pct)
        match_pct = max(0.0, min(100.0, 100.0 - (error / max(1.0, composite_grade_pct)) * 100.0))
        correlation_metrics = {
            "surface_satellite_grade_pct": round(surface_predicted_grade_pct, 1),
            "subsurface_drilled_grade_pct": composite_grade_pct,
            "variance_delta_pct": round(error, 1),
            "spectral_ground_truth_correlation_pct": round(match_pct, 1),
            "validation_verdict": "STRONG VALIDATION — Satellite anomaly confirmed at depth" if match_pct >= 85 else "MODERATE COUPLING — Depth dilution observed",
        }

    return {
        "hole_id": hole_id,
        "mine_name": mine_name,
        "total_depth_m": total_depth,
        "drill_grid_spacing_m": grid_spacing,
        "cutoff_grade_pct": cutoff_grade_pct,
        "is_mineralized": is_mineralized,
        "true_ore_thickness_m": round(total_intercept_thickness, 1),
        "composite_ore_grade_pct": composite_grade_pct,
        "composite_rqd_pct": composite_rqd_pct,
        "unfc_code": unfc_code,
        "unfc_stage": unfc_stage,
        "gsi_stage": gsi_stage,
        "exploration_status": exploration_status,
        "confidence_pct": confidence_pct,
        "intervals": processed_intervals,
        "satellite_cross_validation": correlation_metrics,
    }


def parse_borehole_csv_string(csv_text: str, cutoff_grade_pct: float = 30.0) -> Dict[str, Any]:
    """
    Parses uploaded CSV text into a structured borehole analysis dictionary.
    Expected columns: from_m, to_m, lithology, mn_pct, [fe_pct, sio2_pct, rqd_pct]
    """
    from io import StringIO
    df = pd.read_csv(StringIO(csv_text))
    # Normalize headers
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]

    intervals = []
    for _, r in df.iterrows():
        from_m = float(r.get("from_m", r.get("from", r.get("depth_from", 0.0))))
        to_m = float(r.get("to_m", r.get("to", r.get("depth_to", from_m + 1.0))))
        lith = str(r.get("lithology", r.get("rock_type", "Drill Core Stratum")))
        mn = float(r.get("mn_pct", r.get("mn", r.get("grade", 25.0))))
        fe = float(r.get("fe_pct", r.get("fe", 10.0)))
        sio2 = float(r.get("sio2_pct", r.get("sio2", 15.0)))
        rqd = float(r.get("rqd_pct", r.get("rqd", 75.0)))

        intervals.append({
            "from_m": from_m,
            "to_m": to_m,
            "lithology": lith,
            "mn_pct": mn,
            "fe_pct": fe,
            "sio2_pct": sio2,
            "rqd_pct": rqd,
        })

    tot_depth = max(i["to_m"] for i in intervals) if intervals else 100.0
    hole_data = {
        "hole_id": "UPLOADED-CORE-LOG",
        "mine_name": "Active Ingested Lease",
        "total_depth_m": tot_depth,
        "drill_grid_spacing_m": 75.0,
        "intervals": intervals,
    }
    return analyze_borehole_log(hole_data, cutoff_grade_pct=cutoff_grade_pct)
