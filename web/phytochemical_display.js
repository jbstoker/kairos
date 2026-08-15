// Kairos — honest phytochemical inventory for the seasonal produce modal.
//
// Renders a "🧪 Phytochemical inventory" section into the seasonal item
// detail modal (web/seasonal_display.js calls `KairosPhytochemicals.renderInto`
// after it fills the modal body for produce items). The section shows:
//   - the compound rows (approximate values — always prefixed with "≈ "),
//   - a per-item honesty note,
//   - the clickable source link (USDA FoodData Central),
//   - a per-item user note (localStorage first, mirrored to the server
//     when one is reachable),
//   - and, at the very bottom, the data disclaimer (ℹ️, small, low-contrast).
//
// Data is bundled in window.PHYTOCHEMICAL_DEFAULTS (generated from
// data/phytochemical_data.json by tools/sync_phytochemical.py) so everything
// works offline; the server (/api/phytochemical) is authoritative when it is
// reachable. Values are approximations, not lab-verified measurements.

(function () {
    'use strict';

    // i18n helpers — web/i18n.js is loaded before this script.
    const I18n = (typeof window !== 'undefined' && window.KairosI18n) || null;
    const t = I18n ? I18n.t.bind(I18n) : (key, vars) => key;

    const NOTES_KEY = 'kairos_phytochem_notes';
    const FALLBACK_SOURCE = {
        label: 'USDA FoodData Central (fdc.nal.usda.gov)',
        url: 'https://fdc.nal.usda.gov/'
    };

    function data() { return window.PHYTOCHEMICAL_DEFAULTS || null; }

    function inventoryFor(itemId) {
        const d = data();
        if (!d || !d.items) return null;
        return d.items[itemId] || null;
    }

    function loadNotes() {
        try { return JSON.parse(localStorage.getItem(NOTES_KEY) || 'null') || {}; }
        catch (e) { return {}; }
    }

    function saveNotes(notes) {
        try { localStorage.setItem(NOTES_KEY, JSON.stringify(notes)); } catch (e) { /* storage full */ }
    }

    function esc(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g,
            c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    function approxPrefix() {
        const d = data();
        return !!(d && d.values_are_approximate);
    }

    function compoundRow(c) {
        const approx = approxPrefix() || !!c.approx;
        let val = '';
        if (c.value != null) {
            val = `<span class="pc-val">${approx ? '≈ ' : ''}${esc(c.value)} ${esc(c.unit || '')}</span>`;
        } else if (c.note) {
            val = `<span class="pc-val pc-val-qual">${esc(c.note)}</span>`;
        }
        return `<div class="phytochem-row"><span class="pc-name">${esc(c.name)}</span>${val}</div>`;
    }

    function setStatus(div, message) {
        const el = div.querySelector('.phytochem-note-status');
        if (el) el.textContent = message;
    }

    // Renders the section into the seasonal item modal body (produce only).
    // `item` is the seasonal item (id, kind, name, …).
    function renderInto(body, item) {
        if (!body || !item || item.kind !== 'produce') return;

        const inv = inventoryFor(item.id);
        const d = data() || {};
        const source = d.source || FALLBACK_SOURCE;
        const disclaimer = d.disclaimer || '';

        const div = document.createElement('div');
        div.className = 'phytochem';
        div.innerHTML = `<div class="phytochem-title">${t('phytochem.title')}</div>`;

        // No inventory at all (e.g. user-added produce): honest note, no data.
        if (!inv) {
            div.innerHTML += `<div class="phytochem-note">${t('phytochem.no_inventory')}</div>`;
            body.appendChild(div);
            return;
        }

        const compounds = inv.compounds || [];
        if (compounds.length) {
            div.innerHTML += compounds.map(compoundRow).join('');
        } else {
            div.innerHTML += `<div class="phytochem-note">${esc(inv.note || t('phytochem.no_inventory'))}</div>`;
        }
        if (compounds.length && inv.note) {
            div.innerHTML += `<div class="phytochem-note">📝 ${esc(inv.note)}</div>`;
        }

        const fdc = inv.fdc_id ? `<span class="phytochem-fdc"> · FDC #${esc(inv.fdc_id)}</span>` : '';
        div.innerHTML +=
            `<div class="phytochem-source">${t('phytochem.source')} ` +
            `<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.label)}</a>${fdc}</div>` +
            `<div class="phytochem-notes">` +
            `<label class="phytochem-notes-label" for="phytochemNote">${t('phytochem.your_note')}</label>` +
            `<textarea id="phytochemNote" rows="2" placeholder="${esc(t('phytochem.note_placeholder'))}"></textarea>` +
            `<button type="button" class="action-btn phytochem-save" id="phytochemNoteSave">${t('phytochem.save_note')}</button>` +
            `<div class="phytochem-note-status"></div>` +
            `</div>` +
            `<div class="phytochem-disclaimer">ℹ️ ${esc(disclaimer)}</div>`;

        body.appendChild(div);

        // Existing note: localStorage first, then best-effort server prefill.
        const notes = loadNotes();
        const textarea = div.querySelector('#phytochemNote');
        if (textarea && notes[item.id]) textarea.value = notes[item.id];

        const saveBtn = div.querySelector('#phytochemNoteSave');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const note = textarea ? textarea.value.trim() : '';
                const all = loadNotes();
                if (note) { all[item.id] = note; } else { delete all[item.id]; }
                saveNotes(all);
                setStatus(div, note ? t('phytochem.saved') : t('phytochem.removed'));
                // Mirror server-side when reachable (same pattern as seasonal additions).
                try {
                    fetch(`/api/phytochemical/${encodeURIComponent(item.id)}/note`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ note })
                    }).catch(() => { /* offline — local note stays */ });
                } catch (e) { /* fetch unsupported */ }
            });
        }

        if (!notes[item.id]) {
            try {
                fetch(`/api/phytochemical/${encodeURIComponent(item.id)}/note`)
                    .then(res => res.ok ? res.json() : null)
                    .then(data => {
                        if (data && data.note && textarea) textarea.value = data.note;
                    })
                    .catch(() => { /* offline */ });
            } catch (e) { /* fetch unsupported */ }
        }
    }

    window.KairosPhytochemicals = { renderInto: renderInto };
})();

