// Kairos — help & informative layer.
// Renders the "?" modal (KST explanations, planet meanings, energy) and
// the "today's energy" card in the main display.

// i18n helpers — web/i18n.js + web/app.js are loaded before this script.
// app.js already declares the global `I18n`, `t` and `trName` in the shared
// global lexical scope; redeclaring any of them here would throw
// "SyntaxError: redeclaration of const I18n" in classic-script browsers.

function kairosDayOfYear() {
    const now = new Date();
    // Purely calendar-based (Date.UTC), so DST transitions never shift the count.
    return Math.floor(
        (Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
            - Date.UTC(now.getFullYear(), 0, 0)) / 86400000);
}

function phaseNameFromFraction(fraction) {
    const names = ["New Moon", "Waxing Crescent", "First Quarter", "Waxing Gibbous",
                   "Full Moon", "Waning Gibbous", "Last Quarter", "Waning Crescent"];
    return names[Math.floor(((fraction || 0) % 1) * 8) % 8];
}

// ---- Energy Lens integration ------------------------------------------------
// The energy card normally shows the "pure Kairos" layer (13-day archetype
// wheel, moon mood, element cycle, seasonal festival & food). With an Energy
// Lens selected (web/static/js/lens_manager.js + energy_data.js), the same
// moments are reinterpreted through one of the seven traditions.
const KAIROS_TO_ENERGY_ELEMENT = {
    Light: 'Fire', Shadow: 'Water', Stone: 'Earth', Wind: 'Air', Void: 'Ether'
};
const KAIROS_SEASON_MAP = {
    Spring: 'Emergence', Summer: 'Radiance', Autumn: 'Release', Winter: 'Stillness'
};

function getCurrentArchetype() {
    const doy = kairosDayOfYear();
    return ARCHETYPE_WHEEL[(doy - 1) % 13];
}

function getCurrentMoonMood(kstData) {
    return phaseNameFromFraction(kstData && kstData.lunar_phase);
}

function getCurrentElement() {
    const doy = kairosDayOfYear();
    return ELEMENT_CYCLE[(doy - 1) % 5];
}

function getCurrentSeason(kstData) {
    const tropical = (kstData && kstData.season) || 'Spring';
    return KAIROS_SEASON_MAP[tropical] || tropical;
}

// The "festival" of the moment: a full/new moon outranks the solar quarter,
// otherwise the nearest solstice or equinox from the solar longitude.
function getCurrentFestival(kstData) {
    const lon = (((kstData && kstData.solar_longitude) || 0) % 360 + 360) % 360;
    const phase = (kstData && kstData.lunar_phase != null) ? kstData.lunar_phase : 0;
    const age = (kstData && kstData.lunar_age != null)
        ? Number(kstData.lunar_age)
        : (((phase % 1) + 1) % 1) * 29.53058867;
    const distToFull = Math.min(Math.abs(age - 14.77), 29.53 - Math.abs(age - 14.77));
    const distToNew = Math.min(age, 29.53 - age);
    if (distToFull < 1.5) return 'Full Moon';
    if (distToNew < 1.5) return 'New Moon';
    const quarters = ['Spring Equinox', 'Summer Solstice', 'Autumn Equinox', 'Winter Solstice'];
    return quarters[Math.round(lon / 90) % 4];
}

// ---- "Today's energy" — archetype, mood, element, festival, food ---------
function buildEnergyHTML(kstData) {
    const archetype = getCurrentArchetype();
    const element = getCurrentElement();
    const season = (kstData && kstData.season) || "Spring";        // tropical
    const kairosSeason = getCurrentSeason(kstData);                // Emergence/Radiance/...
    const mood = getCurrentMoonMood(kstData);
    const festivalKey = getCurrentFestival(kstData);

    // Energy Lens — reinterpret the same moments through a chosen tradition.
    const energyLens = (typeof window.getEnergyLens === 'function') ? window.getEnergyLens() : 'none';
    const lensData = (energyLens !== 'none' && window.getEnergyLensData)
        ? window.getEnergyLensData(energyLens) : null;
    const lensVal = (category, key, valueType) => lensData
        ? window.getEnergyValue(energyLens, category, key, valueType) : null;

    // Archetype
    let archetypeVal = trName('archetype.', archetype);
    let archetypeNote = t('archetype_meaning.' + archetype);
    if (lensData) {
        const eq = lensVal('archetypes', archetype, 'equivalent');
        const practice = lensVal('archetypes', archetype, 'practice');
        if (eq) archetypeVal = eq;
        if (practice) archetypeNote = practice;
    }

    // Moon mood
    let moodVal = trName('moon.', mood);
    let moodNote = t('moon_meaning.' + mood);
    if (lensData) {
        const eq = lensVal('moonMoods', mood, 'mood');
        const practice = lensVal('moonMoods', mood, 'practice');
        if (eq) moodVal = eq;
        if (practice) moodNote = practice;
    }

    // Element (the Kairos cycle maps positionally onto the classical five)
    const lensElementKey = KAIROS_TO_ENERGY_ELEMENT[element] || element;
    let elementVal = trName('element.', element);
    let elementNote = t('element_meaning.' + element);
    if (lensData) {
        const eq = lensVal('elements', lensElementKey, 'element');
        if (eq) {
            elementVal = eq;
            const dir = lensVal('elements', lensElementKey, 'direction');
            const col = lensVal('elements', lensElementKey, 'color');
            elementNote = [dir, col].filter(Boolean).join(' · ');
        }
    }

    // Festival
    let festivalVal = t('energy.festival');
    let festivalNote = t('festival.' + season);
    if (lensData) {
        const eq = lensVal('festivals', festivalKey, 'equivalent');
        const practice = lensVal('festivals', festivalKey, 'practice');
        if (eq) festivalVal = eq;
        if (practice) festivalNote = practice;
    }

    // In season (foods & herbs)
    let foodsVal = t('energy.food');
    let foodsNote = t('food.' + season);
    if (lensData) {
        const foods = lensVal('seasons', kairosSeason, 'foods');
        const herbs = lensVal('seasons', kairosSeason, 'herbs');
        if (foods) foodsVal = foods;
        if (herbs) foodsNote = herbs;
    }

    return [
        `<div class="energy-line"><span class="energy-key">${t('energy.archetype')}</span>` +
            `<span class="energy-val">${archetypeVal}</span>` +
            `<span class="energy-note">${archetypeNote}</span></div>`,
        `<div class="energy-line"><span class="energy-key">${t('energy.moon_mood')}</span>` +
            `<span class="energy-val">${moodVal}</span>` +
            `<span class="energy-note">${moodNote}</span></div>`,
        `<div class="energy-line"><span class="energy-key">${t('energy.element', { glyph: '' }).trim()}</span>` +
            `<span class="energy-val">${elementVal}</span>` +
            `<span class="energy-note">${elementNote}</span></div>`,
        `<div class="energy-line"><span class="energy-key">${trName('season.', kairosSeason)}</span>` +
            `<span class="energy-val">${festivalVal}</span>` +
            `<span class="energy-note">${festivalNote}</span></div>`,
        `<div class="energy-line"><span class="energy-key">${t('energy.in_season')}</span>` +
            `<span class="energy-val">${foodsVal}</span>` +
            `<span class="energy-note">${foodsNote}</span></div>`
    ].join("");
}

function renderTodaysEnergy(kstData) {
    const card = document.getElementById('energyCard');
    if (!card) return;
    const body = buildEnergyHTML(kstData);
    // Collapsible: collapsed by default so the card saves room.
    card.innerHTML =
        `<button type="button" class="energy-toggle" id="energyToggle" aria-expanded="false" aria-controls="energyCardBody">` +
        `<svg class="icon-line icon-line-no-margin energy-toggle-icon" aria-hidden="true"><use href="static/icons.svg#icon-chevron-down"/></svg>` +
        `<span>${t('help.todays_energy')}</span></button>` +
        `<div class="energy-body" id="energyCardBody" hidden>${body}</div>`;
    const toggle = document.getElementById('energyToggle');
    const bodyEl = document.getElementById('energyCardBody');
    if (toggle && bodyEl) {
        toggle.addEventListener('click', () => {
            const open = bodyEl.hidden;
            bodyEl.hidden = !open;
            toggle.setAttribute('aria-expanded', String(open));
            const icon = toggle.querySelector('.energy-toggle-icon use');
            if (icon) {
                icon.setAttribute('href',
                    open ? 'static/icons.svg#icon-chevron-up' : 'static/icons.svg#icon-chevron-down');
            }
        });
    }
}

function renderPlanetStrip(kstData) {
    const el = document.getElementById('planetDisplay');
    if (!el) return;
    const planets = (kstData && kstData.planets) || {};
    const order = ['mercury', 'venus', 'mars', 'jupiter', 'saturn'];
    // One clean row per planet (☿ Mercury · ♌ Leo) instead of a run-on line.
    const lines = order.filter(n => planets[n]).map(n => {
        const meta = PLANET_MEANINGS[n];
        const sign = planets[n].zodiac || '—';
        const glyph = ZODIAC_GLYPHS[sign] || '';
        return `<span class="planet-line">${meta.glyph} ${trName('planet.', n)} · ${glyph}${trName('zodiac.', sign)}</span>`;
    });
    el.innerHTML = lines.length ? lines.join('') : '—';
}

// ---- Help modal -----------------------------------------------------------
function openHelp() {
    const kstData = window.__kstData || null;
    const body = document.getElementById('helpBody');
    if (!body) return;

    let html = `<div class="help-section"><h3>${t('help.what_am_i_looking_at')}</h3>`;
    for (const key of ['wheel', 'solarLongitude', 'lunarAge', 'sidereal', 'star', 'season']) {
        html += `<p><strong>${t('kst_help.' + key + '.title')}.</strong> ${t('kst_help.' + key + '.text')}</p>`;
    }
    html += '</div>';

    html += `<div class="help-section"><h3>${t('help.planets_now')}</h3>`;
    const planets = (kstData && kstData.planets) || {};
    const order = ['mercury', 'venus', 'mars', 'jupiter', 'saturn'];
    const present = order.filter(n => planets[n]);
    if (present.length) {
        html += present.map(n => {
            const meta = PLANET_MEANINGS[n];
            const sign = planets[n].zodiac || '—';
            const glyph = ZODIAC_GLYPHS[sign] || '';
            return `<div class="help-row">
                <span class="planet-glyph">${meta.glyph} ${trName('planet.', n)}</span>
                <span class="planet-sign">${t('help.planet_in', { sign: glyph + trName('zodiac.', sign) })}</span>
                <span class="planet-meaning">${t('planet_meaning.' + n)}</span>
            </div>`;
        }).join('');
    } else {
        html += `<p>${t('help.planets_fallback')}</p>`;
    }
    html += '</div>';

    html += `<div class="help-section"><h3>${t('help.todays_energy')}</h3>`;
    html += buildEnergyHTML(kstData);
    html += '</div>';

    html += `<div class="help-section"><h3>${t('help.five_elements')}</h3>`;
    for (const el of ELEMENT_CYCLE) {
        html += `<p><strong>${trName('element.', el)}.</strong> ${t('element_meaning.' + el)}</p>`;
    }
    html += '</div>';

    html += `<div class="help-section"><h3>${t('help.phytochem')}</h3>`;
    html += `<p>${t('help.phytochem_text')}</p>`;
    html += '</div>';

    html += `<div class="help-section"><h3>${t('help.community')}</h3>`;
    html += `<p>${t('help.community_text')}</p>`;
    html += '</div>';

    body.innerHTML = html;
    document.getElementById('helpModal').hidden = false;
    document.body.classList.add('modal-open');
}

function closeHelp() {
    const modal = document.getElementById('helpModal');
    if (modal) modal.hidden = true;
    document.body.classList.remove('modal-open');
}

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('helpBtn');
    const close = document.getElementById('helpClose');
    const modal = document.getElementById('helpModal');
    if (btn) btn.addEventListener('click', openHelp);
    if (close) close.addEventListener('click', closeHelp);
    if (modal) modal.addEventListener('click', e => {
        if (e.target === modal) closeHelp();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeHelp();
    });
});
