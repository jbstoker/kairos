/* Kairos — Planetary Canvas Renderer
 * True sky positions (altitude + azimuth) + eclipse detection.
 *
 * Maps the REAL Sun/Moon altitude and azimuth onto the master spatial
 * viewport (the #kstDisplay panel). The dial is the sky dome seen from
 * above with the corrected celestial axis: facing south, the sun rises in
 * the east (LEFT, az 90°), culminates south (TOP, az 180°) and sets in the
 * west (RIGHT, az 270°); north (az 0°) is the bottom. Altitude is the
 * distance from the horizon (the degree wheel edge, alt 0°) to the zenith at
 * the centre (alt 90°); bodies below the horizon clamp to the wheel edge and
 * render as dimmed ghost beads. When the bodies share an azimuth AND the
 * Moon is at a node, an eclipse is detected and the beads glow + the status
 * line lights up.
 */

// Minutes until the next sunrise from the real solar model (SunCalc) at the
// observer's location; returns null when the model or location is unavailable
// so the caller can fall back to the ~0.25°/min altitude approximation.
function minutesUntilNextSunrise() {
    try {
        if (typeof SunCalc === 'undefined' || !SunCalc.getTimes) return null;
        const loc = (typeof getObserverLocation === 'function')
            ? getObserverLocation() : { lat: 52, lon: 5 };
        const now = new Date();
        const today = SunCalc.getTimes(now, loc.lat, loc.lon).sunrise;
        if (!(today instanceof Date) || isNaN(today.getTime())) return null;
        const target = (today.getTime() > now.getTime())
            ? today
            : SunCalc.getTimes(new Date(now.getTime() + 86400000), loc.lat, loc.lon).sunrise;
        if (!(target instanceof Date) || isNaN(target.getTime())) return null;
        return Math.max(1, Math.round((target.getTime() - now.getTime()) / 60000));
    } catch (e) {
        return null;
    }
}

function updatePlanetaryCanvas(sunAltitudeDeg, sunAzimuthDeg, moonAltitudeDeg, moonAzimuthDeg, moonNodeAngle, targetGregorianTime) {
    const cx = 400;
    const cy = 400;

    // Decorative orbit-path rings plus a SHARED horizon at the outer degree
    // wheel: both bodies map altitude the same way, so when the Sun and Moon
    // share a sky position (an eclipse) their beads overlap. Altitude 0° =
    // the wheel edge (r280), 90° = the zenith at the centre; below the
    // horizon the bead clamps to the wheel edge and renders as a ghost.
    const sunRingRx = 165;
    const moonRingRx = 285;
    const maxRadius = 280;

    // --- Sun: altitude → distance from centre, azimuth → compass position ---
    const sunVisualAlt = Math.max(0, sunAltitudeDeg);     // clamp below-horizon
    const sunDist = maxRadius * (1 - sunVisualAlt / 90);
    const sunRad = sunAzimuthDeg * Math.PI / 180;
    const sunX = cx - sunDist * Math.sin(sunRad);
    const sunY = cy + sunDist * Math.cos(sunRad);
    const sunBelowHorizon = sunAltitudeDeg < 0;

    // --- Moon ---
    const moonVisualAlt = Math.max(0, moonAltitudeDeg);   // clamp below-horizon
    const moonDist = maxRadius * (1 - moonVisualAlt / 90);
    const moonRad = moonAzimuthDeg * Math.PI / 180;
    const moonX = cx - moonDist * Math.sin(moonRad);
    const moonY = cy + moonDist * Math.cos(moonRad);
    const moonBelowHorizon = moonAltitudeDeg < 0;

    // --- Eclipse detection: shared azimuth (wrap-safe), shared altitude AND
    //     lunar node. Tolerances cover PARTIAL eclipses too (e.g. 89%): up to
    //     ~1.7° of azimuth offset, ~5° of altitude, ~19° from the lunar node. ---
    const azDiff = Math.abs(((sunAzimuthDeg - moonAzimuthDeg) % 360) + 360) % 360;
    const isAzAligned = Math.min(azDiff, 360 - azDiff) * Math.PI / 180 < 0.03;
    const isAltAligned = Math.abs(sunAltitudeDeg - moonAltitudeDeg) < 5;
    const isAtNode = Math.abs(moonNodeAngle) < 0.33;
    const isEclipse = isAzAligned && isAltAligned && isAtNode;

    // --- Update Sun orbit and bead ---
    const sunTrack = document.getElementById('sun-orbit-line');
    const sunBead = document.getElementById('sun-bead');
    if (sunTrack && sunBead) {
        // The ring is the static horizon reference for the sun's band.
        sunTrack.setAttribute('rx', sunRingRx);
        sunTrack.setAttribute('ry', sunRingRx * (1 - 0.0167));
        sunBead.setAttribute('cx', sunX);
        sunBead.setAttribute('cy', sunY);
        // Ghost beads for below-horizon bodies (dimmed, outlined).
        if (sunBelowHorizon) {
            sunBead.setAttribute('opacity', '0.3');
            sunBead.setAttribute('stroke', '#555');
        } else {
            sunBead.setAttribute('opacity', '0.9');
            sunBead.setAttribute('stroke', '#fff');
        }
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
        // Ghost beads for below-horizon bodies (dimmed, outlined).
        if (moonBelowHorizon) {
            moonBead.setAttribute('opacity', '0.3');
            moonBead.setAttribute('stroke', '#555');
        } else {
            moonBead.setAttribute('opacity', '0.9');
            moonBead.setAttribute('stroke', '#fff');
        }
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

    // --- Twilight glow: a soft ring at the horizon whose intensity fades with
    //     the sun's depth below it (civil -6..0°, nautical -12..-6°). ---
    const twilightGlow = document.getElementById('twilight-glow');
    if (twilightGlow) {
        let intensity = 0;
        let color = 'rgba(255, 200, 100, 0)';
        if (sunAltitudeDeg < 0 && sunAltitudeDeg >= -6) {
            intensity = 1 + (sunAltitudeDeg / 6);            // 1 at 0°, 0 at -6°
            color = 'rgba(255, 200, 100, ' + (intensity * 0.25).toFixed(3) + ')';
        } else if (sunAltitudeDeg < -6 && sunAltitudeDeg >= -12) {
            intensity = (sunAltitudeDeg + 12) / 6;           // 1 at -6°, 0 at -12°
            color = 'rgba(255, 180, 80, ' + (intensity * 0.15).toFixed(3) + ')';
        }
        twilightGlow.setAttribute('stroke', color);
        twilightGlow.setAttribute('opacity', intensity > 0 ? '1' : '0');
    }

    // --- Virtual Earth & Light Beam (optional, dotted + luminous; off by
    //     default). The beam wedges are gradient fills + a dotted overlay
    //     whose width (90° ± 30%) and intensity follow the solar declination;
    //     during an eclipse the beams turn red and the Earth's umbra appears
    //     at the Moon. Enabled via ⚙️ Configure → 🌍 Show Light Beam.
    let isBeamEnabled = false;
    try { isBeamEnabled = localStorage.getItem('kairos_light_beam') === 'true'; }
    catch (e) { /* no localStorage (e.g. node tests) — beam stays off */ }

    const virtualEarth = document.getElementById('virtual-earth');
    const daylightBeam = document.getElementById('daylight-beam');
    const daylightDots = document.getElementById('daylight-dots');
    const twilightBeam = document.getElementById('twilight-beam');
    const twilightDots = document.getElementById('twilight-dots');
    const nauticalBeam = document.getElementById('nautical-beam');
    const nauticalDots = document.getElementById('nautical-dots');
    const sunPosition = document.getElementById('sun-position');
    const nightOverlay = document.getElementById('night-overlay');
    const umbra = document.getElementById('umbra-shadow');

    if (virtualEarth && isBeamEnabled) {
        virtualEarth.setAttribute('display', 'block');

        const radius = 65;
        const azRad = (sunAzimuthDeg - 180) * Math.PI / 180;

        // --- Beam shape: width follows the solar declination ---
        const declination = (typeof getCurrentSolarDeclination === 'function')
            ? getCurrentSolarDeclination() : 0;
        const widthFactor = 1 + (declination / 23.44) * 0.3;   // 0.7…1.3
        const beamAngle = (Math.PI / 2) * widthFactor;         // 63°…117°
        const leftEdge = azRad - beamAngle / 2;
        const rightEdge = azRad + beamAngle / 2;
        const x1 = cx + radius * Math.sin(leftEdge);
        const y1 = cy - radius * Math.cos(leftEdge);
        const x2 = cx + radius * Math.sin(rightEdge);
        const y2 = cy - radius * Math.cos(rightEdge);
        const path = `M${cx},${cy} L${x1},${y1} A${radius},${radius} 0 0,1 ${x2},${y2} Z`;

        // --- Opacities based on sun altitude ---
        let dayOpacity = 0, twilightOpacity = 0, nauticalOpacity = 0;
        if (sunAltitudeDeg > 0) {
            dayOpacity = 0.8;
        } else if (sunAltitudeDeg > -6) {
            const frac = (sunAltitudeDeg + 6) / 6;
            dayOpacity = 0.8 * frac;
            twilightOpacity = 0.6 * (1 - frac);
        } else if (sunAltitudeDeg > -12) {
            const frac = (sunAltitudeDeg + 12) / 6;
            twilightOpacity = 0.6 * frac;
            nauticalOpacity = 0.4 * (1 - frac);
        }

        // --- Seasonal intensity ---
        const intensityFactor = 0.7 + (declination / 23.44) * 0.3;

        // --- Eclipse detection (existing: azimuth + altitude aligned + node) ---
        const eclipse = isEclipse;

        // --- Apply to beams (with eclipse override) ---
        const beamSets = [
            { beam: daylightBeam, dots: daylightDots, opacity: dayOpacity * intensityFactor, glow: 'url(#daylightGlow)' },
            { beam: twilightBeam, dots: twilightDots, opacity: twilightOpacity * intensityFactor * 0.8, glow: 'url(#twilightGlow)' },
            { beam: nauticalBeam, dots: nauticalDots, opacity: nauticalOpacity * intensityFactor * 0.6, glow: 'url(#nauticalGlow)' }
        ];
        beamSets.forEach(({ beam, dots, opacity, glow }) => {
            if (!beam || !dots) return;
            beam.setAttribute('d', path);
            beam.setAttribute('opacity', eclipse ? opacity * 0.6 : opacity);   // dim during eclipse
            beam.setAttribute('fill', eclipse ? 'url(#eclipseGlow)' : glow);
            dots.setAttribute('d', path);
            dots.setAttribute('opacity', eclipse ? opacity * 0.3 : opacity * 0.4);
        });

        // --- Umbra shadow (during eclipse, rides on the Moon) ---
        if (umbra) {
            if (eclipse) {
                const moonBeadEl = document.getElementById('moon-bead');
                const moonX = moonBeadEl ? parseFloat(moonBeadEl.getAttribute('cx')) || cx : cx;
                const moonY = moonBeadEl ? parseFloat(moonBeadEl.getAttribute('cy')) || cy : cy;
                umbra.setAttribute('cx', moonX);
                umbra.setAttribute('cy', moonY);
                umbra.setAttribute('display', 'block');
            } else {
                umbra.setAttribute('display', 'none');
            }
        }

        // --- Sun position on the globe's edge ---
        const sunX = cx + radius * Math.sin(azRad);
        const sunY = cy - radius * Math.cos(azRad);
        if (sunPosition) {
            sunPosition.setAttribute('cx', sunX);
            sunPosition.setAttribute('cy', sunY);
            sunPosition.setAttribute('opacity', dayOpacity + twilightOpacity > 0 ? 0.9 : 0);
        }

        // --- Night overlay dimming ---
        let nightOpacity = 0.6;
        if (sunAltitudeDeg < -12) nightOpacity = 0.9;
        else if (sunAltitudeDeg < -6) nightOpacity = 0.8;
        else if (sunAltitudeDeg < 0) nightOpacity = 0.6;
        else nightOpacity = 0.4;
        if (nightOverlay) nightOverlay.setAttribute('opacity', nightOpacity);

        // --- Gregorian clock update (inside the globe) ---
        const clock = document.getElementById('gregorian-center-clock');
        if (clock) clock.textContent = targetGregorianTime || '--:--';
    } else if (virtualEarth) {
        virtualEarth.setAttribute('display', 'none');
    }

    // --- Sunrise countdown: while the sun is below the horizon, show the real
    //     minutes until the next sunrise (SunCalc at the observer's location);
    //     fall back to the ~0.25°/min vertical-rate approximation when the
    //     solar model is unavailable (that rate is exact only at the equator). ---
    const countdownElement = document.getElementById('sunrise-countdown');
    if (countdownElement) {
        if (sunAltitudeDeg < 0) {
            let minutes = minutesUntilNextSunrise();
            if (minutes == null) {
                minutes = Math.round((-sunAltitudeDeg) / 0.25);
            }
            if (minutes > 0) {
                countdownElement.textContent = '☀️ Sunrise in ' + minutes + ' min';
                countdownElement.style.display = 'block';
            } else {
                countdownElement.style.display = 'none';
            }
        } else {
            countdownElement.style.display = 'none';
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
