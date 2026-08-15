// Kairos — help & informative layer.
// Renders the "?" modal (KST explanations, planet meanings, energy) and
// the "today's energy" card in the main display.

// i18n helpers — web/i18n.js is loaded before this script.
const I18n = (typeof window !== 'undefined' && window.KairosI18n) || null;
const t = I18n ? I18n.t.bind(I18n) : (key, vars) => key;
const trName = I18n ? I18n.trName.bind(I18n) : (prefix, name) => name;

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

// ---- "Today's energy" — archetype, mood, element, festival, food ---------
function buildEnergyHTML(kstData) {
    const doy = kairosDayOfYear();
    const archetype = ARCHETYPE_WHEEL[(doy - 1) % 13];
    const element = ELEMENT_CYCLE[(doy - 1) % 5];
    const season = (kstData && kstData.season) || "Spring";
    const mood = phaseNameFromFraction(kstData && kstData.lunar_phase);
    const festival = t('festival.' + season);
    const foods = t('food.' + season);
    const elementGlyphs = { "Light": "☀️", "Shadow": "🌑", "Stone": "🪨", "Wind": "🌬️", "Void": "⚫" };

    return [
        `<div class="energy-line"><span class="energy-key">${t('energy.archetype')}</span>` +
            `<span class="energy-val">${trName('archetype.', archetype)}</span>` +
            `<span class="energy-note">${t('archetype_meaning.' + archetype)}</span></div>`,
        `<div class="energy-line"><span class="energy-key">${t('energy.moon_mood')}</span>` +
            `<span class="energy-val">${trName('moon.', mood)}</span>` +
            `<span class="energy-note">${t('moon_meaning.' + mood)}</span></div>`,
        `<div class="energy-line"><span class="energy-key">${elementGlyphs[element]} ${t('energy.element', { glyph: '' }).trim()}</span>` +
            `<span class="energy-val">${trName('element.', element)}</span>` +
            `<span class="energy-note">${t('element_meaning.' + element)}</span></div>`,
        `<div class="energy-line"><span class="energy-key">🕯️ ${trName('season.', season)}</span>` +
            `<span class="energy-val">${t('energy.festival')}</span>` +
            `<span class="energy-note">${festival}</span></div>`,
        `<div class="energy-line"><span class="energy-key">🍎 ${t('energy.in_season')}</span>` +
            `<span class="energy-val">${t('energy.food')}</span>` +
            `<span class="energy-note">${foods}</span></div>`
    ].join("");
}

function renderTodaysEnergy(kstData) {
    const card = document.getElementById('energyCard');
    if (card) card.innerHTML = buildEnergyHTML(kstData);
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
