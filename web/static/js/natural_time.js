/**
 * Kairos — Natural Time Layer (13 / 28 / 13)
 *
 * An optional perceptual layer over TRUE SOLAR TIME
 * (web/static/js/solar_time.js): the natural day has 13 hours, each hour
 * 28 minutes, each minute 13 seconds — 13 × 28 × 13 = 4732 natural seconds,
 * so the day's fraction maps 1:1 onto the sun's position. Natural 00:00 is
 * solar midnight, natural 06:14 is solar noon and natural 13:00 is the
 * day's end.
 *
 * Because it counts the same sky the solar-time engine counts, the natural
 * number and the header degree always agree — the same promise the main
 * display makes. It is selected in ⚙️ Configure → ⏱️ Time System (stored in
 * `kairos_time_system`) and only falls back to the wall clock when the
 * solar engine is not loaded. It is a reading layer, never a replacement:
 * the Kairos solar time, the calendar, the azimuth and every other layer
 * keep working unchanged.
 */

// Natural day: 13 hours × 28 minutes × 13 seconds = 4732 natural seconds.
const NATURAL_DAY_SECONDS = 13 * 28 * 13;   // 4732
const NATURAL_HOUR_SECONDS = 28 * 13;       // 364  natural seconds per natural hour
const NATURAL_MINUTE_SECONDS = 13;          // 13   natural seconds per natural minute

function pad2(n) {
    return String(n).padStart(2, '0');
}

// Convert a fraction of the day (0.0–1.0) into the natural clock parts.
// Pure and deterministic, so it is unit-testable.
function naturalFromFraction(fraction) {
    const clamped = Math.max(0, Math.min(1, fraction));
    const naturalTotalSeconds = clamped * NATURAL_DAY_SECONDS;
    const hours = Math.floor(naturalTotalSeconds / NATURAL_HOUR_SECONDS);
    const remainder = naturalTotalSeconds % NATURAL_HOUR_SECONDS;
    const minutes = Math.floor(remainder / NATURAL_MINUTE_SECONDS);
    const seconds = Math.floor(remainder % NATURAL_MINUTE_SECONDS);
    return { hours, minutes, seconds };
}

// The day's fraction (0–1), counted in TRUE SOLAR TIME: 0 = solar midnight,
// 0.5 = solar noon. Falls back to the wall clock only when the solar engine
// is not loaded.
function solarDayFraction() {
    const now = new Date();
    if (typeof getKairosTime === 'function') {
        try {
            const solarHours = getKairosTime();
            if (typeof solarHours === 'number' && isFinite(solarHours)) {
                return (((solarHours % 24) + 24) % 24) / 24;
            }
        } catch (e) { /* ignore — fall back to the wall clock */ }
    }
    const wallHours = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
    return wallHours / 24;
}

// Live natural time (13h / 28m / 13s), derived from TRUE SOLAR TIME.
function getNaturalTime() {
    const parts = naturalFromFraction(solarDayFraction());
    return {
        hours: parts.hours,
        minutes: parts.minutes,
        seconds: parts.seconds,
        formatted: `${pad2(parts.hours)}:${pad2(parts.minutes)}`,
        full: `${pad2(parts.hours)}:${pad2(parts.minutes)}:${pad2(parts.seconds)}`
    };
}

// Map a solar hour (0–24, e.g. SunCalc's sunrise/sunset hour) onto the
// natural dial: sunrise 06:00 → 03:07, sunset 18:00 → 09:21.
function hour24ToNatural(hour24) {
    return naturalFromFraction(hour24 / 24);
}

function getNaturalSunrise(currentSunriseHour) {
    const p = hour24ToNatural(currentSunriseHour);
    return {
        hours: p.hours,
        minutes: p.minutes,
        formatted: `${pad2(p.hours)}:${pad2(p.minutes)}`
    };
}

function getNaturalSunset(currentSunsetHour) {
    const p = hour24ToNatural(currentSunsetHour);
    return {
        hours: p.hours,
        minutes: p.minutes,
        formatted: `${pad2(p.hours)}:${pad2(p.minutes)}`
    };
}

// "06:14 (180.0°)" — natural time + the Sun's true azimuth, the same shape
// as getKairosTimeDisplay() so the header keeps its degree and the bead and
// the number still agree.
function getNaturalTimeDisplay() {
    const n = getNaturalTime();
    let azimuth = 0;
    if (typeof getSolarAzimuth === 'function') {
        try { azimuth = getSolarAzimuth(); } catch (e) { /* ignore */ }
    }
    return `${n.formatted} (${azimuth.toFixed(1)}°)`;
}

// Is the Natural Time layer active? (localStorage is guarded so this is
// safe to call from Node tests and the isolated watch face.)
function isNaturalTimeSelected() {
    try {
        if (typeof localStorage === 'undefined') return false;
        return localStorage.getItem('kairos_time_system') === 'natural';
    } catch (e) {
        return false;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports.getNaturalTime = getNaturalTime;
    module.exports.naturalFromFraction = naturalFromFraction;
    module.exports.solarDayFraction = solarDayFraction;
    module.exports.hour24ToNatural = hour24ToNatural;
    module.exports.getNaturalSunrise = getNaturalSunrise;
    module.exports.getNaturalSunset = getNaturalSunset;
    module.exports.getNaturalTimeDisplay = getNaturalTimeDisplay;
    module.exports.isNaturalTimeSelected = isNaturalTimeSelected;
}
