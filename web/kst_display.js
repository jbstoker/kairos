// Kairos Time (KST) — celestial engine display.
//
// Three layers, observation-first:
//   1. Backend : fetch /api/kst — the Python + Skyfield engine (planets,
//                next heliacal rising, full snapshot).
//   2. Offline : compute locally with SunCalc (vendored in lib/suncalc.js):
//                solar longitude, lunar age, sidereal time, season, and a
//                real dawn-visibility (heliacal) check of the key stars.
//                The user's stored observations override the calculations,
//                exactly like the core engine.
//   3. Static  : if both fail, keep whatever is already on screen.
//
// The offline mode needs no API calls, no internet, no GPS.

(function () {
    "use strict";

    // ---- Location (geolocation or stored, default 52°N 5°E) ---------------
    const DEFAULT_LOCATION = { lat: 52.0, lon: 5.0 };
    let location = DEFAULT_LOCATION;
    try {
        const saved = localStorage.getItem('kairos_location');
        if (saved) location = JSON.parse(saved);
    } catch (e) { /* ignore */ }

    function requestGeolocation() {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            pos => {
                location = { lat: pos.coords.latitude, lon: pos.coords.longitude };
                try {
                    localStorage.setItem('kairos_location', JSON.stringify(location));
                } catch (e) { /* ignore */ }
                updateKST();
            },
            () => {}, { timeout: 5000, maximumAge: 600000 });
    }

    // ---- Small helpers -----------------------------------------------------
    function setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    function lastObs(obs, category) {
        if (obs && obs[category] && obs[category].length) return obs[category][obs[category].length - 1];
        return null;
    }

    function moonEmojiFromPhase(phase) {
        const idx = Math.round(((phase || 0) % 1) * 8) % 8;
        return ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'][idx];
    }

    function getSeason(solarLongitude) {
        const lon = ((solarLongitude % 360) + 360) % 360;
        if (lon < 90) return 'Spring';
        if (lon < 180) return 'Summer';
        if (lon < 270) return 'Autumn';
        return 'Winter';
    }

    // ---- Sidereal time (Meeus GMST formula) --------------------------------
    function siderealHours(date, longitudeDeg) {
        const d = (date.getTime() - Date.UTC(2000, 0, 1, 12, 0, 0)) / 86400000;
        let gmst = 280.46061837 + 360.98564736629 * d;
        gmst = gmst % 360;
        if (gmst < 0) gmst += 360;
        let lst = (gmst + longitudeDeg) % 360;
        if (lst < 0) lst += 360;
        return lst / 15;
    }

    function calculateSiderealTime(date, longitudeDeg) {
        const h = siderealHours(date, longitudeDeg);
        const hh = Math.floor(h) % 24;
        const mm = Math.floor((h % 1) * 60);
        return `${String(hh).padStart(2, '0')}h${String(mm).padStart(2, '0')}m`;
    }

    // ---- Key stars (same catalog as data/star_data.json) -------------------
    const KEY_STARS = {
        Sirius:   { ra: 6.75,  dec: -16.7 },
        Pleiades: { ra: 3.47,  dec: 24.1 },
        Orion:    { ra: 5.55,  dec: 7.4 },
        Arcturus: { ra: 14.15, dec: 19.18 },
        Vega:     { ra: 18.61, dec: 38.78 }
    };

    function starAltitude(date, lat, lon, star) {
        const lst = siderealHours(date, lon) * 15 * Math.PI / 180;
        const ra = star.ra * 15 * Math.PI / 180;
        const dec = star.dec * Math.PI / 180;
        const phi = lat * Math.PI / 180;
        const H = lst - ra;
        return Math.asin(Math.sin(phi) * Math.sin(dec)
                         + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
    }

    function getDawnStars(now, lat, lon) {
        // Key stars above the horizon at today's sunrise, most prominent first.
        try {
            const times = SunCalc.getTimes(now, lat, lon);
            if (!times.sunrise) return [];
            const up = [];
            for (const name of Object.keys(KEY_STARS)) {
                const alt = starAltitude(times.sunrise, lat, lon, KEY_STARS[name]);
                if (alt > 0) up.push({ name, alt });
            }
            up.sort((a, b) => b.alt - a.alt);
            return up.map(s => s.name);
        } catch (e) { return []; }
    }

    // ---- Offline computation (SunCalc, observation-corrected) --------------
    function computeKST(now) {
        if (typeof SunCalc === 'undefined'
            || typeof SunCalc.getSolarLongitude !== 'function') return null;
        try {
            const lat = location.lat;
            const lon = location.lon;
            const solar_longitude = SunCalc.getSolarLongitude(now);
            const moon = SunCalc.getMoonIllumination(now);
            const lunar_phase = moon.phase % 1;
            const lunar_age = lunar_phase * 29.53058867;
            const times = SunCalc.getTimes(now, lat, lon);
            const dawn = getDawnStars(now, lat, lon);
            return {
                solar_longitude,
                lunar_phase,
                lunar_age,
                sidereal_time: calculateSiderealTime(now, lon),
                season: getSeason(solar_longitude),
                visible_star: dawn.length ? dawn[0] : null,
                dawn_stars: dawn,
                planets: (window.KairosPlanets && window.KairosPlanets.planetLongitudes(now)) || {},
                hasSolarNoon: !!(times && times.solarNoon)
            };
        } catch (e) { return null; }
    }

    // ---- Earth-Age year + tradition date (for the one-line KST format) ------
    const EARTH_AGE_YEARS = 4540000000; // ~4.54 billion years (configurable)

    function formatYear(rawYear) {
        // "4.54B / 2026.624" — scale (Earth age in billions, floored so the
        // precision is never negative) + the remainder (current year).
        const scaleBillions = rawYear / 1e9;
        const scaleValue = Math.floor(scaleBillions * 100) / 100 * 1e9;
        const scale = (scaleValue / 1e9).toFixed(2) + 'B';
        const precision = (rawYear - scaleValue).toFixed(3);
        return `${scale} / ${precision}`;
    }

    function getEarthAge(date) {
        // Aligned with core/checksum.py current_earth_age_year():
        // integer day-of-year (DST-safe) → (doy - 1) / 365.2422.
        const doy = kairosDayOfYear(date);
        return EARTH_AGE_YEARS + date.getFullYear() + (doy - 1) / 365.2422;
    }

    // ---- Canonical Kairos names (mirrors core/constants.py) -----------------
    const KAIROS_DAYS = ["Sundial", "Well", "Root", "Bloom", "Forge", "Harvest", "Star"];
    const KAIROS_MONTHS = ["Root Moon", "Sap Moon", "Green Moon", "Bloom Moon", "Grain Moon",
        "Light Moon", "Thirst Moon", "Fruit Moon", "Harvest Moon", "Wine Moon",
        "Leaf Moon", "Frost Moon", "Star Moon"];
    const KAIROS_SEASONS = { Spring: "Emergence", Summer: "Radiance", Autumn: "Release", Winter: "Stillness" };
    const KAIROS_YEAR_DAY = "Deep Day";

    function kairosDayOfYear(date) {
        // Purely calendar-based (Date.UTC), so DST transitions never shift the count.
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

    // Primary Kairos Time line — always the visual leader:
    // "14:32 · Sundial · Bloom Moon 16 · Radiance · 4.54B / 2026.624"
    function updateKSTSummary(season) {
        const now = new Date();
        const doy = kairosDayOfYear(now);
        const kd = kairosDate(doy);
        const kairosSeason = KAIROS_SEASONS[season] || season;
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        const yearStr = formatYear(getEarthAge(now));
        setText('kstDisplay', `${timeStr} · ${kd.weekday} · ${kd.month} ${kd.day} · ${kairosSeason} · ${yearStr}`);
    }

    // ---- Rendering -----------------------------------------------------------
    const SEASON_COLORS = {
        Spring: '#4a6fa5', Summer: '#5a8f4a', Autumn: '#d4a54a', Winter: '#8a7a6a'
    };

    function renderKST(data) {
        if (!data) return;
        const season = data.season || getSeason(data.solar_longitude);
        const color = SEASON_COLORS[season] || '#4a6fa5';
        const wheel = document.getElementById('kstWheel');
        if (wheel) {
            wheel.style.background = `radial-gradient(circle at center, ${color} 0%, #0b0e14 100%)`;
        }
        const sun = document.getElementById('sunIndicator');
        if (sun) sun.style.transform = `rotate(${(data.solar_longitude || 0) % 360}deg)`;

        const moonEmojis = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];
        const phaseIndex = Math.floor(((data.lunar_phase || 0) % 1) * 8) % 8;
        const moonEl = document.getElementById('moonDisplay');
        if (moonEl) moonEl.textContent = data.moon_emoji || moonEmojis[phaseIndex];

        setText('solarLongitude', `${data.solar_longitude ?? '--'}°`);
        setText('lunarAge', `${data.lunar_age ?? '--'} days`);
        setText('siderealDisplay', data.sidereal_time || '--:--');
        setText('kstSeason', season);

        let starText = '⭐ —';
        if (data.visible_star) {
            starText = `⭐ ${data.visible_star}`;
            const more = (data.dawn_stars || []).length - 1;
            if (more > 0) starText += ` (+${more} more)`;
        } else if (data.next_star && data.next_star_days != null) {
            starText = `⭐ — (next: ${data.next_star} in ~${data.next_star_days}d)`;
        }
        setText('starDisplay', starText);

        // Let the help/energy layer (help.js) consume the fresh snapshot.
        window.__kstData = data;
        if (window.renderTodaysEnergy) renderTodaysEnergy(data);
        if (window.renderPlanetStrip) renderPlanetStrip(data);

        // One-line KST summary: "14:32 · Solaris 16 · Summer · 4.54B / 2026.624"
        updateKSTSummary(season);
    }

    // ---- Update loop ----------------------------------------------------------
    async function updateKST() {
        // 1. Backend engine (Python + Skyfield): full snapshot, planets, next star.
        try {
            const resp = await fetch('/api/kst');
            if (resp.ok) {
                const data = await resp.json();
                if (data && !data.error) {
                    window.__kstActive = true;
                    renderKST(data);
                    return;
                }
            }
        } catch (e) { /* fall through to offline mode */ }

        // 2. Offline: SunCalc, corrected by the user's own observations.
        const calc = computeKST(new Date());
        if (calc) {
            const obs = (typeof loadObs === 'function') ? loadObs() : {};
            const moonObs = lastObs(obs, 'moon_phase');
            const seasonObs = lastObs(obs, 'season_event');
            window.__kstActive = true;
            renderKST({
                solar_longitude: calc.solar_longitude,
                lunar_phase: calc.lunar_phase,
                lunar_age: calc.lunar_age,
                sidereal_time: calc.sidereal_time,
                season: calc.season,                                   // celestial wheel (same as backend)
                observed_season: seasonObs ? seasonObs.value : calc.season,
                visible_star: calc.visible_star,
                dawn_stars: calc.dawn_stars,
                planets: calc.planets || {},
                moon_emoji: moonObs ? moonObs.value : moonEmojiFromPhase(calc.lunar_phase)
            });
            return;
        }

        // 3. Static fallback: leave whatever is already on screen.
        window.__kstActive = false;
    }

    // Expose for app.js observation hooks.
    window.refreshKST = updateKST;

    // Start.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => { updateKST(); requestGeolocation(); });
    } else {
        updateKST();
        requestGeolocation();
    }
    setInterval(updateKST, 10000);

})();

