"""Web test: true elliptical orbits + eclipse detection.

Pins the celestial layout (web/static/js/astronomy_engine.js +
web/static/js/canvas_renderer.js) on the true axis: facing south, the sun
rises in the east — Midnight at the bottom (0 rad), Sunrise LEFT (π/2),
Noon at the top (π), Sunset RIGHT (3π/2). Sun/Moon distances derive from
the true eccentricities (1 − e·cos θ) so the <ellipse> tracks and beads
breathe together; when the bodies align AND the Moon is at a node an
eclipse is detected with glowing-bead + status feedback.

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
    const classes = new Set();
    return {
        id: id,
        _attrs: attrs,
        _classes: classes,
        setAttribute: (k, v) => { attrs[k] = String(v); },
        getAttribute: (k) => attrs[k] || null,
        addEventListener: () => {},
        classList: {
            add: (c) => classes.add(c),
            remove: (c) => classes.delete(c),
            contains: (c) => classes.has(c),
            toggle: (c) => classes.has(c) ? classes.delete(c) : classes.add(c)
        },
        style: {},
        textContent: ''
    };
}
['sun-orbit-line', 'moon-orbit-line', 'sun-bead', 'moon-bead',
 'gregorian-center-clock', 'eclipse-status']
    .forEach(id => elements[id] = makeEl(id));
global.document = { getElementById: (id) => elements[id] || null };
global.window = global;
// The renderer's optional distance debug log must not pollute stdout JSON.
global.console.debug = () => {};

const engine = require('./web/static/js/astronomy_engine.js');
const renderer = require('./web/static/js/canvas_renderer.js');
const m = new engine.CelestialMetrics(0);

// The dial reads the LOCAL wall clock, so build the cardinal instants from
// the local clock too — timezone-independent (every machine's own midnight).
const d0 = new Date(); d0.setHours(0, 0, 0, 0);
const d6 = new Date(d0); d6.setHours(6, 0, 0, 0);
const d12 = new Date(d0); d12.setHours(12, 0, 0, 0);
const d18 = new Date(d0); d18.setHours(18, 0, 0, 0);
const probe = d0.getTime() / 1000;
const out = {
    angles: {
        sunMidnight: m.getSunAngle(d0.getTime() / 1000),
        sunSunrise: m.getSunAngle(d6.getTime() / 1000),
        sunNoon: m.getSunAngle(d12.getTime() / 1000),
        sunSunset: m.getSunAngle(d18.getTime() / 1000)
    },
    nodeAngle: {
        value: m.moonNodeAngleRadians(probe),
        isFinite: isFinite(m.moonNodeAngleRadians(probe)),
        boolAgrees: (Math.abs(m.moonNodeAngleRadians(probe)) * 180 / Math.PI < 12)
            === m.isMoonAtLunarNode(probe)
    }
};

// Frame: sun Midnight (0 rad → bottom), moon Sunrise (π/2 → left).
// Not aligned → no eclipse.
renderer.updatePlanetaryCanvas(0, 0.0167, Math.PI / 2, 0.0549, 0.5, '14:30');
out.frame1 = {
    sunRx: parseFloat(elements['sun-orbit-line']._attrs.rx),
    sunRy: parseFloat(elements['sun-orbit-line']._attrs.ry),
    moonRx: parseFloat(elements['moon-orbit-line']._attrs.rx),
    moonRy: parseFloat(elements['moon-orbit-line']._attrs.ry),
    sunX: parseFloat(elements['sun-bead']._attrs.cx),
    sunY: parseFloat(elements['sun-bead']._attrs.cy),
    moonX: parseFloat(elements['moon-bead']._attrs.cx),
    moonY: parseFloat(elements['moon-bead']._attrs.cy),
    clock: elements['gregorian-center-clock'].textContent,
    sunFill: elements['sun-bead']._attrs.fill,
    sunR: elements['sun-bead']._attrs.r,
    moonFill: elements['moon-bead']._attrs.fill,
    moonR: elements['moon-bead']._attrs.r,
    status: elements['eclipse-status'].textContent
};

// Eclipse: aligned (Δ=0.005 rad) AND at node (0.05 rad).
renderer.updatePlanetaryCanvas(0, 0.0167, 0.005, 0.0549, 0.05, 'x');
out.eclipse = {
    sunFill: elements['sun-bead']._attrs.fill,
    sunR: elements['sun-bead']._attrs.r,
    moonFill: elements['moon-bead']._attrs.fill,
    moonR: elements['moon-bead']._attrs.r,
    statusText: elements['eclipse-status'].textContent,
    active: elements['eclipse-status']._classes.has('active')
};

// Aligned but NOT at a node → no eclipse.
renderer.updatePlanetaryCanvas(0, 0.0167, 0.005, 0.0549, 0.5, 'x');
out.alignedNotNode = {
    sunFill: elements['sun-bead']._attrs.fill,
    sunR: elements['sun-bead']._attrs.r,
    statusText: elements['eclipse-status'].textContent,
    active: elements['eclipse-status']._classes.has('active')
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
        """Midnight=bottom(0), Sunrise=left(π/2), Noon=top(π), Sunset=right(3π/2)."""
        out = self._run()
        self.assertAlmostEqual(out["angles"]["sunNoon"], math.pi, places=6)
        self.assertAlmostEqual(out["angles"]["sunSunrise"], math.pi / 2, places=6)
        # Midnight is 0 rad (bottom) — the engine returns 0 or 2π−ε on one
        # side of the day boundary.
        night = out["angles"]["sunMidnight"] % (2 * math.pi)
        self.assertAlmostEqual(min(night, 2 * math.pi - night), 0.0, places=6)
        self.assertAlmostEqual(out["angles"]["sunSunset"], 3 * math.pi / 2, places=6)

    def test_moon_node_angle(self):
        out = self._run()
        self.assertTrue(out["nodeAngle"]["isFinite"])
        self.assertTrue(out["nodeAngle"]["boolAgrees"])

    def test_elliptical_distance_and_bead_lock(self):
        out = self._run()
        # At θ=0 (midnight): sunDistance = 1 − 0.0167 → rx=165·(1−0.0167),
        # ry=rx·(1−0.0167); the bead sits BOTTOM on the new celestial axis.
        self.assertAlmostEqual(out["frame1"]["sunRx"], 165 * (1 - 0.0167), places=4)
        self.assertAlmostEqual(out["frame1"]["sunRy"],
                               165 * (1 - 0.0167) ** 2, places=4)
        self.assertAlmostEqual(out["frame1"]["sunX"], 400.0, places=4)
        self.assertAlmostEqual(out["frame1"]["sunY"],
                               400 + 165 * (1 - 0.0167) ** 2, places=4)
        # Moon at +π/2 (sunrise): cos=0 → distance=1 → rx=285, ry=285·(1−0.0549);
        # the bead sits LEFT (east) on the true celestial axis.
        self.assertAlmostEqual(out["frame1"]["moonRx"], 285.0, places=4)
        self.assertAlmostEqual(out["frame1"]["moonRy"], 285 * (1 - 0.0549), places=4)
        self.assertAlmostEqual(out["frame1"]["moonX"], 115.0, places=4)
        self.assertAlmostEqual(out["frame1"]["moonY"], 400.0, places=4)
        # Beads sit on their ellipses.
        sx = (out["frame1"]["sunX"] - 400) / out["frame1"]["sunRx"]
        sy = (out["frame1"]["sunY"] - 400) / out["frame1"]["sunRy"]
        self.assertAlmostEqual(sx * sx + sy * sy, 1.0, places=4)

    def test_no_eclipse_when_not_aligned(self):
        out = self._run()
        self.assertEqual(out["frame1"]["sunFill"], "#f39c12")
        self.assertEqual(out["frame1"]["sunR"], "16")
        self.assertEqual(out["frame1"]["moonFill"], "#ecf0f1")
        self.assertEqual(out["frame1"]["moonR"], "11")
        self.assertEqual(out["frame1"]["status"], "")

    def test_eclipse_detected_when_aligned_and_at_node(self):
        out = self._run()
        self.assertEqual(out["eclipse"]["sunFill"], "#ff6b35")
        self.assertEqual(out["eclipse"]["sunR"], "20")
        self.assertEqual(out["eclipse"]["moonFill"], "#8b0000")
        self.assertEqual(out["eclipse"]["moonR"], "14")
        self.assertEqual(out["eclipse"]["statusText"], "🌑 ECLIPSE IN PROGRESS")
        self.assertTrue(out["eclipse"]["active"])

    def test_no_eclipse_when_aligned_but_not_at_node(self):
        out = self._run()
        self.assertEqual(out["alignedNotNode"]["sunFill"], "#f39c12")
        self.assertEqual(out["alignedNotNode"]["sunR"], "16")
        self.assertEqual(out["alignedNotNode"]["statusText"], "")
        self.assertFalse(out["alignedNotNode"]["active"])

    def test_center_clock_bound(self):
        out = self._run()
        self.assertEqual(out["frame1"]["clock"], "14:30")


if __name__ == "__main__":
    unittest.main()

