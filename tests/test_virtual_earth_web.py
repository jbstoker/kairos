"""Web test: the virtual Earth + dotted seasonal light beam (optional, off by
default), with eclipse visualization.

A small globe (r=65) sits at the sky-dome's centre. Its light beams are
gradient wedges (gold daylight / orange civil / blue nautical) plus a dotted
overlay (web/static/js/solar_geometry.js drives the width 90° ± 30% and the
intensity ×0.4–1.0 from the solar declination). During an eclipse the beams
turn red (eclipseGlow), dim, and the Earth's umbra appears at the Moon.
Driven by canvas_renderer.updatePlanetaryCanvas, enabled via ⚙️ Configure →
🌍 Show Light Beam (#light-beam-toggle, kairos_light_beam, off by default).
The globe and the Gregorian clock live in the #virtual-earth group (hidden
when the beam is off). The globe is decorative — it never moves the beads or
the azimuth wheel.
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
        for el in ("night-overlay", "daylight-beam", "daylight-dots",
                   "twilight-beam", "twilight-dots", "nautical-beam",
                   "nautical-dots", "sun-position", "umbra-shadow",
                   "gregorian-center-clock"):
            self.assertIn(f'id="{el}"', html)
        # The dotted pattern + the beam gradients live in the SVG <defs>.
        for el in ("dotPattern", "daylightGlow", "twilightGlow",
                   "nauticalGlow", "eclipseGlow"):
            self.assertIn(f'id="{el}"', html)
        # The user marker is part of the globe.
        self.assertIn("YOU", html)

    def test_concentric_template_has_the_same_markup(self):
        with open(os.path.join(REPO_ROOT, "web", "templates",
                               "concentric_view.html"), encoding="utf-8") as f:
            frag = f.read()
        self.assertIn('<g id="virtual-earth" display="none">', frag)
        self.assertIn('id="daylight-beam"', frag)
        self.assertIn('id="daylight-dots"', frag)
        self.assertIn('id="umbra-shadow"', frag)
        self.assertIn('id="dotPattern"', frag)

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
    'sunrise-countdown', 'virtual-earth', 'night-overlay',
    'daylight-beam', 'daylight-dots', 'twilight-beam', 'twilight-dots',
    'nautical-beam', 'nautical-dots', 'sun-position', 'umbra-shadow'
].forEach(id => elements[id] = makeEl(id));
global.document = { getElementById: (id) => elements[id] || null };
// The renderer's optional distance debug log must not pollute stdout JSON.
global.console.debug = () => {};
const renderer = require('./web/static/js/canvas_renderer.js');
"""

    def _render(self, declination, sunAlt, sunAz, moonAlt, moonAz, node,
                enabled=True):
        script = self._STUBS + (
            "global.localStorage = { getItem: (k) => (k === 'kairos_light_beam' ? "
            + ("'true'" if enabled else "null") + " : null) };\n"
            "global.getCurrentSolarDeclination = () => " + str(declination) + ";\n"
            "renderer.updatePlanetaryCanvas(" + str(sunAlt) + ", " + str(sunAz)
            + ", " + str(moonAlt) + ", " + str(moonAz) + ", " + str(node)
            + ", '14:30');\n"
            "const beam = (id) => elements[id]._attrs;\n"
            "process.stdout.write(JSON.stringify({\n"
            "  display: elements['virtual-earth']._attrs['display'] || null,\n"
            "  dayPath: beam('daylight-beam').d, dayOp: beam('daylight-beam').opacity,\n"
            "  dayFill: beam('daylight-beam').fill, dayDotsOp: beam('daylight-dots').opacity,\n"
            "  twiOp: beam('twilight-beam').opacity, nauOp: beam('nautical-beam').opacity,\n"
            "  sunX: beam('sun-position').cx, sunY: beam('sun-position').cy,"
            " sunOp: beam('sun-position').opacity,\n"
            "  nightOp: beam('night-overlay').opacity,\n"
            "  umbra: beam('umbra-shadow').display,"
            " umbraX: beam('umbra-shadow').cx, umbraY: beam('umbra-shadow').cy,\n"
            "  clock: elements['gregorian-center-clock'].textContent\n"
            "}));\n"
        )
        proc = subprocess.run(["node", "-e", script], capture_output=True,
                              text=True, encoding="utf-8", cwd=REPO_ROOT)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        return json.loads(proc.stdout)

    def test_summer_day_beam_is_widest_and_brightest(self):
        out = self._render(23.44, 10, 90, 30, 180, 0.5)
        self.assertEqual(out["display"], "block")
        # Daylight beam brightest in summer (0.8 × intensity 1.0).
        self.assertAlmostEqual(float(out["dayOp"]), 0.8, places=6)
        # Dotted overlay at 40% of the beam opacity.
        self.assertAlmostEqual(float(out["dayDotsOp"]), 0.32, places=6)
        # Gradient fill, not the eclipse glow.
        self.assertEqual(out["dayFill"], "url(#daylightGlow)")
        self.assertEqual(out["twiOp"], "0")
        self.assertEqual(out["nauOp"], "0")
        # Sun's place on the LEFT (az 90 = east), on the r=65 globe edge.
        self.assertAlmostEqual(float(out["sunX"]), 335, places=1)
        self.assertAlmostEqual(float(out["sunY"]), 400, places=1)
        self.assertEqual(out["sunOp"], "0.9")
        self.assertEqual(out["nightOp"], "0.4")
        self.assertIn("A65,65", out["dayPath"])
        # No eclipse → no umbra.
        self.assertEqual(out["umbra"], "none")
        # The Gregorian clock lives inside the globe.
        self.assertEqual(out["clock"], "14:30")

    def test_winter_day_beam_is_narrower_and_dimmer(self):
        summer = self._render(23.44, 10, 90, 30, 180, 0.5)
        winter = self._render(-23.44, 10, 90, 30, 180, 0.5)
        self.assertAlmostEqual(float(winter["dayOp"]), 0.32, places=6)  # 0.8 × 0.4
        def edge_x(path):
            return float(path.split(" L")[1].split(",")[0])
        self.assertGreater(edge_x(summer["dayPath"]), edge_x(winter["dayPath"]))
        self.assertAlmostEqual(float(winter["sunX"]), 335, places=1)

    def test_civil_twilight_blends_day_and_twilight(self):
        # Alt −3° (equinox): dayOpacity 0.4, twilight 0.3 → both shown.
        out = self._render(0, -3, 180, 30, 180, 0.5)
        self.assertAlmostEqual(float(out["dayOp"]), 0.4 * 0.7, places=6)
        self.assertAlmostEqual(float(out["twiOp"]), 0.3 * 0.7 * 0.8, places=6)
        self.assertEqual(out["nauOp"], "0")
        self.assertEqual(out["sunOp"], "0.9")
        # Sun straight up (az 180 = south/top): x stays at the centre.
        self.assertAlmostEqual(float(out["sunX"]), 400, places=1)
        self.assertAlmostEqual(float(out["sunY"]), 335, places=1)

    def test_deep_night_nothing_lit(self):
        out = self._render(0, -15, 180, 30, 180, 0.5)
        self.assertEqual(out["dayOp"], "0")
        self.assertEqual(out["twiOp"], "0")
        self.assertEqual(out["nauOp"], "0")
        self.assertEqual(out["sunOp"], "0")
        self.assertEqual(out["nightOp"], "0.9")

    def test_eclipse_turns_beams_red_and_shows_umbra(self):
        # Sun and Moon share az 180 + altitude 0 + at a node → eclipse.
        out = self._render(0, 0, 180, 0, 180, 0.05)
        self.assertEqual(out["dayFill"], "url(#eclipseGlow)")
        # Beam dimmed ×0.6; dots ×0.3.
        self.assertAlmostEqual(float(out["dayOp"]), 0.8 * 0.7 * 0.6, places=6)
        self.assertAlmostEqual(float(out["dayDotsOp"]), 0.8 * 0.7 * 0.3, places=6)
        # Umbra rides on the Moon bead (alt 0 az 180 → top, y=120).
        self.assertEqual(out["umbra"], "block")
        self.assertAlmostEqual(float(out["umbraX"]), 400, places=1)
        self.assertAlmostEqual(float(out["umbraY"]), 120, places=1)

    def test_disabled_beam_hides_the_globe(self):
        out = self._render(23.44, 10, 90, 30, 180, 0.5, enabled=False)
        self.assertEqual(out["display"], "none")
        # Beams untouched (no 'd' attribute set in the stub → key omitted).
        self.assertIsNone(out.get("dayPath"))


if __name__ == "__main__":
    unittest.main()
