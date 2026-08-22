/**
 * Kairos Calendar — pure date/name helpers, shared with the wearable watch
 * face (web/watch.html).
 *
 * The canonical source is core/constants.py; web/kst_display.js keeps its own
 * in-app copies of these helpers. This module exists so the watch face can
 * render the Kairos date WITHOUT loading the full web app — the main app is
 * never touched by the watch page.
 *
 * Exposes window.KairosCalendar in the browser and module.exports in Node
 * (used by tests/test_watch_web.py).
 */

(function () {
    "use strict";

    const EARTH_AGE_YEARS = 4540000000; // ~4.54 billion years (configurable)

    // Canonical Kairos names (mirrors core/constants.py).
    const KAIROS_DAYS = ["Sundial", "Well", "Root", "Bloom", "Forge", "Harvest", "Star"];
    const KAIROS_MONTHS = ["Root Moon", "Sap Moon", "Green Moon", "Bloom Moon", "Grain Moon",
        "Light Moon", "Thirst Moon", "Fruit Moon", "Harvest Moon", "Wine Moon",
        "Leaf Moon", "Frost Moon", "Star Moon"];
    const KAIROS_SEASONS = { Spring: "Emergence", Summer: "Radiance", Autumn: "Release", Winter: "Stillness" };
    const KAIROS_YEAR_DAY = "Deep Day";

    // Purely calendar-based (Date.UTC), so DST transitions never shift the count.
    function kairosDayOfYear(date) {
        return Math.floor(
            (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
                - Date.UTC(date.getFullYear(), 0, 0)) / 86400000);  // 1-based: Jan 1 = 1
    }

    function kairosDayName(doy) {
        return KAIROS_DAYS[(doy - 1) % 7];
    }

    function kairosDate(doy) {
        const weekday = kairosDayName(doy);
        if (doy > 364) return { month: KAIROS_YEAR_DAY, day: doy - 364, weekday };
        const m = Math.floor((doy - 1) / 28);
        return { month: KAIROS_MONTHS[m], day: ((doy - 1) % 28) + 1, weekday };
    }

    // Tropical season → Kairos season, from the sun's ecliptic longitude.
    function getSeason(solarLongitude) {
        const lon = ((solarLongitude % 360) + 360) % 360;
        if (lon < 90) return "Spring";
        if (lon < 180) return "Summer";
        if (lon < 270) return "Autumn";
        return "Winter";
    }

    function moonEmojiFromPhase(phase) {
        const idx = Math.round(((phase || 0) % 1) * 8) % 8;
        return ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"][idx];
    }

    // "4.54B / 2026.624" — scale (Earth age in billions) + the remainder.
    function formatYear(rawYear) {
        const scaleBillions = rawYear / 1e9;
        const scaleValue = Math.floor(scaleBillions * 100) / 100 * 1e9;
        const scale = (scaleValue / 1e9).toFixed(2) + "B";
        const precision = (rawYear - scaleValue).toFixed(3);
        return `${scale} / ${precision}`;
    }

    // Aligned with core/checksum.py current_earth_age_year().
    function getEarthAge(date) {
        const doy = kairosDayOfYear(date);
        return EARTH_AGE_YEARS + date.getFullYear() + (doy - 1) / 365.2422;
    }

    const api = {
        EARTH_AGE_YEARS: EARTH_AGE_YEARS,
        KAIROS_DAYS: KAIROS_DAYS.slice(),
        KAIROS_MONTHS: KAIROS_MONTHS.slice(),
        KAIROS_SEASONS: Object.assign({}, KAIROS_SEASONS),
        KAIROS_YEAR_DAY: KAIROS_YEAR_DAY,
        kairosDayOfYear: kairosDayOfYear,
        kairosDayName: kairosDayName,
        kairosDate: kairosDate,
        getSeason: getSeason,
        moonEmojiFromPhase: moonEmojiFromPhase,
        formatYear: formatYear,
        getEarthAge: getEarthAge
    };

    if (typeof module !== "undefined" && module.exports) {
        module.exports = api;
    }
    if (typeof window !== "undefined") {
        window.KairosCalendar = api;
    }
})();
