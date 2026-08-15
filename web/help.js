// Kairos — help & informative layer.
// Renders the "?" modal (KST explanations, planet meanings, energy) and
// the "today's energy" card in the main display.

function kairosDayOfYear() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    return Math.floor((now - start) / 86400000);
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
    const festival = (SEASON_FESTIVAL_MEANINGS[season] || []).join(" · ");
    const foods = (SEASONAL_FOODS[season] || []).join(", ");
    const elementGlyphs = { "Light": "☀️", "Shadow": "🌑", "Stone": "🪨", "Wind": "🌬️", "Void": "⚫" };

    return [
        `<div class="energy-line"><span class="energy-key">🜂 Archetype</span>` +
            `<span class="energy-val">${archetype}</span>` +
            `<span class="energy-note">${ARCHETYPE_MEANINGS[archetype]}</span></div>`,
        `<div class="energy-line"><span class="energy-key">🌙 Moon mood</span>` +
            `<span class="energy-val">${mood}</span>` +
            `<span class="energy-note">${MOON_MOOD_MEANINGS[mood]}</span></div>`,
        `<div class="energy-line"><span class="energy-key">${elementGlyphs[element]} Element</span>` +
            `<span class="energy-val">${element}</span>` +
            `<span class="energy-note">${ELEMENT_MEANINGS[element]}</span></div>`,
        `<div class="energy-line"><span class="energy-key">🕯️ ${season}</span>` +
            `<span class="energy-val">festival</span>` +
            `<span class="energy-note">${festival}</span></div>`,
        `<div class="energy-line"><span class="energy-key">🍎 In season</span>` +
            `<span class="energy-val">food</span>` +
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
    const parts = order.filter(n => planets[n]).map(n => {
        const meta = PLANET_MEANINGS[n];
        const sign = planets[n].zodiac || '—';
        const glyph = ZODIAC_GLYPHS[sign] || '';
        return `${meta.glyph} ${glyph}${sign}`;
    });
    el.textContent = parts.length ? parts.join(' · ') : '—';
}

// ---- Help modal -----------------------------------------------------------
function openHelp() {
    const kstData = window.__kstData || null;
    const body = document.getElementById('helpBody');
    if (!body) return;

    let html = '<div class="help-section"><h3>What am I looking at?</h3>';
    for (const key of ['wheel', 'solarLongitude', 'lunarAge', 'sidereal', 'star', 'season']) {
        const item = KST_HELP[key];
        html += `<p><strong>${item.title}.</strong> ${item.text}</p>`;
    }
    html += '</div>';

    html += '<div class="help-section"><h3>🪐 The planets now (esoteric notes)</h3>';
    const planets = (kstData && kstData.planets) || {};
    const order = ['mercury', 'venus', 'mars', 'jupiter', 'saturn'];
    const present = order.filter(n => planets[n]);
    if (present.length) {
        html += present.map(n => {
            const meta = PLANET_MEANINGS[n];
            const sign = planets[n].zodiac || '—';
            const glyph = ZODIAC_GLYPHS[sign] || '';
            return `<div class="help-row">
                <span class="planet-glyph">${meta.glyph} ${meta.name}</span>
                <span class="planet-sign">in ${glyph} ${sign}</span>
                <span class="planet-meaning">${meta.meaning}</span>
            </div>`;
        }).join('');
    } else {
        html += '<p>Planet positions need the celestial engine — run <code>python web/server.py</code> (or the offline fallback shows nothing here).</p>';
    }
    html += '</div>';

    html += '<div class="help-section"><h3>✨ Today&apos;s energy</h3>';
    html += buildEnergyHTML(kstData);
    html += '</div>';

    html += '<div class="help-section"><h3>🜂 The five elements</h3>';
    for (const el of ELEMENT_CYCLE) {
        html += `<p><strong>${el}.</strong> ${ELEMENT_MEANINGS[el]}</p>`;
    }
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
