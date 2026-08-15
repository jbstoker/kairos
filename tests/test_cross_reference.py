import json
import os
import tempfile
import unittest
from datetime import date, datetime, timedelta

import core.anchor as anchor
from core.cross_reference import SolarNoonResult, cross_reference_solar_noon, default_methods
from core.observation_correction import correct_solar_noon
from core.skyfield_bridge import SKYFIELD_AVAILABLE


class TestCrossReference(unittest.TestCase):
    def test_consensus_value(self):
        r = cross_reference_solar_noon(40.71, -74.01, date(2024, 8, 15))
        self.assertIsInstance(r, SolarNoonResult)
        self.assertIn("meeus", r.methods)
        self.assertIn("suncalc", r.methods)
        self.assertEqual(r.date, date(2024, 8, 15))
        self.assertLess(r.max_diff, timedelta(seconds=120))

    def test_consensus_close_to_methods(self):
        from core.meeus_algorithms import calculate_noon_meeus
        from core.suncalc_bridge import calculate_noon_suncalc

        d = date(2024, 8, 15)
        r = cross_reference_solar_noon(51.5, -0.1, d)
        m = calculate_noon_meeus(51.5, -0.1, d)
        s = calculate_noon_suncalc(51.5, -0.1, d)
        for method_result in (m, s):
            diff = abs((r.value - method_result).total_seconds())
            self.assertLess(diff, 120)

    def test_default_methods(self):
        methods = default_methods()
        self.assertIn("meeus", methods)
        self.assertIn("suncalc", methods)
        if SKYFIELD_AVAILABLE:
            self.assertIn("skyfield", methods)

    def test_unknown_method_warns_and_continues(self):
        r = cross_reference_solar_noon(0, 0, date(2024, 8, 15),
                                       methods=["meeus", "bogus"])
        self.assertIsNotNone(r)
        self.assertEqual(r.methods, ["meeus"])
        self.assertTrue(any("bogus" in w for w in r.warnings))

    def test_all_methods_fail_returns_none(self):
        self.assertIsNone(cross_reference_solar_noon(0, 0, date(2024, 8, 15),
                                                     methods=["bogus", "nope"]))

    def test_accepts_datetime_input(self):
        r = cross_reference_solar_noon(40.71, -74.01,
                                       datetime(2024, 8, 15, 10, 0))
        self.assertEqual(r.date, date(2024, 8, 15))


class TestObservationCorrection(unittest.TestCase):
    def setUp(self):
        fd, self.path = tempfile.mkstemp(suffix=".json")
        os.close(fd)
        os.remove(self.path)
        self._orig = anchor.OBS_FILE
        anchor.OBS_FILE = self.path

    def tearDown(self):
        anchor.OBS_FILE = self._orig
        if os.path.exists(self.path):
            os.remove(self.path)

    def test_no_observation_returns_prediction(self):
        predicted = datetime(2024, 8, 15, 13, 0, 0)
        self.assertEqual(correct_solar_noon(predicted), predicted)

    def test_recent_observation_overrides(self):
        anchor.save_observation("solar_noon", "observed")
        predicted = datetime.now().replace(hour=13, minute=0, second=0, microsecond=0)
        corrected = correct_solar_noon(predicted)
        observed = datetime.fromisoformat(
            anchor.get_last_observation("solar_noon")["timestamp"])
        self.assertEqual(corrected.hour, observed.hour)
        self.assertEqual(corrected.minute, observed.minute)
        self.assertEqual(corrected.date(), predicted.date())

    def test_stale_observation_ignored(self):
        anchor.save_observation("solar_noon", "observed")
        stale = (datetime.now() - timedelta(days=10)).isoformat()
        obs = anchor.load_observations()
        obs["solar_noon"][-1]["timestamp"] = stale
        with open(self.path, "w", encoding="utf-8") as f:
            json.dump(obs, f)
        predicted = datetime.now().replace(hour=13, minute=0, second=0, microsecond=0)
        self.assertEqual(correct_solar_noon(predicted), predicted)


if __name__ == "__main__":
    unittest.main()
