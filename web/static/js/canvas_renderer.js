/* Kairos concentric orbit renderer — polar-to-cartesian mapper.
 *
 * Maps the counter-clockwise orbital angles + eccentric radial factors onto
 * the SVG observation matrix (web/templates/concentric_view.html). Position
 * is computed relative to NOON at the top vertical peak; the sweep advances
 * counter-clockwise through SUNRISE → NIGHT → SUNSET.
 *
 * When the Sun and Moon share the same angular vector the layout visually
 * exposes the eclipse type through the radial breathing: total (Moon
 * contracted close, Sun expanded far) vs annular (Moon expanded far, Sun
 * contracted close).
 */

function renderCelestialPositions(sunAngle, sunRadial, moonAngle, moonRadial) {
    const cx = 400; // Center X coordinate
    const cy = 400; // Center Y coordinate

    const baseSunRadius = 160;   // Sketch Marker 1 Boundary Baseline
    const baseMoonRadius = 280;  // Sketch Marker 2 Boundary Baseline

    // Process live elliptical breathing values
    const currentSunRadius = baseSunRadius * sunRadial;
    const currentMoonRadius = baseMoonRadius * moonRadial;

    // Map Counter-Clockwise from the Top Zenith Axis (Noon = 0 Radian Offset)
    // Sin tracks rightward horizontal distance, Cos tracks vertical position
    const sunX = cx + currentSunRadius * Math.sin(sunAngle);
    const sunY = cy - currentSunRadius * Math.cos(sunAngle);

    const moonX = cx + currentMoonRadius * Math.sin(moonAngle);
    const moonY = cy - currentMoonRadius * Math.cos(moonAngle);

    // Shift physical markers dynamically
    document.getElementById('sun-bead-node').setAttribute('cx', sunX);
    document.getElementById('sun-bead-node').setAttribute('cy', sunY);
    document.getElementById('sun-track-vector').setAttribute('r', currentSunRadius);

    document.getElementById('moon-bead-node').setAttribute('cx', moonX);
    document.getElementById('moon-bead-node').setAttribute('cy', moonY);
    document.getElementById('moon-track-vector').setAttribute('r', currentMoonRadius);
}

function pad2(n) { return (n < 10 ? '0' : '') + n; }

function formatCenterClock(date) {
    return pad2(date.getHours()) + ':' + pad2(date.getMinutes());
}

function initConcentricClock() {
    const metrics = new CelestialMetrics(
        (typeof window !== 'undefined' && window.KAIROS_LONGITUDE) || 0);

    function tick() {
        const ts = Date.now() / 1000;
        renderCelestialPositions(
            metrics.getSunAngle(ts), metrics.getSunRadialFactor(ts),
            metrics.getMoonAngle(ts), metrics.getMoonRadialFactor(ts)
        );
        const clock = document.getElementById('gregorian-center-clock');
        if (clock) clock.textContent = formatCenterClock(new Date());
    }

    tick();
    setInterval(tick, 1000);
}

// Auto-start when the observation matrix is present (script runs at end of body).
if (typeof document !== 'undefined' &&
    document.getElementById('kairos-observation-matrix')) {
    initConcentricClock();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports.renderCelestialPositions = renderCelestialPositions;
    module.exports.initConcentricClock = initConcentricClock;
}
