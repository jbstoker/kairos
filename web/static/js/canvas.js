/* Kairos radial header gauge — axis-locked front-end render routine.
 *
 * Fetches the raw radial distance factors from /api/radial (computed by
 * core/astronomy.CelestialRadialMetrics) and drives the concentric ring +
 * bead positions in the <header> clock. The beads are permanently locked to
 * the vertical centre axis (X = 200): they slide purely up/down, so the Sun
 * and Moon never cross linearly (eclipses are obscured from view).
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

function tickRadialGauge() {
    fetch('/api/radial', { cache: 'no-store' })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
            if (!data) return;
            updateHeaderDistanceClock(data.sun_radial, data.moon_radial);
            updateHeaderReadout(data.gregorian);
        })
        .catch(() => { /* keep the last good frame; backend offline */ });
}

// Manual trigger: re-anchor by forcing an immediate frame fetch.
const eyeTrigger = document.getElementById('eye-override-trigger');
if (eyeTrigger) eyeTrigger.addEventListener('click', tickRadialGauge);

// Start the loop and draw one frame immediately.
tickRadialGauge();
setInterval(tickRadialGauge, 1000);
