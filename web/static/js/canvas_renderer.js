/* Kairos — Planetary Canvas Renderer
 * True sky positions (altitude + azimuth) + eclipse detection.
 *
 * Maps the REAL Sun/Moon altitude and azimuth onto the master spatial
 * viewport (the #kstDisplay panel). The dial is the sky dome seen from
 * above with the corrected celestial axis: facing south, the sun rises in
 * the east (LEFT, az 90°), culminates south (TOP, az 180°) and sets in the
 * west (RIGHT, az 270°); north (az 0°) is the bottom. Altitude is the
 * distance from the horizon ring (alt 0°) to the zenith at the centre
 * (alt 90°); below the horizon the bead moves beyond the ring (underground).
 * When the bodies share an azimuth AND the Moon is at a node, an eclipse is
 * detected and the beads glow + the status line lights up.
 */

function updatePlanetaryCanvas(sunAltitudeDeg, sunAzimuthDeg, moonAltitudeDeg, moonAzimuthDeg, moonNodeAngle, targetGregorianTime) {
    const cx = 400;
    const cy = 400;

    // Decorative orbit-path rings (the light-grey band between them) plus a
    // SHARED horizon radius: both bodies map altitude the same way, so when
    // the Sun and Moon share a sky position (an eclipse) their beads overlap.
    const sunRingRx = 165;
    const moonRingRx = 285;
    const horizonRx = 285;
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

    // --- Sun: altitude → distance from centre, azimuth → compass position ---
    const sunAlt = clamp(sunAltitudeDeg, -90, 90);
    const sunDist = Math.min(380, horizonRx * (1 - sunAlt / 90));
    const sunRad = sunAzimuthDeg * Math.PI / 180;
    const sunX = cx - sunDist * Math.sin(sunRad);
    const sunY = cy + sunDist * Math.cos(sunRad);

    // --- Moon ---
    const moonAlt = clamp(moonAltitudeDeg, -90, 90);
    const moonDist = Math.min(380, horizonRx * (1 - moonAlt / 90));
    const moonRad = moonAzimuthDeg * Math.PI / 180;
    const moonX = cx - moonDist * Math.sin(moonRad);
    const moonY = cy + moonDist * Math.cos(moonRad);

    // --- Eclipse detection: shared azimuth (wrap-safe) AND lunar node.
    //     Tolerances cover PARTIAL eclipses too (e.g. 89%): up to ~1.7° of
    //     azimuth offset and ~19° from the lunar node. ---
    const azDiff = Math.abs(((sunAzimuthDeg - moonAzimuthDeg) % 360) + 360) % 360;
    const isAligned = Math.min(azDiff, 360 - azDiff) * Math.PI / 180 < 0.03;
    const isAtNode = Math.abs(moonNodeAngle) < 0.33;
    const isEclipse = isAligned && isAtNode;

    // --- Update Sun orbit and bead ---
    const sunTrack = document.getElementById('sun-orbit-line');
    const sunBead = document.getElementById('sun-bead');
    if (sunTrack && sunBead) {
        // The ring is the static horizon reference for the sun's band.
        sunTrack.setAttribute('rx', sunRingRx);
        sunTrack.setAttribute('ry', sunRingRx * (1 - 0.0167));
        sunBead.setAttribute('cx', sunX);
        sunBead.setAttribute('cy', sunY);
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
        moonTrack.setAttribute('rx', moonRingRx);
        moonTrack.setAttribute('ry', moonRingRx * (1 - 0.0549));
        moonBead.setAttribute('cx', moonX);
        moonBead.setAttribute('cy', moonY);
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

    // --- Optional: Log positions for debugging ---
    console.debug(`Sun alt ${sunAltitudeDeg.toFixed(1)}° az ${sunAzimuthDeg.toFixed(1)}°, Moon alt ${moonAltitudeDeg.toFixed(1)}° az ${moonAzimuthDeg.toFixed(1)}°`);
}

function pad2(n) { return (n < 10 ? '0' : '') + n; }

function formatCenterClock(date) {
    return pad2(date.getHours()) + ':' + pad2(date.getMinutes());
}

function initConcentricClock() {
    const metrics = new CelestialMetrics(
        (typeof window !== 'undefined' && window.KAIROS_LONGITUDE) || 5,
        (typeof window !== 'undefined' && window.KAIROS_LATITUDE) || 52);

    function tick() {
        const ts = Date.now() / 1000;
        const sun = metrics.getSunPositionDeg(ts);
        const moon = metrics.getMoonPositionDeg(ts);
        updatePlanetaryCanvas(
            sun.altitudeDeg, sun.azimuthDeg,
            moon.altitudeDeg, moon.azimuthDeg,
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
