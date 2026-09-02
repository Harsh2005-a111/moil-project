import requests
import getpass
import os
import json
import numpy as np
import pandas as pd
import rasterio
from rasterio.io import MemoryFile
import matplotlib.pyplot as plt


# ============================================================
# 1. ENTER COPERNICUS CREDENTIALS
# ============================================================

CLIENT_ID = getpass.getpass("Enter Copernicus Client ID: ")
CLIENT_SECRET = getpass.getpass("Enter Copernicus Client Secret: ")


# ============================================================
# 2. COPERNICUS ENDPOINTS
# ============================================================

TOKEN_URL = (
    "https://identity.dataspace.copernicus.eu/"
    "auth/realms/CDSE/protocol/openid-connect/token"
)

PROCESS_URL = (
    "https://sh.dataspace.copernicus.eu/"
    "api/v1/process"
)


# ============================================================
# 3. GET ACCESS TOKEN
# ============================================================

print("\nGetting access token...")

token_response = requests.post(
    TOKEN_URL,
    data={
        "grant_type": "client_credentials",
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
    },
    timeout=30
)

print("Token server status:", token_response.status_code)

if token_response.status_code != 200:

    print("\nAuthentication failed!")
    print(token_response.text)

    raise Exception(
        "Could not obtain access token. "
        "Check your Client ID and Client Secret."
    )


access_token = token_response.json()["access_token"]

print("✓ Authentication successful!")


# ============================================================
# 4. TEST DATA
# ============================================================

# These are ONLY test coordinates.
# They are NOT verified manganese deposits.

locations = pd.DataFrame({

    "mine_id": [
        "test_001",
        "test_002",
        "test_003",
        "test_004",
        "test_005"
    ],

    "latitude": [
        21.6500,
        21.7200,
        21.5800,
        21.8000,
        21.6900
    ],

    "longitude": [
        85.6000,
        85.4800,
        85.7200,
        85.5500,
        85.8200
    ]
})

print("\nTest locations:")
print(locations)


# ============================================================
# 5. OUTPUT DIRECTORY
# ============================================================

OUTPUT_DIR = "sentinel_images"

os.makedirs(OUTPUT_DIR, exist_ok=True)


# ============================================================
# 6. PARAMETERS
# ============================================================

START_DATE = "2025-01-01T00:00:00Z"
END_DATE   = "2025-12-31T23:59:59Z"

# Around 5 km × 5 km
BUFFER = 0.025

# 10 metre resolution
RESOLUTION = 10


# ============================================================
# 7. EVALSCRIPT
# ============================================================
#
# Sentinel-2 bands:
#
# B02 = Blue
# B03 = Green
# B04 = Red
# B08 = NIR
# B11 = SWIR
# B12 = SWIR
#
# ============================================================

EVALSCRIPT = """
//VERSION=3

function setup() {

    return {
        input: [{
            bands: [
                "B02",
                "B03",
                "B04",
                "B08",
                "B11",
                "B12"
            ]
        }],

        output: {
            bands: 6,
            sampleType: "FLOAT32"
        }
    };
}


function evaluatePixel(sample) {

    return [
        sample.B02,
        sample.B03,
        sample.B04,
        sample.B08,
        sample.B11,
        sample.B12
    ];
}
"""


# ============================================================
# 8. DOWNLOAD FUNCTION
# ============================================================

def download_sentinel_image(
    mine_id,
    latitude,
    longitude
):

    print("\n" + "=" * 60)
    print("Processing:", mine_id)
    print("Latitude :", latitude)
    print("Longitude:", longitude)
    print("=" * 60)


    # --------------------------------------------------------
    # Bounding box
    # --------------------------------------------------------

    west = longitude - BUFFER
    south = latitude - BUFFER
    east = longitude + BUFFER
    north = latitude + BUFFER


    # --------------------------------------------------------
    # Approximate dimensions
    # --------------------------------------------------------

    # At this latitude, 0.0001 degree is roughly 10 m.
    width = int(
        (east - west) * 111320 *
        np.cos(np.radians(latitude))
        / RESOLUTION
    )

    height = int(
        (north - south) * 111320
        / RESOLUTION
    )


    print("Image size:", width, "x", height)


    # --------------------------------------------------------
    # Process API request
    # --------------------------------------------------------

    request_body = {

        "input": {

            "bounds": {

                "bbox": [
                    west,
                    south,
                    east,
                    north
                ],

                "properties": {
                    "crs": "http://www.opengis.net/def/crs/EPSG/0/4326"
                }
            },


            "data": [

                {
                    "type": "sentinel-2-l2a",

                    "dataFilter": {

                        "timeRange": {

                            "from": START_DATE,
                            "to": END_DATE
                        },

                        "maxCloudCoverage": 10
                    },

                    "processing": {

                        "upsampling": "BILINEAR",
                        "downsampling": "BILINEAR"
                    }
                }
            ]
        },


        "output": {

            "width": width,
            "height": height,

            "responses": [

                {
                    "identifier": "default",

                    "format": {
                        "type": "image/tiff"
                    }
                }
            ]
        },


        "evalscript": EVALSCRIPT
    }


    # --------------------------------------------------------
    # Send request
    # --------------------------------------------------------

    headers = {

        "Authorization":
            f"Bearer {access_token}",

        "Content-Type":
            "application/json"
    }


    response = requests.post(

        PROCESS_URL,

        headers=headers,

        json=request_body,

        timeout=300
    )


    print("Process API status:", response.status_code)


    # --------------------------------------------------------
    # Check response
    # --------------------------------------------------------

    if response.status_code != 200:

        print("\nAPI ERROR:")
        print(response.text)

        return None


    # --------------------------------------------------------
    # Save TIFF
    # --------------------------------------------------------

    output_folder = os.path.join(
        OUTPUT_DIR,
        mine_id
    )

    os.makedirs(
        output_folder,
        exist_ok=True
    )


    output_file = os.path.join(
        output_folder,
        "sentinel2.tif"
    )


    with open(output_file, "wb") as f:

        f.write(response.content)


    print("✓ Image downloaded!")

    print("Saved to:")
    print(output_file)


    return output_file


# ============================================================
# 9. DOWNLOAD FIRST IMAGE
# ============================================================

file_path = download_sentinel_image(

    locations.iloc[0]["mine_id"],

    locations.iloc[0]["latitude"],

    locations.iloc[0]["longitude"]
)


# ============================================================
# 10. DISPLAY IMAGE
# ============================================================

if file_path is not None:

    print("\nOpening downloaded image...")

    with rasterio.open(file_path) as src:

        image = src.read()

        print("\nImage information:")
        print("------------------")
        print("Bands :", src.count)
        print("Width :", src.width)
        print("Height:", src.height)
        print("CRS   :", src.crs)


        # B04 = Red
        # B03 = Green
        # B02 = Blue

        red = image[2]
        green = image[1]
        blue = image[0]


        # Normalize for visualization

        rgb = np.stack(
            [red, green, blue],
            axis=-1
        )

        rgb = np.nan_to_num(rgb)

        low = np.percentile(rgb, 2)
        high = np.percentile(rgb, 98)

        rgb = (
            (rgb - low) /
            (high - low + 1e-10)
        )

        rgb = np.clip(
            rgb,
            0,
            1
        )


        plt.figure(figsize=(10, 10))

        plt.imshow(rgb)

        plt.title(
            "Sentinel-2 True Color - test_001"
        )

        plt.axis("off")

        plt.show()


print("\nDONE!")
