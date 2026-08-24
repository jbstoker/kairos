"""Web test: the Kairos Dual-Time Logic (orbital text ↔ visual dial).

web/static/js/kairos_dual_time.js separates the GLOBAL ORBITAL TIME from the
LOCAL VISUAL SKY:
  · ORBITAL_TEXT  — getOrbitalTimestamp(currentPulses) → "SS:BB:PP", a pure
    count that never changes with location.
  · SUN_AZIMUTH   — getPhysicalSunAzimuth(lat, lon, date, currentPulses) →
    the Sun's compass bearing at the orbital moment (apparent-solar-midnight
    anchored, via the vendored SunCalc SPA).
  · VISUAL_TIME   — getVisualDialTime(azimuth) → azimuth/360 × 5,096 pulses
    broken into the 26 × 28 × 7 grid (the dial position).
  · DISPLAY RULE  — the sun hand points to SUN_AZIMUTH; the text stays
    ORBITAL_TEXT.

It keeps the equation-of-time pulse (5,096 pulses = one apparent solar day),
so the orbital text never drifts from the real sky.
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


class TestKairosDualTimeServed(unittest.TestCase):
    def setUp(self):
        app.config["TESTING"] = True
        self.client = app.test_client()

    def test_kairos_dual_time_js_served(self):
        resp = self.client.get("/static/js/kairos_dual_time.js")
        self.assertEqual(resp.status_code, 200)
        self.assertIn(b"getOrbitalTimestamp", resp.data)
        self.assertIn(b"getPhysicalSunAzimuth", resp.data)
        self.assertIn(b"getVisualDialTime", resp.data)
        self.assertIn(b"getDualTime", resp.data)

    def test_root_loads_dual_time_after_engine_before_kst(self):
        """kairos_dual_time.js must load after the Kepler engine (it reuses
        getPulseLength) and before the header builder."""
        html = self.client.get("/").get_data(as_text=True)
        self.assertLess(
            html.index('<script src="static/js/kairos_time.js"></script>'),
            html.index('<script src="static/js/kairos_dual_time.js"></script>'))
        self.assertLess(
            html.index('<script src="static/js/kairos_dual_time.js"></script>'),
            html.index('<script src="kst_display.js"></script>'))

    def test_visual_time_markup_present(self):
        """The VISUAL dial position line lives in the Kairos Kepler info
        panel."""
        html = self.client.get("/").get_data(as_text=True)
        self.assertIn('id="visual-time"', html)

    def test_watch_face_does_not_load_dual_time(self):
        """The isolated watch face stays a pure solar clock — the Dual-Time
        layer is a main-app reading option and must not leak in."""
        html = self.client.get("/watch.html").get_data(as_text=True)
        self.assertNotIn('src="static/js/kairos_dual_time.js"', html)


@requires_node
class TestKairosDualTimeJs(unittest.TestCase):
    def _run(self, script):
        proc = subprocess.run(["node", "-e", script], capture_output=True,
                              text=True, encoding="utf-8", cwd=REPO_ROOT)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        return json.loads(proc.stdout)

    def test_engine_file_is_valid_js(self):
        proc = subprocess.run(["node", "--check",
                               "web/static/js/kairos_dual_time.js"],
                              capture_output=True, text=True, cwd=REPO_ROOT)
        self.assertEqual(proc.returncode, 0, proc.stderr)

    def test_orbital_timestamp_breakdown(self):
        script = (
            "const dt = require('./web/static/js/kairos_dual_time.js');\n"
            "process.stdout.write(JSON.stringify({\n"
            "  zero: dt.getOrbitalTimestamp(0),\n"
            "  stride: dt.getOrbitalTimestamp(196),\n"
            "  noon: dt.getOrbitalTimestamp(2548),\n"
            "  last: dt.getOrbitalTimestamp(5095),\n"
            "  clamped: dt.getOrbitalTimestamp(5096)\n"
            "}));\n"
        )
        out = self._run(script)
        self.assertEqual(out["zero"], "01:01:01")
        self.assertEqual(out["stride"], "02:01:01")
        self.assertEqual(out["noon"], "14:01:01")
        self.assertEqual(out["last"], "26:28:07")
        self.assertEqual(out["clamped"], "26:28:07")

    def test_visual_dial_time(self):
        script = (
            "const dt = require('./web/static/js/kairos_dual_time.js');\n"
            "process.stdout.write(JSON.stringify({\n"
            "  north: dt.getVisualDialTime(0),\n"
            "  east: dt.getVisualDialTime(90),\n"
            "  south: dt.getVisualDialTime(180),\n"
            "  west: dt.getVisualDialTime(270),\n"
            "  full: dt.getVisualDialTime(360)\n"
            "}));\n"
        )
        out = self._run(script)
        self.assertEqual(out["north"]["visualPulses"], 0)
        self.assertEqual(out["north"]["formatted"], "01:01:01")
        self.assertEqual(out["east"], {"visualPulses": 1274, "stride": 7,
                                       "beat": 15, "pulse": 1,
                                       "formatted": "07:15:01"})
        self.assertEqual(out["south"], {"visualPulses": 2548, "stride": 14,
                                        "beat": 1, "pulse": 1,
                                        "formatted": "14:01:01"})
        self.assertEqual(out["west"]["visualPulses"], 3822)
        self.assertEqual(out["west"]["formatted"], "20:15:01")
        # 360° wraps to 0°.
        self.assertEqual(out["full"]["visualPulses"], 0)
        self.assertEqual(out["full"]["formatted"], "01:01:01")

    def test_calculate_pulse_length(self):
        script = (
            "const kt = require('./web/static/js/kairos_time.js');\n"
            "global.getPulseLength = kt.getPulseLength;\n"
            "const dt = require('./web/static/js/kairos_dual_time.js');\n"
            "process.stdout.write(JSON.stringify({\n"
            "  jan: dt.calculatePulseLength(new Date(Date.UTC(2024, 0, 1, 12))),\n"
            "  jun: dt.calculatePulseLength(new Date(Date.UTC(2024, 5, 21, 12)))\n"
            "}));\n"
        )
        out = self._run(script)
        for v in out.values():
            self.assertTrue(16.9 < v < 17.0, v)
        self.assertNotAlmostEqual(out["jan"], out["jun"], places=4)

    def test_physical_sun_azimuth_at_orbital_noon(self):
        """Pulse 2,548 is apparent solar noon → the Sun is due south
        (≈180°) for a northern observer, matching the live azimuth."""
        script = (
            "global.SunCalc = require('./web/lib/suncalc.js');\n"
            "const kt = require('./web/static/js/kairos_time.js');\n"
            "global.getPulseLength = kt.getPulseLength;\n"
            "const dt = require('./web/static/js/kairos_dual_time.js');\n"
            "const loc = { lat: 53.1503, lon: 5.8389 };\n"
            "const noon = global.SunCalc.getTimes(\n"
            "    new Date(2026, 7, 21, 12, 0, 0), loc.lat, loc.lon).solarNoon;\n"
            "const az = dt.getPhysicalSunAzimuth(loc.lat, loc.lon, noon, 2548);\n"
            "const live = global.SunCalc.getPosition(noon, loc.lat, loc.lon);\n"
            "const liveNorth = ((((live.azimuth + Math.PI) % (2 * Math.PI)) + 2 * Math.PI)\n"
            "    % (2 * Math.PI)) * 180 / Math.PI;\n"
            "process.stdout.write(JSON.stringify({ az, liveNorth }));\n"
        )
        out = self._run(script)
        self.assertAlmostEqual(out["az"], 180.0, delta=5.0)
        self.assertAlmostEqual(out["az"], out["liveNorth"], delta=5.0)

    def test_physical_sun_azimuth_requires_suncalc(self):
        script = (
            "const kt = require('./web/static/js/kairos_time.js');\n"
            "global.getPulseLength = kt.getPulseLength;\n"
            "const dt = require('./web/static/js/kairos_dual_time.js');\n"
            "process.stdout.write(JSON.stringify(\n"
            "  dt.getPhysicalSunAzimuth(52, 5, new Date(), 2548)));\n"
        )
        out = self._run(script)
        self.assertIsNone(out)

    def test_dual_time_snapshot(self):
        script = (
            "const REAL = Date;\n"
            "const FIXED = new REAL(2026, 0, 15, 12, 0, 0).getTime();\n"
            "class FakeDate extends REAL {\n"
            "  constructor(...args) { super(...(args.length ? args : [FIXED])); }\n"
            "  static now() { return FIXED; }\n"
            "}\n"
            "global.Date = FakeDate;\n"
            "global.localStorage = { getItem: () => null, setItem: () => {} };\n"
            "const kt = require('./web/static/js/kairos_time.js');\n"
            "global.getKairosKeplerTime = kt.getKairosKeplerTime;\n"
            "global.getPulseLength = kt.getPulseLength;\n"
            "global.getSolarAzimuth = () => 180;\n"
            "const dt = require('./web/static/js/kairos_dual_time.js');\n"
            "process.stdout.write(JSON.stringify(dt.getDualTime()));\n"
        )
        out = self._run(script)
        self.assertEqual(out["orbitalText"], "14:01:01")
        self.assertEqual(out["sunAzimuth"], 180)
        self.assertEqual(out["visualPulses"], 2548)
        self.assertEqual(out["visualTime"], "14:01:01")
        self.assertEqual(out["dayOfYear"], 15)
        self.assertTrue(16.9 < out["pulseLength"] < 17.0, out["pulseLength"])


if __name__ == "__main__":
    unittest.main()
