/* Kairos shared client math — CelestialMetrics.
 *
 * Computes the orbital geometry of the concentric observation matrix with the
 * true celestial axis (facing south, northern hemisphere): the sun rises in
 * the east (LEFT) and sets in the west (RIGHT).
 *
 *     Bottom (0 rad)   = MIDNIGHT (0:00)
 *     Left (π/2 rad)   = SUNRISE  (east, 6:00)
 *     Top (π rad)      = NOON     (solar culmination)
 *     Right (3π/2 rad) = SUNSET / SUNDOWN (west, 18:00)
 *
 * The angle is the fraction of the LOCAL day × 360° — exactly the dial the
 * solar-time engine displays — so the displayed degrees ARE the bead's
 * position. All movement is counter-clockwise over the day: midnight → sunrise
 * → noon → sunset. The radial distance factors breathe with the true
 * eccentric anomalies (perihelion/aphelion for the Sun, perigee/apogee for
 * the Moon), so the layout visually exposes supermoons, micromoons, and total
 * vs annular eclipses when the bodies share an angular vector. Pure
 * client-side — no backend needed (GitHub Pages, file://, offline).
 */

class CelestialMetrics {
    constructor(longitudeDeg, latitudeDeg) {
        // The app's documented observer default is 52°N 5°E (kst_display.js
        // DEFAULT_LOCATION); the geolocation-stored kairos_location and the
        // KAIROS_LONGITUDE/KAIROS_LATITUDE globals override it live.
        this.longitudeDeg = longitudeDeg || 5;
        this.latitudeDeg = (latitudeDeg == null) ? 52.0 : latitudeDeg;
        this.SYNODIC_MONTH_DAYS = 29.53058867;
        this.KNOWN_NEW_MOON_UNIX = 947182440;    // 2000-01-06 18:14 UTC
        this.RAD_PER_HOUR = Math.PI / 12;
        this.DEG_PER_HOUR = 15;
        this.SECONDS_PER_DAY = 86400;
    }

    // Live observer location: prefer the geolocation stored by kst_display.js
    // (kairos_location), falling back to the configured/default coordinates.
    _location() {
        let lat = this.latitudeDeg;
        let lon = this.longitudeDeg;
        try {
            const saved = JSON.parse(localStorage.getItem('kairos_location') || 'null');
            if (saved && typeof saved.lat === 'number' && typeof saved.lon === 'number') {
                lat = saved.lat;
                lon = saved.lon;
            }
        } catch (e) { /* ignore */ }
        return { lat, lon };
    }

    // SunCalc azimuths are measured from SOUTH, clockwise; convert to the
    // dial's north-based compass (east=90°, south=180°, west=270°) in degrees.
    _northAzimuthDeg(southAzimuthRad) {
        return (((southAzimuthRad + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
            * 180 / Math.PI;
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

    // ---- Angles (the day as a position: 0 rad = midnight, π = noon) -----------

    dayOfYearUTC(unixTimestamp) {
        const d = new Date(unixTimestamp * 1000);
        const start = Date.UTC(d.getUTCFullYear(), 0, 1);
        return Math.floor((d - start) / 86400000) + 1;
    }

    equationOfTimeMinutes(dayOfYear) {
        const b = 2 * Math.PI * (dayOfYear - 81) / 364;
        return 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
    }

    /**
     * True solar hour angle (radians) — the astronomical variant with the
     * equation of time and configured longitude. Kept for API completeness;
     * the dial itself (getSunAngle/getMoonAngle) reads the local wall clock
     * so its position always matches the displayed degrees.
     */
    solarHourAngleRadians(unixTimestamp) {
        const ts = Number(unixTimestamp);
        const utcHours = (((ts % this.SECONDS_PER_DAY) + this.SECONDS_PER_DAY)
                          % this.SECONDS_PER_DAY) / 3600;
        const eotHours = this.equationOfTimeMinutes(this.dayOfYearUTC(ts)) / 60;
        const lst = (((utcHours + this.longitudeDeg / this.DEG_PER_HOUR + eotHours) % 24) + 24) % 24;
        return (lst - 12) * this.RAD_PER_HOUR;
    }

    /**
     * Dial position from the LOCAL wall clock (fraction of the local day × 2π),
     * identical to web/static/js/solar_time.js's getSolarDegrees — so the
     * displayed degrees ARE the bead's position:
     * 0 rad = midnight (bottom), π/2 = sunrise (left), π = noon (top),
     * 3π/2 = sunset (right).
     */
    dayPositionRadians(unixTimestamp) {
        const d = new Date(unixTimestamp * 1000);
        const ms = d.getHours() * 3600000 + d.getMinutes() * 60000
                   + d.getSeconds() * 1000 + d.getMilliseconds();
        return ms / 86400000 * 2 * Math.PI;
    }

    lunarAgeDays(unixTimestamp) {
        const ts = Math.floor(Number(unixTimestamp));
        const period = this.SYNODIC_MONTH_DAYS * this.SECONDS_PER_DAY;
        const elapsed = (((ts - this.KNOWN_NEW_MOON_UNIX) % period) + period) % period;
        return elapsed / this.SECONDS_PER_DAY;
    }

    getSunAngle(unixTimestamp) {
        // θ_sun = fraction of the LOCAL day × 360°: 0 at midnight (bottom),
        // π/2 at sunrise (left), π at noon (top), 3π/2 at sunset (right).
        return this.dayPositionRadians(unixTimestamp);
    }

    getMoonAngle(unixTimestamp) {
        // The Moon's elongation (read from its age) shifts the sun's dial
        // position: new moon shares the Sun's ray (eclipse), full moon
        // opposes it.
        const elongation = this.lunarAgeDays(unixTimestamp)
                           / this.SYNODIC_MONTH_DAYS * 2 * Math.PI;
        return this.dayPositionRadians(unixTimestamp) + elongation;
    }

    /**
     * Real Sun position (altitude + north-based azimuth, degrees) for a
     * timestamp. Prefers the vendored SunCalc (with the live location from
     * kairos_location); without SunCalc it falls back to the corrected dial —
     * altitude 0 on the horizon ring, azimuth = local day fraction × 360
     * (midnight=north/bottom, sunrise=east/left, noon=south/top,
     * sunset=west/right).
     */
    getSunPositionDeg(unixTimestamp) {
        const loc = this._location();
        if (typeof SunCalc !== 'undefined' && SunCalc.getPosition) {
            const pos = SunCalc.getPosition(new Date(unixTimestamp * 1000), loc.lat, loc.lon);
            return {
                altitudeDeg: pos.altitude * 180 / Math.PI,
                azimuthDeg: this._northAzimuthDeg(pos.azimuth)
            };
        }
        return {
            altitudeDeg: 0,
            azimuthDeg: this.dayPositionRadians(unixTimestamp) * 180 / Math.PI
        };
    }

    /**
     * Real Moon position (altitude + north-based azimuth, degrees), same
     * SunCalc-first strategy; the fallback uses the dial angle.
     */
    getMoonPositionDeg(unixTimestamp) {
        const loc = this._location();
        if (typeof SunCalc !== 'undefined' && SunCalc.getMoonPosition) {
            const pos = SunCalc.getMoonPosition(new Date(unixTimestamp * 1000), loc.lat, loc.lon);
            return {
                altitudeDeg: pos.altitude * 180 / Math.PI,
                azimuthDeg: this._northAzimuthDeg(pos.azimuth)
            };
        }
        return {
            altitudeDeg: 0,
            azimuthDeg: this.getMoonAngle(unixTimestamp) * 180 / Math.PI
        };
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
     * Signed angular distance (radians) from the Moon to the nearest lunar
     * ascending/descending node — |angle| < 0.1 rad means the Moon is at a
     * node (the only alignments where a shared-ray geometry can eclipse).
     */
    moonNodeAngleRadians(unixTimestamp) {
        const ts = Number(unixTimestamp);
        const d = (ts - 946728000) / 86400; // days since J2000.0
        const omega = (125.1228 - 0.0529538083 * d) % 360; // ascending node
        const moonLon = this.approximateMoonEclipticLongitude(ts);
        const distAsc = ((moonLon - omega + 540) % 360) - 180;
        const distDesc = ((moonLon - (omega + 180) + 540) % 360) - 180;
        const distDeg = Math.abs(distAsc) < Math.abs(distDesc) ? distAsc : distDesc;
        return distDeg * Math.PI / 180;
    }

    /**
     * True when the Moon is near its ascending/descending node.
     */
    isMoonAtLunarNode(unixTimestamp, toleranceDeg) {
        const tolRad = (toleranceDeg == null ? 12 : toleranceDeg) * Math.PI / 180;
        return Math.abs(this.moonNodeAngleRadians(unixTimestamp)) < tolRad;
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
