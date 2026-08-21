/* Kairos elliptical observation matrix — polar-to-ellipse mapper.
 *
 * Maps the counter-clockwise orbital angles + eccentric radial factors onto
 * the master spatial viewport (the #kstDisplay panel). The Sun and Moon
 * travel TRUE <ellipse> layers whose rx/ry stretch dynamically with the
 * orbital eccentricities; the beads stay locked on their rings, so the paths
 * and nodes expand/contract together.
 *
 * 3D Tilt Node Filter: when the Moon is NOT at a lunar node, a small radius
 * offset decorrelates the two rings, preventing false monthly overlaps.
 * When the bodies do share an angular vector the radial breathing exposes
 * the eclipse geometry (total vs annular).
 */

function updatePlanetaryCanvas(sunAngle, sunRadialFactor, moonAngle, moonRadialFactor, isAtLunarNode, targetGregorianTime) {
    const cx = 400;
    const cy = 400;

    // Core structural baselines from the system sketch
    const baseSunRx = 165;
    const baseMoonRx = 285;

    // Compute the dynamic elliptical stretch variables
    const sunRx = baseSunRx * sunRadialFactor;
    const sunRy = baseSunRx * (1 - 0.0167) * sunRadialFactor; // Factoring solar eccentricity

    // 3D Tilt Node Filter: Prevents false monthly overlaps
    let nodeOffset = 0;
    if (!isAtLunarNode) {
        nodeOffset = 25 * Math.sin(moonAngle - sunAngle);
    }

    const moonRx = baseMoonRx * moonRadialFactor + nodeOffset;
    const moonRy = baseMoonRx * (1 - 0.0549) * moonRadialFactor + nodeOffset; // Factoring lunar eccentricity

    // 1. Sync and scale the Sun orbit line and position
    const sunTrack = document.getElementById('sun-orbit-line');
    const sunBead = document.getElementById('sun-bead');
    if (sunTrack && sunBead) {
        sunTrack.setAttribute('rx', sunRx);
        sunTrack.setAttribute('ry', sunRy);

        // Counter-clockwise layout mapping from Top Noon Zenith
        sunBead.setAttribute('cx', cx + sunRx * Math.sin(sunAngle));
        sunBead.setAttribute('cy', cy - sunRy * Math.cos(sunAngle));
    }

    // 2. Sync and scale the Moon orbit line and position
    const moonTrack = document.getElementById('moon-orbit-line');
    const moonBead = document.getElementById('moon-bead');
    if (moonTrack && moonBead) {
        moonTrack.setAttribute('rx', moonRx);
        moonTrack.setAttribute('ry', moonRy);

        moonBead.setAttribute('cx', cx + moonRx * Math.sin(moonAngle));
        moonBead.setAttribute('cy', cy - moonRy * Math.cos(moonAngle));
    }

    // 3. Inject the active target date string straight into the Rosetta Center Hub
    const centralClock = document.getElementById('gregorian-center-clock');
    if (centralClock) {
        centralClock.textContent = targetGregorianTime;
    }
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
        updatePlanetaryCanvas(
            metrics.getSunAngle(ts), metrics.getSunRadialFactor(ts),
            metrics.getMoonAngle(ts), metrics.getMoonRadialFactor(ts),
            metrics.isMoonAtLunarNode(ts),
            formatCenterClock(new Date())
        );
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
    module.exports.updatePlanetaryCanvas = updatePlanetaryCanvas;
    module.exports.initConcentricClock = initConcentricClock;
}
