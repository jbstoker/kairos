"""Web test: the solar-time engine (FINAL PRIMARY DISPLAY FORMAT).

web/static/js/solar_time.js turns the wall clock into a *position* —
fraction of day × 360° — so the primary display reads
"12:00 (180.0°) · ⛲Well · Harvest Moon 9 · ☀️Radiance · 4.54B / 2026.635".
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
            "  q06: st.degreesToKairosTime(90),\n"
            "  noon: st.degreesToKairosTime(180),\n"
            "  greg: st.getGregorianTime()\n"
            "}));\n"
        )
        proc = subprocess.run(["node", "-e", script], capture_output=True,
                              text=True, encoding="utf-8")
        self.assertEqual(proc.returncode, 0, proc.stderr)
        out = json.loads(proc.stdout)
        # 12:00 local = half a 24h day = 180° on the 360° dial.
        self.assertEqual(out["degrees"], 180.0)
        self.assertTrue(out["display"].startswith("12:00 ("))
        self.assertIn("180.0", out["display"])
        self.assertEqual(out["q06"], "06:00")
        self.assertEqual(out["noon"], "12:00")
        self.assertRegex(out["greg"], r"^\d{2}:\d{2}$")


if __name__ == "__main__":
    unittest.main()
