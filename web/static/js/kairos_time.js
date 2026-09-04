/**
 * Kairos — Kairos Kepler Time (variable pulse from the equation of time).
 *
 * The Kairos day is 26 Strides × 28 Beats × 7 Pulses = 5,096 pulses. Unlike
 * the fixed "natural second" layers (web/static/js/natural_time.js and
 * web/static/js/kairos_natural_time.js), the pulse length here is NOT a
 * constant: it varies continuously with the day of the year so that 5,096
 * pulses always span exactly one APPARENT SOLAR DAY (anti-meridian → next
 * anti-meridian). The variable length comes from the equation of time — the
 * difference between apparent and mean solar time caused by the ellipticity
 * of Earth's orbit (Kepler's law) and the axial tilt — computed with the same
 * Meeus formula (Astronomical Algorithms, ch. 28) the Python engine uses
 * (core/meeus_algorithms.py), so the browser and the CLI agree.
 *
 *   · equationOfTime(jd)      → EoT in SECONDS (apparent − mean solar time)
 *   · getApparentDayLength(d) → 86400 + d(EoT)/d(day)  ≈ 86400 ± 30 s
 *   · getPulseLength(d)       → dayLength / 5096       ≈ 16.955 s ± 0.004 s
 *
 * The clock itself reads the fraction of the day elapsed since APPARENT
 * SOLAR MIDNIGHT (the Sun's anti-meridian transit = SunCalc solarNoon − 12h)
 * and maps it onto the 26 × 28 × 7 grid — 01:01:01 is apparent midnight,
 * 14:01:01 is apparent solar noon (13 full strides have elapsed, so the
 * 1-indexed clock reads stride 14), 26:28:07 is the day's end. Only without
 * the solar engine does it fall back to the wall clock, like the other
 * layers.
 *
 * Selected in ⚙️ Configure → ⏱️ Time System ("kairos_kepler", persisted in
 * `kairos_time_system`). It is a reading layer, never a replacement: the
 * Kairos solar time, the calendar, the azimuth and every other layer keep
 * working unchanged.
 */

// 26 strides × 28 beats × 7 pulses = 5096 pulses per apparent solar day.
const KAIROS_CONSTANTS = {
    PULSES_PER_DAY: 26 * 28 * 7,   // 5096
    STRIDES_PER_DAY: 26,
    BEATS_PER_STRIDE: 28,
    PULSES_PER_BEAT: 7,
};

// Pulses per stride: 28 beats × 7 pulses = 196.
const KAIROS_PULSES_PER_STRIDE = KAIROS_CONSTANTS.BEATS_PER_STRIDE * KAIROS_CONSTANTS.PULSES_PER_BEAT;

function kairosKeplerPad2(n) {
    return String(n).padStart(2, '0');
}

function _normDeg(deg) { return ((deg % 360) + 360) % 360; }
function _rad(deg) { return deg * Math.PI / 180; }
function _deg(rad) { return rad * 180 / Math.PI; }

/**
 * Julian Day number (with fraction, UT) for a Gregorian Date.
 * Uses the UTC components (a Date is an absolute instant), matching
 * core/meeus_algorithms.julian_day().
 */
function dateToJulianDay(date) {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    const a = Math.floor((14 - month) / 12);
    const y = year + 4800 - a;
    const m = month + 12 * a - 3;
    const jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y
        + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
    const utcFraction = (date.getUTCHours() + date.getUTCMinutes() / 60
        + date.getUTCSeconds() / 3600 + date.getUTCMilliseconds() / 3600000) / 24;
    // The integer JDN formula yields the JD at 12:00 UT of the date, so
    // subtract 0.5 (to 0:00) then add the day's UT fraction.
    return jdn - 0.5 + utcFraction;
}

/**
 * Equation of time for a Julian Day, in SECONDS (apparent − mean solar time).
 * Positive → the apparent (sundial) sun is AHEAD of mean solar time.
 * Port of core/meeus_algorithms.equation_of_time() (Meeus ch. 28).
 */
function equationOfTime(jd) {
    const T = (jd - 2451545.0) / 36525.0;            // Julian centuries since J2000
    const L0 = _normDeg(280.46646 + 36000.76983 * T + 0.0003032 * T * T); // mean longitude
    const M = _normDeg(357.52911 + 35999.05029 * T - 0.0001537 * T * T);  // mean anomaly
    const e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T;       // eccentricity
    const omega = _normDeg(125.04 - 1934.136 * T);   // Moon's ascending node
    const eps0 = 23.43929111 - 0.013004167 * T - 0.00000016389 * T * T
        + 0.0000005036 * T * T * T;
    const eps = eps0 + 0.00256 * Math.cos(_rad(omega)); // true obliquity of the ecliptic
    const y = Math.pow(Math.tan(_rad(eps) / 2), 2);
    const L0r = _rad(L0);
    const Mr = _rad(M);
    // Meeus ch. 28: E = 4° × (y·sin2L0 − 2e·sinM + 4ey·sinM·cos2L0
    //                        − ½y²·sin4L0 − 1¼e²·sin2M)
    const eRad = (y * Math.sin(2 * L0r) - 2 * e * Math.sin(Mr)
        + 4 * e * y * Math.sin(Mr) * Math.cos(2 * L0r)
        - 0.5 * y * y * Math.sin(4 * L0r)
        - 1.25 * e * e * Math.sin(2 * Mr));
    return _deg(eRad) * 4.0 * 60.0;  // degrees → minutes (×4) → seconds (×60)
}

/**
 * Apparent solar day length in seconds (anti-meridian → anti-meridian):
 * 86400 plus the day's change in the equation of time. This is the quantity
 * the variable pulse keeps equal to exactly 5096 pulses.
 */
function getApparentDayLength(date) {
    const jd = dateToJulianDay(date);
    return 86400.0 + (equationOfTime(jd + 1.0) - equationOfTime(jd));
}

/** Pulse length in seconds — one 5096th of today's apparent solar day. */
function getPulseLength(date) {
    return getApparentDayLength(date) / KAIROS_CONSTANTS.PULSES_PER_DAY;
}

/**
 * Day of year in the Kairos calendar (1–364): a fixed 364-day year (13
 * months × 28 days), wrapped mod 364. The epoch is Gregorian January 1 for
 * now (adjustable later, e.g. to the spring equinox). DST-safe (Date.UTC),
 * like the rest of the calendar helpers.
 */
function kairosKeplerDayOfYear(date) {
    const doy = Math.floor(
        (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
            - Date.UTC(date.getFullYear(), 0, 0)) / 86400000);  // 1-based: Jan 1 = 1
    return ((doy - 1) % 364) + 1;
}

/**
 * Convert a fraction of the day (0.0–1.0) into the 26 × 28 × 7 clock parts.
 * Pure and deterministic, so it is unit-testable. fraction 1 → the day's end
 * (25:27:06), mirroring the natural layers' "26:00 is the day's end".
 *
 * The parts are 0-INDEXED (stride 0–25, beat 0–27, pulse 0–6) — the natural
 * dial: solar midnight = 00:00:00, solar noon = 13:00:00. The 1-indexed
 * "Traditional" display is a legacy view (web/static/js/kairos_kepler_display.js).
 */
function kairosKeplerFromFraction(fraction) {
    const clamped = Math.max(0, Math.min(1, fraction));
    const total = clamped * KAIROS_CONSTANTS.PULSES_PER_DAY;
    if (total >= KAIROS_CONSTANTS.PULSES_PER_DAY) {
        // fraction 1 → the day's end (25:27:06), mirroring the natural
        // layers' "26:00 is the day's end".
        return { stride: 25, beat: 27, pulse: 6, totalPulses: total };
    }
    const stride = Math.floor(total / KAIROS_PULSES_PER_STRIDE);
    const remainder = total % KAIROS_PULSES_PER_STRIDE;
    const beat = Math.floor(remainder / KAIROS_CONSTANTS.PULSES_PER_BEAT);
    const pulse = Math.floor(remainder % KAIROS_CONSTANTS.PULSES_PER_BEAT);
    return {
        stride: stride,   // 0-indexed: 0–25
        beat: beat,       // 0-indexed: 0–27
        pulse: pulse,     // 0-indexed: 0–6
        totalPulses: total
    };
}

/**
 * The day's fraction (0–1) elapsed since APPARENT SOLAR MIDNIGHT (the Sun's
 * anti-meridian transit = SunCalc solarNoon − 12h) — the same sky the dial
 * reads. Falls back to the wall clock only when the solar engine is absent.
 */
function kairosKeplerDayFraction(now) {
    const date = now || new Date();
    try {
        if (typeof SunCalc !== 'undefined' && SunCalc.getTimes
            && typeof getObserverLocation === 'function') {
            const loc = getObserverLocation();
            const noon = SunCalc.getTimes(date, loc.lat, loc.lon).solarNoon;
            if (noon instanceof Date && !isNaN(noon.getTime())) {
                const dayStart = new Date(noon.getTime() - 12 * 3600 * 1000); // apparent midnight
                const ms = date - dayStart;
                let f = ms / (24 * 3600 * 1000);
                // Wrap: a moment just before apparent midnight (EoT can push it
                // a few minutes past wall-clock 00:00) reads as the tail of the
                // previous day, keeping the clock continuous.
                f = ((f % 1) + 1) % 1;
                return f;
            }
        }
    } catch (e) { /* fall through to the wall clock */ }
    const wall = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
    return wall / 24;
}

/**
 * Live Kairos Kepler time (26 strides / 28 beats / 7 pulses), anchored at
 * apparent solar midnight. The pulse length is today's real one — the clock
 * advances one pulse every ~16.95 seconds. The parts are 0-indexed (the
 * natural dial: midnight 00:00:00, noon 13:00:00).
 */
function getKairosKeplerTime(date) {
    const now = date || new Date();
    const parts = kairosKeplerFromFraction(kairosKeplerDayFraction(now));
    return {
        stride: parts.stride,
        beat: parts.beat,
        pulse: parts.pulse,
        totalPulses: parts.totalPulses,
        pulseLength: getPulseLength(now),
        dayOfYear: kairosKeplerDayOfYear(now),
        year: now.getFullYear(),
        formatted: `${kairosKeplerPad2(parts.stride)}:${kairosKeplerPad2(parts.beat)}:${kairosKeplerPad2(parts.pulse)}`
    };
}

// "13:00:00 (180.0°)" — the Kairos Kepler clock + the Sun's true azimuth, the
// same shape as the other displays so the header keeps its degree and the
// bead and the number still agree. Follows the 📐 Display Index choice
// (kairos_kepler_display.js): 0-indexed natural (default) or 1-indexed
// traditional.
function getKairosKeplerTimeDisplay() {
    const k = getKairosKeplerTime();
    const one = (typeof getIndexStyle === 'function' && getIndexStyle() === 'one');
    const timeStr = one
        ? `${kairosKeplerPad2(k.stride + 1)}:${kairosKeplerPad2(k.beat + 1)}:${kairosKeplerPad2(k.pulse + 1)}`
        : k.formatted;
    let azimuth = 0;
    if (typeof getSolarAzimuth === 'function') {
        try { azimuth = getSolarAzimuth(); } catch (e) { /* ignore */ }
    }
    return `${timeStr} (${azimuth.toFixed(1)}°)`;
}

// Is the Kairos Kepler Time system active? (localStorage is guarded so this
// is safe to call from Node tests and the isolated watch face.)
function isKairosKeplerSelected() {
    try {
        if (typeof localStorage === 'undefined') return false;
        return localStorage.getItem('kairos_time_system') === 'kairos_kepler';
    } catch (e) {
        return false;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports.getKairosKeplerTime = getKairosKeplerTime;
    module.exports.kairosKeplerFromFraction = kairosKeplerFromFraction;
    module.exports.kairosKeplerDayFraction = kairosKeplerDayFraction;
    module.exports.getKairosKeplerTimeDisplay = getKairosKeplerTimeDisplay;
    module.exports.getPulseLength = getPulseLength;
    module.exports.getApparentDayLength = getApparentDayLength;
    module.exports.equationOfTime = equationOfTime;
    module.exports.dateToJulianDay = dateToJulianDay;
    module.exports.kairosKeplerDayOfYear = kairosKeplerDayOfYear;
    module.exports.isKairosKeplerSelected = isKairosKeplerSelected;
    module.exports.KAIROS_CONSTANTS = KAIROS_CONSTANTS;
}


