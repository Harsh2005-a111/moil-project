"""Commodity context used to prevent cross-commodity Mn false positives.

Point records are the initial fallback until authoritative lease polygons are
available. The registry is intentionally separate from the Mn mine roster.
"""

import csv
from math import cos, radians, sqrt
from pathlib import Path
from typing import Optional, Dict, Any


REFERENCE_PATH = (
    Path(__file__).resolve().parents[2]
    / "mn-reserve-predictor" / "data" / "commodity_reference_locations.csv"
)


def _load_locations():
    """Load representative commodity points; lease polygons can replace these later."""
    if not REFERENCE_PATH.exists():
        return []
    with REFERENCE_PATH.open("r", encoding="utf-8", newline="") as file:
        locations = []
        for row in csv.DictReader(file):
            name_tokens = tuple(token for token in row["name"].lower().replace("-", " ").split() if len(token) > 3)
            locations.append({
                "name": row["name"],
                "aliases": tuple(filter(None, (
                    row["name"].lower(), row["site_id"].lower(), row["commodity"].lower(), *name_tokens,
                ))),
                "commodity": row["commodity"],
                "latitude": float(row["latitude"]),
                "longitude": float(row["longitude"]),
                "match_radius_km": 12.0 if row["label_confidence"] == "high" else 8.0,
                "source": f"{row['source']} ({row['source_url']})",
            })
        return locations

REFERENCE_LOCATIONS = _load_locations()
NON_MN_LOCATIONS = [record for record in REFERENCE_LOCATIONS if record["commodity"] != "manganese"]
MN_LOCATIONS = [record for record in REFERENCE_LOCATIONS if record["commodity"] == "manganese"]


def _distance_km(latitude: float, longitude: float, record: Dict[str, Any]) -> float:
    """Approximate local distance, suitable for point-record matching."""
    lat_km = (latitude - record["latitude"]) * 111.0
    lon_km = (longitude - record["longitude"]) * 111.0 * cos(radians(latitude))
    return sqrt(lat_km ** 2 + lon_km ** 2)


def classify_commodity_context(
    latitude: float,
    longitude: float,
    region_name: Optional[str] = None,
) -> Dict[str, Any]:
    """Classify a coordinate before running the Mn prospectivity model."""
    normalized_name = (region_name or "").strip().lower()
    nearest_name_match = None

    for record in NON_MN_LOCATIONS:
        distance_km = _distance_km(latitude, longitude, record)
        coordinate_match = distance_km <= record["match_radius_km"]
        name_match = any(alias in normalized_name for alias in record["aliases"])

        if coordinate_match:
            return {
                "status": "NON_MN_COMMODITY",
                "commodity": record["commodity"],
                "matched_site": record["name"],
                "distance_km": round(distance_km, 2),
                "source": record["source"],
                "reason": f"Coordinate falls within the verified {record['commodity']} site context.",
            }

        if name_match:
            nearest_name_match = record

    # A name by itself must not sterilize unrelated coordinates. It is only
    # reported for review until a matching coordinate is supplied.
    if nearest_name_match:
        return {
            "status": "NAME_COORDINATE_MISMATCH",
            "commodity": nearest_name_match["commodity"],
            "matched_site": nearest_name_match["name"],
            "distance_km": round(_distance_km(latitude, longitude, nearest_name_match), 2),
            "source": nearest_name_match["source"],
            "reason": "Site name was supplied, but coordinates are outside the registered site radius.",
        }

    for record in MN_LOCATIONS:
        distance_km = _distance_km(latitude, longitude, record)
        if distance_km <= record["match_radius_km"]:
            return {
                "status": "MN_COMPATIBLE",
                "commodity": "manganese",
                "matched_site": record["name"],
                "distance_km": round(distance_km, 2),
                "source": record["source"],
                "reason": "Coordinate falls within the verified manganese site context.",
            }

    return {
        "status": "UNKNOWN",
        "commodity": None,
        "matched_site": None,
        "distance_km": None,
        "source": None,
        "reason": "No authoritative commodity context matched these coordinates.",
    }