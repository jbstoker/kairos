"""Web test: the Sky Mirror (clean, mobile-first sky view).

web/static/js/sky_mirror.js is the DEFAULT sky view: no degree rings, no
labels — a round mirror where the Sun and Moon sit at their real altitude +
azimuth and the horizon line (70% height) is the only reference. South is
up, east is left — the same convention as the degree wheel.

The full observation matrix (degree wheel, orbit tracks, eclipse pill,
twilight countdown, virtual earth) survives behind ⚙️ Configure →
🗺️ Show detailed sky map (#detailed-sky-toggle, localStorage
'kairos_detailed_sky_map', off by default, wired in web/app.js).

Eclipse detection reuses the proven canvas_renderer.js tolerances
(azimuth ≤ ~1.7°, altitude ≤ 5°, lunar node ≤ ~19°).
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


class TestSkyMirrorServed(unittest.TestCase):
    def setUp(self):
        app.config["TESTING"] = True
        self.client = app.test_client()

    def test_sky_mirror_js_served(self):
        resp = self.client.get("/static/js/sky_mirror.js")
        self.assertEqual(resp.status_code, 200)
        self.assertIn(b"updateSkyMirror", resp.data)
        self.assertIn(b"computeSkyMirrorState", resp.data)
        self.assertIn(b"detectEclipse", resp.data)

    def test_root_has_the_sky_mirror_markup(self):
        html = self.client.get("/").get_data(as_text=True)
        for element_id in ["sky-mirror-view", "sky-mirror", "sky-gradient",
                           "horizon-line", "horizon-glow", "sun-bead-visual",
                           "moon-bead-visual", "stars-container",
                           "primary-time"]:
            self.assertIn(f'id="{element_id}"', html, element_id)

    def test_detailed_dome_present_but_hidden_by_default(self):
        """The observation matrix is not deleted — it is the optional
        detailed view behind the toggle."""
        html = self.client.get("/").get_data(as_text=True)
        self.assertIn('id="detailed-sky-map" hidden', html)
        self.assertIn('id="kairos-observation-matrix"', html)

    def test_hidden_wrapper_css_wins_over_flex(self):
        """.spatial-matrix-wrapper is display:flex, which would override the
        UA [hidden] rule — an explicit rule must keep it hidden."""
        with open(os.path.join(REPO_ROOT, "web", "style.css"),
                  encoding="utf-8") as f:
            css = f.read()
        self.assertIn(".spatial-matrix-wrapper[hidden]", css)

    def test_configure_panel_has_the_detailed_sky_toggle(self):
        html = self.client.get("/").get_data(as_text=True)
        self.assertIn('id="detailed-sky-toggle"', html)
        self.assertIn("🗺️ Show detailed sky map", html)

    def test_toggle_wired_in_app_js(self):
        with open(os.path.join(REPO_ROOT, "web", "app.js"),
                  encoding="utf-8") as f:
            appjs = f.read()
        self.assertIn("kairos_detailed_sky_map", appjs)
        self.assertIn("initDetailedSkyToggle", appjs)
        self.assertIn("applySkyViewVisibility", appjs)

    def test_root_loads_sky_mirror_after_astronomy_engine(self):
        """sky_mirror.js drives CelestialMetrics, so the astronomy engine
        must be loaded first."""
        html = self.client.get("/").get_data(as_text=True)
        self.assertLess(
            html.index('<script src="static/js/astronomy_engine.js"></script>'),
            html.index('<script src="static/js/sky_mirror.js"></script>'))

    def test_service_worker_caches_sky_mirror(self):
        with open(os.path.join(REPO_ROOT, "web", "sw.js"),
                  encoding="utf-8") as f:
            sw = f.read()
        self.assertIn("static/js/sky_mirror.js", sw)

    def test_watch_face_does_not_load_sky_mirror(self):
        """The isolated watch face stays a pure solar clock."""
        html = self.client.get("/watch.html").get_data(as_text=True)
        self.assertNotIn('src="static/js/sky_mirror.js"', html)



@requires_node
class TestSkyMirrorJs(unittest.TestCase):
    def _run(self, script):
        proc = subprocess.run(["node", "-e", script], capture_output=True,
                              text=True, encoding="utf-8", cwd=REPO_ROOT)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        return json.loads(proc.stdout)

    def test_engine_file_is_valid_js(self):
        proc = subprocess.run(["node", "--check",
                               "web/static/js/sky_mirror.js"],
                              capture_output=True, text=True, cwd=REPO_ROOT)
        self.assertEqual(proc.returncode, 0, proc.stderr)

    def test_mirror_xy_mapping(self):
        """Alt 0° sits ON the horizon (y=70), the zenith rises towards y=30;
        south is up (x=50), east is left (x<50), west is right (x>50)."""
        script = (
            "const sm = require('./web/static/js/sky_mirror.js');\n"
            "process.stdout.write(JSON.stringify({\n"
            "  horizonSouth: sm.mirrorXY(0, 180),\n"
            "  zenith: sm.mirrorXY(90, 180),\n"
            "  east: sm.mirrorXY(45, 90),\n"
            "  west: sm.mirrorXY(45, 270),\n"
            "  noonSun: sm.mirrorXY(45, 180)\n"
            "}));\n"
        )
        out = self._run(script)
        self.assertAlmostEqual(out["horizonSouth"]["x"], 50.0)
        self.assertAlmostEqual(out["horizonSouth"]["y"], 70.0)
        self.assertAlmostEqual(out["zenith"]["y"], 30.0)
        self.assertLess(out["east"]["x"], 50.0)
        self.assertGreater(out["west"]["x"], 50.0)
        self.assertAlmostEqual(out["noonSun"]["x"], 50.0)
        self.assertAlmostEqual(out["noonSun"]["y"], 50.0)

    def test_sky_colors_day_twilight_night(self):
        script = (
            "const sm = require('./web/static/js/sky_mirror.js');\n"
            "process.stdout.write(JSON.stringify({\n"
            "  day: sm.skyColors(30),\n"
            "  night: sm.skyColors(-20),\n"
            "  twilightLow: sm.skyColors(-5),\n"
            "  twilightHigh: sm.skyColors(10)\n"
            "}));\n"
        )
        out = self._run(script)
        self.assertEqual(out["day"], {"top": "#2a5a8a", "bottom": "#4a8aba"})
        self.assertEqual(out["night"], {"top": "#0a0a1a", "bottom": "#1a1a2a"})
        # Twilight endpoints blend INTO day, not jump.
        self.assertTrue(out["twilightHigh"]["top"].startswith("rgb"))
        self.assertTrue(out["twilightLow"]["bottom"].startswith("rgb"))

    def test_bead_visibility_boundaries(self):
        script = (
            "const sm = require('./web/static/js/sky_mirror.js');\n"
            "process.stdout.write(JSON.stringify({\n"
            "  atMinus10: sm.beadVisibility(-10),\n"
            "  belowMinus10: sm.beadVisibility(-11),\n"
            "  atPlus10: sm.beadVisibility(10)\n"
            "}));\n"
        )
        out = self._run(script)
        self.assertEqual(out["atMinus10"], {"opacity": 0, "visible": True})
        self.assertFalse(out["belowMinus10"]["visible"])
        self.assertEqual(out["atPlus10"]["opacity"], 1)

    def test_eclipse_detection_tolerances(self):
        """Same tolerances as canvas_renderer: az ≤ ~1.7°, alt ≤ 5°,
        node ≤ ~19° (0.33 rad) — all three required."""
        script = (
            "const sm = require('./web/static/js/sky_mirror.js');\n"
            "process.stdout.write(JSON.stringify({\n"
            "  eclipse: sm.detectEclipse(30, 200, 30.5, 200.5, 0),\n"
            "  nodeTooFar: sm.detectEclipse(30, 200, 30.5, 200.5, 0.5),\n"
            "  azTooFar: sm.detectEclipse(30, 200, 30, 210, 0),\n"
            "  altTooFar: sm.detectEclipse(30, 200, 40, 200, 0)\n"
            "}));\n"
        )
        out = self._run(script)
        self.assertTrue(out["eclipse"])
        self.assertFalse(out["nodeTooFar"])
        self.assertFalse(out["azTooFar"])
        self.assertFalse(out["altTooFar"])

    def test_compute_state_day_and_night(self):
        script = (
            "const sm = require('./web/static/js/sky_mirror.js');\n"
            "const day = sm.computeSkyMirrorState(45, 180, 20, 120, 1.0);\n"
            "const night = sm.computeSkyMirrorState(-20, 180, 40, 200, 1.0);\n"
            "process.stdout.write(JSON.stringify({ day, night }));\n"
        )
        out = self._run(script)
        self.assertTrue(out["day"]["sun"]["visible"])
        self.assertAlmostEqual(out["day"]["sun"]["x"], 50.0)
        self.assertAlmostEqual(out["day"]["sun"]["y"], 50.0)
        self.assertFalse(out["day"]["eclipse"])
        self.assertEqual(out["day"]["starOpacity"], 0)
        self.assertFalse(out["night"]["sun"]["visible"])
        self.assertGreater(out["night"]["starOpacity"], 0.5)
        self.assertTrue(out["night"]["moon"]["visible"])
        self.assertIn("linear-gradient", out["day"]["gradient"])

    def test_update_sky_mirror_without_dom_is_noop(self):
        """Node / offline contexts must never crash."""
        script = (
            "const sm = require('./web/static/js/sky_mirror.js');\n"
            "sm.updateSkyMirror();\n"
            "process.stdout.write(JSON.stringify({ ok: true }));\n"
        )
        out = self._run(script)
        self.assertTrue(out["ok"])


if __name__ == "__main__":
    unittest.main()
