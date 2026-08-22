"""Web test: the 13-point degree wheel (360/13 = 27.692307…°).

web/static/js/degree_wheel.js renders a DECORATIVE 13-point natural ring
inside the sky-dome SVG (<g id="natural-13-ring">), while the physical
azimuth wheel (0–360° every 30°) stays untouched — so the header degree and
the Sun/Moon beads keep agreeing. The ring is a pure 13-fold division:
DEGREE_POINTS = 13, DEGREE_STEP = 360/13 = 27.6923076923… (repeating), and
getDegreePoints() returns the {angle, label} points. It renders idempotently
on DOMContentLoaded; the placeholder lives in both web/index.html and
web/templates/concentric_view.html (the canonical fragment).
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


class TestDegreeWheelServed(unittest.TestCase):
    def setUp(self):
        app.config["TESTING"] = True
        self.client = app.test_client()

    def test_degree_wheel_js_served(self):
        resp = self.client.get("/static/js/degree_wheel.js")
        self.assertEqual(resp.status_code, 200)
        self.assertIn(b"getDegreePoints", resp.data)
        self.assertIn(b"renderNaturalThirteenRing", resp.data)

    def test_root_has_the_ring_placeholder_and_script(self):
        html = self.client.get("/").get_data(as_text=True)
        self.assertIn('<g id="natural-13-ring"></g>', html)
        self.assertIn('<script src="static/js/degree_wheel.js"></script>',
                      html)

    def test_concentric_template_has_the_same_placeholder(self):
        """The canonical SVG fragment stays in sync with index.html."""
        with open(os.path.join(REPO_ROOT, "web", "templates",
                               "concentric_view.html"), encoding="utf-8") as f:
            frag = f.read()
        self.assertIn('<g id="natural-13-ring"></g>', frag)

    def test_watch_face_does_not_load_degree_wheel(self):
        html = self.client.get("/watch.html").get_data(as_text=True)
        self.assertNotIn('src="static/js/degree_wheel.js"', html)


@requires_node
class TestDegreeWheelJs(unittest.TestCase):
    def _run(self, script):
        proc = subprocess.run(["node", "-e", script], capture_output=True,
                              text=True, encoding="utf-8", cwd=REPO_ROOT)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        return json.loads(proc.stdout)

    def test_math_and_labels(self):
        script = (
            "const dw = require('./web/static/js/degree_wheel.js');\n"
            "process.stdout.write(JSON.stringify({\n"
            "  points: dw.DEGREE_POINTS,\n"
            "  step: dw.DEGREE_STEP,\n"
            "  labels: dw.getDegreePoints().map(p => p.label),\n"
            "  label7: dw.getDegreeLabel(7),\n"
            "  xy0: dw.degreePointXY(0, 250, 400, 400),\n"
            "  xy90: dw.degreePointXY(90, 250, 400, 400)\n"
            "}));\n"
        )
        out = self._run(script)
        self.assertEqual(out["points"], 13)
        self.assertAlmostEqual(out["step"], 360 / 13, places=9)
        labels = out["labels"]
        self.assertEqual(len(labels), 13)
        self.assertEqual(labels[0], "0°")
        self.assertEqual(labels[1], "27.69°")
        self.assertEqual(labels[2], "55.38°")
        self.assertEqual(labels[3], "83.08°")
        self.assertEqual(labels[4], "110.77°")
        self.assertEqual(labels[6], "166.15°")
        self.assertEqual(labels[7], "193.85°")
        self.assertEqual(labels[12], "332.31°")
        self.assertEqual(out["label7"], "193.85°")
        # Wheel angle convention: 0° at the bottom, 90° at the left.
        self.assertAlmostEqual(out["xy0"]["x"], 400, places=6)
        self.assertAlmostEqual(out["xy0"]["y"], 650, places=6)
        self.assertAlmostEqual(out["xy90"]["x"], 150, places=6)
        self.assertAlmostEqual(out["xy90"]["y"], 400, places=6)

    def test_render_ring_is_idempotent(self):
        script = (
            "const dw = require('./web/static/js/degree_wheel.js');\n"
            "const children = [];\n"
            "const host = {\n"
            "  get childElementCount() { return children.length; },\n"
            "  appendChild: (el) => { children.push(el); return el; }\n"
            "};\n"
            "global.document = {\n"
            "  getElementById: (id) => (id === 'natural-13-ring' ? host : null),\n"
            "  createElementNS: () => ({ setAttribute: () => {}, appendChild: () => {} })\n"
            "};\n"
            "const first = dw.renderNaturalThirteenRing();\n"
            "const second = dw.renderNaturalThirteenRing();\n"
            "process.stdout.write(JSON.stringify({ first, second, children: children.length }));\n"
        )
        out = self._run(script)
        # 1 dashed ring circle + 13 dots + 13 labels = 27 elements, once.
        self.assertEqual(out["first"], 27)
        self.assertEqual(out["second"], 27)
        self.assertEqual(out["children"], 27)

    def test_render_without_host_returns_zero(self):
        script = (
            "const dw = require('./web/static/js/degree_wheel.js');\n"
            "global.document = { getElementById: () => null,\n"
            "                     createElementNS: () => ({}) };\n"
            "process.stdout.write(JSON.stringify(dw.renderNaturalThirteenRing()));\n"
        )
        out = self._run(script)
        self.assertEqual(out, 0)

    def test_engine_file_is_valid_js(self):
        proc = subprocess.run(["node", "--check",
                               "web/static/js/degree_wheel.js"],
                              capture_output=True, text=True, cwd=REPO_ROOT)
        self.assertEqual(proc.returncode, 0, proc.stderr)


if __name__ == "__main__":
    unittest.main()
