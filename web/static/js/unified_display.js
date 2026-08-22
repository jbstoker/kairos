/**
 * Kairos — Unified Adaptive Display (no Gregorian in the header).
 *
 * FINAL UNIFIED HEADER addendum, adapted to the consolidated #kstDisplay:
 * the Gregorian reference already lives only in the matrix's centre clock.
 * The tradition is set in the Configure tab via the two lens selectors
 * (#calendar-lens / #energy-lens, see web/static/js/lens_manager.js), and this
 * layer makes the primary #kstDisplayLine show the SELECTED calendar lens's real
 * calendar date instead of a hardcoded string.
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
        // The Calendar Lens is the source of truth (synced from localStorage
        // by lens_manager.js and app.js).
        const config = document.getElementById('calendar-lens');
        if (config && config.value) return config.value;
        if (typeof window.getCalendarLens === 'function') {
            const v = window.getCalendarLens();
            if (v) return v;
        }
        return (typeof getTradition === 'function') ? getTradition() : 'kairos';
    }

    function setSelectedTradition(value) {
        const config = document.getElementById('calendar-lens');
        if (config) config.value = value;
        if (typeof window.setCalendarLens === 'function') {
            window.setCalendarLens(value);   // persists + refreshes display
        } else {
            try { localStorage.setItem('kairos_calendar_lens', value); } catch (e) { /* ignore */ }
            updateDisplay();            // 0-arg: context label + primary line refresh
            if (window.refreshKST) window.refreshKST();
        }
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
            // working, then re-apply the primary line with the current lens.
            appUpdateDisplay();
            const current = getSelectedTradition();
            const config = document.getElementById('calendar-lens');
            if (config && config.value !== current) config.value = current;
            if (window.__lastKairosString) {
                window.updateDisplay(window.__lastKairosString, current);
            }
            return;
        }
        const line = document.getElementById('kstDisplayLine');
        if (!line) return;
        window.__lastKairosString = kairosString;
        // The pure Kairos calendar (calendar lens 'kairos', legacy 'rhythm')
        // passes the canonical line through unchanged; the other calendar
        // lenses rebuild it with their own month names.
        if (tradition && tradition !== 'rhythm' && tradition !== 'kairos') {
            line.textContent = buildTraditionLine(kairosString, tradition) || kairosString;
        } else {
            line.textContent = kairosString;
        }
    };
    window.getSelectedTradition = getSelectedTradition;
    window.setSelectedTradition = setSelectedTradition;
    window.buildTraditionLine = buildTraditionLine;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports.getSelectedTradition = getSelectedTradition;
        module.exports.setSelectedTradition = setSelectedTradition;
        module.exports.buildTraditionLine = buildTraditionLine;
    }
})();
