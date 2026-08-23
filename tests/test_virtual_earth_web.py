"""Web test: the virtual Earth + light cone (two edges from the Sun bead to
the Earth's horizon, optional, off by default).

Two lines trace the edges of the light cone from the Sun bead to the Earth's
horizon (tangent points on a radius-60 circle), with a soft fill between them
showing the lit side. Opacity maps day / civil twilight / nautical twilight /
night, and during an eclipse (the EXISTING detection — azimuth + altitude
aligned + node) the cone turns red/dark. Shown together with the central
globe when 🌍 Show Light Cone is enabled (#light-beam-toggle,
kairos_light_beam, off by default). The earlier beam designs (soft gradient
core/glow/halo) are replaced. Driven by canvas_renderer.updatePlanetaryCanvas.
Decorative — it never moves the beads or the azimuth wheel.
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


class TestVirtualEarthServed(unittest.TestCase):
    def setUp(self):
        app.config["TESTING"] = True
        self.client = app.test_client()

    def test_root_has_light_cone_markup(self):
        html = self.client.get("/").get_data(as_text=True)
        self.assertIn('<g id="light-cone" display="none">', html)
        for el in ("cone-edge-left", "cone-edge-right", "cone-fill",
                   "virtual-earth", "gregorian-center-clock"):
            self.assertIn(f'id="{el}"', html)
        # The user marker is part of the globe.
        self.assertIn("YOU", html)
        # The replaced beam designs and the redundant markers are gone.
        for stale in ("sun-beam-group", "sun-beam-core", "sun-beam-glow",
                      "sun-beam-halo", "terminator-line", "night-side",
                      "sun-position", "umbra-shadow"):
            self.assertNotIn(f'id="{stale}"', html, f"stale {stale}")

    def test_concentric_template_has_the_same_markup(self):
        with open(os.path.join(REPO_ROOT, "web", "templates",
                               "concentric_view.html"), encoding="utf-8") as f:
            frag = f.read()
        self.assertIn('<g id="light-cone" display="none">', frag)
        self.assertIn('id="cone-edge-left"', frag)
        self.assertIn('id="cone-fill"', frag)
        self.assertNotIn('id="sun-beam-core"', frag)
        self.assertNotIn('id="terminator-line"', frag)

    def test_configure_panel_has_the_toggle(self):
        html = self.client.get("/").get_data(as_text=True)
        self.assertIn('id="light-beam-toggle"', html)
        self.assertIn('data-i18n="config.light_beam"', html)
        self.assertIn("🌍 Show Light Cone", html)

    def test_toggle_logic_lives_in_app_js(self):
        """config.js does not exist — the toggle is wired in web/app.js."""
        with open(os.path.join(REPO_ROOT, "web", "app.js"), encoding="utf-8") as f:
            appjs = f.read()
        self.assertIn("kairos_light_beam", appjs)
        self.assertIn("initLightBeamToggle", appjs)
        self.assertIn("applyVirtualEarthVisibility", appjs)

    def test_watch_face_does_not_load_solar_geometry(self):
        html = self.client.get("/watch.html").get_data(as_text=True)
        self.assertNotIn('src="static/js/solar_geometry.js"', html)


@requires_node
class TestVirtualEarthRenderer(unittest.TestCase):
    _STUBS = r"""
const elements = {};
function makeEl(id) {
    const attrs = {};
    const classes = new Set();
    return {
        id: id,
        _attrs: attrs,
        setAttribute: (k, v) => { attrs[k] = String(v); },
        getAttribute: (k) => attrs[k] || null,
        addEventListener: () => {},
        classList: { add() {}, remove() {}, contains: () => false, toggle() {} },
        style: {},
        textContent: ''
    };
}
[
    'sun-orbit-line', 'moon-orbit-line', 'sun-bead', 'moon-bead',
    'gregorian-center-clock', 'eclipse-status', 'twilight-glow',
    'sunrise-countdown', 'virtual-earth', 'light-cone',
    'cone-edge-left', 'cone-edge-right', 'cone-fill'
].forEach(id => elements[id] = makeEl(id));
global.document = { getElementById: (id) => elements[id] || null };
// The renderer's optional distance debug log must not pollute stdout JSON.
global.console.debug = () => {};
const renderer = require('./web/static/js/canvas_renderer.js');
"""

    def _render(self, sunAlt, sunAz, moonAlt, moonAz, node, enabled=True):
        script = self._STUBS + (
            "global.localStorage = { getItem: (k) => (k === 'kairos_light_beam' ? "
            + ("'true'" if enabled else "null") + " : null) };\n"
            "renderer.updatePlanetaryCanvas(" + str(sunAlt) + ", " + str(sunAz)
            + ", " + str(moonAlt) + ", " + str(moonAz) + ", " + str(node)
            + ", '14:30');\n"
            "const g = (id) => elements[id]._attrs;\n"
            "process.stdout.write(JSON.stringify({\n"
            "  coneDisplay: elements['light-cone']._attrs['display'] || null,\n"
            "  globeDisplay: elements['virtual-earth']._attrs['display'] || null,\n"
            "  lX1: g('cone-edge-left').x1, lY1: g('cone-edge-left').y1,\n"
            "  lX2: g('cone-edge-left').x2, lY2: g('cone-edge-left').y2,\n"
            "  rX2: g('cone-edge-right').x2, rY2: g('cone-edge-right').y2,\n"
            "  lStroke: g('cone-edge-left').stroke, lOp: g('cone-edge-left').opacity,\n"
            "  fillPath: g('cone-fill').d, fillStroke: g('cone-fill').fill,\n"
            "  fillOp: g('cone-fill').opacity,\n"
            "  clock: elements['gregorian-center-clock'].textContent\n"
            "}));\n"
        )
        proc = subprocess.run(["node", "-e", script], capture_output=True,
                              text=True, encoding="utf-8", cwd=REPO_ROOT)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        return json.loads(proc.stdout)

    def test_day_cone_from_sun_to_earth_is_bright(self):
        # Sun alt 10, az 90 (east/LEFT) → the cone edges go from the bead
        # (far left) to the two tangent points on the r=60 horizon circle.
        out = self._render(10, 90, 30, 180, 0.5)
        self.assertEqual(out["coneDisplay"], "block")
        self.assertEqual(out["globeDisplay"], "block")
        dist = 280 * (1 - 10 / 90)          # sun bead distance from centre
        self.assertAlmostEqual(float(out["lX1"]), 400 - dist, places=4)
        self.assertAlmostEqual(float(out["lY1"]), 400, places=4)
        # Tangent points are symmetric about the horizontal axis.
        self.assertAlmostEqual(float(out["lX2"]), float(out["rX2"]), places=4)
        self.assertAlmostEqual(float(out["lY2"]), 400 + 414.46 - 400, places=1)
        self.assertAlmostEqual(float(out["rY2"]), 400 - (float(out["lY2"]) - 400), places=4)
        # Day opacity: cone opacity 0.8 → edges ×0.6 = 0.48, fill ×0.15 = 0.12.
        self.assertEqual(out["lStroke"], "rgba(255,200,100,0.4)")
        self.assertAlmostEqual(float(out["lOp"]), 0.48, places=6)
        self.assertAlmostEqual(float(out["fillOp"]), 0.12, places=6)
        self.assertIn("A60,60", out["fillPath"])
        self.assertEqual(out["clock"], "14:30")

    def test_twilight_and_night_fade_the_cone(self):
        # Civil twilight (−3°): cone opacity 0.5·(1−0.5) = 0.25.
        tw = self._render(-3, 180, 30, 180, 0.5)
        self.assertAlmostEqual(float(tw["lOp"]), 0.25 * 0.6, places=6)
        self.assertAlmostEqual(float(tw["fillOp"]), 0.25 * 0.15, places=6)
        # Nautical twilight (−9°): cone opacity 0.2·(1−0.5) = 0.1.
        nau = self._render(-9, 180, 30, 180, 0.5)
        self.assertAlmostEqual(float(nau["lOp"]), 0.1 * 0.6, places=6)
        # Deep night (−15°): the cone disappears.
        night = self._render(-15, 180, 30, 180, 0.5)
        self.assertAlmostEqual(float(night["lOp"]), 0, places=6)
        self.assertAlmostEqual(float(night["fillOp"]), 0, places=6)

    def test_eclipse_turns_the_cone_red(self):
        # Sun and Moon share az 180 + altitude 10 + at a node → eclipse
        # (existing detection). The cone turns red/dark.
        out = self._render(10, 180, 10, 180, 0.05)
        self.assertEqual(out["lStroke"], "rgba(180,60,30,0.8)")
        self.assertEqual(out["fillStroke"], "rgba(180,60,30,0.2)")
        # Opacity still follows the day light-percentage.
        self.assertAlmostEqual(float(out["lOp"]), 0.48, places=6)

    def test_disabled_cone_hides_both_groups(self):
        out = self._render(10, 90, 30, 180, 0.5, enabled=False)
        self.assertEqual(out["coneDisplay"], "none")
        self.assertEqual(out["globeDisplay"], "none")
        # The cone is untouched (no x1 set in the stub → key omitted).
        self.assertIsNone(out.get("lX1"))


if __name__ == "__main__":
    unittest.main()
