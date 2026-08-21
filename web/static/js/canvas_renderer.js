/* Kairos — Planetary Canvas Renderer
 * True elliptical orbits + eclipse detection.
 *
 * Maps the counter-clockwise orbital angles onto the master spatial viewport
 * (the #kstDisplay panel). Sun and Moon distances are derived from the true
 * eccentricities (1 − e·cos θ), so the <ellipse> tracks and beads breathe
 * together. When the bodies align AND the Moon is at a node, an eclipse is
 * detected and the beads glow + the status line lights up.
 */

function updatePlanetaryCanvas(sunAngle, sunEccentricity, moonAngle, moonEccentricity, moonNodeAngle, targetGregorianTime) {
    const cx = 400;
    const cy = 400;

    // Base radii (defined in SVG)
    const baseSunRx = 165;
    const baseMoonRx = 285;

    // --- Sun true elliptical position ---
    const sunDistance = 1 - 0.0167 * Math.cos(sunAngle); // Earth's orbit eccentricity
    const sunRx = baseSunRx * sunDistance;
    const sunRy = baseSunRx * (1 - 0.0167) * sunDistance; // Elliptical shape

    // --- Moon true elliptical position ---
    const moonDistance = 1 - 0.0549 * Math.cos(moonAngle); // Lunar orbit eccentricity
    const moonRx = baseMoonRx * moonDistance;
    const moonRy = baseMoonRx * (1 - 0.0549) * moonDistance;

    // --- Eclipse detection ---
    const isAligned = Math.abs((sunAngle - moonAngle) % (2 * Math.PI)) < 0.01;
    const isAtNode = Math.abs(moonNodeAngle) < 0.1;
    const isEclipse = isAligned && isAtNode;

    // --- Update Sun orbit and bead ---
    const sunTrack = document.getElementById('sun-orbit-line');
    const sunBead = document.getElementById('sun-bead');
    if (sunTrack && sunBead) {
        sunTrack.setAttribute('rx', sunRx);
        sunTrack.setAttribute('ry', sunRy);
        sunBead.setAttribute('cx', cx + sunRx * Math.sin(sunAngle));
        sunBead.setAttribute('cy', cy - sunRy * Math.cos(sunAngle));
        if (isEclipse) {
            sunBead.setAttribute('fill', '#ff6b35');
            sunBead.setAttribute('r', '20');
            sunBead.style.filter = 'drop-shadow(0px 0px 20px rgba(255,107,53,0.8))';
        } else {
            sunBead.setAttribute('fill', '#f39c12');
            sunBead.setAttribute('r', '16');
            sunBead.style.filter = 'drop-shadow(0px 0px 8px rgba(243,156,18,0.6))';
        }
    }

    // --- Update Moon orbit and bead ---
    const moonTrack = document.getElementById('moon-orbit-line');
    const moonBead = document.getElementById('moon-bead');
    if (moonTrack && moonBead) {
        moonTrack.setAttribute('rx', moonRx);
        moonTrack.setAttribute('ry', moonRy);
        moonBead.setAttribute('cx', cx + moonRx * Math.sin(moonAngle));
        moonBead.setAttribute('cy', cy - moonRy * Math.cos(moonAngle));
        if (isEclipse) {
            moonBead.setAttribute('fill', '#8b0000');
            moonBead.setAttribute('r', '14');
            moonBead.style.filter = 'drop-shadow(0px 0px 15px rgba(139,0,0,0.8))';
        } else {
            moonBead.setAttribute('fill', '#ecf0f1');
            moonBead.setAttribute('r', '11');
            moonBead.style.filter = 'drop-shadow(0px 0px 6px rgba(236,240,241,0.5))';
        }
    }

    // --- Update central clock ---
    const centralClock = document.getElementById('gregorian-center-clock');
    if (centralClock) {
        centralClock.textContent = targetGregorianTime;
    }

    // --- Update eclipse status ---
    const eclipseStatus = document.getElementById('eclipse-status');
    if (eclipseStatus) {
        if (isEclipse) {
            eclipseStatus.textContent = '🌑 ECLIPSE IN PROGRESS';
            eclipseStatus.style.color = '#ff6b35';
            eclipseStatus.style.fontWeight = 'bold';
            eclipseStatus.classList.add('active');
        } else {
            eclipseStatus.textContent = '';
            eclipseStatus.style.color = 'transparent';
            eclipseStatus.style.fontWeight = 'normal';
            eclipseStatus.classList.remove('active');
        }
    }

    // --- Optional: Log distances for debugging ---
    console.debug(`Sun distance: ${sunDistance.toFixed(3)} AU, Moon distance: ${moonDistance.toFixed(3)} (relative)`);
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
            metrics.getSunAngle(ts), 0.0167,
            metrics.getMoonAngle(ts), 0.0549,
            metrics.moonNodeAngleRadians(ts),
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
