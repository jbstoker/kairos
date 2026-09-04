"""Web test: the Kairos Kepler Display layer (Stride : Beat : Pulse format).

web/static/js/kairos_kepler_display.js formats the live Kepler clock
(web/static/js/kairos_time.js) into the human-readable time and date, reusing
the calendar-style layer (web/static/js/calendar_style.js) for the month names
and the Earth Era year:

  header:   "14:01:01 · Root Moon 15 · 26 (180.0°)"
  full:     "EE 4.540.002.026/01/15 14:01:01"
  civil:    "26/01/15 14:01:01"
  pulse:    "Pulse: 16.9504 s"
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


class TestKairosKeplerDisplayServed(unittest.TestCase):
    def setUp(self):
        app.config["TESTING"] = True
        self.client = app.test_client()

    def test_kairos_kepler_display_js_served(self):
        resp = self.client.get("/static/js/kairos_kepler_display.js")
        self.assertEqual(resp.status_code, 200)
        self.assertIn(b"getKairosKeplerDisplay", resp.data)
        self.assertIn(b"getKairosKeplerHeader", resp.data)

    def test_root_loads_kepler_display_after_engine_before_kst(self):
        """kairos_kepler_display.js must load after the Kepler engine and
        before the header builder, so updateKSTSummary() can call
        getKairosKeplerHeader()."""
        html = self.client.get("/").get_data(as_text=True)
        self.assertLess(
            html.index('<script src="static/js/kairos_time.js"></script>'),
            html.index('<script src="static/js/kairos_kepler_display.js"></script>'))
        self.assertLess(
            html.index('<script src="static/js/kairos_kepler_display.js"></script>'),
            html.index('<script src="kst_display.js"></script>'))

    def test_watch_face_does_not_load_kepler_display(self):
        """The isolated watch face stays a pure solar clock — the Kepler
        display layer is a main-app reading option and must not leak in."""
        html = self.client.get("/watch.html").get_data(as_text=True)
        self.assertNotIn('src="static/js/kairos_kepler_display.js"', html)

    def test_pulse_panel_markup_present(self):
        """The real-time pulse panel (pulse length, day length, equation of
        time) lives in the Kairos Kepler info area."""
        html = self.client.get("/").get_data(as_text=True)
        self.assertIn('id="pulse-panel"', html)
        self.assertIn('id="pulse-value"', html)
        self.assertIn('id="day-value"', html)
        self.assertIn('id="eot-value"', html)

    def test_index_style_toggle_markup_present(self):
        """The 🔢 Display Index toggle (0-indexed natural / 1-indexed
        traditional) lives in the Configure panel."""
        html = self.client.get("/").get_data(as_text=True)
        self.assertIn('id="index-style"', html)
        self.assertIn('<option value="zero"', html)
        self.assertIn('<option value="one"', html)
        self.assertIn('data-i18n="config.index_style"', html)


@requires_node
class TestKairosKeplerDisplayJs(unittest.TestCase):
    def _run(self, script):
        proc = subprocess.run(["node", "-e", script], capture_output=True,
                              text=True, encoding="utf-8", cwd=REPO_ROOT)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        return json.loads(proc.stdout)

    def test_engine_file_is_valid_js(self):
        proc = subprocess.run(["node", "--check",
                               "web/static/js/kairos_kepler_display.js"],
                              capture_output=True, text=True, cwd=REPO_ROOT)
        self.assertEqual(proc.returncode, 0, proc.stderr)

    def test_formatting_with_fake_date(self):
        """Wall-clock fallback at local noon (fraction 0.5 → 14:01:01),
        Jan 15 2026 → month 01, day 15, short year 26."""
        script = (
            "const REAL = Date;\n"
            "const FIXED = new REAL(2026, 0, 15, 12, 0, 0).getTime();\n"
            "class FakeDate extends REAL {\n"
            "  constructor(...args) { super(...(args.length ? args : [FIXED])); }\n"
            "  static now() { return FIXED; }\n"
            "}\n"
            "global.Date = FakeDate;\n"
            "global.localStorage = { getItem: () => null, setItem: () => {} };\n"
            "const kt = require('./web/static/js/kairos_time.js');\n"
            "global.getKairosKeplerTime = kt.getKairosKeplerTime;\n"
            "global.kairosKeplerDayOfYear = kt.kairosKeplerDayOfYear;\n"
            "const cs = require('./web/static/js/calendar_style.js');\n"
            "global.getMonthName = cs.getMonthName;\n"
            "global.getEarthEraYear = cs.getEarthEraYear;\n"
            "const kd = require('./web/static/js/kairos_kepler_display.js');\n"
            "process.stdout.write(JSON.stringify(kd.getKairosKeplerDisplay()));\n"
        )
        out = self._run(script)
        # 0-indexed natural dial: local noon → 13:00:00.
        self.assertEqual(out["stride"], 13)
        self.assertEqual(out["beat"], 0)
        self.assertEqual(out["pulse"], 0)
        self.assertEqual(out["timeStr"], "13:00:00")
        self.assertEqual(out["timeStr1"], "14:01:01")   # legacy 1-indexed
        self.assertEqual(out["dateStr"], "01/15")
        self.assertEqual(out["fullDateStr"], "4.540.002.026/01/15")
        self.assertEqual(out["fullStr"], "EE 4.540.002.026/01/15 13:00:00")
        self.assertEqual(out["civilStr"], "26/01/15 13:00:00")
        self.assertEqual(out["monthName"], "Root Moon")   # default month style
        self.assertEqual(out["dayInMonth"], 15)
        self.assertEqual(out["year"], "4.540.002.026")
        self.assertEqual(out["shortYear"], "26")
        self.assertTrue(16.9 < out["pulseLength"] < 17.0, out["pulseLength"])

    def test_zodiac_month_names_respected(self):
        """The display follows the user's 📅 Month Names choice."""
        script = (
            "const REAL = Date;\n"
            "const FIXED = new REAL(2026, 0, 15, 12, 0, 0).getTime();\n"
            "class FakeDate extends REAL {\n"
            "  constructor(...args) { super(...(args.length ? args : [FIXED])); }\n"
            "  static now() { return FIXED; }\n"
            "}\n"
            "global.Date = FakeDate;\n"
            "global.localStorage = {\n"
            "    getItem: (k) => (k === 'kairos_month_style' ? 'zodiac' : null),\n"
            "    setItem: () => {}\n"
            "};\n"
            "const kt = require('./web/static/js/kairos_time.js');\n"
            "global.getKairosKeplerTime = kt.getKairosKeplerTime;\n"
            "global.kairosKeplerDayOfYear = kt.kairosKeplerDayOfYear;\n"
            "const cs = require('./web/static/js/calendar_style.js');\n"
            "global.getMonthName = cs.getMonthName;\n"
            "global.getEarthEraYear = cs.getEarthEraYear;\n"
            "const kd = require('./web/static/js/kairos_kepler_display.js');\n"
            "const d = kd.getKairosKeplerDisplay();\n"
            "process.stdout.write(JSON.stringify({\n"
            "  monthName: d.monthName, fullStr: d.fullStr, civilStr: d.civilStr\n"
            "}));\n"
        )
        out = self._run(script)
        self.assertEqual(out["monthName"], "Capricornus")
        self.assertEqual(out["fullStr"], "EE 4.540.002.026/01/15 13:00:00")
        self.assertEqual(out["civilStr"], "26/01/15 13:00:00")

    def test_header_keeps_the_azimuth(self):
        """'SS:BB:PP · Month Day · shortYear (azimuth°)' — the number and the
        sky-dome bead still agree (0-indexed natural by default)."""
        script = (
            "const REAL = Date;\n"
            "const FIXED = new REAL(2026, 0, 15, 12, 0, 0).getTime();\n"
            "class FakeDate extends REAL {\n"
            "  constructor(...args) { super(...(args.length ? args : [FIXED])); }\n"
            "  static now() { return FIXED; }\n"
            "}\n"
            "global.Date = FakeDate;\n"
            "global.localStorage = { getItem: () => null, setItem: () => {} };\n"
            "global.getSolarAzimuth = () => 180;\n"
            "const kt = require('./web/static/js/kairos_time.js');\n"
            "global.getKairosKeplerTime = kt.getKairosKeplerTime;\n"
            "global.kairosKeplerDayOfYear = kt.kairosKeplerDayOfYear;\n"
            "const cs = require('./web/static/js/calendar_style.js');\n"
            "global.getMonthName = cs.getMonthName;\n"
            "global.getEarthEraYear = cs.getEarthEraYear;\n"
            "const kd = require('./web/static/js/kairos_kepler_display.js');\n"
            "process.stdout.write(JSON.stringify(kd.getKairosKeplerHeader()));\n"
        )
        out = self._run(script)
        self.assertEqual(out, "13:00:00 · Root Moon 15 · 26 (180.0°)")

    def test_month_and_day_mapping(self):
        script = (
            "const kd = require('./web/static/js/kairos_kepler_display.js');\n"
            "process.stdout.write(JSON.stringify({\n"
            "  first: kd.getKairosMonthAndDay(0),\n"
            "  monthEnd: kd.getKairosMonthAndDay(27),\n"
            "  nextMonth: kd.getKairosMonthAndDay(28),\n"
            "  last: kd.getKairosMonthAndDay(363)\n"
            "}));\n"
        )
        out = self._run(script)
        self.assertEqual(out["first"], {"monthIndex": 0, "dayInMonth": 1})
        self.assertEqual(out["monthEnd"], {"monthIndex": 0, "dayInMonth": 28})
        self.assertEqual(out["nextMonth"], {"monthIndex": 1, "dayInMonth": 1})
        self.assertEqual(out["last"], {"monthIndex": 12, "dayInMonth": 28})

    def test_returns_null_without_the_engine(self):
        script = (
            "const kd = require('./web/static/js/kairos_kepler_display.js');\n"
            "process.stdout.write(JSON.stringify({\n"
            "  display: kd.getKairosKeplerDisplay(new Date()),\n"
            "  pulse: kd.getPulseDisplayData(new Date())\n"
            "}));\n"
        )
        out = self._run(script)
        self.assertIsNone(out["display"])
        self.assertIsNone(out["pulse"])

    def test_index_style_selection(self):
        """0-indexed natural is the default; 'one' switches the display to
        the 1-indexed traditional form (fullStr/civilStr follow it)."""
        script = (
            "const storage = {};\n"
            "global.localStorage = {\n"
            "    getItem: (k) => (k in storage ? storage[k] : null),\n"
            "    setItem: (k, v) => { storage[k] = String(v); }\n"
            "};\n"
            "const REAL = Date;\n"
            "const FIXED = new REAL(2026, 0, 15, 12, 0, 0).getTime();\n"
            "class FakeDate extends REAL {\n"
            "  constructor(...args) { super(...(args.length ? args : [FIXED])); }\n"
            "  static now() { return FIXED; }\n"
            "}\n"
            "global.Date = FakeDate;\n"
            "global.getSolarAzimuth = () => 180;\n"
            "const kt = require('./web/static/js/kairos_time.js');\n"
            "global.getKairosKeplerTime = kt.getKairosKeplerTime;\n"
            "global.kairosKeplerDayOfYear = kt.kairosKeplerDayOfYear;\n"
            "const cs = require('./web/static/js/calendar_style.js');\n"
            "global.getMonthName = cs.getMonthName;\n"
            "global.getEarthEraYear = cs.getEarthEraYear;\n"
            "const kd = require('./web/static/js/kairos_kepler_display.js');\n"
            "const defaultStyle = kd.getIndexStyle();\n"
            "const naturalOneIndexed = kd.isOneIndexed();\n"
            "const natural = kd.getKairosKeplerDisplay();\n"
            "const naturalHeader = kd.getKairosKeplerHeader();\n"
            "kd.setIndexStyle('one');\n"
            "const traditional = kd.getKairosKeplerDisplay();\n"
            "const traditionalHeader = kd.getKairosKeplerHeader();\n"
            "process.stdout.write(JSON.stringify({\n"
            "  defaultStyle: defaultStyle,\n"
            "  naturalOneIndexed: naturalOneIndexed,\n"
            "  naturalTime: natural.timeStr, naturalFull: natural.fullStr,\n"
            "  legacyTime: natural.timeStr1,\n"
            "  naturalHeader: naturalHeader,\n"
            "  afterStyle: kd.getIndexStyle(), oneIndexed: kd.isOneIndexed(),\n"
            "  traditionalTime: traditional.timeStr, traditionalFull: traditional.fullStr,\n"
            "  traditionalHeader: traditionalHeader\n"
            "}));\n"
        )
        out = self._run(script)
        self.assertEqual(out["defaultStyle"], "zero")
        self.assertFalse(out["naturalOneIndexed"])
        self.assertEqual(out["naturalTime"], "13:00:00")
        self.assertEqual(out["naturalFull"], "EE 4.540.002.026/01/15 13:00:00")
        self.assertEqual(out["legacyTime"], "14:01:01")
        self.assertEqual(out["naturalHeader"], "13:00:00 · Root Moon 15 · 26 (180.0°)")
        self.assertEqual(out["afterStyle"], "one")
        self.assertTrue(out["oneIndexed"])
        self.assertEqual(out["traditionalTime"], "13:00:00")  # timeStr stays 0-indexed
        self.assertEqual(out["traditionalFull"], "EE 4.540.002.026/01/15 14:01:01")
        self.assertEqual(out["traditionalHeader"], "14:01:01 · Root Moon 15 · 26 (180.0°)")

    def test_index_style_defaults_without_localstorage(self):
        script = (
            "const kd = require('./web/static/js/kairos_kepler_display.js');\n"
            "process.stdout.write(JSON.stringify({\n"
            "  style: kd.getIndexStyle(), one: kd.isOneIndexed()\n"
            "}));\n"
        )
        out = self._run(script)
        self.assertEqual(out["style"], "zero")
        self.assertFalse(out["one"])

    def test_pulse_display_data(self):
        """Feb 11 2024 → EoT ≈ −14.2 min, day ≈ 86,400 s (slightly long),
        pulse ≈ 16.955 s — the same anchors as tests/test_meeus.py."""
        script = (
            "const kt = require('./web/static/js/kairos_time.js');\n"
            "global.dateToJulianDay = kt.dateToJulianDay;\n"
            "global.equationOfTime = kt.equationOfTime;\n"
            "global.getPulseLength = kt.getPulseLength;\n"
            "const kd = require('./web/static/js/kairos_kepler_display.js');\n"
            "const d = kd.getPulseDisplayData(new Date(Date.UTC(2024, 1, 11, 12)));\n"
            "process.stdout.write(JSON.stringify({\n"
            "  pulse: d.pulseLength, mean: d.meanPulseLength, day: d.dayLength,\n"
            "  isLonger: d.isLonger, eot: d.equationOfTimeMinutes\n"
            "}));\n"
        )
        out = self._run(script)
        self.assertTrue(16.9 < out["pulse"] < 17.0, out["pulse"])
        self.assertAlmostEqual(out["mean"], 86400 / 5096, places=6)
        self.assertTrue(86360 < out["day"] < 86440, out["day"])
        self.assertIsInstance(out["isLonger"], bool)
        self.assertAlmostEqual(out["eot"], -14.2, delta=1.5)

    def test_format_pulse_display(self):
        script = (
            "const kd = require('./web/static/js/kairos_kepler_display.js');\n"
            "const shorter = kd.formatPulseDisplay({\n"
            "  pulseLength: 16.9519, pulseVariationMs: -2.6, isLonger: false,\n"
            "  dayLength: 86387.001, dayVariationMinutes: -0.22,\n"
            "  equationOfTimeMinutes: -1.92\n"
            "});\n"
            "const longer = kd.formatPulseDisplay({\n"
            "  pulseLength: 17.0129, pulseVariationMs: 3.4, isLonger: true,\n"
            "  dayLength: 86430.5, dayVariationMinutes: 0.51,\n"
            "  equationOfTimeMinutes: 16.42\n"
            "});\n"
            "process.stdout.write(JSON.stringify({ shorter, longer }));\n"
        )
        out = self._run(script)
        self.assertEqual(out["shorter"], {
            "pulseStr": "16.9519 s",
            "pulseVarStr": "-2.6 ms shorter",
            "dayStr": "86387.001 s",
            "dayVarStr": "-0.22 min",
            "eotStr": "-1.92 min",
            "trend": "📉"
        })
        self.assertEqual(out["longer"], {
            "pulseStr": "17.0129 s",
            "pulseVarStr": "3.4 ms longer",
            "dayStr": "86430.500 s",
            "dayVarStr": "+0.51 min",
            "eotStr": "+16.42 min",
            "trend": "📈"
        })


if __name__ == "__main__":
    unittest.main()
