// Kairos — Lens Manager (web/static/js/lens_manager.js).
//
// Replaces the single "tradition" selector with two independent lenses:
//   · Calendar Lens  — which calendar date the primary line shows
//   · Energy Lens    — which tradition reinterprets today's energy
//
// Selections persist in localStorage (kairos_calendar_lens /
// kairos_energy_lens) and are exposed globally so app.js, help.js and
// unified_display.js can read them.

const LENS_STORAGE_KEY_CALENDAR = 'kairos_calendar_lens';
const LENS_STORAGE_KEY_ENERGY = 'kairos_energy_lens';

const CALENDAR_LENS_VALUES = ['kairos', 'tartarian', 'celtic', 'chinese', 'vedic', 'mystical'];
const ENERGY_LENS_VALUES = ['none', 'curanderismo', 'taoist', 'vedic', 'pagan',
    'mesopotamian', 'egyptian', 'mayan'];

function getCalendarLens() {
    let value = null;
    try { value = localStorage.getItem(LENS_STORAGE_KEY_CALENDAR); } catch (e) { /* ignore */ }
    if (value && CALENDAR_LENS_VALUES.indexOf(value) !== -1) return value;
    // Backward compatibility: carry over the old single-tradition choice.
    let legacy = null;
    try { legacy = localStorage.getItem('kairos_tradition'); } catch (e) { /* ignore */ }
    if (legacy) {
        if (legacy === 'rhythm') legacy = 'kairos';
        if (CALENDAR_LENS_VALUES.indexOf(legacy) !== -1) return legacy;
    }
    return 'kairos';
}

function getEnergyLens() {
    let value = null;
    try { value = localStorage.getItem(LENS_STORAGE_KEY_ENERGY); } catch (e) { /* ignore */ }
    if (value && ENERGY_LENS_VALUES.indexOf(value) !== -1) return value;
    return 'none';
}

function setCalendarLens(value) {
    try { localStorage.setItem(LENS_STORAGE_KEY_CALENDAR, value); } catch (e) { /* ignore */ }
    // Refresh the context label (app.js) and the primary line + energy card
    // (kst_display.js → unified_display.js).
    if (typeof window.updateDisplay === 'function') window.updateDisplay();
    if (typeof window.refreshKST === 'function') window.refreshKST();
}

function setEnergyLens(value) {
    try { localStorage.setItem(LENS_STORAGE_KEY_ENERGY, value); } catch (e) { /* ignore */ }
    // The energy card is re-rendered as part of the KST refresh.
    if (typeof window.refreshKST === 'function') window.refreshKST();
}

// --- UI sync ---
function syncLensSelectors() {
    const calendarSelect = document.getElementById('calendar-lens');
    const energySelect = document.getElementById('energy-lens');
    if (calendarSelect) calendarSelect.value = getCalendarLens();
    if (energySelect) energySelect.value = getEnergyLens();
}

function attachLensListeners() {
    const calendarSelect = document.getElementById('calendar-lens');
    const energySelect = document.getElementById('energy-lens');
    if (calendarSelect) {
        calendarSelect.addEventListener('change', function () {
            setCalendarLens(this.value);
        });
    }
    if (energySelect) {
        energySelect.addEventListener('change', function () {
            setEnergyLens(this.value);
        });
    }
}

// --- Expose globally ---
window.getCalendarLens = getCalendarLens;
window.getEnergyLens = getEnergyLens;
window.setCalendarLens = setCalendarLens;
window.setEnergyLens = setEnergyLens;
window.syncLensSelectors = syncLensSelectors;
window.attachLensListeners = attachLensListeners;

if (typeof module !== 'undefined' && module.exports) {
    module.exports.getCalendarLens = getCalendarLens;
    module.exports.getEnergyLens = getEnergyLens;
    module.exports.setCalendarLens = setCalendarLens;
    module.exports.setEnergyLens = setEnergyLens;
}
