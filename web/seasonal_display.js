// Kairos — dynamic seasonal layer (produce + festivals).
//
// Two data paths:
//   1. Backend : GET/POST /api/seasonal — the Python engine reads the live
//                data/seasonal_data.json (edits persist server-side).
//   2. Offline : window.SEASONAL_DEFAULTS (generated from that JSON) plus
//                localStorage user additions ("➕ Add Produce / Festival").
//
// Items are clickable → a detail modal. Filters follow the Kairos season
// (from the celestial wheel), plus tradition and region.

(function () {
    'use strict';

    // i18n helpers — web/i18n.js is loaded before this script.
    const I18n = (typeof window !== 'undefined' && window.KairosI18n) || null;
    const t = I18n ? I18n.t.bind(I18n) : (key, vars) => key;
    const trName = I18n ? I18n.trName.bind(I18n) : (prefix, name) => name;

    const SEASONS = ['Emergence', 'Radiance', 'Release', 'Stillness'];
    const KAIROS_SEASON_MAP = { Spring: 'Emergence', Summer: 'Radiance', Autumn: 'Release', Winter: 'Stillness' };
    const PRODUCE_CATEGORIES = ['fruit', 'vegetable', 'herb', 'fungus', 'meat', 'other'];
    const STORAGE_KEY = 'kairos_seasonal_additions';
    const TRADITION_LABELS = {
        rhythm: 'Rhythm', tartarian: 'Tartarian', celtic: 'Celtic', chinese: 'Chinese',
        vedic: 'Vedic', mesopotamian: 'Mesopotamian', mystical: 'Mystical',
        mediterranean: 'Mediterranean', european: 'European', italian: 'Italian',
        nordic: 'Nordic', asian: 'Asian', global: 'Global'
    };

    // ---- Current Kairos season (tropical from the celestial wheel) ----------
    function currentSeason() {
        if (window.__kstData && window.__kstData.season) return window.__kstData.season;
        try {
            const lon = SunCalc.getSolarLongitude(new Date());
            if (lon < 90) return 'Spring';
            if (lon < 180) return 'Summer';
            if (lon < 270) return 'Autumn';
            return 'Winter';
        } catch (e) { return 'Summer'; }
    }

    function kairosSeason(tropical) { return KAIROS_SEASON_MAP[tropical] || tropical; }

    // ---- Region from the stored location (or the default 52°N 5°E) ----------
    function detectedRegion() {
        try {
            const saved = JSON.parse(localStorage.getItem('kairos_location') || 'null');
            const lat = (saved && typeof saved.lat === 'number') ? saved.lat : 52.0;
            const a = Math.abs(lat);
            if (a > 66.5) return 'polar';
            if (a >= 30) return 'temperate';
            return 'tropical';
        } catch (e) { return 'temperate'; }
    }

    // ---- User additions (offline path) --------------------------------------
    function loadAdditions() {
        try {
            const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
            return raw || { produce: {}, festivals: {} };
        } catch (e) { return { produce: {}, festivals: {} }; }
    }

    function saveAdditions(adds) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(adds)); } catch (e) { /* storage full */ }
    }

    function allItems() {
        const defaults = window.SEASONAL_DEFAULTS || { produce: {}, festivals: {} };
        const adds = loadAdditions();
        return {
            produce: Object.assign({}, defaults.produce || {}, adds.produce || {}),
            festivals: Object.assign({}, defaults.festivals || {}, adds.festivals || {})
        };
    }

    // ---- Filtering ----------------------------------------------------------
    function matches(item, tradition, region) {
        const trad = item.traditions || [];
        const regs = item.regions || [];
        if (tradition && tradition !== 'all'
            && !trad.includes(tradition) && !trad.includes('global')) return false;
        if (region && region !== 'auto' && region !== 'all'
            && !regs.includes(region) && !regs.includes('global')) return false;
        return true;
    }

    function filtered(season, tradition, region) {
        const data = allItems();
        const out = { season, produce: [], festivals: [] };
        Object.keys(data.produce).forEach(id => {
            const item = Object.assign({ id, kind: 'produce' }, data.produce[id]);
            if (!(item.seasons || []).includes(season)) return;
            if (!matches(item, tradition, region)) return;
            out.produce.push(item);
        });
        Object.keys(data.festivals).forEach(id => {
            const item = Object.assign({ id, kind: 'festival' }, data.festivals[id]);
            if (item.season !== season) return;
            if (!matches(item, tradition, region)) return;
            out.festivals.push(item);
        });
        out.produce.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
        return out;
    }

    // ---- Filter selects -----------------------------------------------------
    function getAppTradition() {
        try { return localStorage.getItem('kairos_tradition') || 'rhythm'; } catch (e) { return 'rhythm'; }
    }

    function populateFilterOptions() {
        const items = allItems();
        const regions = new Set(['global']);
        const traditions = new Set(['global']);
        Object.values(items.produce).forEach(it => (it.regions || []).forEach(r => regions.add(r)));
        Object.values(items.produce).forEach(it => (it.traditions || []).forEach(t => traditions.add(t)));
        Object.values(items.festivals).forEach(it => (it.regions || []).forEach(r => regions.add(r)));
        Object.values(items.festivals).forEach(it => (it.traditions || []).forEach(t => traditions.add(t)));

        const tradSel = document.getElementById('seasonalTradition');
        if (tradSel && tradSel.options.length <= 1) {
            const current = getAppTradition();
            if (TRADITION_LABELS[current]) {
                const opt = document.createElement('option');
                opt.value = current;
                opt.textContent = TRADITION_LABELS[current] + ' ' + t('seasonal.this_app');
                tradSel.appendChild(opt);
            }
            Array.from(traditions).sort().forEach(trad => {
                const opt = document.createElement('option');
                opt.value = trad;
                opt.textContent = (trad === 'global') ? t('seasonal.global') : (TRADITION_LABELS[trad] || trad);
                tradSel.appendChild(opt);
            });
        }
        const regSel = document.getElementById('seasonalRegion');
        if (regSel && regSel.options.length <= 1) {
            const auto = document.createElement('option');
            auto.value = 'auto';
            auto.textContent = t('seasonal.auto_region', { region: detectedRegion() });
            regSel.appendChild(auto);
            Array.from(regions).filter(r => r !== 'global').sort().forEach(r => {
                const opt = document.createElement('option');
                opt.value = r;
                opt.textContent = r[0].toUpperCase() + r.slice(1);
                regSel.appendChild(opt);
            });
            const glob = document.createElement('option');
            glob.value = 'global';
            glob.textContent = t('seasonal.global');
            regSel.appendChild(glob);
        }
    }

    // ---- Rendering ----------------------------------------------------------
    function renderCard(item) {
        return `<button class="seasonal-item" title="${t('seasonal.tap_details')}">` +
            `<span class="item-icon">${item.image || '🌿'}</span>` +
            `<span class="item-name">${item.name}</span></button>`;
    }

    function renderContainer(season, tradition, region) {
        const container = document.getElementById('seasonalContainer');
        const labelEl = document.getElementById('seasonalSeasonLabel');
        if (labelEl) labelEl.textContent = trName('season.', season);
        if (!container) return;

        const result = filtered(season, tradition, region);
        const cards = [];
        result.produce.forEach(item => cards.push(renderCard(item)));
        if (result.festivals.length) {
            cards.push(`<div class="seasonal-group">${t('seasonal.festivals')}</div>`);
            result.festivals.forEach(item => cards.push(renderCard(item)));
        }
        const items = [].concat(result.produce, result.festivals);
        container.innerHTML = cards.length
            ? cards.join('')
            : `<span class="seasonal-note">${t('seasonal.empty_hint')}</span>`;
        container.__items = items;
        container.querySelectorAll('.seasonal-item').forEach((el, i) => {
            el.addEventListener('click', () => openItem(items[i]));
        });
    }

    function refreshSeasonal() {
        populateFilterOptions();
        const season = kairosSeason(currentSeason());
        const tradition = document.getElementById('seasonalTradition').value;
        const region = document.getElementById('seasonalRegion').value;
        renderContainer(season, tradition, region);
        // Backend is authoritative when reachable (server-side edits).
        try {
            fetch(`/api/seasonal?season=${encodeURIComponent(season)}` +
                `&tradition=${encodeURIComponent(tradition)}` +
                `&region=${encodeURIComponent(region)}`)
                .then(res => res.ok ? res.json() : null)
                .then(data => {
                    if (!data || data.season !== season) return;
                    const container = document.getElementById('seasonalContainer');
                    if (!container) return;
                    const items = [].concat(data.produce || [], data.festivals || []);
                    container.innerHTML = items.length
                        ? items.map(renderCard).join('')
                        : `<span class="seasonal-note">${t('seasonal.empty')}</span>`;
                    container.__items = items;
                    container.querySelectorAll('.seasonal-item').forEach((el, i) => {
                        el.addEventListener('click', () => openItem(items[i]));
                    });
                })
                .catch(() => { /* offline — local render stays */ });
        } catch (e) { /* fetch unsupported */ }
    }

    // ---- Item detail modal --------------------------------------------------
    function field(label, value) {
        if (!value) return '';
        const text = Array.isArray(value) ? value.join(', ') : value;
        return `<p><strong>${label}:</strong> ${text}</p>`;
    }

    function openItem(item) {
        const title = document.getElementById('seasonalModalTitle');
        const body = document.getElementById('seasonalModalBody');
        const modal = document.getElementById('seasonalModal');
        if (!body || !modal) return;
        if (title) title.textContent = `${item.image || '🌿'} ${item.name}`;
        let html = '';
        if (item.kind === 'festival') {
            html += field(t('seasonal.field.season'), item.season);
            html += field(t('seasonal.field.regions'), item.regions);
            html += field(t('seasonal.field.traditions'), item.traditions);
            html += field(t('seasonal.field.description'), item.description);
            html += field(t('seasonal.field.activities'), item.activities);
            html += field(t('seasonal.field.foods'), item.foods);
        } else {
            html += field(t('seasonal.field.category'), item.category);
            html += field(t('seasonal.field.seasons'), item.seasons);
            html += field(t('seasonal.field.regions'), item.regions);
            html += field(t('seasonal.field.traditions'), item.traditions);
            html += field(t('seasonal.field.description'), item.description);
            html += field(t('seasonal.field.uses'), item.uses);
            html += field(t('seasonal.field.how_to_find'), item.how_to_find);
        }
        body.innerHTML = html || `<p>${t('seasonal.no_details')}</p>`;
        // The phytochemical inventory (compounds, disclaimer, source link,
        // user notes) renders at the bottom of this modal for produce items.
        if (typeof window.KairosPhytochemicals !== 'undefined' && window.KairosPhytochemicals.renderInto) {
            window.KairosPhytochemicals.renderInto(body, item);
        }
        modal.hidden = false;
        document.body.classList.add('modal-open');
    }

    function closeItem() {
        const modal = document.getElementById('seasonalModal');
        if (modal) modal.hidden = true;
        document.body.classList.remove('modal-open');
    }

    // ---- Add-your-own form --------------------------------------------------
    function openAddForm(kind) {
        const modal = document.getElementById('addSeasonalModal');
        if (!modal) return;
        const kindSel = document.getElementById('addKind');
        if (kindSel && (kind === 'produce' || kind === 'festival')) kindSel.value = kind;
        updateAddFormFields();
        modal.hidden = false;
        document.body.classList.add('modal-open');
    }

    function closeAddForm() {
        const modal = document.getElementById('addSeasonalModal');
        if (modal) modal.hidden = true;
        document.body.classList.remove('modal-open');
    }

    function updateAddFormFields() {
        const kind = document.getElementById('addKind').value;
        const produceFields = document.getElementById('produceFields');
        const festivalFields = document.getElementById('festivalFields');
        const categoryRow = document.getElementById('addCategoryRow');
        if (produceFields) produceFields.hidden = kind !== 'produce';
        if (festivalFields) festivalFields.hidden = kind !== 'festival';
        if (categoryRow) categoryRow.hidden = kind !== 'produce';
    }

    function splitList(value) {
        return value.split(',').map(s => s.trim()).filter(Boolean);
    }

    function submitAddForm() {
        const kind = document.getElementById('addKind').value;
        const name = document.getElementById('addName').value.trim();
        if (!name) {
            const status = document.getElementById('status');
            if (status) status.textContent = t('seasonal.name_first');
            return;
        }
        const image = document.getElementById('addImage').value.trim() || '🌿';
        const description = document.getElementById('addDescription').value.trim();
        const regions = splitList(document.getElementById('addRegions').value);
        const traditions = splitList(document.getElementById('addTraditions').value);

        let item;
        if (kind === 'festival') {
            item = {
                name, image, description,
                season: document.getElementById('addFestivalSeason').value,
                regions, traditions,
                activities: splitList(document.getElementById('addActivities').value),
                foods: splitList(document.getElementById('addFoods').value)
            };
        } else {
            item = {
                name, image, description,
                category: document.getElementById('addCategory').value,
                seasons: [document.getElementById('addProduceSeason').value],
                regions, traditions,
                uses: splitList(document.getElementById('addUses').value),
                how_to_find: document.getElementById('addHowToFind').value.trim()
            };
        }
        saveItem(item, kind);
    }

    function saveItem(item, kind) {
        // Mirror locally first so the item shows instantly (offline-first).
        const adds = loadAdditions();
        const id = (item.name || 'item').toLowerCase()
            .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'item';
        let n = 2;
        let itemId = id;
        while (adds[kind][itemId]) { itemId = `${id}_${n}`; n += 1; }
        adds[kind][itemId] = item;
        saveAdditions(adds);

        // Then persist server-side when the backend is reachable.
        try {
            fetch('/api/seasonal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ kind, item })
            })
                .then(res => res.ok)
                .then(ok => {
                    const status = document.getElementById('status');
                    if (status) {
                        status.textContent = ok
                            ? t('seasonal.added_server', { name: item.name })
                            : t('seasonal.added_device_offline', { name: item.name });
                    }
                })
                .catch(() => {
                    const status = document.getElementById('status');
                    if (status) status.textContent = t('seasonal.added_device_offline', { name: item.name });
                });
        } catch (e) {
            const status = document.getElementById('status');
            if (status) status.textContent = t('seasonal.added_device', { name: item.name });
        }

        closeAddForm();
        refreshSeasonal();
    }

    // ---- Init ---------------------------------------------------------------
    function init() {
        const addProduce = document.getElementById('addProduceBtn');
        if (addProduce) addProduce.addEventListener('click', () => openAddForm('produce'));
        const addFestival = document.getElementById('addFestivalBtn');
        if (addFestival) addFestival.addEventListener('click', () => openAddForm('festival'));
        const closeBtn = document.getElementById('seasonalClose');
        if (closeBtn) closeBtn.addEventListener('click', closeItem);
        const closeAdd = document.getElementById('addClose');
        if (closeAdd) closeAdd.addEventListener('click', closeAddForm);
        const saveBtn = document.getElementById('saveAddBtn');
        if (saveBtn) saveBtn.addEventListener('click', submitAddForm);
        const kindSel = document.getElementById('addKind');
        if (kindSel) kindSel.addEventListener('change', updateAddFormFields);

        const tradSel = document.getElementById('seasonalTradition');
        const regSel = document.getElementById('seasonalRegion');
        if (tradSel) tradSel.addEventListener('change', refreshSeasonal);
        if (regSel) regSel.addEventListener('change', refreshSeasonal);

        [document.getElementById('seasonalModal'), document.getElementById('addSeasonalModal')]
            .forEach(modal => {
                if (modal) modal.addEventListener('click', e => {
                    if (e.target === modal) {
                        modal.hidden = true;
                        document.body.classList.remove('modal-open');
                    }
                });
            });

        refreshSeasonal();
        // Follow season changes (the celestial wheel updates every 10 s).
        setInterval(() => {
            const label = document.getElementById('seasonalSeasonLabel');
            const want = kairosSeason(currentSeason());
            if (label && label.textContent !== want) refreshSeasonal();
        }, 30000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    window.refreshSeasonal = refreshSeasonal;
})();
