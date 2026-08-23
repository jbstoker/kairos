/**
 * Kairos — Solar geometry (Meeus-based declination)
 *
 * The solar declination — the Sun's latitude in the sky, −23.44°…+23.44° —
 * drives the seasonal light beam on the virtual Earth: the beam widens and
 * brightens as the declination approaches its summer maximum (+23.44°) and
 * narrows and dims towards its winter minimum (−23.44°); at the equinoxes
 * (0°) it is straight and balanced.
 *
 * getSolarDeclination(jd) is the Meeus algorithm (ch. 25, simplified —
 * nutation ignored), accurate to ~0.01°, and agrees with the Python engine
 * (core/meeus_algorithms.apparent_declination) at the solstices and
 * equinoxes. getCurrentSolarDeclination() feeds the live renderer.
 */

// The Sun's maximum axial tilt — the poles of the declination scale.
const SOLAR_DECLINATION_MAX = 23.44;

function getSolarDeclination(jd) {
    const J2000 = 2451545.0;
    const T = (jd - J2000) / 36525.0;                 // Julian centuries since J2000

    // Mean solar longitude (degrees)
    const L = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
    // Mean anomaly (degrees)
    const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
    // Equation of the centre (degrees)
    const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M * Math.PI / 180)
        + (0.019993 - 0.000101 * T) * Math.sin(2 * M * Math.PI / 180)
        + 0.000289 * Math.sin(3 * M * Math.PI / 180);
    // Ecliptic longitude (degrees) — simplified, ignores nutation
    const lambda = L + C;
    // Mean obliquity of the ecliptic (degrees)
    const epsilon = 23.439291 - 0.0130042 * T - 0.00000016 * T * T;
    // Declination (degrees)
    const sinDec = Math.sin(lambda * Math.PI / 180) * Math.sin(epsilon * Math.PI / 180);
    return Math.asin(sinDec) * 180 / Math.PI;
}

function getCurrentSolarDeclination() {
    const now = new Date();
    // Gregorian calendar date → Julian Day (standard algorithm, local clock —
    // declination changes only ~0.4°/day, so local vs UTC is negligible).
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const a = Math.floor((14 - month) / 12);
    const y = year + 4800 - a;
    const m = month + 12 * a - 3;
    const jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y
        + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
    const jd = jdn + (now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600) / 24;
    return getSolarDeclination(jd);
}

// The seasonal beam factors from a declination: width 0.7…1.3 (of the 90°
// base beam) and intensity 0.4…1.0. Pure and clamped, so it is unit-testable.
function solarBeamFactors(declinationDeg) {
    const n = Math.max(-1, Math.min(1, declinationDeg / SOLAR_DECLINATION_MAX));
    return {
        widthFactor: 1 + n * 0.3,        // summer 1.3, equinox 1.0, winter 0.7
        intensityFactor: 0.7 + n * 0.3   // summer 1.0, equinox 0.7, winter 0.4
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports.SOLAR_DECLINATION_MAX = SOLAR_DECLINATION_MAX;
    module.exports.getSolarDeclination = getSolarDeclination;
    module.exports.getCurrentSolarDeclination = getCurrentSolarDeclination;
    module.exports.solarBeamFactors = solarBeamFactors;
}
