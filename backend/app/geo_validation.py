"""India-only coordinate validation for the MOIL portal."""

INDIA_LATITUDE_MIN = 6.0
INDIA_LATITUDE_MAX = 37.5
INDIA_LONGITUDE_MIN = 68.0
INDIA_LONGITUDE_MAX = 97.5


def is_india_coordinate(latitude: float, longitude: float) -> bool:
    return (
        INDIA_LATITUDE_MIN <= latitude <= INDIA_LATITUDE_MAX
        and INDIA_LONGITUDE_MIN <= longitude <= INDIA_LONGITUDE_MAX
    )
