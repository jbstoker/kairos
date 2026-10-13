/**
 * Kairos — True Solar Time + Azimuth Engine
 *
 * Aligns the primary display with the sky:
 *   · the TIME is TRUE SOLAR TIME — 12:00 is solar noon (sky-based, not the
 *     wall clock);
 *   · the DEGREE is the SUN'S TRUE AZIMUTH — 0° = N, 90° = E, 180° = S,
 *     270° = W — so the header number and the Sun bead on the sky-dome
 *     degree wheel always agree.
 *
 * Uses the vendored SunCalc for the observer's location (kairos_location,
 * else KAIROS_LONGITUDE/KAIROS_LATITUDE, else the app default 52°N 5°E).
 * Without SunCalc it falls back to the wall-clock position.
 */

// Live observer location — the same source the dial engine uses.
function getObserverLocation() {
    try {
        const saved = JSON.parse(localStorage.getItem('kairos_location') || 'null');
        if (saved && typeof saved.lat === 'number' && typeof saved.lon === 'number') {
            return { lat: saved.lat, lon: saved.lon };
        }
    } catch (e) { /* ignore */ }
    return {
        lat: (typeof window !== 'undefined' && window.KAIROS_LATITUDE) || 52.0,
        lon: (typeof window !== 'undefined' && window.KAIROS_LONGITUDE) || 5.0
    };
}

// SunCalc azimuths are measured from SOUTH, clockwise; convert to the dial's
// north-based compass (east=90°, south=180°, west=270°) in degrees.
function northAzimuthDeg(southAzimuthRad) {
    return ((((southAzimuthRad + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) * 180 / Math.PI;
}

// Gregorian time of TRUE solar noon today (apparent noon, with the equation
// of time), via the vendored SunCalc. Falls back to the wall-clock 12:00.
function getSolarNoon() {
    const loc = getObserverLocation();
    if (typeof SunCalc !== 'undefined' && SunCalc.getTimes) {
        const noon = SunCalc.getTimes(new Date(), loc.lat, loc.lon).solarNoon;
        if (noon instanceof Date && !isNaN(noon.getTime())) {
            return noon.getHours() + noon.getMinutes() / 60 + noon.getSeconds() / 3600;
        }
    }
    return 12.0;
}

// The Sun's true azimuth (degrees, north-based) right now.
function getSolarAzimuth() {
    const loc = getObserverLocation();
    if (typeof SunCalc !== 'undefined' && SunCalc.getPosition) {
        const pos = SunCalc.getPosition(new Date(), loc.lat, loc.lon);
        return northAzimuthDeg(pos.azimuth);
    }
    // Fallback: the wall-clock position on the 360° dial.
    return getSolarDegrees();
}

// TRUE SOLAR TIME — 12:00 is solar noon: 12 + (wall clock − solar noon),
// normalised to 0–24.
function getKairosTime() {
    const now = new Date();
    const gregorianHours = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
    const solarNoon = getSolarNoon();
    let hours = 12 + (gregorianHours - solarNoon);
    hours = ((hours % 24) + 24) % 24;
    return hours;
}

function getKairosTimeDisplay() {
    const hours = getKairosTime();
    const azimuth = getSolarAzimuth();
    const hh = Math.floor(hours);
    const mm = Math.floor((hours - hh) * 60);
    const timeStr = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    return `${timeStr} (${azimuth.toFixed(1)}°)`;
}

// Wall-clock fraction of the local day × 360 — kept as the no-SunCalc
// fallback and for the dial-position API.
function getSolarDegrees() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const msSinceStart = now - startOfDay;
    const totalMsInDay = 24 * 60 * 60 * 1000;
    return (msSinceStart / totalMsInDay) * 360;
}

function degreesToKairosTime(degrees) {
    const totalMinutes = (degrees / 360) * 24 * 60;
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = Math.floor(totalMinutes % 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function getGregorianTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Solar declination for a date (simplified Meeus algorithm).  This is a
 * private implementation local to solar_time.js so it keeps working even when
 * solar_geometry.js later redefines the global getSolarDeclination().
 */
function _kairosSolarDeclination(date) {
    const d = date || new Date();
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const a = Math.floor((14 - month) / 12);
    const y = year + 4800 - a;
    const m = month + 12 * a - 3;
    const jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
    const jd = jdn + (d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600) / 24;
    const T = (jd - 2451545.0) / 36525.0;
    const L = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
    const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
    const sinM = Math.sin(M * Math.PI / 180);
    const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * sinM
            + (0.019993 - 0.000101 * T) * Math.sin(2 * M * Math.PI / 180)
            + 0.000289 * Math.sin(3 * M * Math.PI / 180);
    const lambda = L + C;
    const epsilon = 23.439291 - 0.0130042 * T - 0.00000016 * T * T;
    const sinDec = Math.sin(lambda * Math.PI / 180) * Math.sin(epsilon * Math.PI / 180);
    return Math.asin(sinDec) * 180 / Math.PI;
}

/**
 * Sunset azimuth for a latitude and date (0° = N, 90° = E, 180° = S, 270° = W).
 */
function getSunsetAzimuth(latitude, date) {
    const declination = _kairosSolarDeclination(date);
    const latRad = latitude * Math.PI / 180;
    const decRad = declination * Math.PI / 180;
    const cosAz = Math.sin(decRad) / Math.cos(latRad);
    const clampedCosAz = Math.max(-1, Math.min(1, cosAz));
    const azRad = Math.acos(clampedCosAz);
    let azDeg = 360 - azRad * 180 / Math.PI;
    return ((azDeg % 360) + 360) % 360;
}

/**
 * Map a compass azimuth to a Kairos pulse count. The dial orientation used
 * here matches the sky-dome wheel: 0° = midnight (bottom), 90° = sunrise
 * (left), 180° = noon (top), 270° = sunset (right).
 */
function azimuthToKairos(azimuth) {
    const KAIROS = {
        STRIDES_PER_DAY: 26,
        BEATS_PER_STRIDE: 28,
        PULSES_PER_BEAT: 7,
        PULSES_PER_DAY: 26 * 28 * 7
    };
    const fraction = ((azimuth % 360) + 360) % 360 / 360;
    return fraction * KAIROS.PULSES_PER_DAY;
}

/**
 * Convert a Kairos pulse count to a Stride:Beat:Pulse string.
 */
function pulsesToKairos(totalPulses) {
    const KAIROS = {
        STRIDES_PER_DAY: 26,
        BEATS_PER_STRIDE: 28,
        PULSES_PER_BEAT: 7,
        PULSES_PER_DAY: 26 * 28 * 7
    };
    const pulses = ((totalPulses % KAIROS.PULSES_PER_DAY) + KAIROS.PULSES_PER_DAY) % KAIROS.PULSES_PER_DAY;
    const stride = Math.floor(pulses / (KAIROS.BEATS_PER_STRIDE * KAIROS.PULSES_PER_BEAT));
    const remainder = pulses % (KAIROS.BEATS_PER_STRIDE * KAIROS.PULSES_PER_BEAT);
    const beat = Math.floor(remainder / KAIROS.PULSES_PER_BEAT);
    const pulse = Math.floor(remainder % KAIROS.PULSES_PER_BEAT);
    return `${String(stride).padStart(2, '0')}:${String(beat).padStart(2, '0')}:${String(pulse).padStart(2, '0')}`;
}

function getSunsetTimeKairos(latitude, date) {
    return pulsesToKairos(azimuthToKairos(getSunsetAzimuth(latitude, date)));
}

function getSunriseTimeKairos(latitude, date) {
    return pulsesToKairos(azimuthToKairos(360 - getSunsetAzimuth(latitude, date)));
}

if (typeof window !== 'undefined') {
    window.getSunsetAzimuth = getSunsetAzimuth;
    window.getSunsetTimeKairos = getSunsetTimeKairos;
    window.getSunriseTimeKairos = getSunriseTimeKairos;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports.getSolarNoon = getSolarNoon;
    module.exports.getSolarAzimuth = getSolarAzimuth;
    module.exports.getKairosTime = getKairosTime;
    module.exports.getKairosTimeDisplay = getKairosTimeDisplay;
    module.exports.getSolarDegrees = getSolarDegrees;
    module.exports.degreesToKairosTime = degreesToKairosTime;
    module.exports.getGregorianTime = getGregorianTime;
    module.exports.getSunsetAzimuth = getSunsetAzimuth;
    module.exports.getSunsetTimeKairos = getSunsetTimeKairos;
    module.exports.getSunriseTimeKairos = getSunriseTimeKairos;
}
