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

    // --- Sun as a lightbulb (flood light, not a laser): a soft glow disc
    //     around the Sun bead, a soft gradient wedge flooding from the Sun to
    //     the Earth, and the Earth's lit half. Opacity maps day / civil /
    //     nautical / night and during an eclipse the light turns red.
    //     Enabled via ⚙️ Configure → 🌍 Show Sun Light (kairos_light_beam).
    let isBeamEnabled = false;
    try { isBeamEnabled = localStorage.getItem('kairos_light_beam') === 'true'; }
    catch (e) { /* no localStorage (e.g. node tests) — flood light stays off */ }

    const sunLightGroup = document.getElementById('sun-light');
    const sunGlow = document.getElementById('sun-glow');
    const lightFlood = document.getElementById('light-flood');
    const earthLit = document.getElementById('earth-lit');
    const virtualEarth = document.getElementById('virtual-earth');

    if (sunLightGroup && isBeamEnabled) {
        sunLightGroup.setAttribute('display', 'block');
        if (virtualEarth) virtualEarth.setAttribute('display', 'block');

        const sunBead = document.getElementById('sun-bead');
        if (sunBead) {
            const sunX = parseFloat(sunBead.getAttribute('cx'));
            const sunY = parseFloat(sunBead.getAttribute('cy'));

            // 1. Sun glow — a soft disc centred on the Sun bead.
            if (sunGlow) {
                sunGlow.setAttribute('cx', sunX);
                sunGlow.setAttribute('cy', sunY);
            }

            // 2. Light flood — a soft wedge from the Sun to the Earth that
            //    spreads wider as it travels; the gradient runs Sun → Earth.
            const dx = cx - sunX;
            const dy = cy - sunY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
                const angle = Math.atan2(dy, dx);
                const spread = 30 + dist / 2;                 // wider as it travels
                const leftX = sunX + (dist + 100) * Math.cos(angle - Math.PI / 12);
                const leftY = sunY + (dist + 100) * Math.sin(angle - Math.PI / 12);
                const rightX = sunX + (dist + 100) * Math.cos(angle + Math.PI / 12);
                const rightY = sunY + (dist + 100) * Math.sin(angle + Math.PI / 12);
                if (lightFlood) {
                    lightFlood.setAttribute('d', `M${sunX},${sunY} L${leftX},${leftY} ${cx},${cy} ${rightX},${rightY} Z`);
                }
                const floodGrad = document.getElementById('lightFloodGrad');
                if (floodGrad) {
                    floodGrad.setAttribute('x1', sunX);
                    floodGrad.setAttribute('y1', sunY);
                    floodGrad.setAttribute('x2', cx);
                    floodGrad.setAttribute('y2', cy);
                }
            }

            // 3. Earth's lit half — the half of the globe facing the Sun
            //    (a half-disc clip rotated toward the Sun bead).
            const dayClipPath = document.getElementById('day-clip-path');
            if (dayClipPath) {
                const azRad = Math.atan2(sunY - cy, sunX - cx);
                const p1x = cx + 60 * Math.cos(azRad - Math.PI / 2);
                const p1y = cy + 60 * Math.sin(azRad - Math.PI / 2);
                const p2x = cx + 60 * Math.cos(azRad + Math.PI / 2);
                const p2y = cy + 60 * Math.sin(azRad + Math.PI / 2);
                dayClipPath.setAttribute('d', `M${cx},${cy} L${p1x},${p1y} A60,60 0 0,1 ${p2x},${p2y} Z`);
            }

            // 4. Opacity from the sun altitude (light percentage).
            let opacity = 0;
            if (sunAltitudeDeg > 0) {
                opacity = 0.8;                                             // full day
            } else if (sunAltitudeDeg > -6) {
                opacity = 0.4 * (1 - (sunAltitudeDeg + 6) / 6);            // civil twilight
            } else if (sunAltitudeDeg > -12) {
                opacity = 0.15 * (1 - (sunAltitudeDeg + 12) / 6);          // nautical twilight
            } else {
                opacity = 0;                                               // night
            }
            if (sunGlow) sunGlow.setAttribute('opacity', (opacity * 0.5).toFixed(3));
            if (lightFlood) lightFlood.setAttribute('opacity', (opacity * 0.2).toFixed(3));
            if (earthLit) earthLit.setAttribute('opacity', opacity.toFixed(3));

            // 5. Eclipse (existing detection): the light turns red/dark.
            if (isEclipse) {
                if (sunGlow) sunGlow.setAttribute('fill', 'rgba(180,60,30,0.4)');
                if (lightFlood) lightFlood.setAttribute('fill', 'rgba(180,60,30,0.1)');
                if (earthLit) earthLit.setAttribute('fill', 'rgba(180,60,30,0.2)');
            } else {
                if (sunGlow) sunGlow.setAttribute('fill', 'url(#sunGlowGrad)');
                if (lightFlood) lightFlood.setAttribute('fill', 'url(#lightFloodGrad)');
                if (earthLit) earthLit.setAttribute('fill', 'url(#earthGlowGrad)');
            }
        }
    } else if (sunLightGroup) {
        sunLightGroup.setAttribute('display', 'none');
        if (virtualEarth) virtualEarth.setAttribute('display', 'none');
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
