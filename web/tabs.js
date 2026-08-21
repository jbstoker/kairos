// Kairos tabs — Now / Configure.
//
// The bottom tab bar shows only the button for the view you are NOT on:
// on 🌅 Now only ⚙️ Configure is visible, on ⚙️ Configure only 🌅 Now — so
// the footer always offers exactly one way out of wherever you are.
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
        // Show only the button for the view you are NOT on: the tab you are
        // on hides its own button, so the bottom bar offers one way out of
        // wherever you are (on Now → only ⚙️ Configure; on Configure → only 🌅 Now).
        if (nowBtn) nowBtn.hidden = isNow;
        if (configBtn) configBtn.hidden = !isNow;
        // Keep the active classes for semantics (the hidden button is the
        // active one) and any external styles that read them.
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
