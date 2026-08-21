"""Web test: mobile optimisation (readable + scalable on small screens).

The MOBILE OPTIMIZATION addendum lands as web/static/css/mobile.css and
web/static/js/mobile.js, linked/scripled from web/index.html. The CSS is
adapted to the consolidated #kstDisplay layout — it must target the current
DOM (svg#kairos-observation-matrix, .action-btn, .moon-grid button,
.meta-item, .modal, .seasonal-item) rather than the pre-consolidation
classes (.display, .kst-display, .buttons, .modal-content, .wheel).
"""

import subprocess
import unittest

from web.server import app


class TestMobileCss(unittest.TestCase):
    def setUp(self):
        app.config["TESTING"] = True
        self.client = app.test_client()

    def test_root_links_mobile_assets(self):
        html = self.client.get("/").get_data(as_text=True)
        # The mobile stylesheet follows the main stylesheet in <head>:
        self.assertIn('<link rel="stylesheet" href="style.css">', html)
        self.assertIn('<link rel="stylesheet" href="static/css/mobile.css">',
                      html)
        # The mobile script is the last script, before </body>:
        self.assertIn('<script src="static/js/mobile.js"></script>', html)
        self.assertLess(html.index("static/css/mobile.css"),
                        html.index("static/js/mobile.js"))
        self.assertLess(html.index("static/js/mobile.js"),
                        html.index("</body>"))

    def test_mobile_css_served_with_current_dom_targets(self):
        css = self.client.get("/static/css/mobile.css").get_data(as_text=True)
        self.assertIn("@media (max-width: 600px)", css)
        for target in ("svg#kairos-observation-matrix", ".quadrant-label",
                       ".degree-label",
                       ".rosetta-text", ".action-btn", ".moon-grid button",
                       "#kstDisplay", ".meta-item",
                       "#eclipse-status:not(:empty)", ".seasonal-item",
                       ".modal", ".tab-btn", "-webkit-text-size-adjust"):
            self.assertIn(target, css)
        # Stale pre-consolidation selectors must not be revived (the brace
        # suffix keeps the header comment and .display-header out of scope):
        for stale in (".kst-display {", ".kst-row {", ".modal-content {",
                      "#observationPanel", ".buttons button {", ".wheel {",
                      ".display {"):
            self.assertNotIn(stale, css)

    def test_mobile_js_served_and_parses(self):
        js = self.client.get("/static/js/mobile.js").get_data(as_text=True)
        self.assertIn("DOMContentLoaded", js)
        self.assertIn("seasonal-item", js)
        self.assertIn("kstDisplay", js)
        proc = subprocess.run(["node", "--check", "-"], input=js, text=True,
                              capture_output=True)
        self.assertEqual(proc.returncode, 0, proc.stderr)


if __name__ == "__main__":
    unittest.main()
