const STORAGE_KEY = 'kairos_observations';
const TRADITION_KEY = 'kairos_tradition';

const TRADITION_EMOJI = {
    rhythm: "🌗", tartarian: "🌌", celtic: "🌿", chinese: "🐉",
    vedic: "🕉️", mesopotamian: "🏛️", mystical: "🔮"
};
const TRADITION_LABEL = {
    rhythm: "Rhythm", tartarian: "Tartarian", celtic: "Celtic", chinese: "Chinese",
    vedic: "Vedic", mesopotamian: "Mesopotamian", mystical: "Mystical"
};

const TRADITIONS = {
    rhythm: {
        months: 13,
        names: ["Root Moon", "Sap Moon", "Green Moon", "Bloom Moon", "Grain Moon", "Light Moon", "Thirst Moon", "Fruit Moon", "Harvest Moon", "Wine Moon", "Leaf Moon", "Frost Moon", "Star Moon"],
        yearDay: "Deep Day"
    },
    tartarian: {
        months: 13,
        names: ["Solaris", "Lunaris", "Floralis", "Aquarius", "Arboris", "Luminis", "Solaris II", "Ventus", "Telluris", "Ignis", "Caelestis", "Oceanus", "Terra Nova"],
        yearDay: "Tartarus Day"
    },
    celtic: {
        months: 13,
        names: ["Beth", "Luis", "Fearn", "Saille", "Nion", "Uath", "Duir", "Tinne", "Coll", "Muin", "Gort", "Ngetal", "Ruis"],
        yearDay: "Feast of the Dead"
    },
    chinese: {
        months: 12,
        names: ["Zhengyue", "Er Yue", "San Yue", "Si Yue", "Wu Yue", "Liu Yue", "Qi Yue", "Ba Yue", "Jiu Yue", "Shi Yue", "Shiyi Yue", "Shi'er Yue"],
        yearDay: "Laba"
    },
    vedic: {
        months: 12,
        names: ["Chaitra", "Vaishakha", "Jyeshtha", "Ashadha", "Shravana", "Bhadrapada", "Ashwina", "Kartika", "Agrahayana", "Pausha", "Magha", "Phalguna"],
        yearDay: "Mahashivaratri"
    },
    mesopotamian: {
        months: 12,
        names: ["Nisannu", "Ayaru", "Simanu", "Du'uzu", "Abu", "Ululu", "Tashritu", "Arahsamna", "Kislimu", "Tebetu", "Shabatu", "Addaru"],
        yearDay: "Akitu"
    },
    mystical: {
        months: 13,
        names: ["Phoenix", "Dragon", "Serpent", "Wolf", "Raven", "Bear", "Owl", "Elk", "Salmon", "Eagle", "Horse", "Whale", "Star"],
        yearDay: "Void Day"
    }
};

function loadObs() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { solar_noon: [], moon_phase: [], season_event: [] };
    } catch { return { solar_noon: [], moon_phase: [], season_event: [] }; }
}

function saveObs(category, value) {
    const obs = loadObs();
    if (!obs[category]) obs[category] = [];
    obs[category].push({ timestamp: new Date().toISOString(), value });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obs));
    updateDisplay();
}

function getLast(category) {
    const obs = loadObs();
    if (obs[category] && obs[category].length) return obs[category][obs[category].length - 1];
    return null;
}

function getMoonPhase(emoji) {
    const map = { "🌑": 0, "🌒": 1, "🌓": 2, "🌔": 3, "🌕": 4, "🌖": 5, "🌗": 6, "🌘": 7 };
    return map[emoji] !== undefined ? map[emoji] : null;
}

function phaseName(idx) {
    const names = ["New Moon", "Waxing Crescent", "First Quarter", "Waxing Gibbous", "Full Moon", "Waning Gibbous", "Last Quarter", "Waning Crescent"];
    return names[idx] || "Unknown";
}

function getTradition() {
    return localStorage.getItem(TRADITION_KEY) || 'tartarian';
}

function setTradition(trad) {
    localStorage.setItem(TRADITION_KEY, trad);
    updateDisplay();
}

function dayOfYear(date) {
    // Purely calendar-based (Date.UTC), so DST transitions never shift the count.
    return Math.floor(
        (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
            - Date.UTC(date.getFullYear(), 0, 0)) / 86400000);
}

function traditionDate(doy, trad) {
    if (trad.months === 13) {
        if (doy > 364) return { month: trad.yearDay, day: doy - 364 };
        const m = Math.floor((doy - 1) / 28);
        return { month: trad.names[m], day: ((doy - 1) % 28) + 1 };
    }
    // 12-month solar approximation: 5 x 31 + 7 x 30
    if (doy <= 155) {
        const m = Math.floor((doy - 1) / 31);
        return { month: trad.names[m], day: ((doy - 1) % 31) + 1 };
    }
    const m = 5 + Math.floor((doy - 156) / 30);
    return { month: trad.names[m], day: ((doy - 156) % 30) + 1 };
}

function updateDisplay() {
    const obs = loadObs();
    const solar = getLast('solar_noon');
    const moonEmoji = getLast('moon_phase')?.value || "🌑";
    const season = getLast('season_event')?.value || "Observing...";
    const moonIdx = getMoonPhase(moonEmoji);
    const tradition = getTradition();

    let solarTime = "--:--";
    if (solar) {
        const noon = new Date(solar.timestamp);
        const now = new Date();
        const diff = (now - noon) / 3600000;
        const hours = ((diff % 24) + 24) % 24;
        const hh = Math.floor(hours);
        const mm = Math.floor((hours - hh) * 60);
        solarTime = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    }

    const d = traditionDate(dayOfYear(new Date()), TRADITIONS[tradition]);

    const noon = getLast('solar_noon');
    let noonText = '';
    if (noon) {
        const n = new Date(noon.timestamp);
        const hh = String(n.getHours()).padStart(2, '0');
        const mm = String(n.getMinutes()).padStart(2, '0');
        noonText = `Noon: ${hh}:${mm} (observed)`;
    }

    const solarEl = document.getElementById('solarTime');
    if (solarEl) {
        solarEl.textContent = solarTime;
        solarEl.title = solar
            ? 'Observed solar noon — your local solar time.'
            : 'No observation yet — tap 📐 Shadow Shortest at true noon to see your local solar time.';
    }
    if (!window.__kstActive) {
        // KST (celestial engine) owns the moon display when it is live.
        document.getElementById('moonDisplay').textContent = moonEmoji;
    }
    document.getElementById('seasonDisplay').textContent = `${season} (${tradition})`;
    document.getElementById('calendarDisplay').textContent = `${d.month} ${d.day}`;
    document.getElementById('noonDisplay').textContent = noonText;
    document.getElementById('gregorian').textContent = `(Gregorian: ${new Date().toLocaleString()})`;
    const tradEl = document.getElementById('traditionDisplay');
    if (tradEl) {
        tradEl.textContent = `${TRADITION_EMOJI[tradition] || '🌌'} ${TRADITION_LABEL[tradition] || tradition} · optional layer`;
    }
    document.getElementById('status').textContent = `Moon: ${moonIdx !== null ? phaseName(moonIdx) : 'unknown'} | Season: ${season}`;
}

// --- Precession self-check (fold 2: the deep time is checked) -------------
// One footer line. When the Flask server is running, /api/checksum records
// the check in data/checksums.json (the continuous log); offline, the same
// arithmetic runs in the browser via checksum_selfcheck.js.
function renderSelfCheck(result) {
    const el = document.getElementById('checksumLine');
    if (!el || !result || !window.KairosSelfCheck) return;
    let text = window.KairosSelfCheck.checksumLine(result);
    const trend = result.trend;
    if (trend && trend.count) {
        text += trend.stable
            ? ` · stable across ${trend.count} checks`
            : ` · DRIFTING across ${trend.count} checks`;
    }
    const now = new Date();
    text += ` · updated ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    el.textContent = text;
    el.className = 'checksum-line ' + (result.status === 'consistent' ? 'ok' : 'warn');
}

async function updateSelfCheck() {
    const el = document.getElementById('checksumLine');
    if (!el) return;
    try {
        const resp = await fetch('/api/checksum');
        if (resp.ok) {
            const data = await resp.json();
            if (data && !data.error) {
                renderSelfCheck(data);
                return;
            }
        }
    } catch (e) { /* fall through to offline */ }

    if (window.KairosSelfCheck) {
        renderSelfCheck(window.KairosSelfCheck.precessionChecksum());
    } else {
        el.textContent = 'Self-check: unavailable';
    }
}

// --- Share this moment (text + clipboard + canvas image) ------------------
function buildShareText() {
    const kst = document.getElementById('kstDisplay')?.textContent || '--:--';
    const greg = document.getElementById('gregorian')?.textContent || '';
    const season = (window.__kstData && window.__kstData.season) || '—';
    let loc = '';
    try {
        const saved = JSON.parse(localStorage.getItem('kairos_location') || 'null');
        if (saved) {
            loc = ` · ${Math.abs(saved.lat).toFixed(1)}°${saved.lat >= 0 ? 'N' : 'S'}, ` +
                `${Math.abs(saved.lon).toFixed(1)}°${saved.lon >= 0 ? 'E' : 'W'}`;
        }
    } catch (e) { /* ignore */ }
    return `☀️ Kairos — ${kst}\n${greg}${loc}\n🌍 ${season} · kairos.jbstoker.github.io`;
}

function openShareModal() {
    const modal = document.getElementById('shareModal');
    const text = document.getElementById('shareText');
    if (!modal || !text) return;
    text.value = buildShareText();
    modal.hidden = false;
    document.body.classList.add('modal-open');
}

function closeShareModal() {
    const modal = document.getElementById('shareModal');
    if (modal) modal.hidden = true;
    document.body.classList.remove('modal-open');
}

function copyShareText() {
    const text = document.getElementById('shareText').value;
    const done = () => {
        const status = document.getElementById('status');
        if (status) status.textContent = '✅ Moment copied to clipboard';
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(() => legacyCopy(text));
    } else {
        legacyCopy(text);
    }
}

function legacyCopy(text) {
    const ta = document.getElementById('shareText');
    ta.focus();
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    const status = document.getElementById('status');
    if (status) status.textContent = ok ? '✅ Moment copied to clipboard' : 'Select the text and copy manually.';
}

function downloadMomentImage() {
    const lines = buildShareText().split('\n');
    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 430;
    const ctx = canvas.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, '#0b0e14');
    g.addColorStop(1, '#1e2632');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#2a3442';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
    ctx.fillStyle = '#f0c27f';
    ctx.font = '600 46px Georgia, serif';
    ctx.fillText('☀️ Kairos', 60, 95);
    ctx.fillStyle = '#d4d9e6';
    ctx.font = '28px "Segoe UI", Tahoma, sans-serif';
    lines.forEach((line, i) => ctx.fillText(line, 60, 175 + i * 48));
    ctx.fillStyle = '#5a6a7c';
    ctx.font = '20px "Segoe UI", Tahoma, sans-serif';
    ctx.fillText('time you observe · kairos.jbstoker.github.io', 60, canvas.height - 45);
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'kairos-moment.png';
    a.click();
    const status = document.getElementById('status');
    if (status) status.textContent = '🖼️ Kairos moment image downloaded';
}

// --- Event Listeners ---
document.querySelectorAll('#moonButtons button').forEach(btn => {
    btn.addEventListener('click', () => {
        saveObs('moon_phase', btn.dataset.emoji);
        document.getElementById('status').textContent = `✅ Moon set to ${btn.dataset.emoji} — KST calibrated`;
        if (window.refreshKST) window.refreshKST();
    });
});

document.getElementById('solarNoonBtn').addEventListener('click', () => {
    saveObs('solar_noon', 'observed');
    document.getElementById('status').textContent = '✅ Solar noon observed! KST calibrated.';
    if (window.refreshKST) window.refreshKST();
});

['Spring', 'Summer', 'Autumn', 'Winter'].forEach(season => {
    document.getElementById(`season${season}`).addEventListener('click', () => {
        saveObs('season_event', season);
        document.getElementById('status').textContent = `✅ Season set to ${season}`;
        if (window.refreshKST) window.refreshKST();
    });
});

document.getElementById('traditionSelect').addEventListener('change', (e) => {
    setTradition(e.target.value);
    document.getElementById('status').textContent = `Tradition switched to ${e.target.value}`;
});

document.getElementById('shareBtn').addEventListener('click', openShareModal);
document.getElementById('shareClose').addEventListener('click', closeShareModal);
document.getElementById('copyShareBtn').addEventListener('click', copyShareText);
document.getElementById('imageShareBtn').addEventListener('click', downloadMomentImage);
const shareModalEl = document.getElementById('shareModal');
if (shareModalEl) {
    shareModalEl.addEventListener('click', e => {
        if (e.target === shareModalEl) closeShareModal();
    });
}

// Escape closes any open modal.
document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    ['shareModal', 'seasonalModal', 'addSeasonalModal'].forEach(id => {
        const m = document.getElementById(id);
        if (m && !m.hidden) { m.hidden = true; document.body.classList.remove('modal-open'); }
    });
});

// Load saved tradition
document.getElementById('traditionSelect').value = getTradition();

setInterval(updateDisplay, 10000);
updateDisplay();

setInterval(updateSelfCheck, 60000);
updateSelfCheck();

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
}
