/**
 * Kairos — Kairos Kepler Display (Stride : Beat : Pulse formatting).
 *
 * Formats the live Kepler clock (web/static/js/kairos_time.js) into the
 * human-readable time and date:
 *
 *   header:   "09:19:02 · Scorpius 3 · 26 (270.1°)"
 *   full:     "EE 4.540.002.026/11/03 09:19:02"
 *   civil:    "26/11/03 09:19:02"
 *   pulse:    "Pulse: 17.0129 s"
 *
 * The month names and the Earth Era year come from the calendar-style layer
 * (web/static/js/calendar_style.js) — they respect the user's 📅 Month Names
 * choice (canonical Root Moon…Star Moon or the 13 true zodiac constellations)
 * — and the stride/beat/pulse + pulse length come from the Kepler engine.
 * The header keeps the Sun's true azimuth so the number and the sky-dome
 * bead still agree.
 *
 * Main-app reading layer only; the isolated watch face never loads this.
 */

// The 26 × 28 × 7 structure, mirrored from web/static/js/kairos_time.js.
const KAIROS_DISPLAY = {
    STRIDES_PER_DAY: 26,
    BEATS_PER_STRIDE: 28,
    PULSES_PER_BEAT: 7,
    PULSES_PER_DAY: 26 * 28 * 7,   // 5096
    MONTHS: 13,
    DAYS_PER_MONTH: 28,
    DAYS_PER_YEAR: 364,
};

function kairosKeplerPad2(n) {
    return String(n).padStart(2, '0');
}

/**
 * Kairos month (0–12) and day-in-month (1–28) from a 0-based day of year
 * (0–363). Mirrors the canonical Kairos calendar mapping.
 */
function getKairosMonthAndDay(dayOfYear) {
    const monthIndex = Math.floor(dayOfYear / KAIROS_DISPLAY.DAYS_PER_MONTH);
    const dayInMonth = (dayOfYear % KAIROS_DISPLAY.DAYS_PER_MONTH) + 1;
    return { monthIndex, dayInMonth };
}

/**
 * The display-index style is now fixed to 'zero' (natural dial,
 * 00:00:00–25:27:06). The Configure toggle has been removed, so these helpers
 * ignore localStorage and always report the natural zero-indexed form.
 */
function getIndexStyle() {
    return 'zero';
}

function setIndexStyle(value) {
    return 'zero';
}

function isOneIndexed() {
    return false;
}

/**
 * The full formatted Kepler display for a moment:
 *   { stride, beat, pulse, timeStr,           ← 0-indexed natural (primary)
 *     stride1, beat1, pulse1, timeStr1,        ← 1-indexed traditional (legacy)
 *     dateStr, fullDateStr, fullStr, civilStr, ← follow the 📐 Display Index
 *     pulseLength, monthName, dayInMonth, year, shortYear }
 *
 * Reuses the Kepler engine (getKairosKeplerTime) and the calendar-style
 * layer (getMonthName / getEarthEraYear). Returns null if the engine is not
 * loaded.
 */
function getKairosKeplerDisplay(date) {
    if (typeof getKairosKeplerTime !== 'function') {
        if (typeof console !== 'undefined') console.warn('getKairosKeplerTime not loaded');
        return null;
    }
    const now = date || new Date();
    const kairos = getKairosKeplerTime(now);

    // 0-based day of year (0–363), from the engine's 1–364 helper.
    const doy = (typeof kairosKeplerDayOfYear === 'function')
        ? kairosKeplerDayOfYear(now) - 1 : 0;
    const { monthIndex, dayInMonth } = getKairosMonthAndDay(doy);

    const monthName = (typeof getMonthName === 'function')
        ? getMonthName(monthIndex) : 'Month';
    const earthEra = (typeof getEarthEraYear === 'function')
        ? getEarthEraYear()
        : { full: String(4540000000 + now.getFullYear()),
            short: String(now.getFullYear()).slice(-2) };

    // 0-indexed natural dial (primary) + 1-indexed traditional (legacy).
    const stride = kairos.stride, beat = kairos.beat, pulse = kairos.pulse;
    const timeStr = `${kairosKeplerPad2(stride)}:${kairosKeplerPad2(beat)}:${kairosKeplerPad2(pulse)}`;
    const timeStr1 = `${kairosKeplerPad2(stride + 1)}:${kairosKeplerPad2(beat + 1)}:${kairosKeplerPad2(pulse + 1)}`;
    const shown = isOneIndexed() ? timeStr1 : timeStr;
    const dateStr = `${kairosKeplerPad2(monthIndex + 1)}/${kairosKeplerPad2(dayInMonth)}`;

    return {
        stride, beat, pulse,                    // 0-indexed
        timeStr,                                 // 0-indexed
        stride1: stride + 1, beat1: beat + 1, pulse1: pulse + 1,   // 1-indexed
        timeStr1,                                // 1-indexed
        dateStr,
        fullDateStr: `${earthEra.full}/${dateStr}`,
        fullStr: `EE ${earthEra.full}/${dateStr} ${shown}`,
        civilStr: `${earthEra.short}/${dateStr} ${shown}`,
        pulseLength: kairos.pulseLength,
        monthName,
        dayInMonth,
        year: earthEra.full,
        shortYear: earthEra.short
    };
}

// "08:19:02 · Scorpius 3 · 26 (270.1°)" — the compact header line for the
// Kepler clock. Follows the 📐 Display Index choice (0-indexed natural by
// default, 1-indexed traditional with the toggle). The Sun's true azimuth is
// kept so the header number and the sky-dome bead still agree.
function getKairosKeplerHeader(date) {
    const display = getKairosKeplerDisplay(date);
    if (!display) return null;
    const shown = isOneIndexed() ? display.timeStr1 : display.timeStr;
    let azimuth = 0;
    if (typeof getSolarAzimuth === 'function') {
        try { azimuth = getSolarAzimuth(); } catch (e) { /* ignore */ }
    }
    return `${shown} · ${display.monthName} ${display.dayInMonth} · ${display.shortYear} (${azimuth.toFixed(1)}°)`;
}

/**
 * Live pulse data for the info panel — the "heart" of the system:
 *   { pulseLength, meanPulseLength, pulseVariation, pulseVariationMs,
 *     dayLength, dayVariation, dayVariationMinutes, isLonger,
 *     equationOfTime, equationOfTimeMinutes, date }
 *
 * Reuses the Kepler engine (equationOfTime / getPulseLength /
 * dateToJulianDay). Returns null if the engine is not loaded.
 */
function getPulseDisplayData(date) {
    if (typeof getPulseLength !== 'function' || typeof equationOfTime !== 'function'
        || typeof dateToJulianDay !== 'function') {
        if (typeof console !== 'undefined') console.warn('Kairos Kepler engine not loaded');
        return null;
    }
    const now = date || new Date();
    const jd = dateToJulianDay(now);
    const eot = equationOfTime(jd);                    // seconds
    const eotMinutes = eot / 60;
    const pulseLen = getPulseLength(now);
    const dayLen = pulseLen * KAIROS_DISPLAY.PULSES_PER_DAY;
    const meanPulseLen = 86400 / KAIROS_DISPLAY.PULSES_PER_DAY;  // ~16.955 s

    // Is today's apparent day longer or shorter than a mean solar day?
    const isLonger = dayLen > 86400;
    const diffSeconds = dayLen - 86400;
    const diffMinutes = diffSeconds / 60;

    // The pulse's own breathing against the mean.
    const pulseDiff = pulseLen - meanPulseLen;
    const pulseDiffMs = pulseDiff * 1000;

    return {
        pulseLength: pulseLen,
        meanPulseLength: meanPulseLen,
        pulseVariation: pulseDiff,
        pulseVariationMs: pulseDiffMs,
        dayLength: dayLen,
        dayVariation: diffSeconds,
        dayVariationMinutes: diffMinutes,
        isLonger: isLonger,
        equationOfTime: eot,
        equationOfTimeMinutes: eotMinutes,
        date: now
    };
}

/**
 * Human-readable strings for the pulse panel:
 *   { pulseStr, pulseVarStr, dayStr, dayVarStr, eotStr, trend }
 */
function formatPulseDisplay(data) {
    const sign = data.isLonger ? '+' : '';
    return {
        pulseStr: `${data.pulseLength.toFixed(4)} s`,
        pulseVarStr: `${data.pulseVariationMs.toFixed(1)} ms ${data.isLonger ? 'longer' : 'shorter'}`,
        dayStr: `${data.dayLength.toFixed(3)} s`,
        dayVarStr: `${sign}${data.dayVariationMinutes.toFixed(2)} min`,
        eotStr: `${data.equationOfTimeMinutes > 0 ? '+' : ''}${data.equationOfTimeMinutes.toFixed(2)} min`,
        trend: data.isLonger ? '📈' : '📉'
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports.getKairosKeplerDisplay = getKairosKeplerDisplay;
    module.exports.getKairosKeplerHeader = getKairosKeplerHeader;
    module.exports.getKairosMonthAndDay = getKairosMonthAndDay;
    module.exports.getPulseDisplayData = getPulseDisplayData;
    module.exports.formatPulseDisplay = formatPulseDisplay;
    module.exports.getIndexStyle = getIndexStyle;
    module.exports.setIndexStyle = setIndexStyle;
    module.exports.isOneIndexed = isOneIndexed;
    module.exports.KAIROS_DISPLAY = KAIROS_DISPLAY;
}
