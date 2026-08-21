"""Web test: the /api/radial stream and the radial header template.

The root now serves web/templates/index.html — the non-crossing axis gauge
<header> on top of the preserved classic Kairos body (tabs, forms and
configuration mechanics). /api/radial streams the raw radial distance
factors straight from core.astronomy.CelestialRadialMetrics.
"""

import unittest
from datetime import datetime, timezone

from core.astronomy import CelestialRadialMetrics
from web.server import app


class TestRadialApi(unittest.TestCase):
    def setUp(self):
        app.config["TESTING"] = True
        self.client = app.test_client()

    def test_radial_fixed_timestamp_matches_metrics(self):
        ts = datetime(2026, 3, 20, 12, 0, tzinfo=timezone.utc).timestamp()
        data = self.client.get(f"/api/radial?ts={ts}").get_json()
        metrics = CelestialRadialMetrics()
        self.assertEqual(data["timestamp"], int(ts))
        self.assertAlmostEqual(data["sun_radial"],
                               metrics.get_sun_distance_factor(ts), places=9)
        self.assertAlmostEqual(data["moon_radial"],
                               metrics.get_moon_distance_factor(ts), places=9)
        self.assertRegex(data["gregorian"], r"^\d{2}:\d{2}:\d{2}$")

    def test_radial_defaults_to_now(self):
        data = self.client.get("/api/radial").get_json()
        self.assertIn("sun_radial", data)
        self.assertIn("moon_radial", data)
        self.assertIn("gregorian", data)

    def test_radial_factors_in_bounds(self):
        data = self.client.get("/api/radial").get_json()
        self.assertTrue(0.98 <= data["sun_radial"] <= 1.02)
        self.assertTrue(0.94 <= data["moon_radial"] <= 1.06)

    def test_root_renders_header_and_preserved_body(self):
        resp = self.client.get("/")
        self.assertEqual(resp.status_code, 200)
        html = resp.get_data(as_text=True)
        # The new non-crossing axis gauge header:
        self.assertIn('class="kairos-planetary-header"', html)
        self.assertIn('id="header-concentric-clock"', html)
        self.assertIn('id="gregorian-clock-readout"', html)
        self.assertIn('id="eye-override-trigger"', html)
        self.assertIn("SUNDOWN", html)
        self.assertIn("SUNRISE", html)
        self.assertIn("NOON", html)
        self.assertIn("NIGHT", html)
        # Preserved lower body — tabs, forms and configuration mechanics:
        self.assertIn('id="tabNow"', html)
        self.assertIn('id="tabConfig"', html)
        self.assertIn('id="traditionSelect"', html)
        self.assertIn('id="sunriseBtn"', html)
        self.assertIn('id="enterTimesBtn"', html)
        self.assertIn('id="saveAddBtn"', html)
        self.assertIn('id="moonButtons"', html)
        self.assertIn('id="helpModal"', html)

    def test_legacy_flat_pwa_still_served(self):
        resp = self.client.get("/index.html")
        self.assertEqual(resp.status_code, 200)
        self.assertIn(b"Kairos", resp.data)

    def test_canvas_js_served_from_static(self):
        resp = self.client.get("/static/js/canvas.js")
        self.assertEqual(resp.status_code, 200)
        self.assertIn(b"updateHeaderDistanceClock", resp.data)


if __name__ == "__main__":
    unittest.main()
