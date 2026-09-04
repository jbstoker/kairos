"""Web test: the Kairos Kepler Time system (variable pulse from the equation of time).

web/static/js/kairos_time.js is the equation-of-time sibling of the fixed
natural-second layers: 1 day = 26 Strides = 28 Beats each = 7 Pulses each
(26 × 28 × 7 = 5,096 pulses), but the pulse length is NOT constant — it
varies with the day of the year so that 5,096 pulses always span exactly one
APPARENT SOLAR DAY (86,400 s ± ~30 s). The clock is anchored at apparent
solar midnight (the Sun's anti-meridian transit = SunCalc solarNoon − 12h),
so 01:01:01 is apparent midnight, 14:01:01 is apparent solar noon (1-indexed)
and 26:28:07 is the day's end. The equation of time uses the same Meeus
formula as core/meeus_algorithms.py (they agree to ~1e-12 s). Selected in
⚙️ Configure → ⏱️ Time System and persisted in `kairos_time_system`
("kairos_kepler").
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


class TestKairosKeplerServed(unittest.TestCase):
    def setUp(self):
        app.config["TESTING"] = True
        self.client = app.test_client()

    def test_kairos_time_js_served(self):
        resp = self.client.get("/static/js/kairos_time.js")
        self.assertEqual(resp.status_code, 200)
        self.assertIn(b"getKairosKeplerTime", resp.data)
        self.assertIn(b"equationOfTime", resp.data)
        self.assertIn(b"getPulseLength", resp.data)
        self.assertIn(b"isKairosKeplerSelected", resp.data)

    def test_root_loads_kairos_time_after_kairos_natural_before_kst(self):
        """kairos_time.js must load after the other reading layers and before
        the header builder, so primaryTime() can call
        getKairosKeplerTimeDisplay()."""
        html = self.client.get("/").get_data(as_text=True)
        self.assertLess(
            html.index('<script src="static/js/kairos_natural_time.js"></script>'),
            html.index('<script src="static/js/kairos_time.js"></script>'))
        self.assertLess(
            html.index('<script src="static/js/kairos_time.js"></script>'),
            html.index('<script src="kst_display.js"></script>'))

    def test_configure_panel_has_kairos_kepler_option(self):
        html = self.client.get("/").get_data(as_text=True)
        self.assertIn('<option value="kairos_kepler"', html)
        self.assertIn('data-i18n="config.time_system_kairos_kepler"', html)

    def test_kepler_info_panel_markup_present(self):
        """The Kairos Kepler info line (full Earth Era date, variable pulse
        length) lives under the primary line."""
        html = self.client.get("/").get_data(as_text=True)
        self.assertIn('id="full-kairos-date"', html)
        self.assertIn('id="pulse-length"', html)
        self.assertNotIn('id="pulseLengthReadout"', html)

    def test_watch_face_does_not_load_kairos_time(self):
        """The isolated watch face stays a pure solar clock — the Kairos
        Kepler layer is a main-app reading option and must not leak in."""
        html = self.client.get("/watch.html").get_data(as_text=True)
        self.assertNotIn('src="static/js/kairos_time.js"', html)


@requires_node
class TestKairosKeplerJs(unittest.TestCase):
    def _run(self, script):
        proc = subprocess.run(["node", "-e", script], capture_output=True,
                              text=True, encoding="utf-8", cwd=REPO_ROOT)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        return json.loads(proc.stdout)

    def test_engine_file_is_valid_js(self):
        proc = subprocess.run(["node", "--check",
                               "web/static/js/kairos_time.js"],
                              capture_output=True, text=True, cwd=REPO_ROOT)
        self.assertEqual(proc.returncode, 0, proc.stderr)

    def test_julian_day(self):
        script = (
            "const k = require('./web/static/js/kairos_time.js');\n"
            "process.stdout.write(JSON.stringify({\n"
            "  j2000: k.dateToJulianDay(new Date(Date.UTC(2000, 0, 1, 12))),\n"
            "  unix: k.dateToJulianDay(new Date(Date.UTC(1970, 0, 1, 0))),\n"
            "  jan2024: k.dateToJulianDay(new Date(Date.UTC(2024, 0, 1, 0)))\n"
            "}));\n"
        )
        out = self._run(script)
        self.assertAlmostEqual(out["j2000"], 2451545.0, places=6)
        self.assertAlmostEqual(out["unix"], 2440587.5, places=6)
        self.assertAlmostEqual(out["jan2024"], 2460310.5, places=6)

    def test_equation_of_time_matches_python(self):
        """The JS port must agree with core/meeus_algorithms.py at the same
        Julian Days — both sides of the same Meeus ch. 28 formula."""
        from core.meeus_algorithms import equation_of_time
        jds = [2451545.0, 2460310.5, 2460437.0, 2460436.5, 2460532.5,
               2460588.5, 2460439.5]
        script = (
            "const k = require('./web/static/js/kairos_time.js');\n"
            "const jds = " + json.dumps(jds) + ";\n"
            "process.stdout.write(JSON.stringify(jds.map(jd => k.equationOfTime(jd))));\n"
        )
        out = self._run(script)
        for jd, got in zip(jds, out):
            expected = equation_of_time(jd) * 60.0  # minutes → seconds
            self.assertAlmostEqual(got, expected, delta=1e-6)

    def test_equation_of_time_extremes(self):
        """Real anchors (tests/test_meeus.py): Feb 11 ≈ −14.2 min,
        Nov 3 ≈ +16.4 min, Apr 15 ≈ 0, May 14 ≈ +3.7 min. In seconds."""
        script = (
            "const k = require('./web/static/js/kairos_time.js');\n"
            "const d = (y, m, day) => new Date(Date.UTC(y, m - 1, day, 12));\n"
            "process.stdout.write(JSON.stringify({\n"
            "  feb: k.equationOfTime(k.dateToJulianDay(d(2024, 2, 11))),\n"
            "  nov: k.equationOfTime(k.dateToJulianDay(d(2024, 11, 3))),\n"
            "  apr: k.equationOfTime(k.dateToJulianDay(d(2024, 4, 15))),\n"
            "  may: k.equationOfTime(k.dateToJulianDay(d(2024, 5, 14)))\n"
            "}));\n"
        )
        out = self._run(script)
        self.assertAlmostEqual(out["feb"], -14.2 * 60, delta=90)
        self.assertAlmostEqual(out["nov"], 16.4 * 60, delta=90)
        self.assertAlmostEqual(out["apr"], 0.0, delta=60)
        self.assertAlmostEqual(out["may"], 3.7 * 60, delta=60)

    def test_day_length_and_pulse_length(self):
        script = (
            "const k = require('./web/static/js/kairos_time.js');\n"
            "const d = (y, m, day) => new Date(Date.UTC(y, m - 1, day, 12));\n"
            "process.stdout.write(JSON.stringify({\n"
            "  junDay: k.getApparentDayLength(d(2024, 6, 21)),\n"
            "  junPulse: k.getPulseLength(d(2024, 6, 21)),\n"
            "  aprDay: k.getApparentDayLength(d(2024, 4, 15)),\n"
            "  aprPulse: k.getPulseLength(d(2024, 4, 15)),\n"
            "  janPulse: k.getPulseLength(d(2024, 1, 1))\n"
            "}));\n"
        )
        out = self._run(script)
        # Apparent solar day = 86,400 s ± ~40 s; pulse ≈ 16.955 s.
        for key in ("junDay", "aprDay"):
            self.assertTrue(86360 < out[key] < 86440, out[key])
        for key in ("junPulse", "aprPulse", "janPulse"):
            self.assertTrue(16.94 < out[key] < 16.97, out[key])
        # The pulse genuinely varies through the year (not a constant).
        self.assertNotAlmostEqual(out["junPulse"], out["aprPulse"], places=4)

    def test_kairos_clock_fraction_boundaries(self):
        script = (
            "const k = require('./web/static/js/kairos_time.js');\n"
            "process.stdout.write(JSON.stringify({\n"
            "  start: k.kairosKeplerFromFraction(0),\n"
            "  noon: k.kairosKeplerFromFraction(0.5),\n"
            "  end: k.kairosKeplerFromFraction(1),\n"
            "  nearEnd: k.kairosKeplerFromFraction(0.9999)\n"
            "}));\n"
        )
        out = self._run(script)
        # 0-indexed natural dial: midnight 00:00:00, noon 13:00:00.
        self.assertEqual(out["start"]["stride"], 0)
        self.assertEqual(out["start"]["beat"], 0)
        self.assertEqual(out["start"]["pulse"], 0)
        self.assertEqual(out["noon"]["stride"], 13)
        self.assertEqual(out["noon"]["beat"], 0)
        self.assertEqual(out["noon"]["pulse"], 0)
        self.assertEqual(out["end"]["stride"], 25)
        self.assertEqual(out["end"]["beat"], 27)
        self.assertEqual(out["end"]["pulse"], 6)
        self.assertEqual(out["nearEnd"]["stride"], 25)
        self.assertEqual(out["nearEnd"]["beat"], 27)
        self.assertEqual(out["nearEnd"]["pulse"], 6)

    def test_day_of_year_is_1_to_364(self):
        script = (
            "const k = require('./web/static/js/kairos_time.js');\n"
            "process.stdout.write(JSON.stringify({\n"
            "  jan1: k.kairosKeplerDayOfYear(new Date(2024, 0, 1)),\n"
            "  june: k.kairosKeplerDayOfYear(new Date(2024, 5, 21)),\n"
            "  dec28: k.kairosKeplerDayOfYear(new Date(2024, 11, 28))\n"
            "}));\n"
        )
        out = self._run(script)
        self.assertEqual(out["jan1"], 1)
        for v in out.values():
            self.assertTrue(1 <= v <= 364, v)

    def test_apparent_midnight_anchor_with_engine(self):
        """End-to-end with SunCalc (Wergea): at the instant of apparent solar
        noon the clock reads 13:00:00; at the anti-meridian (nadir) it reads
        00:00:00 — the day starts at apparent solar midnight."""
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
            "global.getObserverLocation = () => loc;\n"
            "const kt = require('./web/static/js/kairos_time.js');\n"
            "const noon = kt.getKairosKeplerTime();\n"
            "CURRENT = times.nadir.getTime();\n"
            "const midnight = kt.getKairosKeplerTime();\n"
            "process.stdout.write(JSON.stringify({\n"
            "  noon: noon.formatted, midnight: midnight.formatted,\n"
            "  pulse: noon.pulseLength\n"
            "}));\n"
        )
        out = self._run(script)
        self.assertEqual(out["noon"], "13:00:00")
        self.assertEqual(out["midnight"], "00:00:00")
        self.assertTrue(16.94 < out["pulse"] < 16.97, out["pulse"])

    def test_wall_clock_fallback_is_deterministic(self):
        """Without the solar engine, the day fraction falls back to the wall
        clock — local noon → 13:00:00, still with today's real pulse."""
        script = (
            "const REAL = Date;\n"
            "const FIXED = new REAL(2024, 0, 15, 12, 0, 0).getTime();\n"
            "class FakeDate extends REAL {\n"
            "  constructor(...args) { super(...(args.length ? args : [FIXED])); }\n"
            "  static now() { return FIXED; }\n"
            "}\n"
            "global.Date = FakeDate;\n"
            "const kt = require('./web/static/js/kairos_time.js');\n"
            "const t = kt.getKairosKeplerTime();\n"
            "process.stdout.write(JSON.stringify({\n"
            "  formatted: t.formatted, pulse: t.pulseLength\n"
            "}));\n"
        )
        out = self._run(script)
        self.assertEqual(out["formatted"], "13:00:00")
        self.assertTrue(16.94 < out["pulse"] < 16.97, out["pulse"])

    def test_is_kairos_kepler_selected(self):
        script = (
            "const storage = {};\n"
            "global.localStorage = {\n"
            "    getItem: (k) => (k in storage ? storage[k] : null),\n"
            "    setItem: (k, v) => { storage[k] = String(v); }\n"
            "};\n"
            "const kt = require('./web/static/js/kairos_time.js');\n"
            "const none = kt.isKairosKeplerSelected();\n"
            "storage['kairos_time_system'] = 'current';\n"
            "const current = kt.isKairosKeplerSelected();\n"
            "storage['kairos_time_system'] = 'natural';\n"
            "const natural = kt.isKairosKeplerSelected();\n"
            "storage['kairos_time_system'] = 'kairos_natural';\n"
            "const kairosNatural = kt.isKairosKeplerSelected();\n"
            "storage['kairos_time_system'] = 'kairos_kepler';\n"
            "const kairosKepler = kt.isKairosKeplerSelected();\n"
            "process.stdout.write(JSON.stringify({ none, current, natural, kairosNatural, kairosKepler }));\n"
        )
        out = self._run(script)
        self.assertFalse(out["none"])
        self.assertFalse(out["current"])
        self.assertFalse(out["natural"])
        self.assertFalse(out["kairosNatural"])
        self.assertTrue(out["kairosKepler"])

    def test_is_kairos_kepler_selected_without_localstorage(self):
        script = (
            "const kt = require('./web/static/js/kairos_time.js');\n"
            "process.stdout.write(JSON.stringify(kt.isKairosKeplerSelected()));\n"
        )
        out = self._run(script)
        self.assertFalse(out)


if __name__ == "__main__":
    unittest.main()

