"""Radial distance factors — core/astronomy.py (CelestialRadialMetrics).

Pins the eccentric, dynamic scaling used by the header gauge: the Sun
breathes within ~0.983–1.017 (perihelion/aphelion envelope) and the Moon
within ~0.94–1.06 (perigee/apogee envelope) over their anomalistic cycles.
"""

import unittest
from datetime import datetime, timezone

from core.astronomy import CelestialRadialMetrics

ANOMALISTIC_MONTH_SECONDS = 27.55455 * 24 * 3600


def _utc(y, mo, d, h=12, mi=0, s=0):
    return datetime(y, mo, d, h, mi, s, tzinfo=timezone.utc).timestamp()


class TestSunDistanceFactor(unittest.TestCase):
    def setUp(self):
        self.metrics = CelestialRadialMetrics()

    def test_bounds_over_a_full_year(self):
        start = int(_utc(2024, 1, 1))
        end = int(_utc(2025, 1, 1))
        for ts in range(start, end, 6 * 3600):
            factor = self.metrics.get_sun_distance_factor(ts)
            self.assertTrue(0.98 <= factor <= 1.02,
                            msg=f"sun factor {factor:.6f} at ts={ts}")

    def test_annual_cycle_repeats(self):
        a = self.metrics.get_sun_distance_factor(_utc(2026, 6, 21))
        b = self.metrics.get_sun_distance_factor(_utc(2027, 6, 21))
        self.assertAlmostEqual(a, b, places=2)

    def test_factor_is_radial_multiplier(self):
        ts = _utc(2026, 3, 20, 12, 0)
        factor = self.metrics.get_sun_distance_factor(ts)
        self.assertGreater(factor, 0.9)
        self.assertLess(factor, 1.1)


class TestMoonDistanceFactor(unittest.TestCase):
    def setUp(self):
        self.metrics = CelestialRadialMetrics()

    def test_bounds_over_an_anomalistic_month(self):
        base = 1705147200
        for k in range(0, 120):
            ts = base + k * ANOMALISTIC_MONTH_SECONDS / 120
            factor = self.metrics.get_moon_distance_factor(ts)
            self.assertTrue(0.94 <= factor <= 1.06,
                            msg=f"moon factor {factor:.6f} at ts={ts}")

    def test_monthly_cycle_repeats(self):
        base = 1705147200
        a = self.metrics.get_moon_distance_factor(base)
        b = self.metrics.get_moon_distance_factor(base + ANOMALISTIC_MONTH_SECONDS)
        self.assertAlmostEqual(a, b, places=6)

    def test_peaks_at_base_epoch(self):
        base = 1705147200  # the spec's perigee phase origin → cos(0) → 1.0549
        quarter = ANOMALISTIC_MONTH_SECONDS / 4
        self.assertGreater(self.metrics.get_moon_distance_factor(base),
                           self.metrics.get_moon_distance_factor(base + quarter))


if __name__ == "__main__":
    unittest.main()
