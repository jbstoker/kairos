"""Web test: the virtual Earth + Sun-originating light beam (terminator line
+ glow, optional, off by default).

A small globe (r=65) sits at the sky-dome's centre. A terminator line and a
soft daylight glow come from the Sun's direction; the night side is clipped
to the half of the globe away from the Sun (the #night-side clip-path tracks
the Sun's azimuth). The redundant sun-position marker is gone — the main Sun
bead is the only sun marker. Driven by canvas_renderer.updatePlanetaryCanvas,
enabled via ⚙️ Configure → 🌍 Show Light Beam (#light-beam-toggle,
kairos_light_beam, off by default). The globe and the Gregorian clock live in
the #virtual-earth group (hidden when the beam is off). Decorative — it never
moves the beads or the azimuth wheel.
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

    def test_root_has_virtual_earth_markup(self):
        html = self.client.get("/").get_data(as_text=True)
        self.assertIn('<g id="virtual-earth" display="none">', html)
        for el in ("night-overlay", "night-side", "nightClip",
                   "terminator-line", "daylight-glow", "gregorian-center-clock"):
            self.assertIn(f'id="{el}"', html)
        # The beam gradients live in the SVG <defs>.
        for el in ("daylightGlow", "twilightGlow", "nauticalGlow",
                   "eclipseGlow", "dotPattern"):
            self.assertIn(f'id="{el}"', html)
        # The user marker is part of the globe.
        self.assertIn("YOU", html)
        # The redundant sun marker is gone (only the main bead marks the Sun).
        self.assertNotIn('id="sun-position"', html)

    def test_concentric_template_has_the_same_markup(self):
        with open(os.path.join(REPO_ROOT, "web", "templates",
                               "concentric_view.html"), encoding="utf-8") as f:
            frag = f.read()
        self.assertIn('<g id="virtual-earth" display="none">', frag)
        self.assertIn('id="terminator-line"', frag)
        self.assertIn('id="daylight-glow"', frag)
        self.assertIn('id="night-side"', frag)
        self.assertNotIn('id="sun-position"', frag)

    def test_configure_panel_has_the_toggle(self):
        html = self.client.get("/").get_data(as_text=True)
        self.assertIn('id="light-beam-toggle"', html)
        self.assertIn('data-i18n="config.light_beam"', html)

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
    'sunrise-countdown', 'virtual-earth', 'night-overlay', 'night-side',
    'terminator-line', 'daylight-glow', 'user-dot'
].forEach(id => elements[id] = makeEl(id));
global.document = {
    getElementById: (id) => elements[id] || null,
    querySelector: (sel) => (sel === '#virtual-earth circle:last-of-type'
        ? elements['user-dot'] : null)
};
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
            "  display: elements['virtual-earth']._attrs['display'] || null,\n"
            "  tX1: g('terminator-line').x1, tY1: g('terminator-line').y1,\n"
            "  tX2: g('terminator-line').x2, tY2: g('terminator-line').y2,\n"
            "  glowPath: g('daylight-glow').d, glowOp: g('daylight-glow').opacity,\n"
            "  nightPath: g('night-side').d, nightOp: g('night-overlay').opacity,\n"
            "  userFill: g('user-dot').fill, userStroke: g('user-dot').stroke,\n"
            "  clock: elements['gregorian-center-clock'].textContent\n"
            "}));\n"
        )
        proc = subprocess.run(["node", "-e", script], capture_output=True,
                              text=True, encoding="utf-8", cwd=REPO_ROOT)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        return json.loads(proc.stdout)

    def test_day_glow_and_terminator_track_the_sun(self):
        # Sun at az 90 (east/LEFT), altitude 10 (daylight).
        out = self._render(10, 90, 30, 180, 0.5)
        self.assertEqual(out["display"], "block")
        # Terminator: sun on the left → boundary line vertical at the right.
        self.assertAlmostEqual(float(out["tX1"]), 465, places=4)
        self.assertAlmostEqual(float(out["tX2"]), 465, places=4)
        self.assertAlmostEqual(float(out["tY1"]), 309, places=4)
        self.assertAlmostEqual(float(out["tY2"]), 491, places=4)
        # Daylight glow is lit (0.25 during the day).
        self.assertEqual(out["glowOp"], "0.25")
        # Night side = the half away from the Sun (right half for a left Sun).
        self.assertEqual(out["nightPath"],
                         "M400,400 L400,335 A65,65 0 0,1 400,465 Z")
        self.assertEqual(out["nightOp"], "0.5")
        # The user dot is lit.
        self.assertEqual(out["userFill"], "#f0c27f")
        self.assertEqual(out["userStroke"], "#fff")
        # The Gregorian clock lives inside the globe.
        self.assertEqual(out["clock"], "14:30")

    def test_terminator_rotates_with_azimuth(self):
        east = self._render(10, 90, 30, 180, 0.5)
        south = self._render(10, 180, 30, 180, 0.5)
        # East sun → vertical terminator; south sun → horizontal terminator.
        self.assertAlmostEqual(float(east["tX1"]), float(east["tX2"]), places=4)
        self.assertAlmostEqual(float(south["tY1"]), float(south["tY2"]), places=4)
        self.assertAlmostEqual(float(south["tY1"]), 335, places=4)
        # Night side flips: south sun → night is the bottom half.
        self.assertEqual(south["nightPath"],
                         "M400,400 L465,400 A65,65 0 0,1 335,400 Z")

    def test_twilight_and_night_glow(self):
        # Civil twilight (−3°): soft glow, user dot still lit.
        tw = self._render(-3, 180, 30, 180, 0.5)
        self.assertAlmostEqual(float(tw["glowOp"]), 0.075, places=6)
        self.assertEqual(tw["userFill"], "#f0c27f")
        self.assertEqual(tw["nightOp"], "0.75")
        # Deep night (−15°): no glow, dark globe, user dot unlit.
        night = self._render(-15, 180, 30, 180, 0.5)
        self.assertEqual(night["glowOp"], "0")
        self.assertEqual(night["nightOp"], "0.95")
        self.assertEqual(night["userFill"], "#5a6a7c")
        self.assertEqual(night["userStroke"], "#3a4a5c")

    def test_disabled_beam_hides_the_globe(self):
        out = self._render(10, 90, 30, 180, 0.5, enabled=False)
        self.assertEqual(out["display"], "none")
        # The glow/terminator are untouched (no attributes set in the stub).
        self.assertIsNone(out.get("glowPath"))
        self.assertIsNone(out.get("tX1"))


if __name__ == "__main__":
    unittest.main()
