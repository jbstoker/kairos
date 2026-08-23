"""Web test: the wearable watch face (web/watch.html).

The watch face is an extra, fully isolated option for building a Kairos watch:
it loads ONLY the shared solar engine (lib/suncalc.js + solar_time.js +
kairos_calendar.js) — never the main app scripts — so the existing web app is
untouched. It renders only the clock (true solar time, 12:00 = solar noon),
optionally with a compact Kairos date line. ?min=1 gives a pure clock.

Also pins the shared KairosCalendar helpers against core/constants.py so the
watch face and the Python engine can never drift apart.
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

MAIN_APP_SCRIPTS = [
    'i18n.js', 'static/js/lens_manager.js', 'static/js/energy_data.js',
    'planets.js', 'observation_methods.js', 'checksum_selfcheck.js', 'tabs.js',
    'seasonal_defaults.js', 'phytochemical_defaults.js', 'app.js',
    'seasonal_display.js', 'phytochemical_display.js', 'help_data.js', 'help.js',
    'kst_display.js', 'static/js/astronomy_engine.js',
    'static/js/canvas_renderer.js', 'static/js/app_controller.js',
    'static/js/unified_display.js', 'static/js/mobile.js',
    'static/js/natural_time.js', 'static/js/kairos_natural_time.js',
    'static/js/degree_wheel.js', 'static/js/solar_geometry.js',
]


def _node(stdin_script, cwd=None):
    proc = subprocess.run(["node", "-e", stdin_script], capture_output=True,
                          text=True, encoding="utf-8", cwd=cwd or REPO_ROOT)
    if proc.returncode != 0:
        raise AssertionError(f"node failed: {proc.stderr}")
    return json.loads(proc.stdout)


class TestWatchPage(unittest.TestCase):
    def setUp(self):
        app.config["TESTING"] = True
        self.client = app.test_client()

    def test_watch_page_served(self):
        resp = self.client.get("/watch.html")
        self.assertEqual(resp.status_code, 200)
        html = resp.get_data(as_text=True)
        self.assertIn('id="time"', html)
        self.assertIn('id="meta"', html)
        self.assertIn('id="date"', html)
        self.assertIn('rel="manifest" href="watch.webmanifest"', html)

    def test_watch_page_uses_the_shared_engine(self):
        html = self.client.get("/watch.html").get_data(as_text=True)
        for script in ["lib/suncalc.js", "static/js/solar_time.js",
                       "static/js/kairos_calendar.js", "static/js/watch.js"]:
            self.assertIn(f'<script src="{script}"></script>', html)
        self.assertIn('<link rel="stylesheet" href="static/css/watch.css">', html)

    def test_watch_page_is_isolated_from_the_main_app(self):
        """The watch face must never load the main app — then it can't break it."""
        html = self.client.get("/watch.html").get_data(as_text=True)
        for script in MAIN_APP_SCRIPTS:
            self.assertNotIn(f'<script src="{script}"', html,
                             f"watch.html must not load {script}")
        # The main app's stylesheets are also off-limits.
        self.assertNotIn('href="style.css"', html)
        self.assertNotIn('href="static/css/mobile.css"', html)

    def test_watch_assets_served(self):
        for path in ["static/js/kairos_calendar.js", "static/js/watch.js",
                     "static/css/watch.css", "watch.webmanifest"]:
            resp = self.client.get("/" + path)
            self.assertEqual(resp.status_code, 200, path)

    def test_main_app_links_to_the_watch_face(self):
        html = self.client.get("/").get_data(as_text=True)
        self.assertIn('href="watch.html"', html)

    def test_service_worker_caches_the_watch_face(self):
        sw = self.client.get("/sw.js").get_data(as_text=True)
        self.assertIn("kairos-v51", sw)
        for asset in ["watch.html", "watch.webmanifest", "static/css/watch.css",
                      "static/js/watch.js", "static/js/kairos_calendar.js"]:
            self.assertIn(asset, sw)

    def test_main_app_still_loads_its_own_scripts(self):
        """Guard: the main page must keep loading everything it always did."""
        html = self.client.get("/").get_data(as_text=True)
        for script in MAIN_APP_SCRIPTS:
            self.assertIn(f'<script src="{script}"', html)


@requires_node
class TestKairosCalendarJs(unittest.TestCase):
    def _helpers(self):
        script = r"""
const cal = require('./web/static/js/kairos_calendar.js');
const out = {
    d1: cal.kairosDate(1),
    d29: cal.kairosDate(29),
    d364: cal.kairosDate(364),
    d365: cal.kairosDate(365),
    doy1: cal.kairosDayOfYear(new Date(2026, 0, 1)),
    doy365: cal.kairosDayOfYear(new Date(2026, 11, 31)),
    seasons: [0, 89.9, 90, 179.9, 180, 269.9, 270, 359.9].map(cal.getSeason),
    moon: [0, 0.125, 0.25, 0.5, 0.75].map(cal.moonEmojiFromPhase),
    year: cal.formatYear(cal.getEarthAge(new Date(2026, 0, 1))),
    year0: cal.formatYear(4540000000)
};
process.stdout.write(JSON.stringify(out));
"""
        return _node(script)

    def test_kairos_dates(self):
        out = self._helpers()
        self.assertEqual(out["d1"], {"month": "Root Moon", "day": 1, "weekday": "Sundial"})
        self.assertEqual(out["d29"], {"month": "Sap Moon", "day": 1, "weekday": "Sundial"})
        self.assertEqual(out["d364"], {"month": "Star Moon", "day": 28, "weekday": "Star"})
        self.assertEqual(out["d365"], {"month": "Deep Day", "day": 1, "weekday": "Sundial"})
        self.assertEqual(out["doy1"], 1)
        self.assertEqual(out["doy365"], 365)

    def test_season_and_moon(self):
        out = self._helpers()
        self.assertEqual(out["seasons"],
                         ["Spring", "Spring", "Summer", "Summer",
                          "Autumn", "Autumn", "Winter", "Winter"])
        self.assertEqual(out["moon"], ["🌑", "🌒", "🌓", "🌕", "🌗"])

    def test_earth_age_year(self):
        out = self._helpers()
        self.assertEqual(out["year0"], "4.54B / 0.000")
        self.assertEqual(out["year"], "4.54B / 2026.000")

    def test_matches_python_constants(self):
        """The JS helpers must agree with core/constants.py exactly."""
        from core.constants import (KAIROS_DAY_NAMES, KAIROS_MONTH_NAMES,
                                    KAIROS_SEASON_NAMES, KAIROS_YEAR_DAY)
        script = r"""
const cal = require('./web/static/js/kairos_calendar.js');
process.stdout.write(JSON.stringify({
    days: cal.KAIROS_DAYS,
    months: cal.KAIROS_MONTHS,
    yearDay: cal.KAIROS_YEAR_DAY,
    seasons: cal.KAIROS_SEASONS
}));
"""
        out = _node(script)
        self.assertEqual(out["days"], KAIROS_DAY_NAMES)
        self.assertEqual(out["months"], KAIROS_MONTH_NAMES)
        self.assertEqual(out["yearDay"], KAIROS_YEAR_DAY)
        self.assertEqual(out["seasons"], KAIROS_SEASON_NAMES)


@requires_node
class TestWatchFaceJs(unittest.TestCase):
    _STUBS = r"""
const REAL = Date;
global.localStorage = {
    getItem: (k) => (k === 'kairos_location')
        ? JSON.stringify({ lat: 53.1503, lon: 5.8389 }) : null,
    setItem: () => {}
};
const text = {};
global.document = {
    getElementById: (id) => ({ set textContent(v) { text[id] = v; } }),
    addEventListener: () => {},
    body: { classList: { add: () => {} } },
    readyState: 'complete'
};
global.window = { addEventListener: () => {}, location: { search: 'SEARCH' } };
global.setTimeout = () => 0;
global.SunCalc = require('./web/lib/suncalc.js');
require('./web/static/js/solar_time.js');
require('./web/static/js/kairos_calendar.js');
require('./web/static/js/watch.js');
"""

    def _render(self, search=""):
        script = self._STUBS.replace("'SEARCH'", "'" + search + "'") + r"""
const w = global.window.KairosWatch;
w.render();
process.stdout.write(JSON.stringify({
    time: text.time, meta: text.meta, date: text.date,
    loc: w.getLocation(), minimal: w.isMinimal()
}));
"""
        return _node(script)

    def test_renders_only_the_clock(self):
        out = self._render()
        self.assertRegex(out["time"], r"^\d{2}:\d{2}$")
        self.assertFalse(out["minimal"])
        self.assertEqual(out["loc"], {"lat": 53.1503, "lon": 5.8389})

    def test_meta_line_carries_azimuth_and_moon(self):
        out = self._render()
        self.assertIn("☀", out["meta"])
        self.assertIn("°", out["meta"])
        self.assertRegex(out["meta"], r"[🌑-🌘] \d+\.\dd$")

    def test_date_line_is_the_kairos_date(self):
        out = self._render()
        self.assertRegex(out["date"], r"^[A-Za-z]+ · [A-Za-z ]+ \d+ · [A-Za-z]+$")

    def test_minimal_mode_is_a_pure_clock(self):
        out = self._render("?min=1")
        self.assertTrue(out["minimal"])
        self.assertRegex(out["time"], r"^\d{2}:\d{2}$")
        # In minimal mode the captions stay untouched (empty / never written).
        self.assertIsNone(out.get("meta"))
        self.assertIsNone(out.get("date"))

    def test_lat_lon_query_overrides_location(self):
        script = self._STUBS.replace("'SEARCH'", "'?lat=51.5&lon=-0.12'") + r"""
const w = global.window.KairosWatch;
process.stdout.write(JSON.stringify({ loc: w.getLocation() }));
"""
        out = _node(script)
        self.assertEqual(out["loc"], {"lat": 51.5, "lon": -0.12})

    def test_engine_files_are_valid_js(self):
        for js in ["web/static/js/watch.js", "web/static/js/kairos_calendar.js",
                   "web/static/js/solar_time.js", "web/lib/suncalc.js"]:
            proc = subprocess.run(["node", "--check", js], capture_output=True,
                                  text=True, encoding="utf-8", cwd=REPO_ROOT)
            self.assertEqual(proc.returncode, 0, f"{js}: {proc.stderr}")


if __name__ == "__main__":
    unittest.main()
