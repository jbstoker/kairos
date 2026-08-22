/**
 * Kairos — Kairos Natural Time (26h / 28m / 7s)
 *
 * The 26-hour day system — 13 light hours + 13 dark hours, each hour
 * 28 minutes, each minute 7 seconds: 26 × 28 × 7 = 5,096 natural seconds.
 * It is the sibling of the 13h / 28m / 13s layer (web/static/js/natural_time.js)
 * and, like that layer, it reads TRUE SOLAR TIME — the day's fraction maps
 * 1:1 onto the sun's position: natural 00:00 is solar midnight, natural
 * 13:00 is solar noon, natural 26:00 is the day's end.
 *
 * The light/dark period is the REAL sky: the header's ☀️ / 🌙 icon and
 * `isLight` come from the Sun's actual altitude above the horizon (the same
 * truth the sky-dome bead shows), never from a fixed dial half. Only without
 * the solar engine does it fall back to the wall clock and to the standard
 * 13h-light window (sunrise 07:00 → sunset 20:00, noon 13:00, midnight 00:00).
 *
 * It is a reading layer, never a replacement: the Kairos solar time, the
 * calendar, the azimuth and every other layer keep working unchanged.
 * Selected in ⚙️ Configure → ⏱️ Time System ("kairos_natural", persisted in
 * `kairos_time_system`).
 */

// Kairos Natural day: 26 hours × 28 minutes × 7 seconds = 5,096 seconds.
const KAIROS_NATURAL_DAY_SECONDS = 26 * 28 * 7;   // 5096
const KAIROS_NATURAL_HOUR_SECONDS = 28 * 7;       // 196 natural seconds per natural hour
const KAIROS_NATURAL_MINUTE_SECONDS = 7;          // 7   natural seconds per natural minute

// Reference anchors of the standard 13h-light day — used verbatim only when
// the solar engine is absent (the dial reads the true-solar day otherwise).
const KAIROS_NATURAL_DEFAULT_SUNRISE = 7;    // 07:00
const KAIROS_NATURAL_NOON = 13;              // 13:00 — solar noon, exact by construction
const KAIROS_NATURAL_DEFAULT_SUNSET = 20;    // 20:00
const KAIROS_NATURAL_MIDNIGHT = 0;           // 00:00

function kairosNaturalPad2(n) {
    return String(n).padStart(2, '0');
}

// Convert a fraction of the day (0.0–1.0) into the 26-hour clock parts.
// Pure and deterministic, so it is unit-testable. fraction 1 → the day's end
// (26:00), mirroring the 13h layer's 13:00.
function kairosNaturalFromFraction(fraction) {
    const clamped = Math.max(0, Math.min(1, fraction));
    const total = clamped * KAIROS_NATURAL_DAY_SECONDS;
    const hours = Math.floor(total / KAIROS_NATURAL_HOUR_SECONDS);
    const remainder = total % KAIROS_NATURAL_HOUR_SECONDS;
    const minutes = Math.floor(remainder / KAIROS_NATURAL_MINUTE_SECONDS);
    const seconds = Math.floor(remainder % KAIROS_NATURAL_MINUTE_SECONDS);
    return { hours: hours, minutes: minutes, seconds: seconds };
}

// The day's fraction (0–1), counted in TRUE SOLAR TIME: 0 = solar midnight,
// 0.5 = solar noon. Reuses the 13h layer's helper so both dials always read
// the same sky; falls back to the wall clock only when it is not loaded.
function kairosNaturalDayFraction() {
    if (typeof solarDayFraction === 'function') {
        try { return solarDayFraction(); } catch (e) { /* fall through */ }
    }
    const now = new Date();
    const wallHours = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
    return wallHours / 24;
}
// Observer location — the same source the dial engine uses.
function kairosNaturalObserverLocation() {
    if (typeof getObserverLocation === 'function') {
        try { return getObserverLocation(); } catch (e) { /* ignore */ }
    }
    try {
        const saved = JSON.parse(localStorage.getItem('kairos_location') || 'null');
        if (saved && typeof saved.lat === 'number' && typeof saved.lon === 'number') {
            return { lat: saved.lat, lon: saved.lon };
        }
    } catch (e) { /* ignore */ }
    return { lat: 52.0, lon: 5.0 };
}

// Is the REAL sun above the horizon right now? null when the engine is absent.
function kairosNaturalIsSunUp() {
    if (typeof SunCalc !== 'undefined' && SunCalc.getPosition) {
        try {
            const loc = kairosNaturalObserverLocation();
            return SunCalc.getPosition(new Date(), loc.lat, loc.lon).altitude > 0;
        } catch (e) { /* fall through */ }
    }
    return null;
}

// Today's real sunrise / sunset in 24-hour solar hours, or null without the
// engine (the caller then uses the standard 07:00 / 20:00 anchors).
function kairosNaturalSunriseHour() {
    if (typeof SunCalc !== 'undefined' && SunCalc.getTimes) {
        try {
            const loc = kairosNaturalObserverLocation();
            const t = SunCalc.getTimes(new Date(), loc.lat, loc.lon);
            if (t && t.sunrise instanceof Date && !isNaN(t.sunrise.getTime())) {
                return t.sunrise.getHours() + t.sunrise.getMinutes() / 60 + t.sunrise.getSeconds() / 3600;
            }
        } catch (e) { /* fall through */ }
    }
    return null;
}

function kairosNaturalSunsetHour() {
    if (typeof SunCalc !== 'undefined' && SunCalc.getTimes) {
        try {
            const loc = kairosNaturalObserverLocation();
            const t = SunCalc.getTimes(new Date(), loc.lat, loc.lon);
            if (t && t.sunset instanceof Date && !isNaN(t.sunset.getTime())) {
                return t.sunset.getHours() + t.sunset.getMinutes() / 60 + t.sunset.getSeconds() / 3600;
            }
        } catch (e) { /* fall through */ }
    }
    return null;
}

// A 24-hour solar hour (0–24) mapped onto the 26-hour dial and rounded to a
// whole dial hour — real sunrise ~06:00 → dial 06:30 → 7, sunset ~18:00 →
// dial 19:30 → 20: the standard-day anchors of the 13 · 28 · 7 sequence.
function kairosNaturalDialHour(hour24) {
    return Math.round(kairosNaturalFromFraction(hour24 / 24).hours);
}

// Live Kairos Natural time (26h / 28m / 7s), derived from TRUE SOLAR TIME.
function getKairosNaturalTime() {
    const parts = kairosNaturalFromFraction(kairosNaturalDayFraction());
    const sunUp = kairosNaturalIsSunUp();
    const isLight = (sunUp !== null)
        ? sunUp
        : (parts.hours >= KAIROS_NATURAL_DEFAULT_SUNRISE &&
           parts.hours < KAIROS_NATURAL_DEFAULT_SUNSET);
    const sunriseHour = kairosNaturalSunriseHour();
    const sunsetHour = kairosNaturalSunsetHour();
    return {
        hours: parts.hours,
        minutes: parts.minutes,
        seconds: parts.seconds,
        isLight: isLight,
        period: isLight ? '☀️ Light' : '🌙 Dark',
        formatted: `${kairosNaturalPad2(parts.hours)}:${kairosNaturalPad2(parts.minutes)}`,
        full: `${kairosNaturalPad2(parts.hours)}:${kairosNaturalPad2(parts.minutes)}:${kairosNaturalPad2(parts.seconds)}`,
        // Reference anchors: noon 13:00 is exact by construction (solar noon
        // is fraction 0.5); sunrise/sunset are today's real ones rounded onto
        // the dial, or the standard 07:00 / 20:00 without the engine.
        sunrise: (sunriseHour !== null) ? kairosNaturalDialHour(sunriseHour) : KAIROS_NATURAL_DEFAULT_SUNRISE,
        noon: KAIROS_NATURAL_NOON,
        sunset: (sunsetHour !== null) ? kairosNaturalDialHour(sunsetHour) : KAIROS_NATURAL_DEFAULT_SUNSET,
        midnight: KAIROS_NATURAL_MIDNIGHT
    };
}
// Map a solar hour (0–24, e.g. SunCalc's sunrise/sunset hour) onto the
// 26-hour dial: sunrise 06:00 → 06:14, sunset 18:00 → 19:14.
function getKairosNaturalSunrise(hour24) {
    const p = kairosNaturalFromFraction(hour24 / 24);
    return {
        hours: p.hours,
        minutes: p.minutes,
        formatted: `${kairosNaturalPad2(p.hours)}:${kairosNaturalPad2(p.minutes)}`
    };
}

function getKairosNaturalSunset(hour24) {
    return getKairosNaturalSunrise(hour24);
}

// "☀️ 13:00 (180.0°)" — Kairos Natural time + the real light/dark icon + the
// Sun's true azimuth, the same shape as the other displays so the header
// keeps its degree and the bead and the number still agree.
function getKairosNaturalTimeDisplay() {
    const n = getKairosNaturalTime();
    let azimuth = 0;
    if (typeof getSolarAzimuth === 'function') {
        try { azimuth = getSolarAzimuth(); } catch (e) { /* ignore */ }
    }
    return `${n.isLight ? '☀️' : '🌙'} ${n.formatted} (${azimuth.toFixed(1)}°)`;
}

// Is the Kairos Natural Time system active? (localStorage is guarded so this
// is safe to call from Node tests and the isolated watch face.)
function isKairosNaturalSelected() {
    try {
        if (typeof localStorage === 'undefined') return false;
        return localStorage.getItem('kairos_time_system') === 'kairos_natural';
    } catch (e) {
        return false;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports.getKairosNaturalTime = getKairosNaturalTime;
    module.exports.kairosNaturalFromFraction = kairosNaturalFromFraction;
    module.exports.kairosNaturalDayFraction = kairosNaturalDayFraction;
    module.exports.getKairosNaturalSunrise = getKairosNaturalSunrise;
    module.exports.getKairosNaturalSunset = getKairosNaturalSunset;
    module.exports.getKairosNaturalTimeDisplay = getKairosNaturalTimeDisplay;
    module.exports.isKairosNaturalSelected = isKairosNaturalSelected;
}
