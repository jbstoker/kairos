"""Web test: the Kairos Natural Time system (26h / 28m / 7s).

web/static/js/kairos_natural_time.js is the 26-hour sibling of the 13h / 28m /
13s layer: a day of 13 light + 13 dark hours, each hour 28 minutes, each
minute 7 seconds (26 × 28 × 7 = 5096 natural seconds), still read from TRUE
SOLAR TIME — natural 00:00 is solar midnight, natural 13:00 is solar noon,
natural 26:00 is the day's end. The header's ☀️ / 🌙 icon and `isLight` follow
the REAL sun altitude (the same truth the sky-dome bead shows); only without
the solar engine does it fall back to the wall clock and the standard
07:00–20:00 light window. Selected in ⚙️ Configure → ⏱️ Time System and
persisted in `kairos_time_system` ("kairos_natural").
"""

import json
import os
import shutil
import subprocess
import unittest

from web.server import app

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

requires_node = unittest.skipUnless(shutil.which("node"),
                                    "requires the 'node' runtime")


class TestKairosNaturalServed(unittest.TestCase):
    def setUp(self):
        app.config["TESTING"] = True
        self.client = app.test_client()

    def test_kairos_natural_js_served(self):
        resp = self.client.get("/static/js/kairos_natural_time.js")
        self.assertEqual(resp.status_code, 200)
        self.assertIn(b"getKairosNaturalTime", resp.data)
        self.assertIn(b"getKairosNaturalTimeDisplay", resp.data)
        self.assertIn(b"isKairosNaturalSelected", resp.data)

    def test_root_loads_kairos_natural_after_natural_before_kst(self):
        """kairos_natural_time.js must load after the solar day-fraction
        helper (natural_time.js) and before the header builder, so
        primaryTime() can call getKairosNaturalTimeDisplay()."""
        html = self.client.get("/").get_data(as_text=True)
        self.assertLess(
            html.index('<script src="static/js/natural_time.js"></script>'),
            html.index('<script src="static/js/kairos_natural_time.js"></script>'))
        self.assertLess(
            html.index('<script src="static/js/kairos_natural_time.js"></script>'),
            html.index('<script src="kst_display.js"></script>'))

    def test_configure_panel_has_kairos_natural_option(self):
        html = self.client.get("/").get_data(as_text=True)
        self.assertIn('<option value="kairos_natural"', html)
        self.assertIn('data-i18n="config.time_system_kairos_natural"', html)

    def test_watch_face_does_not_load_kairos_natural(self):
        """The isolated watch face stays a pure solar clock — the Kairos
        Natural layer is a main-app reading option and must not leak in."""
        html = self.client.get("/watch.html").get_data(as_text=True)
        self.assertNotIn('src="static/js/kairos_natural_time.js"', html)


@requires_node
class TestKairosNaturalJs(unittest.TestCase):
    def _run(self, script):
        proc = subprocess.run(["node", "-e", script], capture_output=True,
                              text=True, encoding="utf-8", cwd=REPO_ROOT)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        return json.loads(proc.stdout)

    def test_day_seconds_and_fraction_boundaries(self):
        script = (
            "const kn = require('./web/static/js/kairos_natural_time.js');\n"
            "process.stdout.write(JSON.stringify({\n"
            "  day: 26 * 28 * 7,\n"
            "  start: kn.kairosNaturalFromFraction(0),\n"
            "  noon: kn.kairosNaturalFromFraction(0.5),\n"
            "  end: kn.kairosNaturalFromFraction(1),\n"
            "  quarter: kn.kairosNaturalFromFraction(0.25),\n"
            "  threeQuarter: kn.kairosNaturalFromFraction(0.75)\n"
            "}));\n"
        )
        out = self._run(script)
        # The Kairos Natural day is 26 × 28 × 7 = 5096 seconds.
        self.assertEqual(out["day"], 5096)
        # 00:00 = solar midnight, 13:00 = solar noon, 26:00 = day's end.
        self.assertEqual(out["start"], {"hours": 0, "minutes": 0, "seconds": 0})
        self.assertEqual(out["noon"], {"hours": 13, "minutes": 0, "seconds": 0})
        self.assertEqual(out["end"], {"hours": 26, "minutes": 0, "seconds": 0})
        # Sunrise quarter-day → 06:14, sunset three-quarter day → 19:14.
        self.assertEqual(out["quarter"], {"hours": 6, "minutes": 14, "seconds": 0})
        self.assertEqual(out["threeQuarter"],
                         {"hours": 19, "minutes": 14, "seconds": 0})

    def test_sunrise_sunset_mapping(self):
        script = (
            "const kn = require('./web/static/js/kairos_natural_time.js');\n"
            "process.stdout.write(JSON.stringify({\n"
            "  sunrise: kn.getKairosNaturalSunrise(6),\n"
            "  sunset: kn.getKairosNaturalSunset(18)\n"
            "}));\n"
        )
        out = self._run(script)
        # Solar 06:00 → natural 06:14; solar 18:00 → natural 19:14.
        self.assertEqual(out["sunrise"], {"hours": 6, "minutes": 14,
                                          "formatted": "06:14"})
        self.assertEqual(out["sunset"], {"hours": 19, "minutes": 14,
                                         "formatted": "19:14"})

    def test_wall_clock_fallback_is_deterministic(self):
        """Without the solar engine, Kairos Natural counts the local wall
        clock (12:00 → half a day → 13:00) with the standard 07:00–20:00
        light window (noon is light) and the addendum's reference anchors."""
        script = (
            "const REAL = Date;\n"
            "class FakeDate extends REAL {\n"
            "  constructor(...args) { super(...(args.length ? args : [2026, 7, 21, 12, 0, 0])); }\n"
            "  static now() { return new REAL(2026, 7, 21, 12, 0, 0).getTime(); }\n"
            "}\n"
            "global.Date = FakeDate;\n"
            "const kn = require('./web/static/js/kairos_natural_time.js');\n"
            "process.stdout.write(JSON.stringify(kn.getKairosNaturalTime()));\n"
        )
        out = self._run(script)
        self.assertEqual(out["formatted"], "13:00")
        self.assertTrue(out["isLight"])
        self.assertEqual(out["period"], "☀️ Light")
        self.assertEqual(out["sunrise"], 7)
        self.assertEqual(out["noon"], 13)
        self.assertEqual(out["sunset"], 20)
        self.assertEqual(out["midnight"], 0)

    def test_counts_true_solar_time(self):
        """When the solar engine is present, Kairos Natural is derived from
        the solar day (via natural_time.js's solarDayFraction), so natural
        noon = solar noon and the display keeps the Sun's azimuth."""
        script = (
            "const nt = require('./web/static/js/natural_time.js');\n"
            "global.solarDayFraction = nt.solarDayFraction;\n"
            "global.getKairosTime = () => 12.0;   // solar noon\n"
            "global.getSolarAzimuth = () => 180.0; // due south\n"
            "const kn = require('./web/static/js/kairos_natural_time.js');\n"
            "process.stdout.write(JSON.stringify({\n"
            "  time: kn.getKairosNaturalTime(),\n"
            "  display: kn.getKairosNaturalTimeDisplay()\n"
            "}));\n"
        )
        out = self._run(script)
        self.assertEqual(out["time"]["formatted"], "13:00")
        # No SunCalc in this harness → fallback window: hour 13 is light.
        self.assertTrue(out["time"]["isLight"])
        self.assertEqual(out["display"], "☀️ 13:00 (180.0°)")

    def test_real_light_dark_with_the_engine(self):
        """End-to-end with SunCalc at Wergea: at solar noon the sun is up
        (☀️ light), at solar midnight it is down (🌙 dark), and the display
        keeps the real azimuth."""
        script = (
            "const REAL = Date;\n"
            "global.SunCalc = require('./web/lib/suncalc.js');\n"
            "const loc = { lat: 53.1503, lon: 5.8389 };\n"
            "const times = global.SunCalc.getTimes(\n"
            "    new REAL(2026, 7, 21, 12, 0, 0), loc.lat, loc.lon);\n"
            "let CURRENT = times.solarNoon.getTime();\n"
            "class FakeDate extends REAL {\n"
            "  constructor(...args) { super(...(args.length ? args : [CURRENT])); }\n"
            "  static now() { return CURRENT; }\n"
            "}\n"
            "global.Date = FakeDate;\n"
            "global.localStorage = { getItem: () => JSON.stringify(loc), setItem: () => {} };\n"
            "const st = require('./web/static/js/solar_time.js');\n"
            "global.getKairosTime = st.getKairosTime;\n"
            "global.getSolarAzimuth = st.getSolarAzimuth;\n"
            "const nt = require('./web/static/js/natural_time.js');\n"
            "global.solarDayFraction = nt.solarDayFraction;\n"
            "const kn = require('./web/static/js/kairos_natural_time.js');\n"
            "const noon = kn.getKairosNaturalTime();\n"
            "const noonDisplay = kn.getKairosNaturalTimeDisplay();\n"
            "const kairosAtNoon = st.getKairosTime();\n"
            "CURRENT = times.nadir.getTime();\n"
            "const midnight = kn.getKairosNaturalTime();\n"
            "process.stdout.write(JSON.stringify({\n"
            "  kairos: kairosAtNoon,\n"
            "  noonFormatted: noon.formatted, noonLight: noon.isLight,\n"
            "  noonDisplay, midnightLight: midnight.isLight\n"
            "}));\n"
        )
        out = self._run(script)
        self.assertAlmostEqual(out["kairos"], 12.0, delta=0.05)
        # Solar noon → natural 13:00, sun up → light, azimuth kept.
        self.assertEqual(out["noonFormatted"], "13:00")
        self.assertTrue(out["noonLight"])
        self.assertRegex(out["noonDisplay"], r"^☀️ 13:00 \(\d{3}\.\d°\)$")
        # Solar midnight → sun down → dark.
        self.assertFalse(out["midnightLight"])

    def test_is_kairos_natural_selected(self):
        script = (
            "const storage = {};\n"
            "global.localStorage = {\n"
            "    getItem: (k) => (k in storage ? storage[k] : null),\n"
            "    setItem: (k, v) => { storage[k] = String(v); }\n"
            "};\n"
            "const kn = require('./web/static/js/kairos_natural_time.js');\n"
            "const none = kn.isKairosNaturalSelected();\n"
            "storage['kairos_time_system'] = 'current';\n"
            "const current = kn.isKairosNaturalSelected();\n"
            "storage['kairos_time_system'] = 'natural';\n"
            "const natural = kn.isKairosNaturalSelected();\n"
            "storage['kairos_time_system'] = 'kairos_natural';\n"
            "const kairosNatural = kn.isKairosNaturalSelected();\n"
            "process.stdout.write(JSON.stringify({ none, current, natural, kairosNatural }));\n"
        )
        out = self._run(script)
        self.assertFalse(out["none"])
        self.assertFalse(out["current"])
        self.assertFalse(out["natural"])
        self.assertTrue(out["kairosNatural"])

    def test_is_kairos_natural_selected_without_localstorage(self):
        script = (
            "const kn = require('./web/static/js/kairos_natural_time.js');\n"
            "process.stdout.write(JSON.stringify(kn.isKairosNaturalSelected()));\n"
        )
        out = self._run(script)
        self.assertFalse(out)

    def test_engine_file_is_valid_js(self):
        proc = subprocess.run(["node", "--check",
                               "web/static/js/kairos_natural_time.js"],
                              capture_output=True, text=True, cwd=REPO_ROOT)
        self.assertEqual(proc.returncode, 0, proc.stderr)


if __name__ == "__main__":
    unittest.main()
