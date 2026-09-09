import unittest

import numpy as np

from app.commodity_context import classify_commodity_context
from pydantic import ValidationError

from app.main import (
    ReserveEstimateRequest,
    SatelliteProspectorInputs,
    ScenarioSimulateRequest,
    estimate_reserves,
    prospect_manganese_reserve,
    simulate_scenario,
)
from app.routers.satellite import extract_spectral_and_ml_predict


class CommodityContextTests(unittest.TestCase):
    GEVRA_LAT = 22.336312
    GEVRA_LON = 82.545748
    DANTEWADA_LAT = 18.9000
    DANTEWADA_LON = 81.3500
    BAILADILA_LAT = 18.7000
    BAILADILA_LON = 81.2000

    def test_gevra_coordinates_are_non_mn(self):
        context = classify_commodity_context(self.GEVRA_LAT, self.GEVRA_LON, "Gevra Mine")
        self.assertEqual(context["status"], "NON_MN_COMMODITY")
        self.assertEqual(context["commodity"], "coal")

    def test_name_does_not_override_unrelated_coordinates(self):
        context = classify_commodity_context(21.8167, 80.1833, "Gevra Mine")
        self.assertEqual(context["status"], "NAME_COORDINATE_MISMATCH")

    def test_prospector_returns_zero_for_gevra(self):
        result = prospect_manganese_reserve(SatelliteProspectorInputs(
            region_name="Gevra Mine",
            latitude=self.GEVRA_LAT,
            longitude=self.GEVRA_LON,
        ))
        self.assertEqual(result["prediction_status"], "NON_MN_COMMODITY")
        self.assertEqual(result["estimated_tonnage_kt"], 0.0)

    def test_reserve_grid_returns_zero_for_gevra(self):
        result = estimate_reserves(ReserveEstimateRequest(
            region_name="Gevra Coal Mine",
            latitude=self.GEVRA_LAT,
            longitude=self.GEVRA_LON,
        ))
        self.assertEqual(result["prediction_status"], "NON_MN_COMMODITY")
        self.assertEqual(result["economically_viable_tonnage_kt"], 0.0)

    def test_representative_iron_contexts_are_non_mn(self):
        for latitude, longitude in (
            (self.DANTEWADA_LAT, self.DANTEWADA_LON),
            (self.BAILADILA_LAT, self.BAILADILA_LON),
        ):
            context = classify_commodity_context(latitude, longitude, "")
            self.assertEqual(context["status"], "NON_MN_COMMODITY")
            self.assertEqual(context["commodity"], "iron_ore")

    def test_image_features_cannot_bypass_gate(self):
        bands = {
            name: np.full((8, 8), value, dtype=float)
            for name, value in {
                "B02": 0.20,
                "B03": 0.30,
                "B04": 0.25,
                "B08": 0.45,
                "B11": 0.80,
                "B12": 0.70,
            }.items()
        }
        result = extract_spectral_and_ml_predict(
            bands,
            self.GEVRA_LAT,
            self.GEVRA_LON,
            "Gevra Mine",
            source_type="test",
        )
        self.assertEqual(result["commodity_context"]["status"], "NON_MN_COMMODITY")
        self.assertEqual(result["prediction"]["estimated_grade_pct"], 0.0)
        self.assertEqual(result["prediction"]["total_available_reserves_kt"], 0.0)

    def test_unknown_india_coordinate_abstains_from_generic_reserve_grid(self):
        result = estimate_reserves(ReserveEstimateRequest(
            region_name="Andaman and Nicobar Islands",
            latitude=11.7401,
            longitude=92.6586,
        ))
        self.assertEqual(result["prediction_status"], "UNKNOWN_LOCATION_CONTEXT")
        self.assertEqual(result["total_estimated_tonnage_kt"], 0.0)

    def test_india_coordinate_bounds_are_enforced(self):
        with self.assertRaises(ValidationError):
            SatelliteProspectorInputs(latitude=91.0, longitude=181.0)

    def test_zero_tonnage_simulation_is_safe(self):
        result = simulate_scenario(ScenarioSimulateRequest(base_tonnage=0.0))
        self.assertEqual(result["shortfall_percentage"], 0.0)


if __name__ == "__main__":
    unittest.main()