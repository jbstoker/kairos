import json
import os
import tempfile
import unittest

import core.checksum as checksum_mod
from core.checksum import (
    PRECESSION_CYCLE_YEARS,
    calculate_precession_position,
    checksum_report,
    current_earth_age_year,
    get_expected_precession_position,
    phase_aligned_year,
    precession_checksum,
)


class TestPrecessionPosition(unittest.TestCase):
    def test_full_cycle_returns_to_zero(self):
        self.assertAlmostEqual(calculate_precession_position(PRECESSION_CYCLE_YEARS), 0.0, delta=1e-6)

    def test_half_cycle(self):
        self.assertAlmostEqual(calculate_precession_position(PRECESSION_CYCLE_YEARS / 2), 180.0, delta=1e-6)

    def test_range(self):
        for years in (1_000_000, 4_540_000_000, 4_540_002_026.624):
            pos = calculate_precession_position(years)
            self.assertTrue(0 <= pos < 360)

    def test_default_deep_time_year(self):
        # The spec's own arithmetic: (4540002026.624 mod 25772)/25772*360
        self.assertAlmostEqual(calculate_precession_position(4540002026.624),
                               90.8887, delta=0.01)

    def test_expected_position_is_small_recent(self):
        pos = get_expected_precession_position()
        self.assertTrue(0 <= pos < 360)
        self.assertLess(pos, 1.0)  # ~26 years of precession ≈ 0.37°


class TestPrecessionChecksum(unittest.TestCase):
    def test_round_deep_time_year_is_out_of_phase(self):
        # The round 4.54e9 number is NOT phase-locked to the precession cycle.
        result = precession_checksum(4540002026.624)
        self.assertEqual(result["status"], "inconsistent")
        self.assertGreater(result["difference_deg"], 50)

    def test_phase_aligned_year_is_consistent(self):
        aligned = phase_aligned_year(4540002026.624)
        result = precession_checksum(aligned)
        self.assertEqual(result["status"], "consistent")
        self.assertLess(result["difference_deg"], 0.5)

    def test_result_keys(self):
        result = precession_checksum()
        for key in ("status", "calculated_position", "expected_position",
                    "difference_deg", "tolerance_deg"):
            self.assertIn(key, result)

    def test_current_earth_age_year_sane(self):
        year = current_earth_age_year()
        self.assertTrue(4_540_000_000 < year < 4_540_003_000)


class TestChecksumReport(unittest.TestCase):
    def test_report_contains_status(self):
        report = checksum_report(4540002026.624)
        self.assertIn("Precession Checksum", report)
        self.assertIn("⚠️", report)
        self.assertIn("Phase offset", report)

    def test_report_aligned_is_ok(self):
        report = checksum_report(phase_aligned_year(4540002026.624))
        self.assertIn("✓", report)
        self.assertIn("Aligned", report)


class TestChecksumTracking(unittest.TestCase):
    def setUp(self):
        fd, self.path = tempfile.mkstemp(suffix=".json")
        os.close(fd)
        os.remove(self.path)
        self._orig = checksum_mod.CHECKSUMS_FILE
        checksum_mod.CHECKSUMS_FILE = self.path

    def tearDown(self):
        checksum_mod.CHECKSUMS_FILE = self._orig
        if os.path.exists(self.path):
            os.remove(self.path)

    def test_track_appends_and_persists(self):
        entry = checksum_mod.track_checksum(4540002026.624)
        self.assertEqual(entry["status"], "inconsistent")
        self.assertIn("timestamp", entry)
        log = checksum_mod.load_checksum_log()
        self.assertEqual(len(log), 1)
        self.assertEqual(log[0]["difference_deg"], entry["difference_deg"])

    def test_trend_is_stable(self):
        for _ in range(3):
            checksum_mod.track_checksum(4540002026.624)
        trend = checksum_mod.checksum_trend()
        self.assertEqual(trend["count"], 3)
        self.assertTrue(trend["stable"])
        self.assertLess(trend["spread_deg"], 0.01)

    def test_trend_empty(self):
        trend = checksum_mod.checksum_trend()
        self.assertEqual(trend["count"], 0)
        self.assertIsNone(trend["stable"])


if __name__ == "__main__":
    unittest.main()
