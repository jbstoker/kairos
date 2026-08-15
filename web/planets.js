// Kairos offline planets — compact browser positions for the five naked-eye
// planets (Mercury–Saturn).
//
// Uses Paul Schlyter's public-domain orbital-element method (with the small
// perturbation terms), accurate to ~1–9 arcminutes over 1900–2100 — plenty
// for a zodiac / "which planet is where" display, and verified against the
// Skyfield engine by tests/test_planets_web_consistency.py. It is NOT a
// substitute for an ephemeris when high precision is required.
//
// Same output shape as core/celestial.planetary_position():
//   { zodiac, ecliptic_longitude }  per planet.

(function (root, factory) {
    if (typeof module === "object" && module.exports) {
        module.exports = factory();
    } else {
        root.KairosPlanets = factory();
    }
}(typeof self !== "undefined" ? self : this, function () {
    "use strict";

    var ZODIAC_SIGNS = [
        "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
        "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
    ];

    function toRad(deg) { return deg * Math.PI / 180; }
    function toDeg(rad) { return rad * 180 / Math.PI; }
    function fix360(deg) { var x = deg % 360; return x < 0 ? x + 360 : x; }

    // Solve Kepler's equation M = E - e*sin(E) by Newton's method.
    function solveKepler(M, e) {
        var E = M + e * Math.sin(M);
        for (var i = 0; i < 12; i++) {
            var dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
            E -= dE;
            if (Math.abs(dE) < 1e-9) break;
        }
        return E;
    }

    // Orbital elements at epoch 2000 Jan 0.5 (Schlyter).
    // Each planet: N0/i0/w0 (angles in deg), a (AU), e0/e1, M0/M1 (mean anomaly).
    var PLANETS = {
        mercury: { N0: 48.3313, N1: 3.24587e-5, i0: 7.0047, i1: 5.00e-8,
                   w0: 29.1241, w1: 1.01444e-5, a: 0.387098, e0: 0.205635,
                   e1: 5.59e-10, M0: 168.6562, M1: 4.0923344368 },
        venus:   { N0: 76.6799, N1: 2.46590e-5, i0: 3.3946, i1: 2.75e-8,
                   w0: 54.8910, w1: 1.38374e-5, a: 0.723330, e0: 0.006773,
                   e1: -1.302e-9, M0: 48.0052, M1: 1.6021302244 },
        mars:    { N0: 49.5574, N1: 2.11081e-5, i0: 1.8497, i1: -1.78e-8,
                   w0: 286.5016, w1: 2.92961e-5, a: 1.523688, e0: 0.093405,
                   e1: 2.516e-9, M0: 18.6021, M1: 0.5240207766 },
        jupiter: { N0: 100.4542, N1: 2.76854e-5, i0: 1.3030, i1: -1.557e-7,
                   w0: 273.8777, w1: 1.64505e-5, a: 5.20256, e0: 0.048498,
                   e1: 4.469e-9, M0: 19.8950, M1: 0.0830853001 },
        saturn:  { N0: 113.6634, N1: 2.38980e-5, i0: 2.4886, i1: -1.081e-7,
                   w0: 339.3939, w1: 2.97661e-5, a: 9.55475, e0: 0.055546,
                   e1: -9.499e-9, M0: 316.9670, M1: 0.0334442282 }
    };

    // Heliocentric ecliptic position of a planet for a day count.
    function heliocentric(p, t) {
        var N = p.N0 + p.N1 * t;
        var i = p.i0 + p.i1 * t;
        var w = p.w0 + p.w1 * t;
        var e = p.e0 + p.e1 * t;
        var E = solveKepler(toRad(p.M0 + p.M1 * t), e);
        var xv = p.a * (Math.cos(E) - e);
        var yv = p.a * (Math.sqrt(1 - e * e) * Math.sin(E));
        var r = Math.sqrt(xv * xv + yv * yv);
        var vw = Math.atan2(yv, xv) + toRad(w);   // true anomaly + perihelion (radians)
        var cosN = Math.cos(toRad(N));
        var sinN = Math.sin(toRad(N));
        var cosI = Math.cos(toRad(i));
        var sinI = Math.sin(toRad(i));
        return {
            x: r * (cosN * Math.cos(vw) - sinN * Math.sin(vw) * cosI),
            y: r * (sinN * Math.cos(vw) + cosN * Math.sin(vw) * cosI)
        };
    }

    // Geocentric tropical ecliptic longitude for all five classical planets.
    // date: any JS Date (UTC-aware; milliseconds are converted to Julian days).
    function planetLongitudes(date) {
        // Days since 2000 Jan 0.5 TT (Schlyter's epoch for the elements).
        var t = date.getTime() / 86400000 - 10956.0;

        // The Sun's geocentric position = -Earth's heliocentric position.
        var e_earth = 0.016709 - 1.151e-9 * t;
        var E_earth = solveKepler(toRad(356.0470 + 0.9856002585 * t), e_earth);
        var xv = Math.cos(E_earth) - e_earth;
        var yv = Math.sqrt(1 - e_earth * e_earth) * Math.sin(E_earth);
        var Rs = Math.sqrt(xv * xv + yv * yv);
        var Ls = fix360(toDeg(Math.atan2(yv, xv)) + 282.9404 + 4.70935e-5 * t);

        var meanAnomalies = {};
        for (var name in PLANETS) {
            if (Object.prototype.hasOwnProperty.call(PLANETS, name)) {
                meanAnomalies[name] = PLANETS[name].M0 + PLANETS[name].M1 * t;
            }
        }
        var Msun = 356.0470 + 0.9856002585 * t;

        var out = {};
        var order = ["mercury", "venus", "mars", "jupiter", "saturn"];
        for (var i = 0; i < order.length; i++) {
            var key = order[i];
            var p = PLANETS[key];
            var h = heliocentric(p, t);
            // Geocentric = heliocentric - Earth's heliocentric
            //              = heliocentric + Sun's geocentric (Rs at Ls).
            var lon = fix360(toDeg(Math.atan2(
                h.y + Rs * Math.sin(toRad(Ls)),
                h.x + Rs * Math.cos(toRad(Ls)))));

            // Small perturbation terms (Schlyter).
            var Mm = meanAnomalies[key];
            if (key === "mercury") lon += 0.011 * Math.cos(toRad(2 * Msun - 2 * Mm - 1.15));
            if (key === "venus") lon += 0.010 * Math.cos(toRad(Msun - Mm - 0.35));
            if (key === "mars") lon += -0.010 * Math.cos(toRad(Mm - 2 * Msun - 0.35));
            if (key === "jupiter") lon += -0.033 * Math.sin(toRad(Mm + 2 * meanAnomalies.saturn - 5.47));
            if (key === "saturn") lon += 0.020 * Math.sin(toRad(2 * Mm - 5 * meanAnomalies.jupiter - 4.67));

            lon = fix360(lon);
            out[key] = {
                zodiac: ZODIAC_SIGNS[Math.floor(lon / 30) % 12],
                ecliptic_longitude: Math.round(lon * 100) / 100
            };
        }
        return out;
    }

    function zodiacFromLongitude(lonDeg) {
        var lon = fix360(lonDeg);
        return ZODIAC_SIGNS[Math.floor(lon / 30) % 12];
    }

    return {
        ZODIAC_SIGNS: ZODIAC_SIGNS,
        planetLongitudes: planetLongitudes,
        zodiacFromLongitude: zodiacFromLongitude
    };
}));
