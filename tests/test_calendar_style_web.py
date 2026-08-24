"""Web test: the Calendar Style layer (month names + Earth Era year).

web/static/js/calendar_style.js lets the 13 Kairos months be read through two
name styles: the canonical "kairos" Root Moon…Star Moon names, or the 13 true
zodiac constellations the Sun actually crosses in a year (Capricornus…
Sagittarius, including Ophiuchus). The style is chosen in ⚙️ Configure →
📅 Month Names (#month-style, persisted as `kairos_month_style`). While the
zodiac style is active the header shows the Earth Era year
("EE 4.540.002.026") instead of "4.54B / 2026.624", plus the short civil
year badge ("EE 26").
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


class TestCalendarStyleServed(unittest.TestCase):
    def setUp(self):
        app.config["TESTING"] = True
        self.client = app.test_client()

    def test_calendar_style_js_served(self):
        resp = self.client.get("/static/js/calendar_style.js")
        self.assertEqual(resp.status_code, 200)
        self.assertIn(b"getMonthName", resp.data)
        self.assertIn(b"getMonthStyle", resp.data)
        self.assertIn(b"getEarthEraYear", resp.data)
        self.assertIn(b"isZodiacStyle", resp.data)

    def test_root_loads_calendar_style_before_kst_display(self):
        """calendar_style.js must load before kst_display.js so the header
        builder can call getMonthName() / isZodiacStyle()."""
        html = self.client.get("/").get_data(as_text=True)
        self.assertLess(
            html.index('<script src="static/js/calendar_style.js"></script>'),
            html.index('<script src="kst_display.js"></script>'))

    def test_configure_panel_has_month_style_select(self):
        html = self.client.get("/").get_data(as_text=True)
        self.assertIn('id="month-style"', html)
        self.assertIn('<option value="kairos"', html)
        self.assertIn('<option value="zodiac"', html)
        self.assertIn('data-i18n="config.month_style"', html)
        self.assertIn('data-i18n="config.month_style_zodiac"', html)

    def test_civil_year_badge_markup_present(self):
        """The short civil year badge ("EE 26") lives under the primary line."""
        html = self.client.get("/").get_data(as_text=True)
        self.assertIn('id="civilYear"', html)

    def test_watch_face_does_not_load_calendar_style(self):
        """The isolated watch face stays canonical — the month-style layer is
        a main-app reading option and must not leak in."""
        html = self.client.get("/watch.html").get_data(as_text=True)
        self.assertNotIn('src="static/js/calendar_style.js"', html)


@requires_node
class TestCalendarStyleJs(unittest.TestCase):
    def _run(self, script):
        proc = subprocess.run(["node", "-e", script], capture_output=True,
                              text=True, encoding="utf-8", cwd=REPO_ROOT)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        return json.loads(proc.stdout)

    def test_engine_file_is_valid_js(self):
        proc = subprocess.run(["node", "--check",
                               "web/static/js/calendar_style.js"],
                              capture_output=True, text=True, cwd=REPO_ROOT)
        self.assertEqual(proc.returncode, 0, proc.stderr)

    def test_default_style_is_kairos_with_canonical_names(self):
        script = (
            "const cs = require('./web/static/js/calendar_style.js');\n"
            "process.stdout.write(JSON.stringify({\n"
            "  style: cs.getMonthStyle(),\n"
            "  first: cs.getMonthName(0),\n"
            "  last: cs.getMonthName(12),\n"
            "  count: cs.KAIROS_MONTH_STYLES.kairos.length\n"
            "}));\n"
        )
        out = self._run(script)
        self.assertEqual(out["style"], "kairos")
        self.assertEqual(out["first"], "Root Moon")
        self.assertEqual(out["last"], "Star Moon")
        self.assertEqual(out["count"], 13)

    def test_zodiac_style_names_and_flag(self):
        script = (
            "const storage = { kairos_month_style: 'zodiac' };\n"
            "global.localStorage = {\n"
            "    getItem: (k) => (k in storage ? storage[k] : null),\n"
            "    setItem: (k, v) => { storage[k] = String(v); }\n"
            "};\n"
            "const cs = require('./web/static/js/calendar_style.js');\n"
            "process.stdout.write(JSON.stringify({\n"
            "  style: cs.getMonthStyle(),\n"
            "  zodiac: cs.isZodiacStyle(),\n"
            "  months: cs.KAIROS_MONTH_STYLES.zodiac,\n"
            "  first: cs.getMonthName(0),\n"
            "  last: cs.getMonthName(12)\n"
            "}));\n"
        )
        out = self._run(script)
        self.assertEqual(out["style"], "zodiac")
        self.assertTrue(out["zodiac"])
        self.assertEqual(out["months"], [
            "Capricornus", "Aquarius", "Pisces", "Aries",
            "Taurus", "Gemini", "Cancer", "Leo",
            "Virgo", "Libra", "Scorpius", "Ophiuchus",
            "Sagittarius"])
        self.assertEqual(out["first"], "Capricornus")
        self.assertEqual(out["last"], "Sagittarius")

    def test_earth_era_year(self):
        script = (
            "const REAL = Date;\n"
            "const FIXED = new REAL(2026, 0, 15, 12, 0, 0).getTime();\n"
            "class FakeDate extends REAL {\n"
            "  constructor(...args) { super(...(args.length ? args : [FIXED])); }\n"
            "  static now() { return FIXED; }\n"
            "}\n"
            "global.Date = FakeDate;\n"
            "const cs = require('./web/static/js/calendar_style.js');\n"
            "process.stdout.write(JSON.stringify(cs.getEarthEraYear()));\n"
        )
        out = self._run(script)
        self.assertEqual(out["full"], "4.540.002.026")
        self.assertEqual(out["short"], "26")

    def test_set_month_style_persists_and_validates(self):
        script = (
            "const storage = {};\n"
            "global.localStorage = {\n"
            "    getItem: (k) => (k in storage ? storage[k] : null),\n"
            "    setItem: (k, v) => { storage[k] = String(v); }\n"
            "};\n"
            "const cs = require('./web/static/js/calendar_style.js');\n"
            "const before = cs.getMonthStyle();\n"
            "cs.setMonthStyle('zodiac');\n"
            "const after = cs.getMonthStyle();\n"
            "const bad = cs.setMonthStyle('nope');\n"
            "process.stdout.write(JSON.stringify({ before, after, bad }));\n"
        )
        out = self._run(script)
        self.assertEqual(out["before"], "kairos")
        self.assertEqual(out["after"], "zodiac")
        self.assertEqual(out["bad"], "kairos")

    def test_default_without_localstorage(self):
        script = (
            "const cs = require('./web/static/js/calendar_style.js');\n"
            "process.stdout.write(JSON.stringify({\n"
            "  style: cs.getMonthStyle(), zodiac: cs.isZodiacStyle()\n"
            "}));\n"
        )
        out = self._run(script)
        self.assertEqual(out["style"], "kairos")
        self.assertFalse(out["zodiac"])


if __name__ == "__main__":
    unittest.main()
