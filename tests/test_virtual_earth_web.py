"""Web test: the virtual Earth + Sun light flood effect (lightbulb, not a
laser — off by default).

The Sun is a glowing disc that floods the space around it: a soft glow around
the Sun bead (#sun-glow, url(#sunGlowGrad)), a soft gradient wedge flooding
from the Sun to the Earth (#light-flood, url(#lightFloodGrad)) and the
Earth's lit half (#earth-lit, clipped to the globe by #dayClip,
url(#earthGlowGrad)). Opacity maps day / civil twilight / nautical twilight /
night, and during an eclipse (the EXISTING detection — azimuth + altitude
aligned + node) the light turns red/dark. Shown together with the central
globe when 🌍 Show Sun Light is enabled (#light-beam-toggle,
kairos_light_beam, off by default). The earlier beam / light-cone designs
(edges, gradients, wedge fills) are replaced. Driven by
canvas_renderer.updatePlanetaryCanvas. Decorative — it never moves the beads
or the azimuth wheel.
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

    def test_root_has_sun_light_markup(self):
        html = self.client.get("/").get_data(as_text=True)
        self.assertIn('<g id="sun-light" display="none">', html)
        for el in ("sun-glow", "light-flood", "earth-lit", "day-clip-path",
                   "dayClip", "sunGlowGrad", "lightFloodGrad", "earthGlowGrad",
                   "virtual-earth", "gregorian-center-clock"):
            self.assertIn(f'id="{el}"', html)
        # The user marker is part of the globe.
        self.assertIn("YOU", html)
        # The replaced beam / cone designs and the redundant markers are gone.
        for stale in ("sun-beam-group", "sun-beam-core", "sun-beam-glow",
                      "sun-beam-halo", "light-cone", "cone-edge-left",
                      "cone-edge-right", "cone-fill", "terminator-line",
                      "night-side", "sun-position", "umbra-shadow"):
            self.assertNotIn(f'id="{stale}"', html, f"stale {stale}")

    def test_concentric_template_has_the_same_markup(self):
        with open(os.path.join(REPO_ROOT, "web", "templates",
                               "concentric_view.html"), encoding="utf-8") as f:
            frag = f.read()
        self.assertIn('<g id="sun-light" display="none">', frag)
        self.assertIn('id="sun-glow"', frag)
        self.assertIn('id="light-flood"', frag)
        self.assertIn('id="earth-lit"', frag)
        self.assertIn('id="day-clip-path"', frag)
        self.assertNotIn('id="light-cone"', frag)
        self.assertNotIn('id="sun-beam-core"', frag)
        self.assertNotIn('id="terminator-line"', frag)

    def test_configure_panel_has_the_toggle(self):
        html = self.client.get("/").get_data(as_text=True)
        self.assertIn('id="light-beam-toggle"', html)
        self.assertIn('data-i18n="config.light_beam"', html)
        self.assertIn("🌍 Show Sun Light", html)

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
    'sunrise-countdown', 'virtual-earth', 'sun-light', 'sun-glow',
    'light-flood', 'earth-lit', 'day-clip-path', 'lightFloodGrad'
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
            "  groupDisplay: elements['sun-light']._attrs['display'] || null,\n"
            "  globeDisplay: elements['virtual-earth']._attrs['display'] || null,\n"
            "  glowX: g('sun-glow').cx, glowY: g('sun-glow').cy,\n"
            "  glowOp: g('sun-glow').opacity, glowFill: g('sun-glow').fill,\n"
            "  floodPath: g('light-flood').d, floodOp: g('light-flood').opacity,\n"
            "  floodFill: g('light-flood').fill,\n"
            "  floodGrad: [g('lightFloodGrad').x1, g('lightFloodGrad').y1,\n"
            "              g('lightFloodGrad').x2, g('lightFloodGrad').y2],\n"
            "  litOp: g('earth-lit').opacity, litFill: g('earth-lit').fill,\n"
            "  clipPath: g('day-clip-path').d,\n"
            "  clock: elements['gregorian-center-clock'].textContent\n"
            "}));\n"
        )
        proc = subprocess.run(["node", "-e", script], capture_output=True,
                              text=True, encoding="utf-8", cwd=REPO_ROOT)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        return json.loads(proc.stdout)


    def test_day_sun_floods_the_earth(self):
        # Sun alt 10, az 90 (east/LEFT) → the glow centres on the bead (far
        # left), the flood wedge runs Sun → Earth and the lit half faces the Sun.
        out = self._render(10, 90, 30, 180, 0.5)
        self.assertEqual(out["groupDisplay"], "block")
        self.assertEqual(out["globeDisplay"], "block")
        dist = 280 * (1 - 10 / 90)          # sun bead distance from centre
        self.assertAlmostEqual(float(out["glowX"]), 400 - dist, places=4)
        self.assertAlmostEqual(float(out["glowY"]), 400, places=4)
        # Flood wedge starts at the Sun and passes through the Earth's centre.
        self.assertTrue(out["floodPath"].startswith(f"M{out['glowX']},400"),
                        out["floodPath"])
        self.assertIn("400,400", out["floodPath"])
        # The gradient follows the Sun → Earth line.
        self.assertEqual(out["floodGrad"][0], out["glowX"])
        self.assertEqual(out["floodGrad"][2], "400")
        # Day opacity: cone opacity 0.8 → glow ×0.5 = 0.4, flood ×0.2 = 0.16,
        # Earth lit half ×1 = 0.8.
        self.assertEqual(out["glowOp"], "0.400")
        self.assertEqual(out["floodOp"], "0.160")
        self.assertEqual(out["litOp"], "0.800")
        # Non-eclipse: soft gradient fills.
        self.assertEqual(out["glowFill"], "url(#sunGlowGrad)")
        self.assertEqual(out["floodFill"], "url(#lightFloodGrad)")
        self.assertEqual(out["litFill"], "url(#earthGlowGrad)")
        # The lit half-disc rotates to face the sun on the left (the clip is
        # M centre → bottom → arc → top, i.e. the left half).
        self.assertIn("A60,60 0 0,1 400,340", out["clipPath"])
        self.assertEqual(out["clock"], "14:30")

    def test_twilight_and_night_fade_the_flood(self):
        # Civil twilight (−3°): opacity 0.4·(1−0.5) = 0.2.
        tw = self._render(-3, 180, 30, 180, 0.5)
        self.assertEqual(tw["glowOp"], "0.100")
        self.assertEqual(tw["floodOp"], "0.040")
        self.assertEqual(tw["litOp"], "0.200")
        # Nautical twilight (−9°): opacity 0.15·(1−0.5) = 0.075 (0.075·0.5
        # rounds to 0.037 in JS toFixed(3)).
        nau = self._render(-9, 180, 30, 180, 0.5)
        self.assertEqual(nau["glowOp"], "0.037")
        self.assertEqual(nau["litOp"], "0.075")
        # Deep night (−15°): the flood is gone.
        night = self._render(-15, 180, 30, 180, 0.5)
        self.assertEqual(night["glowOp"], "0.000")
        self.assertEqual(night["floodOp"], "0.000")
        self.assertEqual(night["litOp"], "0.000")

    def test_eclipse_turns_the_flood_red(self):
        # Sun and Moon share az 180 + altitude 10 + at a node → eclipse
        # (existing detection). The flood light turns red/dark.
        out = self._render(10, 180, 10, 180, 0.05)
        self.assertEqual(out["glowFill"], "rgba(180,60,30,0.4)")
        self.assertEqual(out["floodFill"], "rgba(180,60,30,0.1)")
        self.assertEqual(out["litFill"], "rgba(180,60,30,0.2)")
        # Opacity still follows the day light-percentage.
        self.assertEqual(out["glowOp"], "0.400")
        self.assertEqual(out["litOp"], "0.800")

    def test_disabled_flood_hides_both_groups(self):
        out = self._render(10, 90, 30, 180, 0.5, enabled=False)
        self.assertEqual(out["groupDisplay"], "none")
        self.assertEqual(out["globeDisplay"], "none")
        # The flood elements are untouched (no cx set in the stub → key omitted).
        self.assertIsNone(out.get("glowX"))


if __name__ == "__main__":
    unittest.main()

