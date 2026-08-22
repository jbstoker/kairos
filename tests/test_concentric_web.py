"""Web test: true sky positions (altitude + azimuth) + eclipse detection.

Pins the sky-dome layout (web/static/js/astronomy_engine.js +
web/static/js/canvas_renderer.js) on the true celestial axis: facing south,
Midnight at the bottom (az 0°), Sunrise LEFT (az 90°), Noon at the top
(az 180°), Sunset RIGHT (az 270°). Altitude maps both bodies from the SHARED
horizon ring (the outer ring) to the zenith at the centre, so bodies sharing
a sky position overlap; when the bodies share an azimuth AND the Moon is
near a node an eclipse (including partial ones) is detected with glowing-bead
+ status feedback. A real eclipse (2026-08-12, Wergea) pins the overlap.
Without SunCalc the engine falls back to the dial (altitude 0, azimuth =
local day fraction × 360).

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
 'gregorian-center-clock', 'eclipse-status',
 'twilight-glow', 'sunrise-countdown']
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

// Below-horizon: bodies clamp to the wheel edge and render as dimmed ghosts.
// Moon alt -20 → clamped to 0° → dist 280, az 90 → far LEFT (x 120).
renderer.updatePlanetaryCanvas(10, 180, -20, 90, 0.5, 'x');
out.ghostMoon = {
    moonX: parseFloat(elements['moon-bead']._attrs.cx),
    moonY: parseFloat(elements['moon-bead']._attrs.cy),
    moonOpacity: elements['moon-bead']._attrs.opacity,
    moonStroke: elements['moon-bead']._attrs.stroke,
    sunOpacity: elements['sun-bead']._attrs.opacity,
    sunStroke: elements['sun-bead']._attrs.stroke
};

// Sun alt -5 → clamped to 0° → dist 280, az 90 → far LEFT (x 120); moon lit.
renderer.updatePlanetaryCanvas(-5, 90, 30, 180, 0.5, 'x');
out.ghostSun = {
    sunX: parseFloat(elements['sun-bead']._attrs.cx),
    sunOpacity: elements['sun-bead']._attrs.opacity,
    sunStroke: elements['sun-bead']._attrs.stroke,
    moonOpacity: elements['moon-bead']._attrs.opacity,
    moonStroke: elements['moon-bead']._attrs.stroke
};

// Twilight + countdown: sun alt -3° → civil twilight glow + "Sunrise in 12 min".
renderer.updatePlanetaryCanvas(-3, 180, 30, 90, 0.5, 'x');
out.twilight = {
    stroke: elements['twilight-glow']._attrs.stroke,
    opacity: elements['twilight-glow']._attrs.opacity,
    countdownText: elements['sunrise-countdown'].textContent,
    countdownDisplay: elements['sunrise-countdown'].style.display
};

// Night: sun alt -15° → no glow, but the sunrise countdown still shows.
renderer.updatePlanetaryCanvas(-15, 180, 30, 90, 0.5, 'x');
out.night = {
    opacity: elements['twilight-glow']._attrs.opacity,
    countdownText: elements['sunrise-countdown'].textContent,
    countdownDisplay: elements['sunrise-countdown'].style.display
};

// Day: sun alt 10° → no glow, no countdown.
renderer.updatePlanetaryCanvas(10, 180, 30, 90, 0.5, 'x');
out.day = {
    opacity: elements['twilight-glow']._attrs.opacity,
    countdownDisplay: elements['sunrise-countdown'].style.display
};

// Nautical twilight: sun alt -9° → intensity = (-9+12)/6 = 0.5 → alpha 0.075.
renderer.updatePlanetaryCanvas(-9, 180, 30, 90, 0.5, 'x');
out.nautical = {
    stroke: elements['twilight-glow']._attrs.stroke,
    opacity: elements['twilight-glow']._attrs.opacity
};

// Nautical floor: sun alt -12° → intensity 0 → glow off.
renderer.updatePlanetaryCanvas(-12, 180, 30, 90, 0.5, 'x');
out.nauticalEdge = {
    stroke: elements['twilight-glow']._attrs.stroke,
    opacity: elements['twilight-glow']._attrs.opacity
};

// Real eclipse: the 2026-08-12 partial solar eclipse (89%) at Wergea,
// Friesland (53.1503N, 5.8389E) — maximum 20:09 CEST. The beads must overlap
// and the eclipse status must light up. (Loaded into `global` directly — no
// top-level `const` — so the earlier positions block still tests the fallback.)
global.SunCalc = require('./web/lib/suncalc.js');
const eclipseMetrics = new engine.CelestialMetrics(5.8389, 53.1503);
const eclipseT = new Date(2026, 7, 12, 20, 9, 0).getTime() / 1000;   // 20:09 CEST
const sunE = eclipseMetrics.getSunPositionDeg(eclipseT);
const moonE = eclipseMetrics.getMoonPositionDeg(eclipseT);
renderer.updatePlanetaryCanvas(sunE.altitudeDeg, sunE.azimuthDeg,
    moonE.altitudeDeg, moonE.azimuthDeg,
    eclipseMetrics.moonNodeAngleRadians(eclipseT), '20:09');
out.eclipseReal = {
    sun: sunE, moon: moonE,
    sunX: parseFloat(elements['sun-bead']._attrs.cx),
    sunY: parseFloat(elements['sun-bead']._attrs.cy),
    moonX: parseFloat(elements['moon-bead']._attrs.cx),
    moonY: parseFloat(elements['moon-bead']._attrs.cy),
    status: elements['eclipse-status'].textContent,
    sunFill: elements['sun-bead']._attrs.fill,
    sunR: elements['sun-bead']._attrs.r
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
        # Sun alt 0 az 90 (east/LEFT): on the SHARED horizon ring (the degree
        # wheel edge), far left.
        self.assertAlmostEqual(f["sunRx"], 165.0, places=4)
        self.assertAlmostEqual(f["sunRy"], 165 * (1 - 0.0167), places=4)
        self.assertAlmostEqual(f["sunX"], 400.0 - 280.0, places=4)   # 120
        self.assertAlmostEqual(f["sunY"], 400.0, places=4)
        # Moon alt 45 az 180 (south/TOP): halfway from the moon band to the
        # zenith → dist = 280·(1 − 45/90) = 140, straight up.
        self.assertAlmostEqual(f["moonRx"], 285.0, places=4)
        self.assertAlmostEqual(f["moonRy"], 285 * (1 - 0.0549), places=4)
        self.assertAlmostEqual(f["moonX"], 400.0, places=4)
        self.assertAlmostEqual(f["moonY"], 400.0 - 140.0, places=4)
        # Beads stay inside the 800×800 viewport.
        for x, y in ((f["sunX"], f["sunY"]), (f["moonX"], f["moonY"])):
            self.assertTrue(0 <= x <= 800 and 0 <= y <= 800)

    def test_below_horizon_clamps_to_wheel_and_ghosts(self):
        """Bodies below the horizon clamp to the wheel edge (alt 0° → dist 280)
        instead of drifting outside, and render as dimmed ghost beads."""
        out = self._run()
        g = out["ghostMoon"]
        # Moon alt -20° clamps to 0° → dist 280 at az 90 (east/LEFT).
        self.assertAlmostEqual(g["moonX"], 400.0 - 280.0, places=4)
        self.assertAlmostEqual(g["moonY"], 400.0, places=4)
        self.assertEqual(g["moonOpacity"], "0.3")   # ghost
        self.assertEqual(g["moonStroke"], "#555")
        # Sun alt 10° stays above the horizon → fully lit.
        self.assertEqual(g["sunOpacity"], "0.9")
        self.assertEqual(g["sunStroke"], "#fff")
        s = out["ghostSun"]
        self.assertAlmostEqual(s["sunX"], 400.0 - 280.0, places=4)
        self.assertEqual(s["sunOpacity"], "0.3")
        self.assertEqual(s["sunStroke"], "#555")
        self.assertEqual(s["moonOpacity"], "0.9")
        self.assertEqual(s["moonStroke"], "#fff")

    def test_twilight_glow_and_sunrise_countdown(self):
        """Civil twilight lights the horizon glow and shows the sunrise
        countdown; night and day show neither."""
        out = self._run()
        tw = out["twilight"]
        # Sun alt -3°: intensity = 1 + (-3/6) = 0.5 → alpha 0.125, ring lit.
        self.assertEqual(tw["opacity"], "1")
        self.assertEqual(tw["stroke"], "rgba(255, 200, 100, 0.125)")
        # 3° at ~0.25°/min → 12 minutes.
        self.assertEqual(tw["countdownText"], "☀️ Sunrise in 12 min")
        self.assertEqual(tw["countdownDisplay"], "block")
        # Night (sun < -12°): no glow, but the sunrise countdown still shows.
        self.assertEqual(out["night"]["opacity"], "0")
        self.assertEqual(out["night"]["countdownText"], "☀️ Sunrise in 60 min")   # 15 / 0.25
        self.assertEqual(out["night"]["countdownDisplay"], "block")
        # Day (sun > 0°): no glow, countdown hidden.
        self.assertEqual(out["day"]["opacity"], "0")
        self.assertEqual(out["day"]["countdownDisplay"], "none")
        # Nautical twilight (alt -9°): intensity 0.5 → darker amber, alpha 0.075.
        self.assertEqual(out["nautical"]["opacity"], "1")
        self.assertEqual(out["nautical"]["stroke"], "rgba(255, 180, 80, 0.075)")
        # Nautical floor (alt -12°): intensity 0 → glow off.
        self.assertEqual(out["nauticalEdge"]["opacity"], "0")
        self.assertEqual(out["nauticalEdge"]["stroke"], "rgba(255, 180, 80, 0.000)")

    def test_no_eclipse_when_not_aligned(self):
        out = self._run()
        self.assertEqual(out["frame1"]["sunFill"], "#f39c12")
        self.assertEqual(out["frame1"]["sunR"], "16")
        self.assertEqual(out["frame1"]["moonFill"], "#ecf0f1")
        self.assertEqual(out["frame1"]["moonR"], "11")
        self.assertEqual(out["frame1"]["status"], "")

    def test_real_eclipse_aug_12_2026_overlaps(self):
        """The 2026-08-12 partial solar eclipse (89%) at Wergea, Friesland
        (53.1503N, 5.8389E, 20:09 CEST) must place the Sun and Moon beads
        overlapping and light the eclipse status."""
        out = self._run()
        e = out["eclipseReal"]
        self.assertAlmostEqual(e["sun"]["altitudeDeg"], 7.95, delta=0.3)
        self.assertAlmostEqual(e["sun"]["azimuthDeg"], 284.35, delta=0.5)
        dist = math.hypot(e["sunX"] - e["moonX"], e["sunY"] - e["moonY"])
        self.assertLess(dist, 27.0)   # bead radii 16 + 11 → overlap
        self.assertEqual(e["status"], "🌑 ECLIPSE IN PROGRESS")
        self.assertEqual(e["sunFill"], "#ff6b35")

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

