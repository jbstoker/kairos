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

if (typeof module !== 'undefined' && module.exports) {
    module.exports.getSolarNoon = getSolarNoon;
    module.exports.getSolarAzimuth = getSolarAzimuth;
    module.exports.getKairosTime = getKairosTime;
    module.exports.getKairosTimeDisplay = getKairosTimeDisplay;
    module.exports.getSolarDegrees = getSolarDegrees;
    module.exports.degreesToKairosTime = degreesToKairosTime;
    module.exports.getGregorianTime = getGregorianTime;
}
