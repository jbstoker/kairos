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

    // i18n helpers — web/i18n.js is loaded before this script.
    const I18n = (typeof window !== 'undefined' && window.KairosI18n) || null;
    const t = I18n ? I18n.t.bind(I18n) : (key, vars) => key;
    const trName = I18n ? I18n.trName.bind(I18n) : (prefix, name) => name;

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
            const dawnNames = dawn.map(s => s.name);
            return {
                solar_longitude,
                lunar_phase,
                lunar_age,
                sidereal_time: calculateSiderealTime(now, lon),
                season: getSeason(solar_longitude),
                visible_star: dawnNames.length ? dawnNames[0] : null,
                dawn_stars: dawnNames,
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
        // The month name follows the selected style (web/static/js/
        // calendar_style.js): the canonical Root Moon names or the 13 true
        // zodiac constellations. Falls back to the canonical names.
        const month = (typeof getMonthName === 'function')
            ? getMonthName(m) : KAIROS_MONTHS[m];
        return { month, day: ((doy - 1) % 28) + 1, weekday };
    }

    // Primary Kairos Time line — always the visual leader:
    // "14:32 · ⌛ Sundial · Bloom Moon 16 · ☀️ Radiance · 4.54B / 2026.624"
    // Icons are the single-colour, shape-distinct set (see style.css
    // .icon-* and data/icon_set notes) — colourblind-friendly by shape.
    const DAY_ICONS = {
        Sundial: '⌛', Well: '⛲', Root: '🌱', Bloom: '🌼',
        Forge: '⚒️', Harvest: '🌾', Star: '✦'
    };
    const SEASON_ICONS = {
        Emergence: '🌿', Radiance: '☀️', Release: '🍂', Stillness: '❄️'
    };
    function updateKSTSummary(season) {
        const now = new Date();
        const kairosSeason = KAIROS_SEASONS[season] || season;
        let kairosString;
        if (typeof isKairosKeplerSelected === 'function' && isKairosKeplerSelected()
            && typeof getKairosKeplerHeader === 'function') {
            // Compact Kepler header: "09:19:02 · Scorpius 3 · 26 (270.1°)" —
            // the Stride:Beat:Pulse clock, its month/day and the short civil
            // year, with the Sun's azimuth kept (web/static/js/
            // kairos_kepler_display.js).
            kairosString = getKairosKeplerHeader(now) || primaryTime(now);
        } else {
            const doy = kairosDayOfYear(now);
            const kd = kairosDate(doy);
            const timeStr = primaryTime(now);
            // The year slot: the signature "4.54B / 2026.624" (Earth age split
            // into scale + precision), or the Earth Era year "EE 4.540.002.026"
            // while the zodiac month style is active (calendar_style.js).
            const yearStr = (typeof isZodiacStyle === 'function' && isZodiacStyle()
                && typeof getEarthEraYear === 'function')
                ? `EE ${getEarthEraYear().full}`
                : formatYear(getEarthAge(now));
            const dayIcon = DAY_ICONS[kd.weekday] || '';
            const seasonIcon = SEASON_ICONS[kairosSeason] || '';
            kairosString =
                `${timeStr} · ${dayIcon}${trName('day.', kd.weekday)} · ${trName('month.', kd.month)} ${kd.day} · ${seasonIcon}${trName('season.', kairosSeason)} · ${yearStr}`;
        }
        setText('kstDisplayLine', kairosString);
        updateCivilYearBadge();
        updateKeplerInfo();
        updatePulsePanel();
        // FINAL UNIFIED HEADER: the primary line adapts to the selected
        // tradition (Gregorian lives only in the matrix's centre clock).
        if (window.updateDisplay) {
            window.updateDisplay(kairosString,
                window.getSelectedTradition ? window.getSelectedTradition() : 'tartarian');
        }
    }

    // ---- Visible-star row: primary star + expandable "+N more" -------------
    // Clicking the star (or the "+N more" chip) expands the full list of
    // key stars above the horizon at dawn. Expanded state survives the
    // 10-second refresh so the list doesn't collapse under the user.
    function renderStarDisplay(data) {
        const el = document.getElementById('starDisplay');
        if (!el) return;

        const wasExpanded = !!(el.querySelector('.star-more-list')
            && !el.querySelector('.star-more-list').hidden);

        // Both the backend (/api/kst → name strings) and the offline engine
        // can feed this; normalize a star entry (string, or {name}) to a name.
        const nameOf = (s) => (typeof s === 'string' ? s : (s && s.name) || '');
        const primary = nameOf(data.visible_star);

        if (primary) {
            const others = (data.dawn_stars || [])
                .map(nameOf)
                .filter(n => n && n !== primary);
            let html = `<span class="star-primary">⭐ ${trName('star.', primary)}</span>`;
            if (others.length) {
                html +=
                    `<button type="button" class="star-more" aria-expanded="${wasExpanded}">` +
                    (wasExpanded ? t('kst.hide') : t('kst.more', { count: others.length })) +
                    `</button>` +
                    `<span class="star-more-list" ${wasExpanded ? '' : 'hidden'}>` +
                    others.map(n => `· ${trName('star.', n)}`).join('<br>') +
                    `</span>`;
            }
            el.innerHTML = html;
            const list = el.querySelector('.star-more-list');
            if (list) {
                el.addEventListener('click', () => {
                    const show = list.hidden;
                    list.hidden = !show;
                    const btn = el.querySelector('.star-more');
                    if (btn) {
                        btn.textContent = show ? t('kst.hide') : t('kst.more', { count: others.length });
                        btn.setAttribute('aria-expanded', String(show));
                    }
                });
            }
        } else if (data.next_star && data.next_star_days != null) {
            el.innerHTML =
                `<span class="star-primary">${t('kst.next_star', {
                    star: trName('star.', data.next_star),
                    days: data.next_star_days
                })}</span>`;
        } else {
            el.textContent = t('kst.none');
        }
    }

    // ---- Rendering -----------------------------------------------------------
    const SEASON_COLORS = {
        Spring: '#4a6fa5', Summer: '#5a8f4a', Autumn: '#d4a54a', Winter: '#8a7a6a'
    };

    // ---- Primary display time: the solar position, not the wall clock ---------
    // "12:00 (180.0°)" — time as a position (web/static/js/solar_time.js).
    // The optional reading layers remap the same solar day, keeping the
    // degree — so the number and the sky-dome bead still agree:
    //   · web/static/js/natural_time.js        — 13h / 28m / 13s dial
    //   · web/static/js/kairos_natural_time.js — 26h / 28m / 7s "13 light +
    //     13 dark" dial
    //   · web/static/js/kairos_time.js         — Kairos Kepler: 26 strides /
    //     28 beats / 7 pulses with a VARIABLE pulse length from the equation
    //     of time (5096 pulses = one apparent solar day).
    function primaryTime(now) {
        if (typeof isKairosKeplerSelected === 'function' && isKairosKeplerSelected()) {
            if (typeof getKairosKeplerHeader === 'function') {
                const h = getKairosKeplerHeader(now);
                if (h) return h;
            }
            if (typeof getKairosKeplerTimeDisplay === 'function') return getKairosKeplerTimeDisplay();
        }
        if (typeof isKairosNaturalSelected === 'function' && isKairosNaturalSelected()) {
            if (typeof getKairosNaturalTimeDisplay === 'function') return getKairosNaturalTimeDisplay();
        }
        if (typeof isNaturalTimeSelected === 'function' && isNaturalTimeSelected()) {
            if (typeof getNaturalTimeDisplay === 'function') return getNaturalTimeDisplay();
        }
        if (typeof getKairosTimeDisplay === 'function') return getKairosTimeDisplay();
        return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }

    // The Kairos Kepler info panel (web/static/js/kairos_kepler_display.js +
    // web/static/js/kairos_dual_time.js): the full Earth Era date, the short
    // civil date, the variable pulse length and the VISUAL dial position —
    // shown under the primary line only while Kepler mode is active.
    function updateKeplerInfo() {
        const fullEl = document.getElementById('full-kairos-date');
        const civilEl = document.getElementById('civil-kairos-date');
        const pulseEl = document.getElementById('pulse-length');
        const visualEl = document.getElementById('visual-time');
        if (!fullEl && !civilEl && !pulseEl && !visualEl) return;
        if (typeof isKairosKeplerSelected === 'function' && isKairosKeplerSelected()
            && typeof getKairosKeplerDisplay === 'function') {
            try {
                const d = getKairosKeplerDisplay(new Date());
                if (d) {
                    if (fullEl) { fullEl.textContent = d.fullStr; fullEl.hidden = false; }
                    if (civilEl) { civilEl.textContent = d.civilStr; civilEl.hidden = false; }
                    if (pulseEl) { pulseEl.textContent = `Pulse: ${d.pulseLength.toFixed(4)} s`; pulseEl.hidden = false; }
                    // VISUAL_TIME: the Sun's azimuth mapped back onto the
                    // 26 × 28 × 7 dial (kairos_dual_time.js) — the dial hand
                    // position next to the global orbital text. Follows the
                    // 📐 Display Index choice (0-indexed default).
                    if (visualEl) {
                        if (typeof getVisualDialTime === 'function' && typeof getSolarAzimuth === 'function') {
                            const v = getVisualDialTime(getSolarAzimuth());
                            const one = (typeof getIndexStyle === 'function' && getIndexStyle() === 'one');
                            visualEl.textContent = `Dial: ${one ? v.formatted1 : v.formatted}`;
                            visualEl.hidden = false;
                        } else {
                            visualEl.hidden = true;
                        }
                    }
                    return;
                }
            } catch (e) { /* fall through to hidden */ }
        }
        if (fullEl) fullEl.hidden = true;
        if (civilEl) civilEl.hidden = true;
        if (pulseEl) pulseEl.hidden = true;
        if (visualEl) visualEl.hidden = true;
    }

    // The short civil year badge ("EE 26") — shown only while the zodiac
    // month style is active (calendar_style.js) and the Kepler info panel is
    // NOT (the panel already carries the short civil date).
    function updateCivilYearBadge() {
        const el = document.getElementById('civilYear');
        if (!el) return;
        const keplerActive = (typeof isKairosKeplerSelected === 'function')
            && isKairosKeplerSelected();
        if (!keplerActive && typeof isZodiacStyle === 'function' && isZodiacStyle()
            && typeof getEarthEraYear === 'function') {
            try {
                el.textContent = `EE ${getEarthEraYear().short}`;
                el.hidden = false;
                return;
            } catch (e) { /* fall through to hidden */ }
        }
        el.hidden = true;
    }

    // The Kairos Kepler pulse panel (web/static/js/kairos_kepler_display.js):
    // the live variable pulse length, the apparent day length and the
    // equation of time — the "heart" of the system. Visible only while the
    // kairos_kepler time system is active; refreshed on the 10 s KST cycle
    // and whenever the time system changes.
    function updatePulsePanel() {
        const panel = document.getElementById('pulse-panel');
        if (!panel) return;
        const active = (typeof isKairosKeplerSelected === 'function')
            && isKairosKeplerSelected();
        panel.hidden = !active;
        if (!active) return;
        if (typeof getPulseDisplayData !== 'function'
            || typeof formatPulseDisplay !== 'function') return;
        try {
            const data = getPulseDisplayData(new Date());
            if (!data) return;
            const formatted = formatPulseDisplay(data);
            const pulseEl = document.getElementById('pulse-value');
            const dayEl = document.getElementById('day-value');
            const eotEl = document.getElementById('eot-value');
            if (pulseEl) pulseEl.textContent = formatted.pulseStr;
            if (dayEl) dayEl.textContent = `${formatted.dayStr} (${formatted.dayVarStr})`;
            if (eotEl) eotEl.textContent = formatted.eotStr;
        } catch (e) { /* ignore */ }
    }

    function renderKST(data) {
        if (!data) return;
        const season = data.season || getSeason(data.solar_longitude);

        // The unified kstDisplay panel (web/static/js/app_controller.js)
        // renders the concentric matrix, the Gregorian anchor, the metadata
        // grid and the observed context from this fresh snapshot.
        window.__kstData = data;
        if (window.renderTodaysEnergy) renderTodaysEnergy(data);

        // One-line KST summary: "14:32 · Solaris 16 · Summer · 4.54B / 2026.624"
        updateKSTSummary(season);
        if (window.refreshUnifiedPanel) window.refreshUnifiedPanel();
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

