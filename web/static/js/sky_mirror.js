/**
 * Kairos — Sky Mirror (clean, mobile-first sky view)
 *
 * The default sky view: no degree rings, no labels — a round mirror of the
 * sky where the Sun and Moon sit at their REAL altitude + azimuth and the
 * horizon line is the only reference. The full observation matrix (degree
 * wheel, orbit tracks, eclipse pill) survives behind ⚙️ Configure →
 * 🗺️ Show detailed sky map (off by default; web/app.js →
 * initDetailedSkyToggle).
 *
 * Position mapping: the horizon sits at 70% height, the zenith towards 30%;
 * south is up, east is left — the same convention as the degree wheel, so
 * the mirror and the header's azimuth degree still agree. Bodies below
 * −10° altitude fade out entirely.
 *
 * Eclipse detection reuses the PROVEN tolerances of canvas_renderer.js
 * (azimuth ≤ ~1.7°, altitude ≤ 5°, lunar node ≤ ~19° — validated against
 * the 2026-08-12 Wergea partial eclipse); on an eclipse the Sun bead
 * darkens and shows a corona.
 *
 * Pure core (computeSkyMirrorState) is DOM-free and node-testable; the
 * browser bootstrap runs every 10 s.
 */

// --- Constants ---
const MIRROR_CX = 50;              // % — horizontal centre
const MIRROR_CY = 70;              // % — the horizon line
const MIRROR_RADIUS = 40;          // % — horizon→zenith span (alt 90° → 30%)
const SKY_STAR_COUNT = 42;         // subtle night stars
// Eclipse tolerances — identical to canvas_renderer.js.
const ECLIPSE_AZ_TOL_RAD = 0.03;   // ~1.7° of shared azimuth
const ECLIPSE_ALT_TOL_DEG = 5;     // shared altitude
const ECLIPSE_NODE_TOL_RAD = 0.33; // ~19° from a lunar node

// --- Colour helpers ---
function _lerp(a, b, t) { return a + (b - a) * t; }

function lerpColor(hex1, hex2, t) {
    const c = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    const a = c(hex1), b = c(hex2);
    return `rgb(${Math.round(_lerp(a[0], b[0], t))}, ${Math.round(_lerp(a[1], b[1], t))}, ${Math.round(_lerp(a[2], b[2], t))})`;
}

// Day / twilight / night from the Sun's true altitude. Twilight blends
// smoothly across −6°…+10° (civil dusk/dawn into full day).
function skyColors(sunAltDeg) {
    if (sunAltDeg > 10) return { top: '#2a5a8a', bottom: '#4a8aba' };
    if (sunAltDeg > -6) {
        const t = (sunAltDeg + 6) / 16; // 0 at −6° → 1 at +10°
        return {
            top: lerpColor('#2a3a5a', '#2a5a8a', t),
            bottom: lerpColor('#c8783c', '#4a8aba', t)
        };
    }
    return { top: '#0a0a1a', bottom: '#1a1a2a' };
}

// --- Geometry ---
// Map altitude/azimuth onto the mirror: altitude 0° sits on the horizon
// (y = 70%), 90° towards the zenith (y = 30%); azimuth 180° (south) is
// straight up, 90° (east) left, 270° (west) right.
function mirrorXY(altDeg, azDeg) {
    const altRad = (altDeg / 90) * MIRROR_RADIUS;
    const azRad = (azDeg - 180) * Math.PI / 180;
    return {
        x: MIRROR_CX + altRad * Math.sin(azRad),
        y: MIRROR_CY - altRad * Math.cos(azRad)
    };
}

// Bodies fade in across −10°…+10° of altitude and hide below −10°.
function beadVisibility(altDeg) {
    return {
        opacity: Math.min(1, Math.max(0, (altDeg + 10) / 20)),
        visible: altDeg >= -10
    };
}

// Shared azimuth (wrap-safe) + shared altitude + lunar node — the same
// detection as canvas_renderer.js, tolerances included.
function detectEclipse(sunAltDeg, sunAzDeg, moonAltDeg, moonAzDeg, moonNodeAngleRad) {
    const azDiffDeg = Math.abs(((sunAzDeg - moonAzDeg) % 360) + 360) % 360;
    const azAligned = Math.min(azDiffDeg, 360 - azDiffDeg) * Math.PI / 180 < ECLIPSE_AZ_TOL_RAD;
    const altAligned = Math.abs(sunAltDeg - moonAltDeg) < ECLIPSE_ALT_TOL_DEG;
    const atNode = Math.abs(moonNodeAngleRad) < ECLIPSE_NODE_TOL_RAD;
    return azAligned && altAligned && atNode;
}

// --- Pure state (no DOM — unit-tested under node) ---
function computeSkyMirrorState(sunAltDeg, sunAzDeg, moonAltDeg, moonAzDeg, moonNodeAngleRad) {
    const colors = skyColors(sunAltDeg);
    const sunPos = mirrorXY(sunAltDeg, sunAzDeg);
    const moonPos = mirrorXY(moonAltDeg, moonAzDeg);
    const sunVis = beadVisibility(sunAltDeg);
    const moonVis = beadVisibility(moonAltDeg);
    return {
        gradient: `linear-gradient(to bottom, ${colors.top}, ${colors.bottom})`,
        horizonGlow: Math.max(0, 1 - Math.abs(sunAltDeg / 10)) * 0.6,
        starOpacity: Math.min(0.9, Math.max(0, -sunAltDeg / 12)),
        eclipse: detectEclipse(sunAltDeg, sunAzDeg, moonAltDeg, moonAzDeg, moonNodeAngleRad),
        sun: {
            x: sunPos.x, y: sunPos.y,
            size: 20 + Math.max(0, sunAltDeg) / 90 * 30, // 20px at horizon → 50px at zenith
            opacity: sunVis.opacity, visible: sunVis.visible
        },
        moon: {
            x: moonPos.x, y: moonPos.y,
            opacity: moonVis.opacity, visible: moonVis.visible
        }
    };
}



// --- DOM layer (browser only) ---

// A subtle, deterministic star field (seeded LCG — same sky every visit).
function buildStarField(container) {
    if (!container || container.childElementCount) return 0;
    let seed = 13 * 28 * 7;
    const rand = () => (seed = (seed * 48271) % 2147483647) / 2147483647;
    for (let i = 0; i < SKY_STAR_COUNT; i++) {
        const star = document.createElement('div');
        const size = 1 + rand() * 1.6;
        star.style.cssText = `position: absolute; width: ${size.toFixed(1)}px; height: ${size.toFixed(1)}px;`
            + `border-radius: 50%; background: rgba(255, 255, 255, ${(0.4 + rand() * 0.5).toFixed(2)});`
            + `left: ${(rand() * 100).toFixed(1)}%; top: ${(rand() * 100).toFixed(1)}%;`;
        container.appendChild(star);
    }
    return container.childElementCount;
}

function applySkyMirrorState(state) {
    const gradient = document.getElementById('sky-gradient');
    if (gradient) gradient.style.background = state.gradient;

    const glow = document.getElementById('horizon-glow');
    if (glow) glow.style.opacity = state.horizonGlow.toFixed(2);

    const stars = document.getElementById('stars-container');
    if (stars) stars.style.opacity = state.starOpacity.toFixed(2);

    const sunBead = document.getElementById('sun-bead-visual');
    if (sunBead) {
        sunBead.style.left = `${state.sun.x.toFixed(1)}%`;
        sunBead.style.top = `${state.sun.y.toFixed(1)}%`;
        sunBead.style.width = `${state.sun.size.toFixed(0)}px`;
        sunBead.style.height = `${state.sun.size.toFixed(0)}px`;
        sunBead.style.opacity = state.sun.opacity.toFixed(2);
        sunBead.style.display = state.sun.visible ? 'block' : 'none';
        if (state.eclipse) {
            sunBead.style.background = 'radial-gradient(circle, #333, #111)';
            sunBead.style.boxShadow = '0 0 60px rgba(255, 200, 100, 0.1)';
            sunBead.style.outline = '4px solid rgba(255, 200, 100, 0.3)';
        } else {
            sunBead.style.background = 'radial-gradient(circle, #f39c12, #f1c40f)';
            sunBead.style.boxShadow = '0 0 60px rgba(243, 156, 18, 0.5)';
            sunBead.style.outline = 'none';
        }
    }

    const moonBead = document.getElementById('moon-bead-visual');
    if (moonBead) {
        moonBead.style.left = `${state.moon.x.toFixed(1)}%`;
        moonBead.style.top = `${state.moon.y.toFixed(1)}%`;
        moonBead.style.opacity = state.moon.opacity.toFixed(2);
        moonBead.style.display = state.moon.visible ? 'block' : 'none';
    }

    // The time caption below the mirror echoes the primary line's time +
    // azimuth (one source of truth: kst_display.js → #kstDisplayLine).
    const line = document.getElementById('kstDisplayLine');
    const caption = document.getElementById('primary-time');
    if (line && caption) {
        const t = (line.textContent || '').split('·')[0].trim();
        if (t && !t.startsWith('--')) caption.textContent = t;
    }
}

// Recompute from the real sky (vendored SunCalc via CelestialMetrics, at the
// observer's saved location) and apply to the mirror.
function updateSkyMirror() {
    if (typeof document === 'undefined') return;
    if (!document.getElementById('sky-mirror')) return;
    if (typeof CelestialMetrics === 'undefined') return;
    if (!updateSkyMirror._metrics) {
        updateSkyMirror._metrics = new CelestialMetrics(
            (typeof window !== 'undefined' && window.KAIROS_LONGITUDE) || 5,
            (typeof window !== 'undefined' && window.KAIROS_LATITUDE) || 52);
    }
    const metrics = updateSkyMirror._metrics;
    const ts = Date.now() / 1000;
    const sun = metrics.getSunPositionDeg(ts);
    const moon = metrics.getMoonPositionDeg(ts);
    applySkyMirrorState(computeSkyMirrorState(
        sun.altitudeDeg, sun.azimuthDeg,
        moon.altitudeDeg, moon.azimuthDeg,
        metrics.moonNodeAngleRadians(ts)));
}

// --- Browser bootstrap: build the stars, draw now, refresh every 10 s ---
if (typeof document !== 'undefined') {
    const bootSkyMirror = () => {
        buildStarField(document.getElementById('stars-container'));
        updateSkyMirror();
        setInterval(updateSkyMirror, 10000);
    };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootSkyMirror);
    } else {
        bootSkyMirror();
    }
}

if (typeof window !== 'undefined') {
    window.updateSkyMirror = updateSkyMirror;
    window.computeSkyMirrorState = computeSkyMirrorState;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports.MIRROR_CX = MIRROR_CX;
    module.exports.MIRROR_CY = MIRROR_CY;
    module.exports.MIRROR_RADIUS = MIRROR_RADIUS;
    module.exports.SKY_STAR_COUNT = SKY_STAR_COUNT;
    module.exports.ECLIPSE_AZ_TOL_RAD = ECLIPSE_AZ_TOL_RAD;
    module.exports.ECLIPSE_ALT_TOL_DEG = ECLIPSE_ALT_TOL_DEG;
    module.exports.ECLIPSE_NODE_TOL_RAD = ECLIPSE_NODE_TOL_RAD;
    module.exports.skyColors = skyColors;
    module.exports.lerpColor = lerpColor;
    module.exports.mirrorXY = mirrorXY;
    module.exports.beadVisibility = beadVisibility;
    module.exports.detectEclipse = detectEclipse;
    module.exports.computeSkyMirrorState = computeSkyMirrorState;
    module.exports.updateSkyMirror = updateSkyMirror;
    module.exports.buildStarField = buildStarField;
}

