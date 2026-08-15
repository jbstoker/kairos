"""Web test: the observation-method calibrator (web/observation_methods.js).

Sunrise+Sunset and Equal-Shadows both find solar noon as the midpoint of two
observed moments. The pure state machine lives in the browser module; this
test pins it under Node so the PWA behaviour is verified without a browser.
"""

import json
import os
import shutil
import subprocess
import unittest

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JS_MODULE = "web/observation_methods.js"

requires_node = unittest.skipUnless(shutil.which("node"),
                                    "requires the 'node' runtime")


def _run_js(script):
    full = "const om = require('./" + JS_MODULE + "');\n" + script
    proc = subprocess.run(["node", "-e", full], capture_output=True,
                          text=True, cwd=REPO_ROOT)
    if proc.returncode != 0:
        raise AssertionError(f"node failed: {proc.stderr}")
    return proc.stdout.strip()


@requires_node
class TestObservationMethods(unittest.TestCase):
    def test_sunrise_sunset_midpoint(self):
        out = json.loads(_run_js(
            "const cal = om.createCalibrator();\n"
            "const r1 = cal.recordSunrise(new Date(Date.UTC(2024, 7, 15, 6, 30)));\n"
            "const r2 = cal.recordSunset(new Date(Date.UTC(2024, 7, 15, 21, 30)));\n"
            "process.stdout.write(JSON.stringify("
            "{ r1: r1.status, r2: r2.status, noon: r2.noon.toISOString() }));"))
        self.assertEqual(out["r1"], "sunrise_recorded")
        self.assertEqual(out["r2"], "noon")
        # Midpoint of 06:30 and 21:30 UTC → 14:00 UTC.
        self.assertEqual(out["noon"], "2024-08-15T14:00:00.000Z")

    def test_sunset_without_sunrise(self):
        out = _run_js(
            "const cal = om.createCalibrator();\n"
            "const r = cal.recordSunset(new Date(Date.UTC(2024, 7, 15, 21, 30)));\n"
            "process.stdout.write(JSON.stringify(r.status));")
        self.assertEqual(json.loads(out), "need_sunrise")

    def test_equal_shadows_midpoint(self):
        out = json.loads(_run_js(
            "const cal = om.createCalibrator();\n"
            "const r1 = cal.recordEqualShadow(new Date(Date.UTC(2024, 7, 15, 9, 0)));\n"
            "const r2 = cal.recordEqualShadow(new Date(Date.UTC(2024, 7, 15, 17, 0)));\n"
            "process.stdout.write(JSON.stringify("
            "{ r1: r1.status, r2: r2.status, noon: r2.noon.toISOString() }));"))
        self.assertEqual(out["r1"], "shadow_first")
        self.assertEqual(out["r2"], "noon")
        # Midpoint of 09:00 and 17:00 UTC → 13:00 UTC.
        self.assertEqual(out["noon"], "2024-08-15T13:00:00.000Z")

    def test_sessions_reset_after_completion(self):
        # A completed pair clears the session, so a new pair starts clean.
        out = json.loads(_run_js(
            "const cal = om.createCalibrator();\n"
            "cal.recordEqualShadow(new Date(1));\n"
            "cal.recordEqualShadow(new Date(3));\n"
            "const r1 = cal.recordEqualShadow(new Date(5));\n"
            "const r2 = cal.recordEqualShadow(new Date(7));\n"
            "process.stdout.write(JSON.stringify("
            "{ r1: r1.status, r2: r2.status, noon: r2.noon.toISOString() }));"))
        self.assertEqual(out["r1"], "shadow_first")
        self.assertEqual(out["r2"], "noon")
        self.assertEqual(out["noon"], "1970-01-01T00:00:00.006Z")

    def test_sunrise_cleared_after_sunset(self):
        out = json.loads(_run_js(
            "const cal = om.createCalibrator();\n"
            "cal.recordSunrise(new Date(Date.UTC(2024, 7, 15, 6, 0)));\n"
            "const done = cal.recordSunset(new Date(Date.UTC(2024, 7, 15, 20, 0)));\n"
            "const again = cal.recordSunset(new Date(Date.UTC(2024, 7, 15, 21, 0)));\n"
            "process.stdout.write(JSON.stringify("
            "{ done: done.status, again: again.status }));"))
        self.assertEqual(out["done"], "noon")
        self.assertEqual(out["again"], "need_sunrise")

    def test_reset(self):
        out = _run_js(
            "const cal = om.createCalibrator();\n"
            "cal.recordSunrise(new Date(1));\n"
            "const r = cal.recordSunset(new Date(3));\n"
            "const after = cal.reset();\n"
            "process.stdout.write(JSON.stringify("
            "{ r: r.status, after: after.status }));")
        out = json.loads(out)
        self.assertEqual(out["r"], "noon")
        self.assertEqual(out["after"], "reset")


if __name__ == "__main__":
    unittest.main()
