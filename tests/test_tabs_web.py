"""Web test: tab switching (web/tabs.js).

``tabs.js`` is loaded *before* app.js on purpose — tab switching uses one
delegated document-level listener and ES5-only APIs, so the tabs keep
working even if another script fails to load or throws. This test pins that
behaviour under Node with a minimal DOM stub.

Skips when the ``node`` runtime is unavailable (e.g. minimal installs).
"""

import json
import os
import shutil
import subprocess
import unittest

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JS_MODULE = "web/tabs.js"

requires_node = unittest.skipUnless(shutil.which("node"),
                                    "requires the 'node' runtime")

# A tiny DOM stub: five elements, one document with a click-listener store,
# and a parentNode chain that terminates at the document. Loaded *before*
# tabs.js so its document-level wiring attaches.
_NODE_SCRIPT = r"""
const handlers = [];
function makeEl(id) {
    const classes = new Set();
    if (id === 'tabNowBtn' || id === 'tabConfigBtn') classes.add('tab-btn');
    if (id === 'tabNowBtn') classes.add('active');
    const e = {
        id: id,
        hidden: (id === 'tabConfig'),
        _classes: classes,
        classList: {
            add: (c) => e._classes.add(c),
            remove: (c) => e._classes.delete(c),
            contains: (c) => e._classes.has(c)
        },
        getAttribute: (name) => {
            if (name !== 'data-tab') return null;
            if (id === 'tabConfigBtn') return 'config';
            if (id === 'tabNowBtn') return 'now';
            return null;
        },
        parentNode: null
    };
    return e;
}
const elements = {};
['tabNow', 'tabConfig', 'tabNowBtn', 'tabConfigBtn', 'seasonalTuneBtn']
    .forEach(id => elements[id] = makeEl(id));
const documentStub = {
    getElementById: (id) => elements[id] || null,
    addEventListener: (t, fn) => handlers.push(fn),
    parentNode: null
};
const container = {
    parentNode: documentStub,
    classList: { add() {}, remove() {}, contains() { return false; } },
    getAttribute: () => null
};
['tabNowBtn', 'tabConfigBtn', 'seasonalTuneBtn']
    .forEach(id => elements[id].parentNode = container);
global.document = documentStub;
global.window = global;
require('./""" + JS_MODULE + r"""');
function click(el) { handlers.forEach(fn => fn({ target: el })); }
const state = () => JSON.stringify({
    nowHidden: elements.tabNow.hidden,
    cfgHidden: elements.tabConfig.hidden,
    nowActive: elements.tabNowBtn._classes.has('active'),
    cfgActive: elements.tabConfigBtn._classes.has('active'),
    switchTabType: typeof global.switchTab
});
const out = { initial: JSON.parse(state()) };
click(elements.tabConfigBtn);
out.afterConfig = JSON.parse(state());
click(elements.tabNowBtn);
out.afterNow = JSON.parse(state());
click(elements.seasonalTuneBtn);
out.afterTune = JSON.parse(state());
click(container); // a non-tab click must change nothing
out.afterNonTab = JSON.parse(state());
process.stdout.write(JSON.stringify(out));
"""


@requires_node
class TestTabsWeb(unittest.TestCase):
    def _run(self):
        proc = subprocess.run(["node", "-e", _NODE_SCRIPT],
                              capture_output=True, text=True, cwd=REPO_ROOT)
        if proc.returncode != 0:
            raise AssertionError(f"node failed: {proc.stderr}")
        return json.loads(proc.stdout)

    def test_initial_state(self):
        out = self._run()
        self.assertFalse(out["initial"]["nowHidden"])
        self.assertTrue(out["initial"]["cfgHidden"])
        self.assertTrue(out["initial"]["nowActive"])
        self.assertFalse(out["initial"]["cfgActive"])
        self.assertEqual(out["initial"]["switchTabType"], "function")

    def test_click_config_shows_configure(self):
        out = self._run()
        self.assertTrue(out["afterConfig"]["nowHidden"])
        self.assertFalse(out["afterConfig"]["cfgHidden"])
        self.assertFalse(out["afterConfig"]["nowActive"])
        self.assertTrue(out["afterConfig"]["cfgActive"])

    def test_click_now_returns(self):
        out = self._run()
        self.assertFalse(out["afterNow"]["nowHidden"])
        self.assertTrue(out["afterNow"]["cfgHidden"])
        self.assertTrue(out["afterNow"]["nowActive"])

    def test_tune_button_jumps_to_configure(self):
        out = self._run()
        self.assertTrue(out["afterTune"]["nowHidden"])
        self.assertFalse(out["afterTune"]["cfgHidden"])

    def test_non_tab_click_is_ignored(self):
        out = self._run()
        self.assertEqual(out["afterNonTab"], out["afterTune"])


if __name__ == "__main__":
    unittest.main()
