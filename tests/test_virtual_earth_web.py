"""Web test: the virtual Earth + seasonal light beam (optional, off by default).

A small globe sits at the sky-dome's centre with three beam wedges — daylight
(gold), civil twilight (orange), nautical twilight (blue) — whose width
(90° ± 30%) and intensity (×0.4–1.0) follow the solar declination
(web/static/js/solar_geometry.js). Driven by
canvas_renderer.updatePlanetaryCanvas using the sky-dome's OWN angle
convention, so the lit side points the same way as the Sun bead. Toggle:
⚙️ Configure → 🌍 Show Light Beam (#light-beam-toggle, stored in
kairos_light_beam, off by default). The globe is decorative and never moves
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

    def test_root_has_virtual_earth_markup(self):
        html = self.client.get("/").get_data(as_text=True)
        self.assertIn('<g id="virtual-earth" display="none">', html)
        for el in ("night-overlay", "nautical-beam", "twilight-beam",
                   "daylight-beam", "sun-position"):
            self.assertIn(f'id="{el}"', html)
        # The Gregorian clock survives (it renders inside/on the globe).
        self.assertIn('id="gregorian-center-clock"', html)

    def test_concentric_template_has_the_same_markup(self):
        with open(os.path.join(REPO_ROOT, "web", "templates",
                               "concentric_view.html"), encoding="utf-8") as f:
            frag = f.read()
        self.assertIn('<g id="virtual-earth" display="none">', frag)
        self.assertIn('id="daylight-beam"', frag)

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
    'nautical-beam', 'twilight-beam', 'daylight-beam', 'sun-position'
].forEach(id => elements[id] = makeEl(id));
elements['virtual-earth']._attrs['display'] = '';
global.document = { getElementById: (id) => elements[id] || null };
// The renderer's optional distance debug log must not pollute stdout JSON.
global.console.debug = () => {};
const renderer = require('./web/static/js/canvas_renderer.js');
"""

    def _render(self, declination, sunAlt, sunAz):
        script = self._STUBS + (
            "global.getCurrentSolarDeclination = () => " + str(declination) + ";\n"
            "global.solarBeamFactors = require('./web/static/js/solar_geometry.js').solarBeamFactors;\n"
            "renderer.updatePlanetaryCanvas(" + str(sunAlt) + ", " + str(sunAz) + ", 30, 180, 0.5, '14:30');\n"
            "const d = elements['daylight-beam']._attrs;\n"
            "const t = elements['twilight-beam']._attrs;\n"
            "const n = elements['nautical-beam']._attrs;\n"
            "const sp = elements['sun-position']._attrs;\n"
            "const no = elements['night-overlay']._attrs;\n"
            "process.stdout.write(JSON.stringify({\n"
            "  dayPath: d.d, dayOp: d.opacity,\n"
            "  twiOp: t.opacity, nauOp: n.opacity,\n"
            "  sunX: sp.cx, sunY: sp.cy, sunOp: sp.opacity,\n"
            "  nightOp: no.opacity\n"
            "}));\n"
        )
        proc = subprocess.run(["node", "-e", script], capture_output=True,
                              text=True, encoding="utf-8", cwd=REPO_ROOT)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        return json.loads(proc.stdout)

    def test_summer_day_beam_is_widest_and_brightest(self):
        out = self._render(23.44, 10, 90)
        # Daylight gold, brightest in summer.
        self.assertEqual(out["dayOp"], "0.550")
        self.assertEqual(out["twiOp"], "0.000")
        # Sun's place is on the LEFT (az 90 = east) — the sky-dome convention.
        self.assertAlmostEqual(float(out["sunX"]), 305, places=1)
        self.assertAlmostEqual(float(out["sunY"]), 400, places=1)
        self.assertEqual(out["sunOp"], "0.9")
        # The globe's night side is lightest during the day.
        self.assertEqual(out["nightOp"], "0.4")
        self.assertIn("A95,95", out["dayPath"])

    def test_winter_day_beam_is_narrower_and_dimmer(self):
        summer = self._render(23.44, 10, 90)
        winter = self._render(-23.44, 10, 90)
        self.assertEqual(winter["dayOp"], "0.220")
        # The summer wedge spans a wider arc (its arc-edge x is nearer centre).
        def edge_x(path):
            return float(path.split(" L")[1].split(",")[0])
        self.assertGreater(edge_x(summer["dayPath"]), edge_x(winter["dayPath"]))
        # Same sun direction in both seasons (east / left).
        self.assertAlmostEqual(float(winter["sunX"]), 305, places=1)

    def test_twilight_and_nautical_bands(self):
        # Civil twilight (−3°): orange beam at 0.4·0.7·0.8 at the equinox.
        out = self._render(0, -3, 180)
        self.assertEqual(out["dayOp"], "0.000")
        self.assertEqual(out["twiOp"], "0.224")
        self.assertEqual(out["nauOp"], "0.000")
        self.assertEqual(out["sunOp"], "0.9")
        # Deep night (−15°): nothing lit, globe darkest.
        night = self._render(0, -15, 180)
        self.assertEqual(night["dayOp"], "0.000")
        self.assertEqual(night["twiOp"], "0.000")
        self.assertEqual(night["nauOp"], "0.000")
        self.assertEqual(night["sunOp"], "0")
        self.assertEqual(night["nightOp"], "0.9")

    def test_hidden_globe_is_not_updated(self):
        script = self._STUBS + (
            "elements['virtual-earth']._attrs['display'] = 'none';\n"
            "global.getCurrentSolarDeclination = () => 23.44;\n"
            "renderer.updatePlanetaryCanvas(10, 90, 30, 180, 0.5, '14:30');\n"
            "process.stdout.write(JSON.stringify({\n"
            "  dayPath: elements['daylight-beam']._attrs.d || 'M400,400 L333,333 A95,95 0 0,1 467,333 Z',\n"
            "  dayOp: elements['daylight-beam']._attrs.opacity || '0'\n"
            "}));\n"
        )
        proc = subprocess.run(["node", "-e", script], capture_output=True,
                              text=True, encoding="utf-8", cwd=REPO_ROOT)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        out = json.loads(proc.stdout)
        # Untouched: still the initial placeholder path, opacity still "0".
        self.assertEqual(out["dayPath"], "M400,400 L333,333 A95,95 0 0,1 467,333 Z")
        self.assertEqual(out["dayOp"], "0")


if __name__ == "__main__":
    unittest.main()
