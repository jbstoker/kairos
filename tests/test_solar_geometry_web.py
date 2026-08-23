"""Web test: solar geometry (Meeus-based declination, web/static/js/solar_geometry.js).

getSolarDeclination(jd) follows the Meeus algorithm (ch. 25, simplified —
nutation ignored, ~0.01° accuracy). It must agree with the Python engine
(core.meeus_algorithms.apparent_declination) at the solstices and equinoxes,
and solarBeamFactors() must give the seasonal beam width (0.7…1.3) and
intensity (0.4…1.0) that drive the virtual Earth's light beam.
"""

import json
import os
import shutil
import subprocess
import unittest

from web.server import app

from core.meeus_algorithms import apparent_declination, julian_day

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

requires_node = unittest.skipUnless(shutil.which("node"),
                                    "requires the 'node' runtime")


class TestSolarGeometryServed(unittest.TestCase):
    def setUp(self):
        app.config["TESTING"] = True
        self.client = app.test_client()

    def test_solar_geometry_js_served(self):
        resp = self.client.get("/static/js/solar_geometry.js")
        self.assertEqual(resp.status_code, 200)
        self.assertIn(b"getSolarDeclination", resp.data)
        self.assertIn(b"getCurrentSolarDeclination", resp.data)
        self.assertIn(b"solarBeamFactors", resp.data)

    def test_root_loads_solar_geometry_before_canvas_renderer(self):
        html = self.client.get("/").get_data(as_text=True)
        self.assertLess(
            html.index('<script src="static/js/solar_geometry.js"></script>'),
            html.index('<script src="static/js/canvas_renderer.js"></script>'))


@requires_node
class TestSolarGeometryJs(unittest.TestCase):
    def _run(self, script):
        proc = subprocess.run(["node", "-e", script], capture_output=True,
                              text=True, encoding="utf-8", cwd=REPO_ROOT)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        return json.loads(proc.stdout)

    def test_declination_agrees_with_python_at_the_seasons(self):
        points = {
            "summer": julian_day(2024, 6, 21, 12.0),
            "winter": julian_day(2024, 12, 21, 12.0),
            "march": julian_day(2024, 3, 20, 12.0),
            "september": julian_day(2024, 9, 22, 12.0)
        }
        script = (
            "const sg = require('./web/static/js/solar_geometry.js');\n"
            "process.stdout.write(JSON.stringify({\n"
            "  summer: sg.getSolarDeclination(" + str(points["summer"]) + "),\n"
            "  winter: sg.getSolarDeclination(" + str(points["winter"]) + "),\n"
            "  march: sg.getSolarDeclination(" + str(points["march"]) + "),\n"
            "  september: sg.getSolarDeclination(" + str(points["september"]) + ")\n"
            "}));\n"
        )
        out = self._run(script)
        for key, jd in points.items():
            self.assertAlmostEqual(out[key], apparent_declination(jd), delta=0.3,
                                   msg=f"{key}: JS vs Python declination")

    def test_declination_bounds_and_live_value(self):
        script = (
            "const sg = require('./web/static/js/solar_geometry.js');\n"
            "process.stdout.write(JSON.stringify({\n"
            "  summer: sg.getSolarDeclination(" + str(julian_day(2024, 6, 21, 12.0)) + "),\n"
            "  winter: sg.getSolarDeclination(" + str(julian_day(2024, 12, 21, 12.0)) + "),\n"
            "  now: sg.getCurrentSolarDeclination()\n"
            "}));\n"
        )
        out = self._run(script)
        self.assertGreater(out["summer"], 20)
        self.assertLess(out["winter"], -20)
        self.assertTrue(-23.45 <= out["now"] <= 23.45)

    def test_beam_factors(self):
        script = (
            "const sg = require('./web/static/js/solar_geometry.js');\n"
            "process.stdout.write(JSON.stringify({\n"
            "  summer: sg.solarBeamFactors(23.44),\n"
            "  equinox: sg.solarBeamFactors(0),\n"
            "  winter: sg.solarBeamFactors(-23.44),\n"
            "  clamped: sg.solarBeamFactors(50)\n"
            "}));\n"
        )
        out = self._run(script)
        self.assertAlmostEqual(out["summer"]["widthFactor"], 1.3)
        self.assertAlmostEqual(out["summer"]["intensityFactor"], 1.0)
        self.assertAlmostEqual(out["equinox"]["widthFactor"], 1.0)
        self.assertAlmostEqual(out["equinox"]["intensityFactor"], 0.7)
        self.assertAlmostEqual(out["winter"]["widthFactor"], 0.7)
        self.assertAlmostEqual(out["winter"]["intensityFactor"], 0.4)
        # Out-of-range declinations clamp to the ±23.44° poles.
        self.assertAlmostEqual(out["clamped"]["widthFactor"], 1.3)

    def test_engine_file_is_valid_js(self):
        proc = subprocess.run(["node", "--check",
                               "web/static/js/solar_geometry.js"],
                              capture_output=True, text=True, cwd=REPO_ROOT)
        self.assertEqual(proc.returncode, 0, proc.stderr)


if __name__ == "__main__":
    unittest.main()
