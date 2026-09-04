/**
 * Kairos — Calendar Style (month names + Earth Era year).
 *
 * The 13 Kairos months can be read through two name styles:
 *   · "kairos" — the canonical Root Moon…Star Moon names (the Kairos lens)
 *   · "zodiac" — the 13 true zodiac constellations the Sun actually crosses
 *     in a year (including Ophiuchus): Capricornus…Sagittarius.
 *
 * The style is chosen in ⚙️ Configure → 📅 Month Names and persisted in
 * `kairos_month_style`. In the zodiac style the header also shows the Earth
 * Era year — the unbroken count of years since the beginning of our world —
 * as "EE 4.540.002.026", plus the short civil year ("EE 26") as a small
 * badge.
 *
 * This is a main-app reading layer; the isolated watch face (web/watch.html)
 * keeps the canonical names via web/static/js/kairos_calendar.js.
 */

// 13 true zodiac constellations, in the order the Sun crosses them through
// the Kairos year. Month 0 = Capricornus, aligned with the January start of
// the 364-day Kairos year.
const KAIROS_MONTH_STYLES = {
    kairos: [
        "Root Moon", "Sap Moon", "Green Moon", "Bloom Moon",
        "Grain Moon", "Light Moon", "Thirst Moon", "Fruit Moon",
        "Harvest Moon", "Wine Moon", "Leaf Moon", "Frost Moon",
        "Star Moon"
    ],
    zodiac: [
        "Capricornus", "Aquarius", "Pisces", "Aries",
        "Taurus", "Gemini", "Cancer", "Leo",
        "Virgo", "Libra", "Scorpius", "Ophiuchus",
        "Sagittarius"
    ]
};

const KAIROS_MONTH_STYLE_DEFAULT = 'zodiac';
const KAIROS_MONTH_STYLE_STORAGE = 'kairos_month_style';
const EARTH_AGE_YEARS = 4540000000; // ~4.54 billion years (configurable)

// The selected month-name style (guarded so it is safe to call from Node
// tests and pages without localStorage).
function getMonthStyle() {
    try {
        if (typeof localStorage === 'undefined') return KAIROS_MONTH_STYLE_DEFAULT;
        const value = localStorage.getItem(KAIROS_MONTH_STYLE_STORAGE);
        if (value && KAIROS_MONTH_STYLES[value]) return value;
    } catch (e) { /* ignore */ }
    return KAIROS_MONTH_STYLE_DEFAULT;
}

function setMonthStyle(value) {
    const style = (value && KAIROS_MONTH_STYLES[value])
        ? value : KAIROS_MONTH_STYLE_DEFAULT;
    try { localStorage.setItem(KAIROS_MONTH_STYLE_STORAGE, style); } catch (e) { /* ignore */ }
    // Refresh the context label (app.js) and the primary line (kst_display.js).
    if (typeof window !== 'undefined' && typeof window.updateDisplay === 'function') {
        window.updateDisplay();
    }
    if (typeof window !== 'undefined' && typeof window.refreshKST === 'function') {
        window.refreshKST();
    }
    return style;
}

// Month name (0–12) in the selected style; falls back to the canonical name.
function getMonthName(monthIndex) {
    const list = KAIROS_MONTH_STYLES[getMonthStyle()]
        || KAIROS_MONTH_STYLES[KAIROS_MONTH_STYLE_DEFAULT];
    return list[monthIndex] || list[0];
}

// Is the true-zodiac style active? (drives the Earth Era year in the header)
function isZodiacStyle() {
    return getMonthStyle() === 'zodiac';
}

/**
 * The Earth Era year — the unbroken count of years since the beginning of
 * our world: 4,540,000,000 + the current civil year.
 *   { full: "4.540.002.026", short: "26" }
 */
function getEarthEraYear() {
    const gregorianYear = new Date().getFullYear();
    const earthEraYear = EARTH_AGE_YEARS + gregorianYear;
    // Dot-grouped thousands, matching the "EE 4.540.002.026" display.
    const grouped = String(earthEraYear).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return {
        full: grouped,
        short: String(gregorianYear).slice(-2)
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports.getMonthStyle = getMonthStyle;
    module.exports.setMonthStyle = setMonthStyle;
    module.exports.getMonthName = getMonthName;
    module.exports.isZodiacStyle = isZodiacStyle;
    module.exports.getEarthEraYear = getEarthEraYear;
    module.exports.KAIROS_MONTH_STYLES = KAIROS_MONTH_STYLES;
}
