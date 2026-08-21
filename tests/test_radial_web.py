"""Web test: the /api/radial stream and the unified spatial panel page.

The root serves web/index.html — the #kstDisplay master spatial panel (the
counter-clockwise elliptical observation matrix on top of the preserved
classic Kairos body: tabs, forms and configuration mechanics). /api/radial
streams the raw radial distance factors straight from
core.astronomy.CelestialRadialMetrics; the matrix itself runs fully
client-side via web/static/js/astronomy_engine.js + canvas_renderer.js.
"""

import json
import os
import subprocess
import unittest
from datetime import datetime, timezone

from core.astronomy import CelestialRadialMetrics
from web.server import app

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


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

    def test_root_renders_spatial_panel_and_preserved_body(self):
        resp = self.client.get("/")
        self.assertEqual(resp.status_code, 200)
        html = resp.get_data(as_text=True)
        # The master elliptical spatial panel:
        self.assertIn('class="card kst-unified-spatial-panel"', html)
        self.assertIn('id="kairos-observation-matrix"', html)
        self.assertIn('id="gregorian-center-clock"', html)
        self.assertIn('id="sun-orbit-line"', html)
        self.assertIn('id="moon-orbit-line"', html)
        self.assertIn('id="sun-bead"', html)
        self.assertIn('id="moon-bead"', html)
        self.assertIn('id="eclipse-status"', html)

        self.assertIn('id="observed-date-label"', html)
        self.assertIn('id="tradition-selector"', html)
        self.assertIn('<script src="static/js/solar_time.js"></script>', html)
        self.assertIn('<script src="static/js/unified_display.js"></script>',
                      html)
        # Geometrically placed fixed axis labels:
        self.assertIn("NOON", html)
        self.assertIn("SUNRISE", html)
        self.assertIn("NIGHT / MIDNIGHT", html)
        self.assertIn("SUNDOWN / SUNSET", html)
        # The flat header gauge row is completely gone:
        self.assertNotIn('class="kairos-planetary-header"', html)
        self.assertNotIn('id="header-concentric-clock"', html)
        self.assertNotIn('id="gregorian-clock-readout"', html)
        self.assertNotIn('id="eye-override-trigger"', html)
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

    def test_static_engine_js_served(self):
        engine_js = self.client.get("/static/js/astronomy_engine.js")
        self.assertEqual(engine_js.status_code, 200)
        self.assertIn(b"CelestialMetrics", engine_js.data)
        renderer_js = self.client.get("/static/js/canvas_renderer.js")
        self.assertEqual(renderer_js.status_code, 200)
        self.assertIn(b"updatePlanetaryCanvas", renderer_js.data)
        controller_js = self.client.get("/static/js/app_controller.js")
        self.assertEqual(controller_js.status_code, 200)
        self.assertIn(b"updateUnifiedDisplayPanel", controller_js.data)
        unified_js = self.client.get("/static/js/unified_display.js")
        self.assertEqual(unified_js.status_code, 200)
        self.assertIn(b"getSelectedTradition", unified_js.data)
        solar_js = self.client.get("/static/js/solar_time.js")
        self.assertEqual(solar_js.status_code, 200)
        self.assertIn(b"getKairosTimeDisplay", solar_js.data)

    def test_unified_display_builds_real_tradition_line(self):
        """The primary line adapts to the selected tradition using the app's
        real calendar helpers (TRADITIONS / traditionDate / dayOfYear), not a
        hardcoded string — and the rhythm (Kairos) lens passes through."""
        script = (
            "global.window = global;\n"
            "let lineText = null;\n"
            "const stubEl = { set textContent(v) { lineText = v; } };\n"
            "global.document = { getElementById: (id) => (id === 'kstDisplayLine' ? stubEl : null) };\n"
            "global.TRADITIONS = { rhythm: { months: 13, names: ['Root Moon','Sap Moon','Green Moon','Bloom Moon','Grain Moon','Light Moon','Thirst Moon','Fruit Moon','Harvest Moon','Wine Moon','Leaf Moon','Frost Moon','Star Moon'], yearDay: 'Deep Day' }, tartarian: { months: 13, names: ['Solaris','Lunaris','Floralis','Aquarius','Arboris','Luminis','Solaris II','Ventus','Telluris','Ignis','Caelestis','Oceanus','Terra Nova'], yearDay: 'Tartarus Day' } };\n"
            "global.TRADITION_EMOJI = { rhythm: '🌗', tartarian: '🌌' };\n"
            "global.dayOfYear = () => 245;\n"
            "global.traditionDate = (doy, trad) => { if (trad.months === 13) { if (doy > 364) return { month: trad.yearDay, day: doy - 364 }; const m = Math.floor((doy - 1) / 28); return { month: trad.names[m], day: ((doy - 1) % 28) + 1 }; } return { month: trad.names[0], day: 1 }; };\n"
            "const ud = require('./web/static/js/unified_display.js');\n"
            "const kairos = '12:00 (180.0°) · ⌛ Sundial · Bloom Moon 16 · ☀️ Radiance · 4.54B / 2026.624';\n"
            "window.updateDisplay(kairos, 'tartarian');\n"
            "const tartarianLine = lineText;\n"
            "window.updateDisplay(kairos, 'rhythm');\n"
            "process.stdout.write(JSON.stringify({\n"
            "  tartarian: tartarianLine,\n"
            "  rhythm: lineText\n"
            "}));\n"
        )
        proc = subprocess.run(["node", "-e", script], capture_output=True,
                              text=True, encoding="utf-8", cwd=REPO_ROOT)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        out = json.loads(proc.stdout)
        # Day 245 in a 13×28 calendar = Telluris (month 8) day 21; the solar
        # position ("12:00 (180.0°)") leads the tradition line unchanged.
        self.assertTrue(out["tartarian"].startswith("12:00 (180.0°) · 🌌 "))
        self.assertIn("Telluris 21", out["tartarian"])
        self.assertIn("Radiance", out["tartarian"])
        self.assertIn("2026.624", out["tartarian"])
        # The Kairos (rhythm) lens passes the line through unchanged.
        self.assertEqual(out["rhythm"],
                         "12:00 (180.0°) · ⌛ Sundial · Bloom Moon 16 · ☀️ Radiance · 4.54B / 2026.624")


if __name__ == "__main__":
    unittest.main()
