// Kairos observation methods — solar-noon calibration helpers.
//
// Two observation-first ways to find your local solar noon with no
// instrument except your eyes (and, for the fallback, a stick):
//
//   1. Sunrise + Sunset (primary): noon is the midpoint between the sunrise
//      and sunset you observed on the same day.
//   2. Equal Shadows (fallback): when a stick's shadow equals the stick, the
//      sun is at 45° altitude. The two such moments in a day bracket solar
//      noon, and their midpoint is noon.
//
// Pure state machine — no DOM, no storage. Runs in the PWA (via
// window.KairosObservation) and under Node.js for the test suite
// (tests/test_observation_methods_web.py).
//
// All timestamps are JS Dates; a completed calibration returns the noon as a
// Date too.

(function (root, factory) {
    if (typeof module === "object" && module.exports) {
        module.exports = factory();
    } else {
        root.KairosObservation = factory();
    }
}(typeof self !== "undefined" ? self : this, function () {
    "use strict";

    function createCalibrator() {
        var sunrise = null;   // sunrise/sunset session state
        var shadows = [];     // equal-shadow session state

        function midpoint(a, b) {
            return new Date((a.getTime() + b.getTime()) / 2);
        }

        return {
            // Sunrise+Sunset method — record the moment the sun's disc
            // touches the horizon. Status: "sunrise_recorded".
            recordSunrise: function (t) {
                sunrise = t;
                return { status: "sunrise_recorded" };
            },
            // Sunset closes the pair: noon = midpoint(sunrise, sunset).
            // Status: "noon" (with the computed Date) or "need_sunrise".
            recordSunset: function (t) {
                if (!sunrise) return { status: "need_sunrise" };
                var noon = midpoint(sunrise, t);
                sunrise = null;   // fresh session for the next day
                return { status: "noon", noon: noon };
            },
            // Equal-Shadows method — record the moment the shadow length
            // equals the object's height (morning, then afternoon).
            // Status: "shadow_first", then "noon" on the second press.
            recordEqualShadow: function (t) {
                shadows.push(t);
                if (shadows.length === 2) {
                    var noon = midpoint(shadows[0], shadows[1]);
                    shadows = [];   // fresh session for the next day
                    return { status: "noon", noon: noon };
                }
                return { status: "shadow_first" };
            },
            // Abandon an in-progress session.
            reset: function () {
                sunrise = null;
                shadows = [];
                return { status: "reset" };
            }
        };
    }

    return { createCalibrator: createCalibrator };
}));
