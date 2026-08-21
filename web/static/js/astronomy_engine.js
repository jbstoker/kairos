/* Kairos shared client math — CelestialMetrics.
 *
 * Computes the counter-clockwise orbital geometry of the concentric
 * observation matrix:
 *
 *     Top (0 rad)      = NOON   (solar culmination)
 *     Right (π/2 rad)  = SUNRISE (dawn)
 *     Bottom (π rad)   = NIGHT  (midnight)
 *     Left (3π/2 rad)  = SUNSET / SUNDOWN (dusk)
 *
 * All movement is counter-clockwise. The radial distance factors breathe
 * with the true eccentric anomalies (perihelion/aphelion for the Sun,
 * perigee/apogee for the Moon), so the layout visually exposes supermoons,
 * micromoons, and total vs annular eclipses when the bodies share an angular
 * vector. Pure client-side — no backend needed (GitHub Pages, file://,
 * offline).
 */

class CelestialMetrics {
    constructor(longitudeDeg) {
        this.longitudeDeg = longitudeDeg || 0;   // east positive
        this.SYNODIC_MONTH_DAYS = 29.53058867;
        this.KNOWN_NEW_MOON_UNIX = 947182440;    // 2000-01-06 18:14 UTC
        this.RAD_PER_HOUR = Math.PI / 12;
        this.DEG_PER_HOUR = 15;
        this.SECONDS_PER_DAY = 86400;
    }

    /**
     * Calculates Earth's distance variance to the sun (Perihelion to Aphelion).
     * Returns scale factor bounded between ~0.983 (closest) and ~1.017 (farthest).
     */
    getSunRadialFactor(unixTimestamp) {
        const date = new Date(unixTimestamp * 1000);
        const start = new Date(date.getFullYear(), 0, 0);
        const diff = date - start;
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);

        // Perihelion occurs roughly around January 3rd
        const anomaly = 2 * Math.PI * (dayOfYear - 3) / 365.25;
        return 1 + 0.0167 * Math.cos(anomaly);
    }

    /**
     * Calculates the Moon's highly elastic perigee-to-apogee orbital variance.
     * Returns scale factor bounded between ~0.945 (closest) and ~1.055 (farthest).
     */
    getMoonRadialFactor(unixTimestamp) {
        // Base anchor point for a known perigee (e.g., Jan 13, 2024)
        const basePerigeeUnix = 1705147200;
        const elapsedSeconds = unixTimestamp - basePerigeeUnix;
        const anomalisticMonthSeconds = 27.55455 * 24 * 3600;

        const orbitPhase = (elapsedSeconds % anomalisticMonthSeconds) / anomalisticMonthSeconds;
        const anomaly = 2 * Math.PI * orbitPhase;
        return 1 + 0.0549 * Math.cos(anomaly);
    }

    // ---- Angles (counter-clockwise sweep, Noon = 0 at the top zenith) -------

    dayOfYearUTC(unixTimestamp) {
        const d = new Date(unixTimestamp * 1000);
        const start = Date.UTC(d.getUTCFullYear(), 0, 1);
        return Math.floor((d - start) / 86400000) + 1;
    }

    equationOfTimeMinutes(dayOfYear) {
        const b = 2 * Math.PI * (dayOfYear - 81) / 364;
        return 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
    }

    solarHourAngleRadians(unixTimestamp) {
        const ts = Number(unixTimestamp);
        const utcHours = (((ts % this.SECONDS_PER_DAY) + this.SECONDS_PER_DAY)
                          % this.SECONDS_PER_DAY) / 3600;
        const eotHours = this.equationOfTimeMinutes(this.dayOfYearUTC(ts)) / 60;
        const lst = (((utcHours + this.longitudeDeg / this.DEG_PER_HOUR + eotHours) % 24) + 24) % 24;
        return (lst - 12) * this.RAD_PER_HOUR;
    }

    lunarAgeDays(unixTimestamp) {
        const ts = Math.floor(Number(unixTimestamp));
        const period = this.SYNODIC_MONTH_DAYS * this.SECONDS_PER_DAY;
        const elapsed = (((ts - this.KNOWN_NEW_MOON_UNIX) % period) + period) % period;
        return elapsed / this.SECONDS_PER_DAY;
    }

    getSunAngle(unixTimestamp) {
        // θ_sun = −H: H=0 at solar noon → top; −π/2 at sunrise → right, etc.
        return -this.solarHourAngleRadians(unixTimestamp);
    }

    getMoonAngle(unixTimestamp) {
        // The Moon's elongation (read from its age) shifts the solar hour
        // angle: new moon shares the Sun's ray (eclipse), full moon opposes it.
        const elongation = this.lunarAgeDays(unixTimestamp)
                           / this.SYNODIC_MONTH_DAYS * 2 * Math.PI;
        return -(this.solarHourAngleRadians(unixTimestamp) + elongation);
    }

    /**
     * Approximate the Moon's mean ecliptic longitude (deg) for a timestamp.
     * Prefers the vendored SunCalc; falls back to a mean-sun approximation.
     */
    approximateMoonEclipticLongitude(unixTimestamp) {
        const ts = Number(unixTimestamp);
        let sunLon = 0;
        if (typeof SunCalc !== 'undefined' && SunCalc.getSolarLongitude) {
            sunLon = SunCalc.getSolarLongitude(new Date(ts * 1000));
        } else {
            // Mean solar longitude (Meeus): days since J2000.0 (2000-01-01 12:00 UTC).
            const d = (ts - 946728000) / 86400;
            sunLon = (280.460 + 0.9856474 * d) % 360;
        }
        const elongationDeg = this.lunarAgeDays(ts) / this.SYNODIC_MONTH_DAYS * 360;
        return (((sunLon + elongationDeg) % 360) + 360) % 360;
    }

    /**
     * True when the Moon is near its ascending/descending node — the only
     * alignments where the shared-ray geometry can be a real eclipse (the
     * 3D Tilt Node Filter uses this to prevent false monthly overlaps).
     * The ascending-node longitude precesses over the ~18.6-year cycle.
     */
    isMoonAtLunarNode(unixTimestamp, toleranceDeg) {
        const ts = Number(unixTimestamp);
        const tol = toleranceDeg || 12;
        const d = (ts - 946728000) / 86400; // days since J2000.0
        const omega = (125.1228 - 0.0529538083 * d) % 360; // ascending node
        const moonLon = this.approximateMoonEclipticLongitude(ts);
        const distAsc = Math.abs(((((moonLon - omega) % 360) + 540) % 360) - 180);
        const distDesc = Math.abs(((((moonLon - (omega + 180)) % 360) + 540) % 360) - 180);
        return Math.min(distAsc, distDesc) < tol;
    }

    snapshot(unixTimestamp) {
        const ts = Number(unixTimestamp);
        return {
            timestamp: Math.floor(ts),
            sun: { angle: this.getSunAngle(ts), radial: this.getSunRadialFactor(ts) },
            moon: { angle: this.getMoonAngle(ts), radial: this.getMoonRadialFactor(ts) }
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports.CelestialMetrics = CelestialMetrics;
}
