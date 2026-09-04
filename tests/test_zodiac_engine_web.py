"""Web test: the Star Sign engine (old tropical vs. true sidereal).

web/static/js/zodiac_engine.js reads the same sky through two wheels:

  · TROPICAL (old) — 12 signs of 30°, season-based, anchored to the March
    equinox (0° ≈ day 80), the inherited Western zodiac.
  · SIDEREAL (true) — the 13 REAL constellations on the Sun's path by their
    IAU boundary dates: unequal spans (Virgo ~45 days, Scorpius only ~7),
    with Ophiuchus between Scorpius and Sagittarius. No offset model — the
    ~24° drift is baked into where the Sun truly stands.

The birthday never leaves the device (localStorage 'kairos_birthday', set in
⚙️ Configure → 📅 Birthday); without it the engine reads today's sky. The
star-sign section renders inside the "Today's energy" card via
help.js → renderTodaysEnergy.
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


class TestZodiacEngineServed(unittest.TestCase):
    def setUp(self):
        app.config["TESTING"] = True
        self.client = app.test_client()

    def test_zodiac_engine_js_served(self):
        resp = self.client.get("/static/js/zodiac_engine.js")
        self.assertEqual(resp.status_code, 200)
        self.assertIn(b"getStarSigns", resp.data)
        self.assertIn(b"buildStarSignHTML", resp.data)
        self.assertIn("Ophiuchus".encode("utf-8"), resp.data)
        self.assertIn(b"SIDEREAL_SIGNS", resp.data)

    def test_root_loads_zodiac_engine_after_help_before_kst(self):
        """help.js renders the energy card; the engine must load after it
        declares renderTodaysEnergy and before kst_display triggers renders."""
        html = self.client.get("/").get_data(as_text=True)
        self.assertLess(
            html.index('<script src="help.js"></script>'),
            html.index('<script src="static/js/zodiac_engine.js"></script>'))
        self.assertLess(
            html.index('<script src="static/js/zodiac_engine.js"></script>'),
            html.index('<script src="kst_display.js"></script>'))

    def test_configure_panel_has_birthday_input(self):
        html = self.client.get("/").get_data(as_text=True)
        self.assertIn('id="birthday-input"', html)
        self.assertIn('type="date"', html)

    def test_service_worker_caches_zodiac_engine(self):
        with open(os.path.join(REPO_ROOT, "web", "sw.js"),
                  encoding="utf-8") as f:
            sw = f.read()
        self.assertIn("static/js/zodiac_engine.js", sw)

    def test_watch_face_does_not_load_zodiac_engine(self):
        """The isolated watch face stays a pure solar clock — the star-sign
        layer is a main-app feature and must not leak in."""
        html = self.client.get("/watch.html").get_data(as_text=True)
        self.assertNotIn('src="static/js/zodiac_engine.js"', html)


@requires_node
class TestZodiacEngineJs(unittest.TestCase):
    def _run(self, script):
        proc = subprocess.run(["node", "-e", script], capture_output=True,
                              text=True, encoding="utf-8", cwd=REPO_ROOT)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        return json.loads(proc.stdout)

    def test_engine_file_is_valid_js(self):
        proc = subprocess.run(["node", "--check",
                               "web/static/js/zodiac_engine.js"],
                              capture_output=True, text=True, cwd=REPO_ROOT)
        self.assertEqual(proc.returncode, 0, proc.stderr)

    def test_ecliptic_longitude_anchored_to_equinox(self):
        """0° is the March equinox, not January 1 (the addendum's original
        Jan-1 anchor shifted the whole wheel by ~80 days)."""
        script = (
            "const z = require('./web/static/js/zodiac_engine.js');\n"
            "process.stdout.write(JSON.stringify({\n"
            "  equinox: z.getEclipticLongitude(new Date(2026, 2, 21)),\n"
            "  jan1: z.getEclipticLongitude(new Date(2026, 0, 1))\n"
            "}));\n"
        )
        out = self._run(script)
        self.assertAlmostEqual(out["equinox"], 0.0, delta=0.5)
        self.assertAlmostEqual(out["jan1"], 282.11, delta=0.5)

    def test_tropical_sign_known_dates(self):
        script = (
            "const z = require('./web/static/js/zodiac_engine.js');\n"
            "process.stdout.write(JSON.stringify({\n"
            "  apr9: z.getTropicalSign(new Date(2026, 3, 9)).name,\n"
            "  jan1: z.getTropicalSign(new Date(2026, 0, 1)).name,\n"
            "  aug1: z.getTropicalSign(new Date(2026, 7, 1)).name\n"
            "}));\n"
        )
        out = self._run(script)
        self.assertEqual(out["apr9"], "Aries")
        self.assertEqual(out["jan1"], "Capricornus")
        self.assertEqual(out["aug1"], "Leo")

    def test_all_thirteen_sidereal_signs_reachable(self):
        """Every IAU constellation hosts the Sun at some point in the year —
        Ophiuchus AND tiny Scorpius (7 days) must both occur."""
        script = (
            "const z = require('./web/static/js/zodiac_engine.js');\n"
            "const seen = new Set();\n"
            "for (let m = 0; m < 12; m++) {\n"
            "  for (let d = 1; d <= 31; d++) {\n"
            "    const date = new Date(2026, m, d);\n"
            "    if (date.getMonth() !== m) continue;\n"
            "    seen.add(z.getSiderealSign(date).name);\n"
            "  }\n"
            "}\n"
            "process.stdout.write(JSON.stringify([...seen]));\n"
        )
        out = self._run(script)
        self.assertEqual(len(out), 13)
        self.assertIn("Ophiuchus", out)
        self.assertIn("Pisces", out)
        self.assertIn("Aries", out)

    def test_sidereal_iau_known_dates(self):
        """The true sign follows the IAU constellation boundaries, not the
        inherited wheel: Oct 10 → Virgo (real sky), Dec 1 → Ophiuchus,
        Aug 1 → Cancer (tropical Leo), Jan 10 → Sagittarius."""
        script = (
            "const z = require('./web/static/js/zodiac_engine.js');\n"
            "const f = (m, d) => ({\n"
            "  t: z.getTropicalSign(new Date(2026, m, d)).name,\n"
            "  s: z.getSiderealSign(new Date(2026, m, d)).name });\n"
            "process.stdout.write(JSON.stringify({\n"
            "  oct10: f(9, 10), dec1: f(11, 1), aug1: f(7, 1), jan10: f(0, 10)\n"
            "}));\n"
        )
        out = self._run(script)
        self.assertEqual(out["oct10"], {"t": "Libra", "s": "Virgo"})
        self.assertEqual(out["dec1"], {"t": "Sagittarius", "s": "Ophiuchus"})
        self.assertEqual(out["aug1"], {"t": "Leo", "s": "Cancer"})
        self.assertEqual(out["jan10"], {"t": "Capricornus", "s": "Sagittarius"})

    def test_get_star_signs_with_saved_birthday(self):
        script = (
            "global.localStorage = {\n"
            "    getItem: (k) => (k === 'kairos_birthday' ? '1990-04-09' : null),\n"
            "    setItem: () => {}, removeItem: () => {}\n"
            "};\n"
            "const z = require('./web/static/js/zodiac_engine.js');\n"
            "const s = z.getStarSigns();\n"
            "process.stdout.write(JSON.stringify({\n"
            "  hasBirthday: s.hasBirthday,\n"
            "  tropical: s.tropical.name, sidereal: s.sidereal.name,\n"
            "  offset: s.offset, strengths: s.strengths.length,\n"
            "  element: s.attributes.element\n"
            "}));\n"
        )
        out = self._run(script)
        self.assertTrue(out["hasBirthday"])
        self.assertEqual(out["tropical"], "Aries")
        self.assertEqual(out["sidereal"], "Pisces")
        self.assertEqual(out["offset"], 24)
        self.assertEqual(out["strengths"], 5)
        self.assertIn("Water", out["element"])

    def test_get_star_signs_without_localstorage(self):
        """Offline & storage-less contexts fall back to today's sky."""
        script = (
            "const z = require('./web/static/js/zodiac_engine.js');\n"
            "const s = z.getStarSigns();\n"
            "process.stdout.write(JSON.stringify({\n"
            "  hasBirthday: s.hasBirthday,\n"
            "  tropical: s.tropical.name, sidereal: s.sidereal.name\n"
            "}));\n"
        )
        out = self._run(script)
        self.assertFalse(out["hasBirthday"])
        self.assertTrue(out["tropical"])
        self.assertTrue(out["sidereal"])

    def test_build_star_sign_html_pure_string(self):
        """buildStarSignHTML touches no DOM — usable under node and safely
        appended by help.js in the browser."""
        script = (
            "global.localStorage = {\n"
            "    getItem: (k) => (k === 'kairos_birthday' ? '1990-04-09' : null),\n"
            "    setItem: () => {}, removeItem: () => {}\n"
            "    };\n"
            "const z = require('./web/static/js/zodiac_engine.js');\n"
            "const html = z.buildStarSignHTML();\n"
            "process.stdout.write(JSON.stringify({\n"
            "  section: html.includes('id=\"star-sign-section\"'),\n"
            "  dual: html.includes('True · Real Sky') && html.includes('Old · Tropical'),\n"
            "  versus: html.includes('>VS<'),\n"
            "  feeling: html.includes('You were born under the constellation of'),\n"
            "  strengths: html.includes('Your Strengths'),\n"
            "  drift: html.includes('24° drift')\n"
            "}));\n"
        )
        out = self._run(script)
        self.assertTrue(all(out.values()), out)

    def test_same_sign_shows_unified_profile_not_comparison(self):
        """When both wheels agree (Aug 15: tropical Leo = real-sky Leo), the
        section shows ONE unified card — no VS comparison."""
        script = (
            "global.localStorage = {\n"
            "    getItem: (k) => (k === 'kairos_birthday' ? '1990-08-15' : null),\n"
            "    setItem: () => {}, removeItem: () => {}\n"
            "};\n"
            "const z = require('./web/static/js/zodiac_engine.js');\n"
            "const s = z.getStarSigns();\n"
            "const html = z.buildStarSignHTML();\n"
            "process.stdout.write(JSON.stringify({\n"
            "  tropical: s.tropical.name, sidereal: s.sidereal.name,\n"
            "  agree: html.includes('both wheels agree'),\n"
            "  noVersus: !html.includes('>VS<'),\n"
            "  feeling: html.includes('and there the Sun still stands')\n"
            "}));\n"
        )
        out = self._run(script)
        self.assertEqual(out["tropical"], "Leo")
        self.assertEqual(out["sidereal"], "Leo")
        self.assertTrue(out["agree"])
        self.assertTrue(out["noVersus"])
        self.assertTrue(out["feeling"])


if __name__ == "__main__":
    unittest.main()

