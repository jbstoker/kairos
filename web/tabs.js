// Kairos tabs — Now / Configure.
//
// Loaded before app.js on purpose: tab switching is wired by event
// delegation at the document level and only touches the two panels and two
// buttons, so the tabs keep working even if another script fails to load
// or throws at startup. This is what prevents "the tabs do nothing" from
// any single-file problem (a stale cache, an old browser, a missing id).
//
// Deliberately dependency-free ES5: no optional chaining, no arrow
// functions, no classList.toggle(force) — just getElementById and one
// document-level click listener.

(function (root) {
    'use strict';

    // No DOM (a worker, or a Node test that wants the pure switchTab) →
    // still expose switchTab, but skip the click wiring.
    if (typeof root.document === 'undefined') {
        return;
    }

    function switchTab(name) {
        var isNow = name === 'now';
        var nowPanel = document.getElementById('tabNow');
        var configPanel = document.getElementById('tabConfig');
        if (nowPanel) nowPanel.hidden = !isNow;
        if (configPanel) configPanel.hidden = isNow;
        var nowBtn = document.getElementById('tabNowBtn');
        var configBtn = document.getElementById('tabConfigBtn');
        if (nowBtn) {
            if (isNow) { nowBtn.classList.add('active'); } else { nowBtn.classList.remove('active'); }
        }
        if (configBtn) {
            if (!isNow) { configBtn.classList.add('active'); } else { configBtn.classList.remove('active'); }
        }
    }

    root.switchTab = switchTab;

    // One delegated listener handles the tab buttons. Walking up with
    // parentNode keeps it working when `closest` is unavailable.
    document.addEventListener('click', function (e) {
        var el = e.target;
        while (el && el !== document) {
            if (el.classList && el.classList.contains('tab-btn')) {
                var tab = el.getAttribute('data-tab') ||
                    (el.id === 'tabConfigBtn' ? 'config' : 'now');
                switchTab(tab);
                return;
            }
            el = el.parentNode;
        }
    });
})(typeof window !== 'undefined' ? window : this);
