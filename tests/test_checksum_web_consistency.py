"""Web ↔ core consistency: the browser precession self-check must agree
with the Python engine.

``web/checksum_selfcheck.js`` mirrors ``core/checksum.py`` so the PWA can run
the continuous self-check fully offline. This test pins the two
implementations together by running the same fixed dates through both and
comparing every reported field.

Skips when the ``node`` runtime is unavailable (e.g. minimal installs).
"""

import json
import os
import shutil
import subprocess
import unittest
from datetime import datetime
from unittest import mock

from core.checksum import (
    J2000_EPOCH,
    PRECESSION_CYCLE_YEARS,
    current_earth_age_year,
    precession_checksum,
)

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JS_MODULE = "web/checksum_selfcheck.js"

requires_node = unittest.skipUnless(shutil.which("node"),
                                    "requires the 'node' runtime")

# Same wall-clock instants in both languages (naive local time, like the app).
DATES = [(2000, 1, 1), (2024, 3, 20), (2024, 8, 15),
         (2024, 12, 31), (2026, 6, 21)]


def _run_js(dates):
    """Run the JS module under node and return its JSON output."""
    date_literals = ", ".join(
        f"new Date({y}, {m - 1}, {d}, 12, 0, 0)" for y, m, d in dates)
    script = (
        "const sc = require('./" + JS_MODULE + "');\n"
        f"const dates = [{date_literals}];\n"
        "const out = {\n"
        "  constants: { cycle: sc.PRECESSION_CYCLE_YEARS,"
        " j2000: sc.J2000_EPOCH, earth: sc.EARTH_AGE_DEFAULT },\n"
        "  years: dates.map(d => sc.currentEarthAgeYear(d)),\n"
        "  checks: dates.map(d => sc.precessionChecksum({ date: d }))\n"
        "};\n"
        "process.stdout.write(JSON.stringify(out));\n"
    )
    proc = subprocess.run(["node", "-e", script], capture_output=True,
                          text=True, cwd=REPO_ROOT)
    if proc.returncode != 0:
        raise AssertionError(f"node failed: {proc.stderr}")
    return json.loads(proc.stdout)


def _frozen_datetime(y, m, d):
    """A datetime subclass whose now() returns the given local wall-clock."""
    class _Frozen(datetime):
        @classmethod
        def now(cls, tz=None):
            return cls(y, m, d, 12, 0, 0)
    return _Frozen


@requires_node
class TestWebChecksumConsistency(unittest.TestCase):
    def test_constants_match(self):
        js = _run_js([(2024, 8, 15)])
        self.assertEqual(js["constants"]["cycle"], PRECESSION_CYCLE_YEARS)
        self.assertEqual(js["constants"]["j2000"], J2000_EPOCH)
        self.assertEqual(js["constants"]["earth"], 4_540_000_000)

    def test_current_earth_age_year_matches(self):
        js = _run_js(DATES)
        for (y, m, d), year in zip(DATES, js["years"]):
            with self.subTest(date=(y, m, d)):
                with mock.patch("core.checksum.datetime", _frozen_datetime(y, m, d)):
                    py = current_earth_age_year()
                self.assertAlmostEqual(year, py, places=9)

    def test_precession_checksum_matches(self):
        js = _run_js(DATES)
        for (y, m, d), check in zip(DATES, js["checks"]):
            with self.subTest(date=(y, m, d)):
                with mock.patch("core.checksum.datetime", _frozen_datetime(y, m, d)):
                    py = precession_checksum()
                self.assertEqual(check["status"], py["status"])
                self.assertAlmostEqual(check["calculated_position"],
                                       py["calculated_position"], places=4)
                self.assertAlmostEqual(check["expected_position"],
                                       py["expected_position"], places=4)
                self.assertAlmostEqual(check["difference_deg"],
                                       py["difference_deg"], places=4)
                self.assertEqual(check["tolerance_deg"], py["tolerance_deg"])

    def test_explicit_year_overrides_now(self):
        """Both engines accept an explicit deep-time year (used by tests)."""
        with mock.patch("core.checksum.datetime", _frozen_datetime(2024, 8, 15)):
            py = precession_checksum(4_540_002_026.624)
        script = (
            "const sc = require('./" + JS_MODULE + "');\n"
            "process.stdout.write(JSON.stringify("
            "  sc.precessionChecksum({ date: new Date(2024, 7, 15, 12, 0, 0),"
            " earthAgeYear: 4540002026.624 })));\n"
        )
        proc = subprocess.run(["node", "-e", script], capture_output=True,
                              text=True, cwd=REPO_ROOT)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        js_check = json.loads(proc.stdout)
        self.assertEqual(js_check["status"], py["status"])
        self.assertAlmostEqual(js_check["difference_deg"],
                               py["difference_deg"], places=4)
        self.assertEqual(js_check["earth_age_year"], 4_540_002_026.624)


if __name__ == "__main__":
    unittest.main()
