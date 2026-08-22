"""Web test: the Natural Time layer (13h / 28m / 13s).

web/static/js/natural_time.js is an optional perceptual layer over TRUE
SOLAR TIME: the natural day has 13 hours, each hour 28 minutes, each minute
13 seconds (13 × 28 × 13 = 4732 natural seconds), so the day's fraction maps
1:1 onto the sun's position — natural 00:00 is solar midnight, natural 06:14
is solar noon, natural 13:00 is the day's end. The header keeps its degree,
so the natural number and the sky-dome bead always agree (the same promise
as the solar-time engine). Selected in ⚙️ Configure → ⏱️ Time System and
persisted in `kairos_time_system`.
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


class TestNaturalTimeServed(unittest.TestCase):
    def setUp(self):
        app.config["TESTING"] = True
        self.client = app.test_client()

    def test_natural_time_js_served(self):
        resp = self.client.get("/static/js/natural_time.js")
        self.assertEqual(resp.status_code, 200)
        self.assertIn(b"getNaturalTime", resp.data)
        self.assertIn(b"getNaturalSunrise", resp.data)
        self.assertIn(b"isNaturalTimeSelected", resp.data)

    def test_root_loads_natural_time_between_solar_and_kst(self):
        """natural_time.js must load after the solar engine and before the
        header builder, so primaryTime() can call getNaturalTimeDisplay()."""
        html = self.client.get("/").get_data(as_text=True)
        self.assertLess(
            html.index('<script src="static/js/solar_time.js"></script>'),
            html.index('<script src="static/js/natural_time.js"></script>'))
        self.assertLess(
            html.index('<script src="static/js/natural_time.js"></script>'),
            html.index('<script src="kst_display.js"></script>'))

    def test_configure_panel_has_time_system_toggle(self):
        html = self.client.get("/").get_data(as_text=True)
        self.assertIn('id="time-system"', html)
        self.assertIn('<option value="current"', html)
        self.assertIn('<option value="natural"', html)
        # The toggle label is translated (catalog key present in the HTML).
        self.assertIn('data-i18n="config.time_system"', html)

    def test_time_system_badge_in_header(self):
        html = self.client.get("/").get_data(as_text=True)
        self.assertIn('id="timeSystemBadge"', html)
        self.assertIn('data-i18n="config.time_system_natural_badge"', html)

    def test_watch_face_does_not_load_natural_time(self):
        """The isolated watch face stays a pure solar clock — the Natural
        Time layer is a main-app reading option and must not leak in."""
        html = self.client.get("/watch.html").get_data(as_text=True)
        self.assertNotIn('src="static/js/natural_time.js"', html)


@requires_node
class TestNaturalTimeJs(unittest.TestCase):
    def _run(self, script):
        proc = subprocess.run(["node", "-e", script], capture_output=True,
                              text=True, encoding="utf-8", cwd=REPO_ROOT)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        return json.loads(proc.stdout)

    def test_natural_day_seconds_and_fraction_boundaries(self):
        script = (
            "const nt = require('./web/static/js/natural_time.js');\n"
            "process.stdout.write(JSON.stringify({\n"
            "  day: 13 * 28 * 13,\n"
            "  start: nt.naturalFromFraction(0),\n"
            "  noon: nt.naturalFromFraction(0.5),\n"
            "  end: nt.naturalFromFraction(1),\n"
            "  quarter: nt.naturalFromFraction(0.25),\n"
            "  threeQuarter: nt.naturalFromFraction(0.75)\n"
            "}));\n"
        )
        out = self._run(script)
        # The natural day is 13 × 28 × 13 = 4732 seconds.
        self.assertEqual(out["day"], 4732)
        # 00:00 = solar midnight, 06:14 = solar noon, 13:00 = day's end.
        self.assertEqual(out["start"], {"hours": 0, "minutes": 0, "seconds": 0})
        self.assertEqual(out["noon"], {"hours": 6, "minutes": 14, "seconds": 0})
        self.assertEqual(out["end"], {"hours": 13, "minutes": 0, "seconds": 0})
        # Sunrise quarter-day → 03:07, sunset three-quarter day → 09:21.
        self.assertEqual(out["quarter"], {"hours": 3, "minutes": 7, "seconds": 0})
        self.assertEqual(out["threeQuarter"],
                         {"hours": 9, "minutes": 21, "seconds": 0})

    def test_sunrise_sunset_mapping(self):
        script = (
            "const nt = require('./web/static/js/natural_time.js');\n"
            "process.stdout.write(JSON.stringify({\n"
            "  sunrise: nt.getNaturalSunrise(6),\n"
            "  sunset: nt.getNaturalSunset(18)\n"
            "}));\n"
        )
        out = self._run(script)
        # Solar 06:00 → natural 03:07; solar 18:00 → natural 09:21.
        self.assertEqual(out["sunrise"], {"hours": 3, "minutes": 7,
                                          "formatted": "03:07"})
        self.assertEqual(out["sunset"], {"hours": 9, "minutes": 21,
                                         "formatted": "09:21"})

    def test_wall_clock_fallback_is_deterministic(self):
        """Without the solar engine, natural time counts the local wall clock
        (12:00 → half a day → 06:14) so the layer never dies."""
        script = (
            "const REAL = Date;\n"
            "class FakeDate extends REAL {\n"
            "  constructor(...args) { super(...(args.length ? args : [2026, 7, 21, 12, 0, 0])); }\n"
            "  static now() { return new REAL(2026, 7, 21, 12, 0, 0).getTime(); }\n"
            "}\n"
            "global.Date = FakeDate;\n"
            "const nt = require('./web/static/js/natural_time.js');\n"
            "process.stdout.write(JSON.stringify(nt.getNaturalTime()));\n"
        )
        out = self._run(script)
        self.assertEqual(out["formatted"], "06:14")

    def test_natural_time_counts_true_solar_time(self):
        """When the solar engine is present, natural time is derived from the
        solar day (getKairosTime()), so natural noon = solar noon."""
        script = (
            "global.getKairosTime = () => 6.0;   // solar 06:00\n"
            "global.getSolarAzimuth = () => 90.0; // sunrise, due east\n"
            "const nt = require('./web/static/js/natural_time.js');\n"
            "process.stdout.write(JSON.stringify({\n"
            "  time: nt.getNaturalTime(),\n"
            "  display: nt.getNaturalTimeDisplay()\n"
            "}));\n"
        )
        out = self._run(script)
        self.assertEqual(out["time"]["formatted"], "03:07")
        self.assertEqual(out["display"], "03:07 (90.0°)")

    def test_solar_noon_is_natural_noon_with_the_real_engine(self):
        """End-to-end with SunCalc at the instant of solar noon (Wergea): the
        Kairos time reads 12:00, so natural time reads 06:14 and the display
        keeps the Sun's real azimuth (≈180°, due south)."""
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
            "global.getKairosTime = st.getKairosTime;\n"
            "global.getSolarAzimuth = st.getSolarAzimuth;\n"
            "const nt = require('./web/static/js/natural_time.js');\n"
            "process.stdout.write(JSON.stringify({\n"
            "  kairos: st.getKairosTime(),\n"
            "  natural: nt.getNaturalTime().formatted,\n"
            "  display: nt.getNaturalTimeDisplay()\n"
            "}));\n"
        )
        out = self._run(script)
        self.assertAlmostEqual(out["kairos"], 12.0, delta=0.05)
        # Solar noon → natural 06:14, with the real azimuth kept in the header.
        self.assertEqual(out["natural"], "06:14")
        self.assertRegex(out["display"], r"^06:14 \(\d{3}\.\d°\)$")

    def test_is_natural_time_selected(self):
        script = (
            "const storage = {};\n"
            "global.localStorage = {\n"
            "    getItem: (k) => (k in storage ? storage[k] : null),\n"
            "    setItem: (k, v) => { storage[k] = String(v); }\n"
            "};\n"
            "const nt = require('./web/static/js/natural_time.js');\n"
            "const none = nt.isNaturalTimeSelected();\n"
            "storage['kairos_time_system'] = 'current';\n"
            "const current = nt.isNaturalTimeSelected();\n"
            "storage['kairos_time_system'] = 'natural';\n"
            "const natural = nt.isNaturalTimeSelected();\n"
            "process.stdout.write(JSON.stringify({ none, current, natural }));\n"
        )
        out = self._run(script)
        self.assertFalse(out["none"])
        self.assertFalse(out["current"])
        self.assertTrue(out["natural"])

    def test_is_natural_time_selected_without_localstorage(self):
        script = (
            "const nt = require('./web/static/js/natural_time.js');\n"
            "process.stdout.write(JSON.stringify(nt.isNaturalTimeSelected()));\n"
        )
        out = self._run(script)
        self.assertFalse(out)

    def test_engine_file_is_valid_js(self):
        proc = subprocess.run(["node", "--check",
                               "web/static/js/natural_time.js"],
                              capture_output=True, text=True, cwd=REPO_ROOT)
        self.assertEqual(proc.returncode, 0, proc.stderr)


if __name__ == "__main__":
    unittest.main()

