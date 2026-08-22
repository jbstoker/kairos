const STORAGE_KEY = 'kairos_observations';
const TRADITION_KEY = 'kairos_tradition';

const TRADITION_EMOJI = {
    kairos: "🌌", rhythm: "🌗", tartarian: "🌿", celtic: "🕊️", chinese: "🐉",
    vedic: "🕉️", mesopotamian: "🏛️", mystical: "🔮"
};
const TRADITION_LABEL = {
    kairos: "Kairos", rhythm: "Rhythm", tartarian: "Tartarian", celtic: "Celtic",
    chinese: "Chinese", vedic: "Vedic", mesopotamian: "Mesopotamian",
    mystical: "Mystical"
};

// i18n helpers — web/i18n.js is loaded before this script. The fallbacks
// keep the app usable even if that file failed to load.
const I18n = (typeof window !== 'undefined' && window.KairosI18n) || null;
const t = I18n ? I18n.t.bind(I18n) : (key, vars) => {
    let s = key;
    if (vars) for (const k in vars) s = s.split('{' + k + '}').join(String(vars[k]));
    return s;
};
const trName = I18n ? I18n.trName.bind(I18n) : (prefix, name) => name;
const applyI18n = I18n ? I18n.apply.bind(I18n) : () => {};

const TRADITIONS = {
    kairos: {
        months: 13,
        names: ["Root Moon", "Sap Moon", "Green Moon", "Bloom Moon", "Grain Moon", "Light Moon", "Thirst Moon", "Fruit Moon", "Harvest Moon", "Wine Moon", "Leaf Moon", "Frost Moon", "Star Moon"],
        yearDay: "Deep Day"
    },
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
    // The old single tradition became the Calendar Lens (lens_manager.js).
    if (typeof window.getCalendarLens === 'function') return window.getCalendarLens();
    return localStorage.getItem(TRADITION_KEY) || 'kairos';
}

function setTradition(trad) {
    if (typeof window.setCalendarLens === 'function') {
        window.setCalendarLens(trad);
    } else {
        try { localStorage.setItem(TRADITION_KEY, trad); } catch (e) { /* ignore */ }
        updateDisplay();
    }
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
    const season = getLast('season_event')?.value || "";
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

    // The unified kstDisplay panel header carries the active context:
    // tradition · calendar date · observation-driven solar time.
    const datePart = `${trName('month.', d.month)} ${d.day}`;
    let context = `${TRADITION_EMOJI[tradition] || '🌌'} ${TRADITION_LABEL[tradition] || tradition} · ${datePart}`;
    if (solar) context += ` · ☀️ ${solarTime}`;
    window.KAIROS_CONTEXT_LABEL = context;
    if (window.refreshUnifiedPanel) window.refreshUnifiedPanel();
    document.getElementById('status').textContent = t('app.status_moon_season', {
        moon: moonIdx !== null ? trName('moon.', phaseName(moonIdx)) : t('app.unknown'),
        season: season ? trName('season.', season) : t('display.observing')
    });
}

// --- Precession self-check (fold 2: the deep time is checked) -------------
// One footer line. When the Flask server is running, /api/checksum records
// the check in data/checksums.json (the continuous log); offline, the same
// arithmetic runs in the browser via checksum_selfcheck.js.
function renderSelfCheck(result) {
    const el = document.getElementById('checksumLine');
    if (!el || !result || !window.KairosSelfCheck) return;
    let text = window.KairosSelfCheck.checksumLine(result, t('checksum.precession_offset'));
    const trend = result.trend;
    if (trend && trend.count) {
        text += trend.stable
            ? ` · ${t('app.checksum_stable', { count: trend.count })}`
            : ` · ${t('app.checksum_drifting', { count: trend.count })}`;
    }
    const now = new Date();
    text += ` · ${t('app.updated', {
        time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    })}`;
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
        el.textContent = t('app.selfcheck_unavailable');
    }
}

// --- Share this moment (text, clipboard, canvas image, photo capture) -------
let capturedMomentDataURL = null;

function getKairosDisplayString() {
    const kst = document.getElementById('kstDisplayLine');
    if (kst && kst.textContent && !kst.textContent.startsWith('--')) return kst.textContent;
    const context = window.KAIROS_CONTEXT_LABEL || 'Observing Active Context...';
    return context;
}

function buildShareText() {
    const kst = getKairosDisplayString();
    const clock = document.getElementById('gregorian-center-clock')?.textContent
        || new Date().toLocaleTimeString();
    const greg = `(Gregorian: ${new Date().toLocaleDateString()} ${clock})`;
    const season = (window.__kstData && window.__kstData.season) || '—';
    let loc = '';
    try {
        const saved = JSON.parse(localStorage.getItem('kairos_location') || 'null');
        if (saved) {
            loc = ` · ${Math.abs(saved.lat).toFixed(1)}°${saved.lat >= 0 ? 'N' : 'S'}, ` +
                `${Math.abs(saved.lon).toFixed(1)}°${saved.lon >= 0 ? 'E' : 'W'}`;
        }
    } catch (e) { /* ignore */ }
    return `☀️ Kairos — ${kst}\n${greg}${loc}\n🌍 ${trName('season.', season)} · kairos.jbstoker.github.io`;
}

function openShareModal() {
    const modal = document.getElementById('shareModal');
    const text = document.getElementById('shareText');
    if (!modal || !text) return;
    text.value = buildShareText();
    const preview = document.getElementById('sharePreview');
    const img = document.getElementById('capturedImage');
    const momentText = document.getElementById('momentText');
    const sharePhotoBtn = document.getElementById('shareImageBtn');
    if (preview && img && capturedMomentDataURL) {
        img.src = capturedMomentDataURL;
        if (momentText) momentText.textContent = t('share.living_in', { moment: getKairosDisplayString() });
        preview.hidden = false;
    } else if (preview) {
        preview.hidden = true;
    }
    if (sharePhotoBtn) sharePhotoBtn.hidden = !capturedMomentDataURL;
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
        if (status) status.textContent = t('share.moment_copied');
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
    if (status) status.textContent = ok ? t('share.moment_copied') : t('share.copy_manually');
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
    ctx.fillText(t('share.watermark'), 60, canvas.height - 45);
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'kairos-moment.png';
    a.click();
    const status = document.getElementById('status');
    if (status) status.textContent = t('share.image_downloaded');
}

// --- Photo capture: camera/file picker → stamp → share/download -------------
function captureMoment() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            capturedMomentDataURL = ev.target.result;
            openShareModal();
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

function shareCapturedImage() {
    if (!capturedMomentDataURL) return;
    const image = new Image();
    image.onload = function () {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);
        // Bottom bar with the Kairos line, scaled to the photo size.
        const barH = Math.max(80, Math.round(canvas.height * 0.12));
        ctx.fillStyle = 'rgba(11, 14, 20, 0.72)';
        ctx.fillRect(0, canvas.height - barH, canvas.width, barH);
        ctx.fillStyle = '#f5e6c4';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const line = t('share.living_in', { moment: getKairosDisplayString() });
        const fontSize = Math.max(18, Math.round(canvas.width / 34));
        ctx.font = `600 ${fontSize}px "Segoe UI", Tahoma, sans-serif`;
        ctx.fillText(line, canvas.width / 2, canvas.height - barH / 2);
        canvas.toBlob(function (blob) {
            if (!blob) return;
            const file = new File([blob], 'kairos-moment.png', { type: 'image/png' });
            const shareData = {
                title: t('share.share_title'),
                text: t('share.living_in', { moment: getKairosDisplayString() }),
                files: [file]
            };
            if (navigator.canShare && navigator.canShare(shareData)) {
                navigator.share(shareData).catch(() => { /* user cancelled */ });
            } else {
                const link = document.createElement('a');
                link.download = 'kairos-moment.png';
                link.href = URL.createObjectURL(blob);
                link.click();
            }
            const status = document.getElementById('status');
            if (status) status.textContent = t('share.photo_shared');
        }, 'image/png');
    };
    image.onerror = function () {
        const status = document.getElementById('status');
        if (status) status.textContent = t('share.photo_error');
    };
    image.src = capturedMomentDataURL;
}

// --- Solar-noon calibration (Sunrise+Sunset / Equal Shadows) ---------------
// The pure state machine lives in web/observation_methods.js; here we only
// wire it to the UI and store the completed noon as an observation.
function setObservationStatus(message, isSuccess) {
    const status = document.getElementById('shadowStatus');
    if (status) {
        status.textContent = message;
        status.classList.toggle('obs-success', !!isSuccess);
    }
}

const NOON_METHOD_LABELS = {
    equal_shadows: 'obs.method_equal_shadows',
    sunrise_sunset: 'obs.method_sunrise_sunset',
    entered_times: 'obs.method_entered_times',
    entered_noon: 'obs.method_entered_noon'
};

function saveSolarNoon(noonTime, method) {
    saveObsAt('solar_noon', method, noonTime);
    const nice = noonTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const label = t(NOON_METHOD_LABELS[method] || 'obs.method_sunrise_sunset');
    setObservationStatus(t('obs.noon_calculated', { time: nice }), true);
    const status = document.getElementById('status');
    if (status) status.textContent = t('obs.noon_calibrated', { label });
}

// Turn an <input type="time"> value ("HH:MM" or "HH:MM:SS") into a local
// Date for today; returns null for invalid input.
function timeInputToDate(value) {
    const parts = String(value || '').split(':').map(Number);
    if (parts.length < 2 || parts.some(Number.isNaN)) return null;
    const [h, m, s = 0] = parts;
    if (!(h >= 0 && h < 24 && m >= 0 && m < 60 && s >= 0 && s < 60)) return null;
    const d = new Date();
    d.setHours(h, m, s, 0);
    return d;
}

// Textual entry: sunrise + sunset -> noon is their midpoint (same rule as
// the live buttons, so both paths agree).
function enterObservedTimes() {
    const sunrise = timeInputToDate(document.getElementById('enterSunrise').value);
    const sunset = timeInputToDate(document.getElementById('enterSunset').value);
    if (!sunrise || !sunset) {
        setObservationStatus(t('obs.enter_both'), true);
        return;
    }
    if (sunset <= sunrise) {
        setObservationStatus(t('obs.enter_order'));
        return;
    }
    const noon = new Date((sunrise.getTime() + sunset.getTime()) / 2);
    saveSolarNoon(noon, 'entered_times');
}

// Textual entry: direct solar noon (culmination) — the most precise value.
function enterSolarNoon() {
    const noon = timeInputToDate(document.getElementById('enterNoon').value);
    if (!noon) {
        setObservationStatus(t('obs.enter_noon'));
        return;
    }
    saveSolarNoon(noon, 'entered_noon');
}

function saveObsAt(category, value, ts) {
    const obs = loadObs();
    if (!obs[category]) obs[category] = [];
    obs[category].push({ timestamp: ts.toISOString(), value });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obs));
    updateDisplay();
    if (window.refreshKST) window.refreshKST();
}

// --- Event Listeners ---
document.querySelectorAll('#moonButtons button').forEach(btn => {
    btn.addEventListener('click', () => {
        saveObs('moon_phase', btn.dataset.emoji);
        document.getElementById('status').textContent =
            t('obs.moon_set', { emoji: btn.dataset.emoji });
        if (window.refreshKST) window.refreshKST();
    });
});

const kairosCalibrator = (window.KairosObservation && window.KairosObservation.createCalibrator)
    ? window.KairosObservation.createCalibrator() : null;

document.getElementById('sunriseBtn').addEventListener('click', () => {
    if (!kairosCalibrator) return;
    kairosCalibrator.recordSunrise(new Date());
    setObservationStatus(t('obs.sunrise_recorded'), true);
});

document.getElementById('sunsetBtn').addEventListener('click', () => {
    if (!kairosCalibrator) return;
    const r = kairosCalibrator.recordSunset(new Date());
    if (r.status === 'need_sunrise') {
        setObservationStatus(t('obs.need_sunrise'));
        return;
    }
    saveSolarNoon(r.noon, 'sunrise_sunset');
});

document.getElementById('equalShadowBtn').addEventListener('click', () => {
    if (!kairosCalibrator) return;
    const r = kairosCalibrator.recordEqualShadow(new Date());
    if (r.status === 'shadow_first') {
        setObservationStatus(t('obs.shadow_first'), true);
        return;
    }
    saveSolarNoon(r.noon, 'equal_shadows');
});

const enterTimesBtn = document.getElementById('enterTimesBtn');
if (enterTimesBtn) enterTimesBtn.addEventListener('click', enterObservedTimes);
const enterNoonBtn = document.getElementById('enterNoonBtn');
if (enterNoonBtn) enterNoonBtn.addEventListener('click', enterSolarNoon);

['Spring', 'Summer', 'Autumn', 'Winter'].forEach(season => {
    document.getElementById(`season${season}`).addEventListener('click', () => {
        saveObs('season_event', season);
        document.getElementById('status').textContent = t('obs.season_set', { season: trName('season.', season) });
        if (window.refreshKST) window.refreshKST();
    });
});

// --- Lenses: calendar + energy ----------------------------------------------
// lens_manager.js owns persistence + refresh (attachLensListeners); these
// extra listeners only surface a status line for the user.
if (window.attachLensListeners) window.attachLensListeners();
const calendarLensSel = document.getElementById('calendar-lens');
if (calendarLensSel) {
    calendarLensSel.addEventListener('change', (e) => {
        document.getElementById('status').textContent =
            t('obs.tradition_switched', { tradition: e.target.value });
    });
}
const energyLensSel = document.getElementById('energy-lens');
if (energyLensSel) {
    energyLensSel.addEventListener('change', (e) => {
        document.getElementById('status').textContent =
            t('obs.energy_switched', { lens: e.target.value });
    });
}

// --- Observer location: pin the sky to where you are (kairos_location) ------
function getStoredLocation() {
    try {
        const saved = JSON.parse(localStorage.getItem('kairos_location') || 'null');
        if (saved && typeof saved.lat === 'number' && typeof saved.lon === 'number') return saved;
    } catch (e) { /* ignore */ }
    return { lat: 52.0, lon: 5.0 };
}

function saveLocation(lat, lon) {
    try { localStorage.setItem('kairos_location', JSON.stringify({ lat, lon })); } catch (e) { /* ignore */ }
    // The dial engine reads kairos_location live every tick; refresh the other layers.
    if (window.refreshKST) window.refreshKST();
    if (window.refreshUnifiedPanel) window.refreshUnifiedPanel();
}

(function initLocationControls() {
    const latInput = document.getElementById('locationLat');
    const lonInput = document.getElementById('locationLon');
    const saveBtn = document.getElementById('saveLocationBtn');
    const gpsBtn = document.getElementById('useGpsBtn');
    const status = document.getElementById('status');
    if (!latInput || !lonInput || !saveBtn || !status) return;
    const loc = getStoredLocation();
    latInput.value = loc.lat;
    lonInput.value = loc.lon;
    saveBtn.addEventListener('click', () => {
        const lat = parseFloat(latInput.value);
        const lon = parseFloat(lonInput.value);
        if (Number.isNaN(lat) || Number.isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
            status.textContent = '⚠️ Location must be valid — latitude −90…90, longitude −180…180.';
            return;
        }
        saveLocation(lat, lon);
        status.textContent = `📍 Location set: ${lat.toFixed(4)}°, ${lon.toFixed(4)}°`;
    });
    if (gpsBtn) {
        gpsBtn.addEventListener('click', () => {
            if (!navigator.geolocation) {
                status.textContent = '📡 GPS unavailable here — enter your location manually.';
                return;
            }
            status.textContent = '📡 Finding your position…';
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const lat = pos.coords.latitude;
                    const lon = pos.coords.longitude;
                    latInput.value = lat.toFixed(4);
                    lonInput.value = lon.toFixed(4);
                    saveLocation(lat, lon);
                    status.textContent = `📡 GPS position set: ${lat.toFixed(4)}°, ${lon.toFixed(4)}°`;
                },
                () => { status.textContent = '📡 GPS denied — enter your location manually.'; },
                { timeout: 8000, maximumAge: 600000 }
            );
        });
    }
})();

// --- In season card: collapsible like the energy card ------------------------
(function initSeasonalToggle() {
    const toggle = document.getElementById('seasonalToggle');
    const container = document.getElementById('seasonalContainer');
    if (!toggle || !container) return;
    const icon = toggle.querySelector('.seasonal-toggle-icon use');
    const update = (open) => {
        container.hidden = !open;
        toggle.setAttribute('aria-expanded', String(open));
        if (icon) {
            icon.setAttribute('href',
                open ? 'static/icons.svg#icon-chevron-up' : 'static/icons.svg#icon-chevron-down');
        }
    };
    // Collapsed by default so the card saves room. The toggle is a real
    // <button>, so Enter/Space are handled natively (click only).
    update(false);
    toggle.addEventListener('click', () => update(container.hidden));
})();

document.getElementById('shareBtn').addEventListener('click', openShareModal);
document.getElementById('captureBtn').addEventListener('click', captureMoment);
document.getElementById('shareClose').addEventListener('click', closeShareModal);
document.getElementById('copyShareBtn').addEventListener('click', copyShareText);
document.getElementById('imageShareBtn').addEventListener('click', downloadMomentImage);
document.getElementById('shareImageBtn').addEventListener('click', shareCapturedImage);
const shareModalEl = document.getElementById('shareModal');
if (shareModalEl) {
    shareModalEl.addEventListener('click', e => {
        if (e.target === shareModalEl) closeShareModal();
    });
}

// --- Tabs: Now (the view) / Configure (the controls) ------------------------
// Handled by web/tabs.js (loaded before this script): one delegated
// document-level listener keeps the tabs working even if a script fails or
// throws, and the seasonal "⚙️ tune" button (jumps to Configure) is wired
// there too.

// Escape closes any open modal.
document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    ['shareModal', 'seasonalModal', 'addSeasonalModal'].forEach(id => {
        const m = document.getElementById(id);
        if (m && !m.hidden) { m.hidden = true; document.body.classList.remove('modal-open'); }
    });
});

// Load saved lenses (calendar + energy) — lens_manager.js persists them.
if (window.syncLensSelectors) window.syncLensSelectors();

setInterval(updateDisplay, 10000);
updateDisplay();

setInterval(updateSelfCheck, 60000);
updateSelfCheck();

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
}
