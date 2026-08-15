"""Web ↔ core consistency: the offline browser planets (web/planets.js) must
agree with the Skyfield engine (core/celestial.planetary_position).

The browser module uses a compact orbital-element algorithm (Paul Schlyter)
accurate to ~1–9 arcminutes, so the longitude comparison allows a small
tolerance and the zodiac sign is only asserted when the planet sits
comfortably away from a sign boundary. Skips without node or skyfield.
"""

import json
import os
import shutil
import subprocess
import unittest
from datetime import datetime, timezone

from core.celestial import KST_AVAILABLE, planetary_position

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JS_MODULE = "web/planets.js"

requires_node = unittest.skipUnless(shutil.which("node"), "requires the 'node' runtime")
requires_skyfield = unittest.skipUnless(KST_AVAILABLE, "requires skyfield + ephemeris")

DATES = [(2000, 3, 20), (2024, 1, 15), (2024, 8, 15), (2026, 6, 21), (2030, 12, 21)]
PLANETS = ("mercury", "venus", "mars", "jupiter", "saturn")
SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
         "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"]


def _run_js(dates):
    literals = ", ".join(
        f"new Date(Date.UTC({y}, {m - 1}, {d}, 12, 0, 0))" for y, m, d in dates)
    script = (
        "const p = require('./" + JS_MODULE + "');\n"
        f"const dates = [{literals}];\n"
        "const out = dates.map(d => p.planetLongitudes(d));\n"
        "process.stdout.write(JSON.stringify(out));\n"
    )
    proc = subprocess.run(["node", "-e", script], capture_output=True,
                          text=True, cwd=REPO_ROOT)
    if proc.returncode != 0:
        raise AssertionError(f"node failed: {proc.stderr}")
    return json.loads(proc.stdout)


def _circular(a, b):
    diff = abs(a - b) % 360.0
    return min(diff, 360.0 - diff)


@requires_node
@requires_skyfield
class TestPlanetsWebConsistency(unittest.TestCase):
    def test_longitude_agrees_with_skyfield(self):
        js = _run_js(DATES)
        for (y, m, d), snapshot in zip(DATES, js):
            for name in PLANETS:
                with self.subTest(date=(y, m, d), planet=name):
                    py = planetary_position(name, datetime(y, m, d, 12, tzinfo=timezone.utc))
                    self.assertIsNotNone(py)
                    self.assertLess(
                        _circular(snapshot[name]["ecliptic_longitude"],
                                  py["ecliptic_longitude"]),
                        2.0,
                        f"{name}: js={snapshot[name]['ecliptic_longitude']} "
                        f"py={py['ecliptic_longitude']}")

    def test_zodiac_sign_agrees_away_from_boundaries(self):
        js = _run_js(DATES)
        for (y, m, d), snapshot in zip(DATES, js):
            for name in PLANETS:
                with self.subTest(date=(y, m, d), planet=name):
                    py = planetary_position(name, datetime(y, m, d, 12, tzinfo=timezone.utc))
                    lon = py["ecliptic_longitude"]
                    if min(lon % 30.0, 30.0 - lon % 30.0) < 2.0:
                        continue  # too close to a boundary to be meaningful
                    self.assertEqual(
                        snapshot[name]["zodiac"], py["zodiac"],
                        f"{name} lon {lon}: js={snapshot[name]['zodiac']} "
                        f"vs py={py['zodiac']}")

    def test_zodiac_signs_are_real(self):
        js = _run_js(DATES)
        for snapshot in js:
            for name in PLANETS:
                self.assertIn(snapshot[name]["zodiac"], SIGNS)


if __name__ == "__main__":
    unittest.main()
