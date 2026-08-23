"""Web test: the virtual Earth + Sun-originating light beam (gradient beam,
eclipse ready; optional, off by default).

A gradient beam connects the Sun bead on the wheel to the Earth at the
centre. Its opacity encodes the light percentage (0% night … 100% day,
fading through twilight), and during an eclipse (the EXISTING detection —
azimuth + altitude aligned + node) it turns red/dark. The beam and the
central globe are shown together when 🌍 Show Light Beam is enabled
(#light-beam-toggle, kairos_light_beam, off by default). The redundant
sun-position marker and the terminator/glow/night-clip design are gone.
Driven by canvas_renderer.updatePlanetaryCanvas. Decorative — it never moves
the beads or the azimuth wheel.
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

    def test_root_has_sun_beam_markup(self):
        html = self.client.get("/").get_data(as_text=True)
        self.assertIn('<g id="sun-beam-group" display="none">', html)
        for el in ("sun-beam-core", "sun-beam-glow", "sun-beam-halo",
                   "sun-beam-grad", "eclipse-beam-grad", "virtual-earth",
                   "gregorian-center-clock"):
            self.assertIn(f'id="{el}"', html)
        # The user marker is part of the globe.
        self.assertIn("YOU", html)
        # The replaced visual (old laser beam id, terminator / night clip /
        # glow) and the redundant sun-position marker are gone.
        for stale in ("sun-beam\"", "terminator-line", "night-side",
                      "nightClip", "daylight-glow", "sun-position",
                      "umbra-shadow"):
            self.assertNotIn(f'id="{stale}', html, f"stale {stale}")

    def test_concentric_template_has_the_same_markup(self):
        with open(os.path.join(REPO_ROOT, "web", "templates",
                               "concentric_view.html"), encoding="utf-8") as f:
            frag = f.read()
        self.assertIn('<g id="sun-beam-group" display="none">', frag)
        self.assertIn('id="sun-beam-core"', frag)
        self.assertIn('id="sun-beam-halo"', frag)
        self.assertIn('id="eclipse-beam-grad"', frag)
        self.assertNotIn('id="sun-beam"', frag)
        self.assertNotIn('id="terminator-line"', frag)

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
    'sunrise-countdown', 'virtual-earth', 'sun-beam-group',
    'sun-beam-core', 'sun-beam-glow', 'sun-beam-halo'
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
            "const b = (id) => elements[id]._attrs;\n"
            "process.stdout.write(JSON.stringify({\n"
            "  beamDisplay: elements['sun-beam-group']._attrs['display'] || null,\n"
            "  globeDisplay: elements['virtual-earth']._attrs['display'] || null,\n"
            "  x1: b('sun-beam-core').x1, y1: b('sun-beam-core').y1,\n"
            "  x2: b('sun-beam-core').x2, y2: b('sun-beam-core').y2,\n"
            "  stroke: b('sun-beam-core').stroke, opacity: b('sun-beam-core').opacity,\n"
            "  glowStroke: b('sun-beam-glow').stroke, glowOp: b('sun-beam-glow').opacity,\n"
            "  haloStroke: b('sun-beam-halo').stroke, haloOp: b('sun-beam-halo').opacity,\n"
            "  clock: elements['gregorian-center-clock'].textContent\n"
            "}));\n"
        )
        proc = subprocess.run(["node", "-e", script], capture_output=True,
                              text=True, encoding="utf-8", cwd=REPO_ROOT)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        return json.loads(proc.stdout)

    def test_day_beam_from_sun_to_earth_is_bright(self):
        # Sun alt 10, az 90 (east/LEFT) → bead far left, beam to the centre.
        out = self._render(10, 90, 30, 180, 0.5)
        self.assertEqual(out["beamDisplay"], "block")
        self.assertEqual(out["globeDisplay"], "block")
        # Sun bead at alt 10 az 90: dist = 280·(1−10/90), x = 400−dist.
        dist = 280 * (1 - 10 / 90)
        self.assertAlmostEqual(float(out["x1"]), 400 - dist, places=4)
        self.assertAlmostEqual(float(out["y1"]), 400, places=4)
        self.assertAlmostEqual(float(out["x2"]), 400, places=4)
        self.assertAlmostEqual(float(out["y2"]), 400, places=4)
        # Light percentage 100% → core 0.9, glow 0.3, halo 0.08.
        self.assertEqual(out["stroke"], "url(#sun-beam-grad)")
        self.assertAlmostEqual(float(out["opacity"]), 0.9, places=6)
        self.assertAlmostEqual(float(out["glowOp"]), 0.3, places=6)
        self.assertAlmostEqual(float(out["haloOp"]), 0.08, places=6)
        self.assertEqual(out["clock"], "14:30")

    def test_twilight_fades_the_beam(self):
        # Civil twilight (−3°): light percent = 50·(1−0.5) = 25.
        out = self._render(-3, 180, 30, 180, 0.5)
        self.assertAlmostEqual(float(out["opacity"]), 0.4 + 0.25 * 0.5, places=6)
        self.assertAlmostEqual(float(out["glowOp"]), 0.1 + 0.25 * 0.2, places=6)
        self.assertAlmostEqual(float(out["haloOp"]), 0.04 + 0.25 * 0.04, places=6)
        # Nautical twilight (−9°): light percent = 10·(1−0.5) = 5.
        nau = self._render(-9, 180, 30, 180, 0.5)
        self.assertAlmostEqual(float(nau["opacity"]), 0.4 + 0.05 * 0.5, places=6)
        # Deep night (−15°): 0% light, beam still visible but dimmest.
        night = self._render(-15, 180, 30, 180, 0.5)
        self.assertAlmostEqual(float(night["opacity"]), 0.4, places=6)
        self.assertAlmostEqual(float(night["glowOp"]), 0.1, places=6)
        self.assertAlmostEqual(float(night["haloOp"]), 0.04, places=6)

    def test_eclipse_turns_the_beam_red(self):
        # Sun and Moon share az 180 + altitude 0 + at a node → eclipse
        # (existing detection). All three beam layers switch to the red
        # gradient (core 0.8, glow 0.3, halo 0.1).
        out = self._render(0, 180, 0, 180, 0.05)
        self.assertEqual(out["stroke"], "url(#eclipse-beam-grad)")
        self.assertEqual(out["glowStroke"], "url(#eclipse-beam-grad)")
        self.assertEqual(out["haloStroke"], "url(#eclipse-beam-grad)")
        self.assertEqual(out["opacity"], "0.8")
        self.assertEqual(out["glowOp"], "0.3")
        self.assertEqual(out["haloOp"], "0.1")

    def test_disabled_beam_hides_both_groups(self):
        out = self._render(10, 90, 30, 180, 0.5, enabled=False)
        self.assertEqual(out["beamDisplay"], "none")
        self.assertEqual(out["globeDisplay"], "none")
        # The beam is untouched (no x1 set in the stub → key omitted).
        self.assertIsNone(out.get("x1"))


if __name__ == "__main__":
    unittest.main()
