"""Web test: concentric observation matrix geometry.

Pins the counter-clockwise orbit layout (web/static/js/astronomy_engine.js +
web/static/js/canvas_renderer.js): Noon at the top (0 rad), Sunrise right
(+π/2), Night bottom (π), Sunset left (−π/2); the radial distance factors
breathe within the perihelion/aphelion (Sun) and perigee/apogee (Moon)
envelopes; and when the bodies share an angular vector the layout exposes
the eclipse geometry.

Runs under node with a minimal DOM stub, like the other web tests.
"""

import json
import math
import os
import shutil
import subprocess
import unittest

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
['sun-bead-node', 'moon-bead-node', 'sun-track-vector', 'moon-track-vector',
 'gregorian-center-clock']
    .forEach(id => elements[id] = makeEl(id));
global.document = { getElementById: (id) => elements[id] || null };
global.window = global;

const engine = require('./web/static/js/astronomy_engine.js');
const renderer = require('./web/static/js/canvas_renderer.js');
const m = new engine.CelestialMetrics(0);

// Apparent solar noon for a UTC date, using the engine's own equation of time.
function solarNoonUTC(y, mo, d) {
    const noon = Date.UTC(y, mo - 1, d, 12, 0, 0) / 1000;
    const eotHours = m.equationOfTimeMinutes(m.dayOfYearUTC(noon)) / 60;
    return noon - eotHours * 3600;
}

const noon = solarNoonUTC(2026, 3, 20);
const out = {
    angles: {
        sunNoon: m.getSunAngle(noon),
        sunSunrise: m.getSunAngle(noon - 6 * 3600),
        sunNight: m.getSunAngle(noon - 12 * 3600),
        sunSunset: m.getSunAngle(noon + 6 * 3600)
    },
    radialBounds: {
        sun: m.getSunRadialFactor(noon),
        moon: m.getMoonRadialFactor(noon)
    },
    newMoon: { sun: m.getSunAngle(947182440), moon: m.getMoonAngle(947182440) },
    fullMoon: {
        sun: m.getSunAngle(947182440 + 14.765294335 * 86400),
        moon: m.getMoonAngle(947182440 + 14.765294335 * 86400)
    }
};

// Renderer: sun at Noon (0), moon at Sunrise (+π/2), factor 1.0.
renderer.renderCelestialPositions(0, 1.0, Math.PI / 2, 1.0);
out.frame1 = {
    sunX: parseFloat(elements['sun-bead-node']._attrs.cx),
    sunY: parseFloat(elements['sun-bead-node']._attrs.cy),
    moonX: parseFloat(elements['moon-bead-node']._attrs.cx),
    moonY: parseFloat(elements['moon-bead-node']._attrs.cy),
    sunR: parseFloat(elements['sun-track-vector']._attrs.r),
    moonR: parseFloat(elements['moon-track-vector']._attrs.r)
};

// Breathing: sun factor 1.02, moon factor 0.945 — same ray (eclipse geometry).
renderer.renderCelestialPositions(Math.PI / 2, 1.02, Math.PI / 2, 0.945);
out.frame2 = {
    sunX: parseFloat(elements['sun-bead-node']._attrs.cx),
    moonX: parseFloat(elements['moon-bead-node']._attrs.cx),
    sunR: parseFloat(elements['sun-track-vector']._attrs.r),
    moonR: parseFloat(elements['moon-track-vector']._attrs.r)
};

process.stdout.write(JSON.stringify(out));
process.exit(0);
"""

@requires_node
class TestConcentricWeb(unittest.TestCase):
    def _run(self):
        proc = subprocess.run(["node", "-e", _NODE_SCRIPT],
                              capture_output=True, text=True, cwd=REPO_ROOT)
        if proc.returncode != 0:
            raise AssertionError(f"node failed: {proc.stderr}")
        return json.loads(proc.stdout)

    def test_angle_cardinal_mapping(self):
        """Noon=top(0), Sunrise=right(+π/2), Night=bottom(π), Sunset=left(−π/2)."""
        out = self._run()
        self.assertAlmostEqual(out["angles"]["sunNoon"], 0.0, places=6)
        self.assertAlmostEqual(out["angles"]["sunSunrise"], math.pi / 2, places=6)
        self.assertAlmostEqual(abs(out["angles"]["sunNight"]), math.pi, places=6)
        self.assertAlmostEqual(out["angles"]["sunSunset"], -math.pi / 2, places=6)

    def test_radial_factors_in_bounds(self):
        out = self._run()
        self.assertTrue(0.98 <= out["radialBounds"]["sun"] <= 1.02)
        self.assertTrue(0.94 <= out["radialBounds"]["moon"] <= 1.06)

    def test_new_moon_shares_the_sun_ray(self):
        out = self._run()
        self.assertAlmostEqual(out["newMoon"]["sun"], out["newMoon"]["moon"], places=6)

    def test_full_moon_opposes_the_sun(self):
        out = self._run()
        separation = abs(((out["fullMoon"]["moon"] - out["fullMoon"]["sun"] + math.pi)
                          % (2 * math.pi)) - math.pi)
        self.assertAlmostEqual(separation, math.pi, places=3)

    def test_renderer_cardinal_positions(self):
        out = self._run()
        # Sun at angle 0 → top (400, 240); Moon at +π/2 → right (680, 400).
        self.assertAlmostEqual(out["frame1"]["sunX"], 400.0, places=6)
        self.assertAlmostEqual(out["frame1"]["sunY"], 240.0, places=6)
        self.assertAlmostEqual(out["frame1"]["moonX"], 680.0, places=6)
        self.assertAlmostEqual(out["frame1"]["moonY"], 400.0, places=6)
        self.assertAlmostEqual(out["frame1"]["sunR"], 160.0, places=6)
        self.assertAlmostEqual(out["frame1"]["moonR"], 280.0, places=6)

    def test_renderer_breathes_tracks(self):
        out = self._run()
        self.assertAlmostEqual(out["frame2"]["sunR"], 160.0 * 1.02, places=6)
        self.assertAlmostEqual(out["frame2"]["moonR"], 280.0 * 0.945, places=6)

    def test_renderer_same_ray_exposes_eclipse_geometry(self):
        out = self._run()
        # Both bodies on the same ray (π/2): the moon sits farther out on the
        # same horizontal axis than the sun — eclipse geometry via breathing.
        self.assertAlmostEqual(out["frame2"]["moonX"], 280.0 * 0.945 + 400.0, places=6)
        self.assertAlmostEqual(out["frame2"]["sunX"], 160.0 * 1.02 + 400.0, places=6)


if __name__ == "__main__":
    unittest.main()

