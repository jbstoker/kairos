import unittest

from core.solar import estimate_day_length, format_solar_time


class TestSolar(unittest.TestCase):
    def test_equator_equinox(self):
        self.assertAlmostEqual(estimate_day_length(0, 0), 12.0, places=1)

    def test_arctic_summer(self):
        # At the Arctic Circle (lat = 90 - obliquity) on the solstice the sun
        # does not set, so the day is exactly 24h long.
        self.assertAlmostEqual(estimate_day_length(90 - 23.44, 23.44), 24.0, places=1)

    def test_equator_solstice(self):
        self.assertAlmostEqual(estimate_day_length(0, 23.44), 12.0, places=1)

    def test_polar_night_clamped(self):
        # Deep polar winter must clamp to 0h rather than raise / return NaN.
        length = estimate_day_length(80, -23.44)
        self.assertGreaterEqual(length, 0.0)
        self.assertLessEqual(length, 24.0)

    def test_format_solar_time(self):
        self.assertEqual(format_solar_time(0.0), "00:00")
        self.assertEqual(format_solar_time(12.5), "12:30")
        self.assertEqual(format_solar_time(None), "No observation")


if __name__ == "__main__":
    unittest.main()
