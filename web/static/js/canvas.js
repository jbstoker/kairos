/* Kairos radial header gauge — axis-locked front-end render routine.
 *
 * Fetches the raw radial distance factors from /api/radial (computed by
 * core/astronomy.CelestialRadialMetrics) and drives the concentric ring +
 * bead positions in the <header> clock. The beads are permanently locked to
 * the vertical centre axis (X = 200): they slide purely up/down, so the Sun
 * and Moon never cross linearly (eclipses are obscured from view).
 *
 * Static fallback: when no /api/radial backend is reachable (GitHub Pages,
 * file://, offline) the same anomaly formulas are evaluated in the browser
 * and the Gregorian readout ticks from the local clock.
 */

function updateHeaderDistanceClock(sunRadialFactor, moonRadialFactor) {
    const cx = 200; // Center X
    const cy = 200; // Center Y

    const baseSunRadius = 140;
    const baseMoonRadius = 80;

    // Scale ring dimensions strictly by physical distance anomalies
    const dynamicSunRadius = baseSunRadius * sunRadialFactor;
    const dynamicMoonRadius = baseMoonRadius * moonRadialFactor;

    // Redraw the concentric ring paths
    document.getElementById('hdr-sun-ring').setAttribute('r', dynamicSunRadius);
    document.getElementById('hdr-moon-ring').setAttribute('r', dynamicMoonRadius);

    // Eclipse Prevention Lock: Force X to stay at center cx.
    // Beads move purely up and down along the central vertical axis vector.
    const sunY = cy - dynamicSunRadius;
    const moonY = cy - dynamicMoonRadius;

    document.getElementById('hdr-sun-bead').setAttribute('cy', sunY);
    document.getElementById('hdr-moon-bead').setAttribute('cy', moonY);
}

function updateHeaderReadout(gregorian) {
    const el = document.getElementById('gregorian-clock-readout');
    if (el && gregorian) el.textContent = gregorian;
}

// ---- Static fallback: client-side mirror of CelestialRadialMetrics --------
function dayOfYearUTC(ts) {
    const d = new Date(ts * 1000);
    return Math.floor((d - Date.UTC(d.getUTCFullYear(), 0, 1)) / 86400000) + 1;
}

function computeSunRadial(ts) {
    const anomaly = 2 * Math.PI * (dayOfYearUTC(ts) - 3) / 365.25;
    return 1 + 0.0167 * Math.cos(anomaly);
}

function computeMoonRadial(ts) {
    const monthSeconds = 27.55455 * 24 * 3600;
    const phase = (((ts - 1705147200) % monthSeconds) + monthSeconds) % monthSeconds / monthSeconds;
    return 1 + 0.0549 * Math.cos(2 * Math.PI * phase);
}

function pad2(n) { return (n < 10 ? '0' : '') + n; }

function localTimeHHMMSS(d) {
    return pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
}

function renderLocally() {
    const ts = Date.now() / 1000;
    updateHeaderDistanceClock(computeSunRadial(ts), computeMoonRadial(ts));
    updateHeaderReadout(localTimeHHMMSS(new Date()));
}

// When the backend has recently confirmed itself down, keep rendering from
// the local fallback instead of re-polling every second (avoids noisy 404s
// on static hosting). The backend is re-probed every 30 s.
let backendDownAt = 0;
const BACKEND_RETRY_MS = 30000;

function tickRadialGauge() {
    const now = Date.now();
    if (backendDownAt && now - backendDownAt < BACKEND_RETRY_MS) {
        renderLocally();
        return;
    }
    fetch('/api/radial', { cache: 'no-store' })
        .then(res => {
            if (!res.ok) {
                backendDownAt = now;
                renderLocally(); // backend absent → compute in the browser
                return null;
            }
            return res.json();
        })
        .then(data => {
            if (!data) return;
            backendDownAt = 0;
            updateHeaderDistanceClock(data.sun_radial, data.moon_radial);
            updateHeaderReadout(data.gregorian);
        })
        .catch(() => {
            backendDownAt = now;
            renderLocally();
        });
}

// Manual trigger: re-anchor by forcing an immediate frame.
const eyeTrigger = document.getElementById('eye-override-trigger');
if (eyeTrigger) eyeTrigger.addEventListener('click', tickRadialGauge);

// Start the loop and draw one frame immediately.
tickRadialGauge();
setInterval(tickRadialGauge, 1000);
