/**
 * Kairos — Star Sign Engine (old tropical vs. true sidereal)
 *
 * Two honest wheels over the same sky:
 *   · TROPICAL (old) — 12 equal signs of 30°, season-based, anchored to the
 *     March equinox (0° ≈ day 80 of the year, the sun's position at the
 *     equinox). This is the inherited Western zodiac.
 *   · SIDEREAL (true) — the 13 REAL constellations on the Sun's path, by
 *     their actual IAU boundary dates in the current era: unequal spans
 *     (Virgo ~45 days, Scorpius only ~7), with Ophiuchus between Scorpius
 *     and Sagittarius. This is the sky you can point at — no offset model,
 *     no equal slices: the drift of ~24° (ZODIAC_PRECESSION_OFFSET, shown
 *     for comparison) is already baked into where the Sun truly stands.
 *
 * The birthday is optional and never leaves the device (localStorage
 * 'kairos_birthday'); without it the engine reads today's sky.
 *
 * Integration: the star-sign section renders inside the "Today's energy"
 * card (web/help.js → renderTodaysEnergy appends buildStarSignHTML()).
 * The birthday input lives in ⚙️ Configure → 📅 Birthday.
 */

// --- Constants ---
const ZODIAC_PRECESSION_OFFSET = 24;      // nominal drift in degrees (display only)
const ZODIAC_EQUINOX_DAY = 80;            // ~March 21: 0° tropical longitude
const ZODIAC_YEAR_DAYS = 365.2422;        // tropical year
const TROPICAL_SIGN_SPAN = 30;            // 30° per old sign

// --- Tropical Zodiac (12 signs, season-based) ---
const TROPICAL_SIGNS = [
    { name: "Aries", emoji: "♈" },
    { name: "Taurus", emoji: "♉" },
    { name: "Gemini", emoji: "♊" },
    { name: "Cancer", emoji: "♋" },
    { name: "Leo", emoji: "♌" },
    { name: "Virgo", emoji: "♍" },
    { name: "Libra", emoji: "♎" },
    { name: "Scorpius", emoji: "♏" },
    { name: "Sagittarius", emoji: "♐" },
    { name: "Capricornus", emoji: "♑" },
    { name: "Aquarius", emoji: "♒" },
    { name: "Pisces", emoji: "♓" }
].map((s, i) => ({ ...s, start: i * TROPICAL_SIGN_SPAN, end: (i + 1) * TROPICAL_SIGN_SPAN }));

// --- Sidereal Zodiac (the 13 REAL constellations, IAU boundary dates) ---
// The Sun's actual path through the constellations in the current era —
// unequal spans (Virgo ~45 days, Scorpius only ~7, Ophiuchus ~18). `start`
// is [month, day]; a sign holds from its start until the next sign's start
// (Sagittarius wraps the year-end into mid-January).
const SIDEREAL_SIGNS = [
    { name: "Capricornus", emoji: "♑", start: [1, 19] },
    { name: "Aquarius", emoji: "♒", start: [2, 16] },
    { name: "Pisces", emoji: "♓", start: [3, 12] },
    { name: "Aries", emoji: "♈", start: [4, 19] },
    { name: "Taurus", emoji: "♉", start: [5, 14] },
    { name: "Gemini", emoji: "♊", start: [6, 20] },
    { name: "Cancer", emoji: "♋", start: [7, 21] },
    { name: "Leo", emoji: "♌", start: [8, 10] },
    { name: "Virgo", emoji: "♍", start: [9, 16] },
    { name: "Libra", emoji: "♎", start: [10, 31] },
    { name: "Scorpius", emoji: "♏", start: [11, 23] },
    { name: "Ophiuchus", emoji: "⛎", start: [11, 30] },
    { name: "Sagittarius", emoji: "♐", start: [12, 18] }
];


// --- Zodiac Strengths ---
const ZODIAC_STRENGTHS = {
    "Aries": ["Courageous", "Confident", "Enthusiastic", "Optimistic", "Honest"],
    "Taurus": ["Reliable", "Patient", "Practical", "Devoted", "Responsible"],
    "Gemini": ["Adaptable", "Intellectual", "Communicative", "Versatile", "Eloquent"],
    "Cancer": ["Intuitive", "Sympathetic", "Protective", "Tenacious", "Loyal"],
    "Leo": ["Generous", "Loyal", "Ambitious", "Creative", "Passionate"],
    "Virgo": ["Analytical", "Practical", "Diligent", "Humble", "Methodical"],
    "Libra": ["Cooperative", "Diplomatic", "Gracious", "Fair-minded", "Social"],
    "Scorpius": ["Resourceful", "Passionate", "Determined", "Loyal", "Intuitive"],
    "Ophiuchus": ["Visionary", "Wise", "Healing", "Transformative", "Insightful"],
    "Sagittarius": ["Adventurous", "Optimistic", "Honest", "Enthusiastic", "Wise"],
    "Capricornus": ["Responsible", "Disciplined", "Ambitious", "Patient", "Practical"],
    "Aquarius": ["Progressive", "Original", "Independent", "Humanitarian", "Intellectual"],
    "Pisces": ["Compassionate", "Artistic", "Gentle", "Intuitive", "Empathetic"]
};

// --- Zodiac Elements & Qualities ---
const ZODIAC_ATTRIBUTES = {
    "Aries": { element: "🔥 Fire", quality: "Cardinal" },
    "Taurus": { element: "🌍 Earth", quality: "Fixed" },
    "Gemini": { element: "💨 Air", quality: "Mutable" },
    "Cancer": { element: "💧 Water", quality: "Cardinal" },
    "Leo": { element: "🔥 Fire", quality: "Fixed" },
    "Virgo": { element: "🌍 Earth", quality: "Mutable" },
    "Libra": { element: "💨 Air", quality: "Cardinal" },
    "Scorpius": { element: "💧 Water", quality: "Fixed" },
    "Ophiuchus": { element: "🔥 Fire", quality: "Mutable" },
    "Sagittarius": { element: "🔥 Fire", quality: "Mutable" },
    "Capricornus": { element: "🌍 Earth", quality: "Cardinal" },
    "Aquarius": { element: "💨 Air", quality: "Fixed" },
    "Pisces": { element: "💧 Water", quality: "Mutable" }
};

// --- Birthday persistence (device-local, offline by default) ---
function getSavedBirthday() {
    try {
        if (typeof localStorage !== 'undefined') {
            return localStorage.getItem('kairos_birthday');
        }
    } catch (e) { /* storage unavailable — read today's sky instead */ }
    return null;
}

function setSavedBirthday(value) {
    try {
        if (typeof localStorage !== 'undefined') {
            if (value) {
                localStorage.setItem('kairos_birthday', value);
            } else {
                localStorage.removeItem('kairos_birthday');
            }
        }
    } catch (e) { /* storage unavailable — nothing to persist */ }
}

// --- Core functions ---
function zodiacDayOfYear(date) {
    // Purely calendar-based, so DST transitions never shift the count.
    const start = new Date(date.getFullYear(), 0, 0);
    return Math.floor((date - start) / 86400000);
}

function getEclipticLongitude(date) {
    // 0° is the March equinox (~day 80), not January 1 — the tropical wheel
    // is season-based, so it must start where the seasons start.
    const lon = ((zodiacDayOfYear(date) - ZODIAC_EQUINOX_DAY) / ZODIAC_YEAR_DAYS) * 360;
    return ((lon % 360) + 360) % 360;
}

function signForLongitude(signs, lon) {
    const normalized = ((lon % 360) + 360) % 360;
    for (const sign of signs) {
        if (normalized >= sign.start && normalized < sign.end) {
            return sign;
        }
    }
    return signs[signs.length - 1]; // 360° exactly → the final sign's tail
}

function getTropicalSign(date) {
    return signForLongitude(TROPICAL_SIGNS, getEclipticLongitude(date));
}

function getSiderealSign(date) {
    // The real sky: which constellation the Sun actually stands in, by IAU
    // boundary dates. Sagittarius wraps the year-end (Dec 18 – Jan 18).
    const m = date.getMonth() + 1;
    const d = date.getDate();
    let current = SIDEREAL_SIGNS[SIDEREAL_SIGNS.length - 1];
    for (const sign of SIDEREAL_SIGNS) {
        const [sm, sd] = sign.start;
        if (m > sm || (m === sm && d >= sd)) current = sign;
    }
    return current;
}

function getStarSigns() {
    const birthday = getSavedBirthday();
    // Noon-anchored parsing keeps the day-of-year stable across time zones.
    const date = birthday ? new Date(birthday + 'T12:00:00') : new Date();
    const tropical = getTropicalSign(date);
    const sidereal = getSiderealSign(date);
    return {
        date: date,
        hasBirthday: Boolean(birthday),
        tropical: tropical,
        sidereal: sidereal,
        offset: ZODIAC_PRECESSION_OFFSET,
        strengths: ZODIAC_STRENGTHS[sidereal.name] || [],
        attributes: ZODIAC_ATTRIBUTES[sidereal.name] || { element: "—", quality: "—" }
    };
}

// --- Rendering -------------------------------------------------------------
// The whole section is one pure HTML string (no DOM access), so it can be
// appended to the energy card by help.js and unit-tested under node.

function buildStarSignHTML() {
    const data = getStarSigns();
    const tropical = data.tropical;
    const sidereal = data.sidereal;
    const strengths = data.strengths.join(', ');
    const attrs = data.attributes;
    const tropicalAttrs = ZODIAC_ATTRIBUTES[tropical.name] || { element: "—", quality: "—" };

    const sameSign = tropical.name === sidereal.name;

    let html = `<div id="star-sign-section">`;

    // Compact row — same .energy-line pattern as the other energy rows.
    html += `<div class="energy-line"><span class="energy-key">⭐ True Star Sign</span>` +
        `<span class="energy-val">${sidereal.emoji} ${sidereal.name}</span>` +
        `<span class="energy-note">${sameSign ? 'both wheels agree' : `old: ${tropical.emoji} ${tropical.name} · ~${data.offset}° drift`}</span></div>`;

    if (sameSign) {
        // Both wheels point at the same sign — no comparison needed, one
        // unified profile.
        html += `<div style="margin-top: 8px; padding: 16px; background: #1e2632; border-radius: 16px; border: 2px solid #f0c27f; text-align: center;">`;
        html += `<div style="font-size: 2.4rem;">${sidereal.emoji}</div>`;
        html += `<div style="color: #f0c27f; font-size: 1.2rem; font-weight: bold;">${sidereal.name}</div>`;
        html += `<div style="color: #8e9ab0; font-size: 0.75rem; margin-top: 4px;">both wheels agree — old and true</div>`;
        html += `<div style="margin-top: 12px; font-size: 0.85rem; color: #d4d9e6; display: flex; justify-content: center; gap: 16px;">`;
        html += `<span><span style="color: #8e9ab0;">Element:</span> ${attrs.element}</span>`;
        html += `<span><span style="color: #8e9ab0;">Quality:</span> ${attrs.quality}</span>`;
        html += `</div>`;
        html += `<div style="margin-top: 12px; font-size: 0.8rem;">`;
        html += `<div style="color: #f0c27f;">Strengths</div>`;
        html += `<div style="color: #d4d9e6;">${strengths}</div>`;
        html += `</div></div>`;
    } else {
        // Dual profile — a real side-by-side comparison (grid stays
        // two-column even on narrow screens, VS badge between the cards).
        html += `<div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 8px; align-items: stretch; margin-top: 8px;">`;
        html += `<div style="padding: 12px 8px; background: #0b0e14; border-radius: 16px; border: 1px solid #2a3442; text-align: center;">`;
        html += `<div style="font-size: 2rem;">${tropical.emoji}</div>`;
        html += `<div style="color: #8e9ab0; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px;">Old · Tropical</div>`;
        html += `<div style="color: #f5e6c4; font-size: 1.1rem; font-weight: bold;">${tropical.name}</div>`;
        html += `<div style="margin-top: 8px; font-size: 0.75rem; color: #d4d9e6;">${tropicalAttrs.element}<br>${tropicalAttrs.quality}</div>`;
        html += `</div>`;
        html += `<div style="align-self: center; color: #8e9ab0; font-size: 0.65rem; font-weight: bold; border: 1px solid #2a3442; border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">VS</div>`;
        html += `<div style="padding: 12px 8px; background: #1e2632; border-radius: 16px; border: 2px solid #f0c27f; text-align: center;">`;
        html += `<div style="font-size: 2rem;">${sidereal.emoji}</div>`;
        html += `<div style="color: #f0c27f; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px;">True · Real Sky</div>`;
        html += `<div style="color: #f0c27f; font-size: 1.1rem; font-weight: bold;">${sidereal.name}</div>`;
        html += `<div style="margin-top: 8px; font-size: 0.75rem; color: #d4d9e6;">${attrs.element}<br>${attrs.quality}</div>`;
        html += `<div style="margin-top: 8px; font-size: 0.7rem;"><span style="color: #f0c27f;">Strengths:</span> <span style="color: #d4d9e6;">${strengths}</span></div>`;
        html += `</div></div>`;
    }


    // Feeling statement — the philosophical anchor. Without a birthday the
    // engine reads today's sky and says so honestly.
    html += `<div style="margin: 8px 0; padding: 8px 16px; background: #0b0e14; border-radius: 12px; border-left: 3px solid #f0c27f;">`;
    html += `<div style="font-size: 0.85rem; color: #a0b3c9; font-style: italic; text-align: center; line-height: 1.6;">`;
    if (data.hasBirthday && sameSign) {
        html += `“You were born under <span style="color: #f0c27f; font-style: normal; font-weight: bold;">${sidereal.name}</span> — and there the Sun still stands.<br>`;
        html += `The old wheel and the true sky agree on you.<br>`;
        html += `Your strengths—<span style="color: #f0c27f; font-style: normal; font-weight: bold;">${strengths}</span>—are written in the stars.<br>`;
        html += `This is where you are. This is where you have always been.”`;
    } else if (data.hasBirthday) {
        html += `“You were born under the constellation of <span style="color: #f0c27f; font-style: normal; font-weight: bold;">${sidereal.name}</span> — not <span style="color: #8e9ab0; font-style: normal;">${tropical.name}</span>.<br>`;
        html += `The sky has shifted, but your place in it is real.<br>`;
        html += `Your strengths—<span style="color: #f0c27f; font-style: normal; font-weight: bold;">${strengths}</span>—are written in the stars.<br>`;
        html += `This is where you are. This is where you have always been.”`;
    } else {
        html += `“The Sun moves through <span style="color: #f0c27f; font-style: normal; font-weight: bold;">${sidereal.name}</span> today (tropical: <span style="color: #8e9ab0; font-style: normal;">${tropical.name}</span>).<br>`;
        html += `Set your birthday in ⚙️ Configure → 📅 Birthday to find your true sign.”`;
    }
    html += `</div></div>`;

    // Strengths — integrated into the energy card.
    html += `<div style="margin-top: 12px; padding: 12px; background: #1a2230; border-radius: 12px; border: 1px solid #2a3442;">`;
    html += `<div style="color: #8e9ab0; font-size: 0.8rem; margin-bottom: 4px;">Your Strengths ${data.hasBirthday ? 'Today' : 'of This Sign'}</div>`;
    html += `<div style="color: #f0c27f; font-size: 1rem; font-weight: 500;">${strengths}</div>`;
    html += `<div style="color: #8e9ab0; font-size: 0.75rem; margin-top: 4px;">Use your natural gifts to find solutions and bring order to your day.</div>`;
    html += `</div>`;

    html += `</div>`; // /#star-sign-section
    return html;
}

// Re-render in place when the birthday changes, keeping the energy card's
// expanded/collapsed state; fall back to a full energy-card re-render.
function updateStarSignDisplay() {
    if (typeof document === 'undefined') return;
    const section = document.getElementById('star-sign-section');
    if (section) {
        section.outerHTML = buildStarSignHTML();
        return;
    }
    if (typeof renderTodaysEnergy === 'function') {
        renderTodaysEnergy(window.__kstData || null);
    }
}

// --- Browser bootstrap (skipped under node) ---
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function () {
        const input = document.getElementById('birthday-input');
        if (input) {
            const saved = getSavedBirthday();
            if (saved) input.value = saved;
            input.addEventListener('change', function () {
                setSavedBirthday(this.value || null);
                updateStarSignDisplay();
            });
        }
    });
}

// Expose globally (help.js appends buildStarSignHTML() to the energy card).
if (typeof window !== 'undefined') {
    window.getStarSigns = getStarSigns;
    window.buildStarSignHTML = buildStarSignHTML;
    window.updateStarSignDisplay = updateStarSignDisplay;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports.ZODIAC_PRECESSION_OFFSET = ZODIAC_PRECESSION_OFFSET;
    module.exports.ZODIAC_EQUINOX_DAY = ZODIAC_EQUINOX_DAY;
    module.exports.TROPICAL_SIGNS = TROPICAL_SIGNS;
    module.exports.SIDEREAL_SIGNS = SIDEREAL_SIGNS;
    module.exports.ZODIAC_STRENGTHS = ZODIAC_STRENGTHS;
    module.exports.ZODIAC_ATTRIBUTES = ZODIAC_ATTRIBUTES;
    module.exports.getEclipticLongitude = getEclipticLongitude;
    module.exports.getTropicalSign = getTropicalSign;
    module.exports.getSiderealSign = getSiderealSign;
    module.exports.getStarSigns = getStarSigns;
    module.exports.buildStarSignHTML = buildStarSignHTML;
    module.exports.updateStarSignDisplay = updateStarSignDisplay;
}

