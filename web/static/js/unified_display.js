/**
 * Kairos — Unified Adaptive Display (no Gregorian in the header).
 *
 * FINAL UNIFIED HEADER addendum, adapted to the consolidated #kstDisplay:
 * the Gregorian reference already lives only in the matrix's centre clock,
 * so this layer (a) adds the compact #tradition-selector to the panel header
 * (kept in sync with the Configure tab's #traditionSelect), and (b) makes
 * the primary #kstDisplayLine show the SELECTED tradition's real calendar
 * date instead of a hardcoded string.
 *
 * The addendum's window.updateDisplay(kairosString, tradition) API is kept,
 * but app.js already owns a global updateDisplay() — this wrapper preserves
 * BOTH call styles:
 *   · updateDisplay()                            → app.js's context-label refresh
 *   · updateDisplay(kairosString, tradition)     → tradition-aware primary line
 */
(function () {
    "use strict";

    const I18n = (typeof window !== 'undefined' && window.KairosI18n) || null;
    const trName = I18n ? I18n.trName.bind(I18n) : (prefix, name) => name;

    // The last Kairos-lens line built by web/kst_display.js — the baseline the
    // primary line switches back to (or rebuilds from) when a tradition is on.
    window.__lastKairosString = '';

    function getSelectedTradition() {
        // #traditionSelect is already synced from localStorage by app.js at
        // load, so it is the source of truth; the header selector mirrors it.
        const config = document.getElementById('traditionSelect');
        if (config && config.value) return config.value;
        const header = document.getElementById('tradition-selector');
        if (header && header.value) return header.value;
        return (typeof getTradition === 'function') ? getTradition() : 'tartarian';
    }

    function setSelectedTradition(value) {
        const header = document.getElementById('tradition-selector');
        const config = document.getElementById('traditionSelect');
        if (header) header.value = value;
        if (config) config.value = value;
        try { localStorage.setItem('kairos_tradition', value); } catch (e) { /* ignore */ }
        updateDisplay();            // 0-arg: context label + primary line refresh
        if (window.refreshKST) window.refreshKST();
    }

    // Real tradition date, reusing app.js's calendar helpers (TRADITIONS,
    // traditionDate, dayOfYear). Rebuilds the line from the Kairos string's
    // time / season / year segments: "14:32 · 🌌 Solaris 16 · ☀️ Radiance · 4.54B".
    function buildTraditionLine(kairosString, tradition) {
        const parts = String(kairosString || '').split(' · ');
        const timeStr = parts[0] || '';
        const season = parts[3] || '';
        const year = parts[4] || '';
        const trad = (typeof TRADITIONS !== 'undefined') ? TRADITIONS[tradition] : null;
        if (!trad || typeof traditionDate !== 'function' ||
            typeof dayOfYear !== 'function') return kairosString;
        const d = traditionDate(dayOfYear(new Date()), trad);
        const emoji = (typeof TRADITION_EMOJI !== 'undefined')
            ? (TRADITION_EMOJI[tradition] || '') : '';
        const datePart = `${emoji} ${trName('month.', d.month)} ${d.day}`;
        return [timeStr, datePart, season, year].filter(Boolean).join(' · ');
    }

    // The addendum's API, merged with app.js's existing updateDisplay().
    const appUpdateDisplay = (typeof window !== 'undefined') ? window.updateDisplay : null;
    window.updateDisplay = function (kairosString, tradition) {
        if (arguments.length === 0 && appUpdateDisplay) {
            // app.js's periodic / setTradition / saveObs refresh — keep it
            // working, then re-apply the primary line with the new tradition.
            appUpdateDisplay();
            const current = getSelectedTradition();
            const header = document.getElementById('tradition-selector');
            const config = document.getElementById('traditionSelect');
            if (header && header.value !== current) header.value = current;
            if (config && config.value !== current) config.value = current;
            if (window.__lastKairosString) {
                window.updateDisplay(window.__lastKairosString, current);
            }
            return;
        }
        const line = document.getElementById('kstDisplayLine');
        if (!line) return;
        window.__lastKairosString = kairosString;
        if (tradition && tradition !== 'rhythm') {
            line.textContent = buildTraditionLine(kairosString, tradition) || kairosString;
        } else {
            line.textContent = kairosString;
        }
    };
    window.getSelectedTradition = getSelectedTradition;
    window.setSelectedTradition = setSelectedTradition;
    window.buildTraditionLine = buildTraditionLine;

    // Keep the header selector in sync with the Configure selector.
    function syncHeaderSelector() {
        const header = document.getElementById('tradition-selector');
        if (!header) return;
        header.value = getSelectedTradition();
        header.addEventListener('change', function () {
            setSelectedTradition(this.value);
        });
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', syncHeaderSelector);
    } else {
        syncHeaderSelector();
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports.getSelectedTradition = getSelectedTradition;
        module.exports.setSelectedTradition = setSelectedTradition;
        module.exports.buildTraditionLine = buildTraditionLine;
    }
})();
