"""Web test: the true solar-time + azimuth engine.

web/static/js/solar_time.js aligns the primary display with the sky: the
time is TRUE SOLAR TIME (12:00 = solar noon) and the degree is the Sun's
real north-based azimuth, so the header and the sky-dome bead always agree
("12:00 (180.0°) · ⛲Well · Harvest Moon 9 · ☀️Radiance · 4.54B / 2026.635").
Without SunCalc it falls back to the wall-clock dial.
The root page must load it before kst_display.js / unified_display.js.
"""

import json
import subprocess
import unittest

from web.server import app


class TestSolarTimeJs(unittest.TestCase):
    def setUp(self):
        app.config["TESTING"] = True
        self.client = app.test_client()

    def test_solar_time_js_served(self):
        resp = self.client.get("/static/js/solar_time.js")
        self.assertEqual(resp.status_code, 200)
        self.assertIn(b"getKairosTimeDisplay", resp.data)
        self.assertIn(b"getSolarDegrees", resp.data)

    def test_root_loads_solar_time_before_kst_display(self):
        html = self.client.get("/").get_data(as_text=True)
        self.assertLess(html.index('<script src="static/js/solar_time.js"></script>'),
                        html.index('<script src="kst_display.js"></script>'))
        self.assertLess(html.index('<script src="static/js/solar_time.js"></script>'),
                        html.index('<script src="static/js/unified_display.js"></script>'))

    def test_degrees_and_time_roundtrip_at_fixed_local_time(self):
        script = (
            "const REAL = Date;\n"
            "class FakeDate extends REAL {\n"
            "  constructor(...args) { super(...(args.length ? args : [2026, 7, 21, 12, 0, 0])); }\n"
            "  static now() { return new REAL(2026, 7, 21, 12, 0, 0).getTime(); }\n"
            "}\n"
            "global.Date = FakeDate;\n"
            "const st = require('./web/static/js/solar_time.js');\n"
            "process.stdout.write(JSON.stringify({\n"
            "  degrees: st.getSolarDegrees(),\n"
            "  display: st.getKairosTimeDisplay(),\n"
            "  midnight: st.degreesToKairosTime(0),\n"
            "  sunrise: st.degreesToKairosTime(90),\n"
            "  noon: st.degreesToKairosTime(180),\n"
            "  sunset: st.degreesToKairosTime(270),\n"
            "  greg: st.getGregorianTime()\n"
            "}));\n"
        )
        proc = subprocess.run(["node", "-e", script], capture_output=True,
                              text=True, encoding="utf-8")
        self.assertEqual(proc.returncode, 0, proc.stderr)
        out = json.loads(proc.stdout)
        # The dial: 0°=midnight (bottom), 90°=sunrise (LEFT), 180°=noon (top),
        # 270°=sunset (RIGHT) — the displayed degrees are the bead's position.
        self.assertEqual(out["degrees"], 180.0)          # 12:00 = half a day
        self.assertTrue(out["display"].startswith("12:00 ("))
        self.assertIn("180.0", out["display"])
        self.assertEqual(out["midnight"], "00:00")
        self.assertEqual(out["sunrise"], "06:00")
        self.assertEqual(out["noon"], "12:00")
        self.assertEqual(out["sunset"], "18:00")
        self.assertRegex(out["greg"], r"^\d{2}:\d{2}$")

    def test_true_solar_time_at_solar_noon(self):
        """With SunCalc, at the instant of solar noon for Wergea the Kairos
        time reads 12:00 and the degree is the Sun's real azimuth (≈180°/S)."""
        script = (
            "const REAL = Date;\n"
            "global.SunCalc = require('./web/lib/suncalc.js');\n"
            "const loc = { lat: 53.1503, lon: 5.8389 };\n"
            "const noonDate = global.SunCalc.getTimes(\n"
            "    new REAL(2026, 7, 21, 12, 0, 0), loc.lat, loc.lon).solarNoon;\n"
            "class FakeDate extends REAL {\n"
            "  constructor(...args) { super(...(args.length ? args : [noonDate.getTime()])); }\n"
            "  static now() { return noonDate.getTime(); }\n"
            "}\n"
            "global.Date = FakeDate;\n"
            "global.localStorage = { getItem: () => JSON.stringify(loc), setItem: () => {} };\n"
            "const st = require('./web/static/js/solar_time.js');\n"
            "process.stdout.write(JSON.stringify({\n"
            "  noon: st.getSolarNoon(),\n"
            "  kairosHours: st.getKairosTime(),\n"
            "  az: st.getSolarAzimuth(),\n"
            "  disp: st.getKairosTimeDisplay()\n"
            "}));\n"
        )
        proc = subprocess.run(["node", "-e", script], capture_output=True,
                              text=True, encoding="utf-8")
        self.assertEqual(proc.returncode, 0, proc.stderr)
        out = json.loads(proc.stdout)
        # Solar noon for Wergea in August is ~13:39 local.
        self.assertTrue(13.3 <= out["noon"] <= 14.2, out["noon"])
        # True solar time: 12:00 at solar noon.
        self.assertAlmostEqual(out["kairosHours"], 12.0, delta=0.05)
        # The sun is due south → azimuth ≈ 180° north-based.
        self.assertAlmostEqual(out["az"], 180.0, delta=5.0)
        self.assertRegex(out["disp"], r"^12:00 \(\d{3}\.\d°\)$")


if __name__ == "__main__":
    unittest.main()
