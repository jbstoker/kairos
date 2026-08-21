"""Web test: true sky positions (altitude + azimuth) + eclipse detection.

Pins the sky-dome layout (web/static/js/astronomy_engine.js +
web/static/js/canvas_renderer.js) on the true celestial axis: facing south,
Midnight at the bottom (az 0°), Sunrise LEFT (az 90°), Noon at the top
(az 180°), Sunset RIGHT (az 270°). Altitude maps the beads from the horizon
ring to the zenith at the centre; when the bodies share an azimuth AND the
Moon is at a node an eclipse is detected with glowing-bead + status
feedback. Without SunCalc the engine falls back to the dial (altitude 0,
azimuth = local day fraction × 360).

Runs under node with a minimal DOM stub, like the other web tests.
"""

import json
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
    positions: {
        sunMidnight: m.getSunPositionDeg(d0.getTime() / 1000),
        sunSunrise: m.getSunPositionDeg(d6.getTime() / 1000),
        sunNoon: m.getSunPositionDeg(d12.getTime() / 1000),
        sunSunset: m.getSunPositionDeg(d18.getTime() / 1000),
        moon: m.getMoonPositionDeg(probe)
    },
    nodeAngle: {
        value: m.moonNodeAngleRadians(probe),
        isFinite: isFinite(m.moonNodeAngleRadians(probe)),
        boolAgrees: (Math.abs(m.moonNodeAngleRadians(probe)) * 180 / Math.PI < 12)
            === m.isMoonAtLunarNode(probe)
    }
};

// Frame: sun on the horizon at azimuth 90 (east/LEFT), moon at altitude 45
// azimuth 180 (south/TOP). Different azimuths → not aligned → no eclipse.
renderer.updatePlanetaryCanvas(0, 90, 45, 180, 0.5, '14:30');
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

// Eclipse: shared azimuth (Δ=0°) AND at node (0.05 rad).
renderer.updatePlanetaryCanvas(0, 180, 0, 180, 0.05, 'x');
out.eclipse = {
    sunFill: elements['sun-bead']._attrs.fill,
    sunR: elements['sun-bead']._attrs.r,
    moonFill: elements['moon-bead']._attrs.fill,
    moonR: elements['moon-bead']._attrs.r,
    statusText: elements['eclipse-status'].textContent,
    active: elements['eclipse-status']._classes.has('active')
};

// Aligned but NOT at a node → no eclipse.
renderer.updatePlanetaryCanvas(0, 180, 0, 180, 0.5, 'x');
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
class TestSkyDomeWeb(unittest.TestCase):
    def _run(self):
        proc = subprocess.run(["node", "-e", _NODE_SCRIPT],
                              capture_output=True, text=True,
                              encoding="utf-8", cwd=REPO_ROOT)
        if proc.returncode != 0:
            raise AssertionError(f"node failed: {proc.stderr}")
        return json.loads(proc.stdout)

    def test_azimuth_cardinal_mapping(self):
        """Fallback dial (no SunCalc in node): midnight=north/bottom(0°),
        sunrise=east/LEFT(90°), noon=south/TOP(180°), sunset=west/RIGHT(270°),
        all at altitude 0 on the horizon ring."""
        out = self._run()
        pos = out["positions"]
        self.assertAlmostEqual(pos["sunNoon"]["azimuthDeg"], 180.0, places=6)
        self.assertAlmostEqual(pos["sunSunrise"]["azimuthDeg"], 90.0, places=6)
        # Midnight is 0° (bottom) — the engine returns 0 or 360−ε.
        night = pos["sunMidnight"]["azimuthDeg"] % 360
        self.assertAlmostEqual(min(night, 360 - night), 0.0, places=6)
        self.assertAlmostEqual(pos["sunSunset"]["azimuthDeg"], 270.0, places=6)
        for key in ("sunMidnight", "sunSunrise", "sunNoon", "sunSunset"):
            self.assertAlmostEqual(pos[key]["altitudeDeg"], 0.0, places=6)
        # Moon fallback: altitude 0, finite azimuth within one turn.
        self.assertAlmostEqual(pos["moon"]["altitudeDeg"], 0.0, places=6)
        self.assertTrue(0.0 <= pos["moon"]["azimuthDeg"] < 360.0)

    def test_moon_node_angle(self):
        out = self._run()
        self.assertTrue(out["nodeAngle"]["isFinite"])
        self.assertTrue(out["nodeAngle"]["boolAgrees"])

    def test_altitude_azimuth_bead_placement(self):
        out = self._run()
        f = out["frame1"]
        # Sun alt 0 az 90 (east/LEFT): on the sun's horizon ring, far left.
        self.assertAlmostEqual(f["sunRx"], 165.0, places=4)
        self.assertAlmostEqual(f["sunRy"], 165 * (1 - 0.0167), places=4)
        self.assertAlmostEqual(f["sunX"], 400.0 - 165.0, places=4)   # 235
        self.assertAlmostEqual(f["sunY"], 400.0, places=4)
        # Moon alt 45 az 180 (south/TOP): halfway from the moon band to the
        # zenith → dist = 285·(1 − 45/90) = 142.5, straight up.
        self.assertAlmostEqual(f["moonRx"], 285.0, places=4)
        self.assertAlmostEqual(f["moonRy"], 285 * (1 - 0.0549), places=4)
        self.assertAlmostEqual(f["moonX"], 400.0, places=4)
        self.assertAlmostEqual(f["moonY"], 400.0 - 142.5, places=4)
        # Beads stay inside the 800×800 viewport.
        for x, y in ((f["sunX"], f["sunY"]), (f["moonX"], f["moonY"])):
            self.assertTrue(0 <= x <= 800 and 0 <= y <= 800)

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

