"""Web test: i18n layer (web/i18n.js).

Pins the translation catalog: every language must share the English key set
(so adding a language with a missing key fails CI), and the helpers must
interpolate variables and fall back to canonical names for proper nouns.
Runs under Node with a minimal localStorage stub, like test_tabs_web.py.
"""

import json
import os
import shutil
import subprocess
import unittest

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JS_MODULE = "web/i18n.js"

requires_node = unittest.skipUnless(shutil.which("node"),
                                    "requires the 'node' runtime")

_NODE_SCRIPT = r"""
const storage = {};
global.localStorage = {
    getItem: (k) => (k in storage ? storage[k] : null),
    setItem: (k, v) => { storage[k] = String(v); },
    removeItem: (k) => { delete storage[k]; }
};
const i = require('./""" + JS_MODULE + r"""');
const en = Object.keys(i.CATALOG.en).sort();
const out = {
    langs: i.LANGS,
    parity: {},
    enCount: en.length,
    allKeys: en,
    interpolation: i.t('share.living_in', { moment: 'X' }),
    nameFallback: i.trName('month.', 'Solaris'),
    zhSeason: i.CATALOG.zh['season.Radiance'],
    tFallback: i.t('does.not.exist'),
    fallbackLang: i.normalizeLang('pt'),
    currentLang: i.currentLang()
};
i.setLang('nl');
out.tNl = i.t('app.tagline');
out.tNlAfterSwitch = i.t('app.tagline');
out.currentLangAfter = i.currentLang();
out.kairosName = i.trName('day.', 'Sundial');
for (const lang of i.LANGS) {
    const keys = Object.keys(i.CATALOG[lang]).sort();
    out.parity[lang] = JSON.stringify(keys) === JSON.stringify(en);
}
process.stdout.write(JSON.stringify(out));
"""


@requires_node
class TestI18nWeb(unittest.TestCase):
    def _run(self):
        proc = subprocess.run(["node", "-e", _NODE_SCRIPT],
                              capture_output=True, text=True,
                              encoding="utf-8", cwd=REPO_ROOT)
        if proc.returncode != 0:
            raise AssertionError(f"node failed: {proc.stderr}")
        return json.loads(proc.stdout)

    def test_language_list(self):
        self.assertEqual(self._run()["langs"],
                         ["en", "nl", "fy", "de", "fr", "es", "zh"])

    def test_key_parity_all_languages(self):
        out = self._run()
        self.assertTrue(all(out["parity"].values()), out["parity"])
        # Guard: the catalog must never silently lose entries. Update this
        # number intentionally when you add new UI strings.
        self.assertEqual(out["enCount"], 817)

    def test_interpolation(self):
        self.assertEqual(self._run()["interpolation"], "Living in X")

    def test_name_fallback_keeps_proper_nouns(self):
        out = self._run()
        self.assertEqual(out["nameFallback"], "Solaris")
        self.assertEqual(out["kairosName"], "Zonnewijzer")  # Sundial (nl)

    def test_zh_translation(self):
        self.assertEqual(self._run()["zhSeason"], "光辉")  # Radiance

    def test_set_lang_persists(self):
        out = self._run()
        self.assertEqual(out["currentLangAfter"], "nl")
        self.assertEqual(out["tNlAfterSwitch"], "tijd die je observeert")

    def test_unknown_key_and_lang_fallback(self):
        out = self._run()
        self.assertEqual(out["tFallback"], "does.not.exist")
        self.assertEqual(out["fallbackLang"], "en")

    def test_all_data_i18n_html_keys_exist(self):
        """Every data-i18n* key used in web/index.html must be in the catalog."""
        import re

        html_path = os.path.join(REPO_ROOT, "web", "index.html")
        with open(html_path, encoding="utf-8") as f:
            html = f.read()
        out = self._run()
        en = out["enCount"]  # sanity: catalog loaded
        self.assertGreater(en, 0)
        pattern = re.compile(r'data-i18n(?:-placeholder|-title|-html|-alt)?="([^"]+)"')
        keys = set(pattern.findall(html))
        missing = [k for k in sorted(keys) if k not in set(out["allKeys"])]
        self.assertEqual(missing, [])


if __name__ == "__main__":
    unittest.main()
