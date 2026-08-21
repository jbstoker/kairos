"""Web test: unified kstDisplay panel controller (web/static/js/app_controller.js).

Pins updateUnifiedDisplayPanel(selectedDateTimeState): it binds the
Gregorian anchor to the matrix centre, the consolidated metric grid (solar
longitude, lunar age, planets, celestial season) and triggers the sky-dome
canvas redraw with the real Sun/Moon altitude + azimuth positions. Runs
under node with a minimal DOM stub.
"""

import json
import os
import shutil
import subprocess
import unittest
from datetime import datetime, timezone

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

requires_node = unittest.skipUnless(shutil.which("node"),
                                    "requires the 'node' runtime")

_NODE_SCRIPT = r"""
const elements = {};
function makeEl(id) {
    const attrs = {};
    return {
        id: id,
        _attrs: attrs,
        setAttribute: (k, v) => { attrs[k] = String(v); },
        getAttribute: (k) => attrs[k] || null,
        addEventListener: () => {},
        style: {},
        textContent: ''
    };
}
['gregorian-center-clock', 'solar-longitude-val',
 'lunar-age-val', 'active-planets-val', 'celestial-season-val',
 'sun-bead', 'moon-bead', 'sun-orbit-line', 'moon-orbit-line']
    .forEach(id => elements[id] = makeEl(id));
global.document = { getElementById: (id) => elements[id] || null };
global.window = global;
// The renderer's optional distance debug log must not pollute stdout JSON.
global.console.debug = () => {};
global.KairosI18n = { t: (k) => (k === 'kst.days' ? 'days' : k), trName: (p, n) => n };

// Fresh KST snapshot the app_controller should read from.
global.__kstData = {
    solar_longitude: 123.4,
    lunar_age: 15.2,
    season: 'Summer',
    planets: { mercury: {}, venus: {}, mars: {} }
};

const engine = require('./web/static/js/astronomy_engine.js');
const renderer = require('./web/static/js/canvas_renderer.js');
global.CelestialMetrics = engine.CelestialMetrics;
global.updatePlanetaryCanvas = renderer.updatePlanetaryCanvas;
const app = require('./web/static/js/app_controller.js');

const ts = Date.UTC(2026, 3, 20, 14, 30, 0) / 1000;
const state = app.createSelectedDateTime(ts, { traditionLabel: 'Tartarian · Telluris 9' });
app.updateUnifiedDisplayPanel(state);

const out = {
    centerClock: elements['gregorian-center-clock'].textContent,
    solarLongitude: elements['solar-longitude-val'].textContent,
    lunarAge: elements['lunar-age-val'].textContent,
    planets: elements['active-planets-val'].textContent,
    season: elements['celestial-season-val'].textContent,
    sunMoved: elements['sun-bead']._attrs.cx !== undefined,
    moonMoved: elements['moon-bead']._attrs.cx !== undefined,
    sunRingRx: parseFloat(elements['sun-orbit-line']._attrs.rx),
    sunRingRy: parseFloat(elements['sun-orbit-line']._attrs.ry),
    moonRingRx: parseFloat(elements['moon-orbit-line']._attrs.rx)
};

process.stdout.write(JSON.stringify(out));
process.exit(0);
"""


@requires_node
class TestAppControllerWeb(unittest.TestCase):
    def _run(self):
        proc = subprocess.run(["node", "-e", _NODE_SCRIPT],
                              capture_output=True, text=True,
                              encoding="utf-8", cwd=REPO_ROOT)
        if proc.returncode != 0:
            raise AssertionError(f"node failed: {proc.stderr}")
        return json.loads(proc.stdout)

    def test_gregorian_anchor_bound_to_centre(self):
        out = self._run()
        ts = datetime(2026, 4, 20, 14, 30, 0, tzinfo=timezone.utc).timestamp()
        expected = datetime.fromtimestamp(ts).strftime("%H:%M")  # local, like the browser
        self.assertEqual(out["centerClock"], expected)

    def test_metadata_grid_from_snapshot(self):
        out = self._run()
        self.assertEqual(out["solarLongitude"], "123.4°")
        self.assertEqual(out["lunarAge"], "15.2 days")
        self.assertEqual(out["planets"], "mercury, venus, mars")
        self.assertEqual(out["season"], "Summer")

    def test_counter_clockwise_redraw_triggered(self):
        out = self._run()
        self.assertTrue(out["sunMoved"])
        self.assertTrue(out["moonMoved"])
        # Sun ellipse breathes with the eccentric radial factor (within bounds)
        # and ry keeps the solar eccentricity ratio.
        self.assertTrue(0.98 <= out["sunRingRx"] / 165 <= 1.02)
        self.assertAlmostEqual(out["sunRingRy"], out["sunRingRx"] * (1 - 0.0167), places=4)
        # Moon ellipse breathes within its envelope (allowing the node offset).
        self.assertTrue(0.80 <= out["moonRingRx"] / 285 <= 1.20)


if __name__ == "__main__":
    unittest.main()
