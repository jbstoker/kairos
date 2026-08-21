"""Web test: elliptical observation matrix geometry.

Pins the counter-clockwise layout (web/static/js/astronomy_engine.js +
web/static/js/canvas_renderer.js): Noon at the top (0 rad), Sunrise right
(+π/2), Night bottom (π), Sunset left (−π/2); the TRUE <ellipse> orbits
stretch rx/ry dynamically with the eccentric radial factors; the beads stay
locked on their rings; and the 3D Tilt Node Filter decorrelates the Moon's
ring when it is NOT at a lunar node (preventing false monthly overlaps).

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
['sun-orbit-line', 'moon-orbit-line', 'sun-bead', 'moon-bead',
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
    lunarNode: {
        now: m.isMoonAtLunarNode(Date.now() / 1000),
        isBoolean: typeof m.isMoonAtLunarNode(noon) === 'boolean'
    }
};

// Sun at Noon (0), Moon at Sunrise (+π/2), factors 1.0, NOT at a node.
renderer.updatePlanetaryCanvas(0, 1.0, Math.PI / 2, 1.0, false, '14:30');
out.frame1 = {
    sunRx: parseFloat(elements['sun-orbit-line']._attrs.rx),
    sunRy: parseFloat(elements['sun-orbit-line']._attrs.ry),
    moonRx: parseFloat(elements['moon-orbit-line']._attrs.rx),
    moonRy: parseFloat(elements['moon-orbit-line']._attrs.ry),
    sunX: parseFloat(elements['sun-bead']._attrs.cx),
    sunY: parseFloat(elements['sun-bead']._attrs.cy),
    moonX: parseFloat(elements['moon-bead']._attrs.cx),
    moonY: parseFloat(elements['moon-bead']._attrs.cy),
    clock: elements['gregorian-center-clock'].textContent
};

// Node filter: at new-moon alignment Δ=0 → offset 0; at a node → offset 0.
renderer.updatePlanetaryCanvas(0, 1.0, 0, 1.0, false, 'x');
out.aligned = parseFloat(elements['moon-orbit-line']._attrs.rx);
renderer.updatePlanetaryCanvas(0, 1.0, 0, 1.0, true, 'x');
out.atNode = parseFloat(elements['moon-orbit-line']._attrs.rx);

// Breathing: sun factor 1.017, moon factor 0.945, offset active (Δ=π/2).
renderer.updatePlanetaryCanvas(0, 1.017, Math.PI / 2, 0.945, false, 'x');
out.frame2 = {
    sunRx: parseFloat(elements['sun-orbit-line']._attrs.rx),
    sunRy: parseFloat(elements['sun-orbit-line']._attrs.ry),
    moonRx: parseFloat(elements['moon-orbit-line']._attrs.rx)
};

process.stdout.write(JSON.stringify(out));
process.exit(0);
"""

@requires_node
class TestEllipticalMatrixWeb(unittest.TestCase):
    def _run(self):
        proc = subprocess.run(["node", "-e", _NODE_SCRIPT],
                              capture_output=True, text=True,
                              encoding="utf-8", cwd=REPO_ROOT)
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

    def test_lunar_node_flag_is_boolean(self):
        out = self._run()
        self.assertTrue(out["lunarNode"]["isBoolean"])

    def test_ellipse_structure_and_bead_lock(self):
        out = self._run()
        # Sun ellipse: rx=165, ry=165*(1−0.0167); bead at top of the ellipse.
        self.assertAlmostEqual(out["frame1"]["sunRx"], 165.0, places=4)
        self.assertAlmostEqual(out["frame1"]["sunRy"], 165.0 * (1 - 0.0167), places=4)
        self.assertAlmostEqual(out["frame1"]["sunX"], 400.0, places=4)
        self.assertAlmostEqual(out["frame1"]["sunY"], 400 - 165.0 * (1 - 0.0167), places=4)
        # Bead sits on the ellipse: (x−400)²/rx² + (y−400)²/ry² = 1.
        sx = (out["frame1"]["sunX"] - 400) / out["frame1"]["sunRx"]
        sy = (out["frame1"]["sunY"] - 400) / out["frame1"]["sunRy"]
        self.assertAlmostEqual(sx * sx + sy * sy, 1.0, places=4)

    def test_node_filter_offsets_moon_ring(self):
        out = self._run()
        # Δ=π/2, not at a node → nodeOffset=25 → moonRx = 285 + 25.
        self.assertAlmostEqual(out["frame1"]["moonRx"], 285 + 25, places=4)
        self.assertAlmostEqual(out["frame1"]["moonRy"],
                               285 * (1 - 0.0549) + 25, places=4)
        # At alignment (Δ=0) the offset is 0 → moonRx = 285.
        self.assertAlmostEqual(out["aligned"], 285.0, places=4)
        # At a lunar node the filter is disabled → moonRx = 285.
        self.assertAlmostEqual(out["atNode"], 285.0, places=4)

    def test_center_clock_bound(self):
        out = self._run()
        self.assertEqual(out["frame1"]["clock"], "14:30")

    def test_elliptical_breathing(self):
        out = self._run()
        self.assertAlmostEqual(out["frame2"]["sunRx"], 165 * 1.017, places=4)
        self.assertAlmostEqual(out["frame2"]["sunRy"],
                               165 * (1 - 0.0167) * 1.017, places=4)
        self.assertAlmostEqual(out["frame2"]["moonRx"], 285 * 0.945 + 25, places=4)


if __name__ == "__main__":
    unittest.main()

