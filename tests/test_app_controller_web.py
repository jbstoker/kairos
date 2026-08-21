"""Web test: unified kstDisplay panel controller (web/static/js/app_controller.js).

Pins updateUnifiedDisplayPanel(selectedDateTimeState): it binds the
Gregorian anchor to the matrix centre, the active context to the panel
header, the consolidated metric grid (solar longitude, lunar age, planets,
celestial season) and triggers the counter-clockwise canvas redraw with the
orbital radial factors. Runs under node with a minimal DOM stub.
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
        textContent: ''
    };
}
['gregorian-center-clock', 'observed-date-label', 'solar-longitude-val',
 'lunar-age-val', 'active-planets-val', 'celestial-season-val',
 'sun-bead-node', 'moon-bead-node', 'sun-track-vector', 'moon-track-vector']
    .forEach(id => elements[id] = makeEl(id));
global.document = { getElementById: (id) => elements[id] || null };
global.window = global;
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
global.renderCelestialPositions = renderer.renderCelestialPositions;
const app = require('./web/static/js/app_controller.js');

const ts = Date.UTC(2026, 3, 20, 14, 30, 0) / 1000;
const state = app.createSelectedDateTime(ts, { traditionLabel: 'Tartarian · Telluris 9' });
app.updateUnifiedDisplayPanel(state);

const out = {
    centerClock: elements['gregorian-center-clock'].textContent,
    dateLabel: elements['observed-date-label'].textContent,
    solarLongitude: elements['solar-longitude-val'].textContent,
    lunarAge: elements['lunar-age-val'].textContent,
    planets: elements['active-planets-val'].textContent,
    season: elements['celestial-season-val'].textContent,
    sunMoved: elements['sun-bead-node']._attrs.cx !== undefined,
    moonMoved: elements['moon-bead-node']._attrs.cx !== undefined,
    sunRingR: parseFloat(elements['sun-track-vector']._attrs.r),
    moonRingR: parseFloat(elements['moon-track-vector']._attrs.r)
};

// Default context (no state label) falls back to the app's context or the
// observing placeholder.
global.KAIROS_CONTEXT_LABEL = 'Vedic · Ashwina 7';
const defaultState = app.createSelectedDateTime(ts);
app.updateUnifiedDisplayPanel(defaultState);
out.defaultLabel = elements['observed-date-label'].textContent;
delete global.KAIROS_CONTEXT_LABEL;

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

    def test_active_date_context_header(self):
        out = self._run()
        self.assertEqual(out["dateLabel"], "Tartarian · Telluris 9")
        self.assertEqual(out["defaultLabel"], "Vedic · Ashwina 7")

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
        # Rings breathe with the eccentric radial factors (within bounds).
        self.assertTrue(0.98 <= out["sunRingR"] / 160 <= 1.02)
        self.assertTrue(0.94 <= out["moonRingR"] / 280 <= 1.06)


if __name__ == "__main__":
    unittest.main()
