/* Kairos unified display controller — web/static/js/app_controller.js.
 *
 * Binds the consolidated #kstDisplay panel — the singular, definitive
 * dashboard. The old scattered display layers (plain .display card, KST
 * one-line, Gregorian anchor line, tradition line, seasonal wheel, metric
 * rows) all live here now:
 *
 *     · Active Selected Date Context Header (#observed-date-label)
 *     · The Integrated Concentric Planetary Layout (the observation matrix)
 *     · Consolidated metric metadata footer (solar longitude, lunar age,
 *       active planets, celestial season)
 *     · Gregorian anchor pinned in the centre of the matrix
 *
 * updateUnifiedDisplayPanel(selectedDateTimeState) binds natively to the
 * active date selected in the optional/historical layer — defaulting to the
 * current real-time moment. Pure client-side, observation-driven, offline.
 */
(function () {
    "use strict";

    const I18n = (typeof window !== 'undefined' && window.KairosI18n) || null;
    const t = I18n ? I18n.t.bind(I18n) : (key) => key;
    const trName = I18n ? I18n.trName.bind(I18n) : (prefix, name) => name;

    const OBSERVING_CONTEXT = 'Observing Active Context...';

    let celestialMetrics = null;
    if (typeof CelestialMetrics !== 'undefined') {
        celestialMetrics = new CelestialMetrics(
            (typeof window !== 'undefined' && window.KAIROS_LONGITUDE) || 0);
    }

    // ---- Metric helpers (prefer the fresh KST snapshot; compute on demand) --
    function calculateSolarLongitude(timestamp) {
        const kst = window.__kstData;
        if (kst && kst.solar_longitude != null) return Number(kst.solar_longitude);
        if (typeof SunCalc !== 'undefined' && SunCalc.getSolarLongitude) {
            return SunCalc.getSolarLongitude(new Date(timestamp * 1000));
        }
        return 0;
    }

    function calculateLunarAge(timestamp) {
        const kst = window.__kstData;
        if (kst && kst.lunar_age != null) return Number(kst.lunar_age);
        if (typeof SunCalc !== 'undefined' && SunCalc.getMoonIllumination) {
            return (SunCalc.getMoonIllumination(new Date(timestamp * 1000)).phase % 1)
                * 29.53058867;
        }
        return 0;
    }

    function getVisiblePlanets(timestamp) {
        const kst = window.__kstData;
        const planets = (kst && kst.planets) || {};
        const names = Object.keys(planets);
        return names.length ? names.map(n => trName('planet.', n)).join(', ') : '—';
    }

    function getCurrentCelestialSeason(timestamp) {
        const kst = window.__kstData;
        if (kst && kst.season) return trName('season.', kst.season);
        const lon = calculateSolarLongitude(timestamp);
        if (lon < 90) return trName('season.', 'Spring');
        if (lon < 180) return trName('season.', 'Summer');
        if (lon < 270) return trName('season.', 'Autumn');
        return trName('season.', 'Winter');
    }

    // ---- Selected date/time state (current now, or an optional layer) --------
    function createSelectedDateTime(timestamp, context) {
        const ts = (timestamp == null) ? Date.now() / 1000 : Number(timestamp);
        const label = (context && context.traditionLabel)
            ? context.traditionLabel
            : (window.KAIROS_CONTEXT_LABEL || OBSERVING_CONTEXT);
        return {
            getUnixTimestamp: () => ts,
            toGregorianString: () => {
                const d = new Date(ts * 1000);
                const p = (n) => (n < 10 ? '0' : '') + n;
                return p(d.getHours()) + ':' + p(d.getMinutes());
            },
            getCustomTraditionLabel: () => label
        };
    }

    /**
     * Updates the unified kstDisplay card with parameters matching either the
     * current real-time or an optionally selected target date.
     */
    function updateUnifiedDisplayPanel(selectedDateTimeState) {
        // 1. Compute astronomical targets based on the specific selected date.
        const timestamp = selectedDateTimeState.getUnixTimestamp();
        const gregorianString = selectedDateTimeState.toGregorianString();

        // 2. Bind the Gregorian reference straight to the centre of the matrix.
        const clock = document.getElementById('gregorian-center-clock');
        if (clock) clock.textContent = gregorianString;

        // 3. Update the active date title frame of the kstDisplay card.
        const label = document.getElementById('observed-date-label');
        if (label) label.textContent = selectedDateTimeState.getCustomTraditionLabel();

        // 4. Update the combined metric nodes inside the kstDisplay footer.
        const solarLongitudeVal = document.getElementById('solar-longitude-val');
        if (solarLongitudeVal) {
            solarLongitudeVal.textContent = `${calculateSolarLongitude(timestamp).toFixed(1)}°`;
        }
        const lunarAgeVal = document.getElementById('lunar-age-val');
        if (lunarAgeVal) {
            lunarAgeVal.textContent = `${calculateLunarAge(timestamp).toFixed(1)} ${t('kst.days')}`;
        }
        const planetsVal = document.getElementById('active-planets-val');
        if (planetsVal) planetsVal.textContent = getVisiblePlanets(timestamp);
        const seasonVal = document.getElementById('celestial-season-val');
        if (seasonVal) seasonVal.textContent = getCurrentCelestialSeason(timestamp);

        // 5. Trigger the counter-clockwise canvas redraw with orbital factors.
        if (celestialMetrics && typeof renderCelestialPositions === 'function') {
            renderCelestialPositions(
                celestialMetrics.getSunAngle(timestamp),
                celestialMetrics.getSunRadialFactor(timestamp),
                celestialMetrics.getMoonAngle(timestamp),
                celestialMetrics.getMoonRadialFactor(timestamp)
            );
        }
    }

    function refreshUnifiedPanel() {
        updateUnifiedDisplayPanel(createSelectedDateTime(Date.now() / 1000));
    }

    // Expose for kst_display.js / app.js / the optional layer.
    if (typeof window !== 'undefined') {
        window.updateUnifiedDisplayPanel = updateUnifiedDisplayPanel;
        window.createSelectedDateTime = createSelectedDateTime;
        window.refreshUnifiedPanel = refreshUnifiedPanel;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports.updateUnifiedDisplayPanel = updateUnifiedDisplayPanel;
        module.exports.createSelectedDateTime = createSelectedDateTime;
        module.exports.refreshUnifiedPanel = refreshUnifiedPanel;
        module.exports.getVisiblePlanets = getVisiblePlanets;
        module.exports.getCurrentCelestialSeason = getCurrentCelestialSeason;
    }
})();

