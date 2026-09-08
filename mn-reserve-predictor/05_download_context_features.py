"""Download real Sentinel-2 features for commodity reference locations.

This script uses the public Microsoft Planetary Computer STAC catalog and
does not synthesize spectral values. Rows with missing auxiliary features are
kept for audit, but are not silently promoted to training-ready observations.
"""

import argparse
import zipfile
from pathlib import Path

import numpy as np
import pandas as pd
import requests
import rasterio
from rasterio.windows import Window


ROOT = Path(__file__).resolve().parent
REFERENCE_PATH = ROOT / "data" / "commodity_reference_locations.csv"
OUTPUT_PATH = ROOT / "data" / "real_context_features.csv"
STAC_SEARCH = "https://planetarycomputer.microsoft.com/api/stac/v1/search"
STAC_SIGN = "https://planetarycomputer.microsoft.com/api/sas/v1/sign"
LANDSAT_COLLECTION = "landsat-c2-l2"
EMAG2_URL = "https://www.ngdc.noaa.gov/geomag/data/EMAG2/EMAG2_V3_20170530.zip"
WEATHER_API = "https://archive-api.open-meteo.com/v1/archive"
ELEVATION_API = "https://api.open-meteo.com/v1/elevation"
BANDS = ("B02", "B03", "B04", "B08", "B11", "B12")


def load_emag2_grid(cache_path):
    """Download and parse official EMAG2 v3 CSV when available."""
    if not cache_path.exists():
        response = requests.get(EMAG2_URL, timeout=180)
        response.raise_for_status()
        cache_path.write_bytes(response.content)
    with zipfile.ZipFile(cache_path) as archive:
        csv_name = next(name for name in archive.namelist() if name.lower().endswith(".csv"))
        with archive.open(csv_name) as stream:
            return pd.read_csv(stream)


def nearest_emag2(latitude, longitude, grid):
    """Return nearest EMAG2 anomaly; a missing grid means explicit unknown."""
    if grid is None:
        return None, "NOAA EMAG2 v3 unavailable"
    lat_col = next(column for column in grid.columns if column.lower() in ("lat", "latitude"))
    lon_col = next(column for column in grid.columns if column.lower() in ("lon", "longitude"))
    value_col = next(column for column in grid.columns if "mag" in column.lower() or "anom" in column.lower())
    distance = (grid[lat_col] - latitude).abs() + (grid[lon_col] - longitude).abs()
    row = grid.loc[distance.idxmin()]
    return float(row[value_col]), "NOAA EMAG2 v3 nearest grid cell"


def fetch_scene(latitude, longitude, cloud_limit=25):
    payload = {
        "collections": ["sentinel-2-l2a"],
        "bbox": [longitude - 0.025, latitude - 0.025, longitude + 0.025, latitude + 0.025],
        "datetime": "2017-01-01T00:00:00Z/2026-12-31T23:59:59Z",
        "query": {"eo:cloud_cover": {"lt": cloud_limit}},
        "limit": 1,
        "sortby": [{"field": "properties.eo:cloud_cover", "direction": "asc"}],
    }
    response = requests.post(STAC_SEARCH, json=payload, timeout=30)
    response.raise_for_status()
    features = response.json().get("features", [])
    if not features:
        return None

    item = features[0]
    arrays = {}
    for band in BANDS:
        href = item["assets"][band]["href"]
        signed = requests.get(STAC_SIGN, params={"href": href}, timeout=15)
        signed.raise_for_status()
        with rasterio.open(signed.json()["href"]) as source:
            size = min(128, source.width, source.height)
            window = Window(
                max(0, source.width // 2 - size // 2),
                max(0, source.height // 2 - size // 2),
                size,
                size,
            )
            arrays[band] = np.clip(source.read(1, window=window).astype(float) / 10000.0, 0.0, 1.0)

    b04 = arrays["B04"]
    b08 = arrays["B08"]
    ndvi = (b08 - b04) / (b08 + b04 + 1e-6)
    item_date = item.get("properties", {}).get("datetime")
    cloud_cover = item.get("properties", {}).get("eo:cloud_cover")
    return {
        "image_date": item_date,
        "cloud_cover_pct": cloud_cover,
        "swir_b11_absorption": float(np.nanmedian(arrays["B11"])),
        "swir_b12_absorption": float(np.nanmedian(arrays["B12"])),
        "ndvi": float(np.nanmedian(ndvi)),
        "b02_median": float(np.nanmedian(arrays["B02"])),
        "b03_median": float(np.nanmedian(arrays["B03"])),
        "b04_median": float(np.nanmedian(arrays["B04"])),
        "b08_median": float(np.nanmedian(arrays["B08"])),
        "source_type": "Sentinel-2 L2A via Microsoft Planetary Computer STAC",
    }


def fetch_landsat_lst(latitude, longitude, cloud_limit=25):
    """Fetch median Landsat Collection 2 L2 surface temperature in Celsius."""
    payload = {
        "collections": [LANDSAT_COLLECTION],
        "bbox": [longitude - 0.025, latitude - 0.025, longitude + 0.025, latitude + 0.025],
        "datetime": "2020-01-01T00:00:00Z/2026-12-31T23:59:59Z",
        "query": {"eo:cloud_cover": {"lt": cloud_limit}},
        "limit": 1,
        "sortby": [{"field": "properties.eo:cloud_cover", "direction": "asc"}],
    }
    response = requests.post(STAC_SEARCH, json=payload, timeout=30)
    response.raise_for_status()
    features = response.json().get("features", [])
    if not features:
        return None
    assets = features[0].get("assets", {})
    thermal_asset = assets.get("ST_B10")
    if not thermal_asset:
        return None
    signed = requests.get(STAC_SIGN, params={"href": thermal_asset["href"]}, timeout=15)
    signed.raise_for_status()
    with rasterio.open(signed.json()["href"]) as source:
        size = min(128, source.width, source.height)
        window = Window(
            max(0, source.width // 2 - size // 2),
            max(0, source.height // 2 - size // 2),
            size,
            size,
        )
        # Landsat Collection 2 ST_B10 scale/offset: Kelvin to Celsius.
        values = source.read(1, window=window).astype(float) * 0.00341802 + 149.0 - 273.15
    values = values[np.isfinite(values) & (values > -50) & (values < 80)]
    if values.size == 0:
        return None
    return {
        "land_surface_temp_c": float(np.median(values)),
        "land_surface_temp_source": "Landsat Collection 2 Level-2 ST_B10 via Planetary Computer STAC",
        "lst_scene_date": features[0].get("properties", {}).get("datetime"),
    }


def fetch_auxiliary_features(latitude, longitude, start_date="2024-01-01", end_date="2024-12-31"):
    """Fetch real reanalysis/DEM values; no synthetic fallbacks are used."""
    soil_params = {
        "latitude": latitude,
        "longitude": longitude,
        "start_date": start_date,
        "end_date": end_date,
        "hourly": "soil_moisture_0_to_7cm,soil_temperature_0_to_7cm",
        "models": "era5_land",
        "timezone": "UTC",
    }
    soil_response = requests.get(WEATHER_API, params=soil_params, timeout=45)
    soil_response.raise_for_status()
    soil_hourly = soil_response.json().get("hourly", {})
    rain_params = {**soil_params, "hourly": "precipitation", "models": "era5"}
    rain_response = requests.get(WEATHER_API, params=rain_params, timeout=45)
    rain_response.raise_for_status()
    rain_hourly = rain_response.json().get("hourly", {})
    precipitation = pd.to_numeric(pd.Series(rain_hourly.get("precipitation", [])), errors="coerce").dropna()
    soil_moisture = pd.to_numeric(pd.Series(soil_hourly.get("soil_moisture_0_to_7cm", [])), errors="coerce").dropna()
    soil_temperature = pd.to_numeric(pd.Series(soil_hourly.get("soil_temperature_0_to_7cm", [])), errors="coerce").dropna()
    elevation_response = requests.get(
        ELEVATION_API,
        params={"latitude": latitude, "longitude": longitude},
        timeout=20,
    )
    elevation_response.raise_for_status()
    elevation_values = elevation_response.json().get("elevation", [])
    if precipitation.empty or soil_moisture.empty or soil_temperature.empty or not elevation_values:
        raise ValueError("Auxiliary API returned incomplete values")

    return {
        # Annual mean weekly precipitation from hourly ERA5-Land totals.
        "rainfall_mm_weekly": float(precipitation.sum() / 52.1429),
        "soil_moisture": float(soil_moisture.mean()),
        # This is soil temperature, retained under the model's historical
        # feature name and explicitly marked as a proxy rather than LST.
        "land_surface_temp_c": float(soil_temperature.mean()),
        "land_surface_temp_source": "ERA5-Land soil_temperature_0_to_7cm proxy; not satellite LST",
        "elevation_m": float(elevation_values[0]),
        "rainfall_source": "ERA5 via Open-Meteo Historical API",
        "soil_moisture_source": "ERA5-Land via Open-Meteo Historical API",
        "elevation_source": "Copernicus DEM GLO-90 via Open-Meteo Elevation API",
        "auxiliary_period": f"{start_date}/{end_date}",
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--cloud-limit", type=float, default=25)
    parser.add_argument("--overwrite", action="store_true")
    parser.add_argument("--emag-cache", type=Path, default=ROOT / "data" / "EMAG2_V3_20170530.zip")
    parser.add_argument("--skip-emag", action="store_true", help="Do not attempt the large NOAA archive download")
    args = parser.parse_args()

    reference = pd.read_csv(REFERENCE_PATH)
    existing = pd.read_csv(OUTPUT_PATH) if OUTPUT_PATH.exists() and not args.overwrite else pd.DataFrame()
    emag_grid = None
    if not args.skip_emag:
        try:
            emag_grid = load_emag2_grid(args.emag_cache)
            print(f"Loaded EMAG2 grid from {args.emag_cache}")
        except Exception as error:
            print(f"EMAG2 unavailable for this run: {error}")
    else:
        print("EMAG2 download skipped; magnetic values remain unknown.")
    rows = []
    for record in reference.to_dict("records"):
        cached = existing[existing["site_id"] == record["site_id"]] if not existing.empty else pd.DataFrame()
        if not cached.empty:
            rows.append(cached.iloc[0].to_dict())
            continue
        try:
            features = fetch_scene(record["latitude"], record["longitude"], args.cloud_limit)
            auxiliary = fetch_auxiliary_features(record["latitude"], record["longitude"])
            try:
                lst = fetch_landsat_lst(record["latitude"], record["longitude"], args.cloud_limit)
            except Exception as error:
                print(f"Landsat LST unavailable for {record['site_id']}: {error}")
                lst = None
            if lst:
                auxiliary.update(lst)
            emag_value, emag_source = nearest_emag2(record["latitude"], record["longitude"], emag_grid)
            row = {**record, **(features or {}), **auxiliary, "emag2_anomaly_nt": emag_value, "emag2_source": emag_source}
            row["download_status"] = "success" if features and auxiliary else "no_scene"
        except Exception as error:
            row = {**record, "download_status": "error", "download_error": str(error)}
        rows.append(row)
        print(record["site_id"], row["download_status"])

    output = pd.DataFrame(rows)
    output["is_synthetic"] = False
    required_auxiliary = [
        "land_surface_temp_c", "rainfall_mm_weekly", "soil_moisture",
        "emag2_anomaly_nt", "elevation_m", "rock_type",
    ]
    auxiliary_values = output.reindex(columns=required_auxiliary)
    output["training_ready"] = (
        output["download_status"].eq("success")
        & auxiliary_values.notna().all(axis=1)
        & output.get(
            "land_surface_temp_source",
            pd.Series("", index=output.index),
        ).eq("Sentinel-3/ Landsat LST")
    )
    output["training_blockers"] = output.apply(
        lambda row: "; ".join(filter(None, [
            "missing EMAG2 magnetic anomaly" if pd.isna(row.get("emag2_anomaly_nt")) else "",
            "soil temperature proxy used instead of land surface temperature"
            if row.get("land_surface_temp_source") != "Sentinel-3/ Landsat LST" else "",
            "missing Sentinel-2 scene" if row.get("download_status") != "success" else "",
        ])),
        axis=1,
    )
    output.to_csv(OUTPUT_PATH, index=False)
    print(f"Wrote {len(output)} real-context records to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()