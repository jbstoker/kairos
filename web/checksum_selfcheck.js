// Kairos precession self-check — a browser mirror of core/checksum.py.
//
// Pure functions only: no DOM, no network. The same file runs in the PWA
// (offline, via window.KairosSelfCheck) and under Node.js in the test suite,
// so the browser arithmetic is verified against the Python engine.
//
// The checksum answers one verifiable question about the Earth-age year
// Kairos displays (e.g. 4,540,002,026.624):
//     "Is the deep-time year in phase with the observed position of the
//      vernal equinox?"
//
// Honesty by design: a round-number epoch has an *expected* phase offset
// (~0.37° in 2026, growing ~50.29"/year). What matters — and what the
// checksum tracks — is that the offset stays constant instead of silently
// drifting.

(function (root, factory) {
    if (typeof module === "object" && module.exports) {
        module.exports = factory();
    } else {
        root.KairosSelfCheck = factory();
    }
}(typeof self !== "undefined" ? self : this, function () {
    "use strict";

    // Constants — keep in sync with core/checksum.py.
    var PRECESSION_CYCLE_YEARS = 25772;
    var PRECESSION_RATE_DEG_PER_YEAR = 360.0 / PRECESSION_CYCLE_YEARS;
    var J2000_EPOCH = 2000.0;
    var EARTH_AGE_DEFAULT = 4540000000;
    var TROPICAL_YEAR_DAYS = 365.2422;

    // Gregorian day-of-year (1..365/366), like tm_yday. Purely calendar-based
    // (via Date.UTC), so DST transitions never shift the count.
    function dayOfYear(date) {
        return Math.floor(
            (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
                - Date.UTC(date.getFullYear(), 0, 0)) / 86400000);
    }

    function fractionOfYear(date) {
        return (dayOfYear(date) - 1) / TROPICAL_YEAR_DAYS;
    }

    // The deep-time year right now: Earth age + Gregorian year + fraction.
    function currentEarthAgeYear(date) {
        var now = date || new Date();
        return EARTH_AGE_DEFAULT + now.getFullYear() + fractionOfYear(now);
    }

    // Equinox phase (0-360°) implied by a deep-time year:
    // (earth_age_years mod CYCLE) / CYCLE * 360.
    function calculatePrecessionPosition(earthAgeYears) {
        var phaseYears = earthAgeYears % PRECESSION_CYCLE_YEARS;
        return (phaseYears / PRECESSION_CYCLE_YEARS) * 360.0;
    }

    // Observed equinox phase (0-360°) relative to the J2000.0 anchor.
    function expectedPrecessionPosition(date) {
        var now = date || new Date();
        var yearsSinceJ2000 = now.getFullYear() + fractionOfYear(now) - J2000_EPOCH;
        var drift = yearsSinceJ2000 * PRECESSION_RATE_DEG_PER_YEAR;
        var normalized = drift % 360.0;
        if (normalized < 0) normalized += 360.0;
        return normalized;
    }

    // Shortest angular distance between two positions on a circle.
    function circularDifference(a, b) {
        var diff = Math.abs(a - b) % 360.0;
        return Math.min(diff, 360.0 - diff);
    }

    function round4(x) {
        return Math.round(x * 10000) / 10000;
    }

    // Compare a deep-time year against the observed vernal equinox.
    // opts.date:        local Date used for the expected position (default now)
    // opts.earthAgeYear: override the computed deep-time year (for tests)
    // opts.toleranceDeg: tolerance in degrees (default 0.5, like Python)
    function precessionChecksum(opts) {
        opts = opts || {};
        var date = opts.date || null;
        var earthAgeYears = (opts.earthAgeYear !== undefined && opts.earthAgeYear !== null)
            ? opts.earthAgeYear
            : currentEarthAgeYear(date);
        var toleranceDeg = (opts.toleranceDeg !== undefined) ? opts.toleranceDeg : 0.5;
        var calculated = calculatePrecessionPosition(earthAgeYears);
        var expected = expectedPrecessionPosition(date);
        var diff = circularDifference(calculated, expected);
        return {
            status: (diff <= toleranceDeg) ? "consistent" : "inconsistent",
            calculated_position: round4(calculated),
            expected_position: round4(expected),
            difference_deg: round4(diff),
            tolerance_deg: toleranceDeg,
            earth_age_year: earthAgeYears
        };
    }

    // The one-line footer text shown in the PWA.
    // `label` is the (translated) "Precession offset" text; the caller passes
    // it so this pure module stays dependency-free (see web/i18n.js).
    function checksumLine(result, label) {
        var delta = (result.difference_deg !== undefined)
            ? Number(result.difference_deg).toFixed(4) + "°"
            : "--°";
        return "🔭 " + (label || "Precession offset") + ": " + delta;
    }

    return {
        PRECESSION_CYCLE_YEARS: PRECESSION_CYCLE_YEARS,
        J2000_EPOCH: J2000_EPOCH,
        EARTH_AGE_DEFAULT: EARTH_AGE_DEFAULT,
        TROPICAL_YEAR_DAYS: TROPICAL_YEAR_DAYS,
        dayOfYear: dayOfYear,
        currentEarthAgeYear: currentEarthAgeYear,
        calculatePrecessionPosition: calculatePrecessionPosition,
        expectedPrecessionPosition: expectedPrecessionPosition,
        circularDifference: circularDifference,
        precessionChecksum: precessionChecksum,
        checksumLine: checksumLine
    };
}));
