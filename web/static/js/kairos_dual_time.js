/**
 * Kairos — Dual-Time Logic (Orbital text ↔ Visual dial).
 *
 * Separates the GLOBAL ORBITAL TIME from the LOCAL VISUAL SKY:
 *
 *   · ORBITAL_TEXT — the global text timestamp ("SS:BB:PP"), a pure count of
 *     the pulses elapsed in the Kairos day. It never changes with your
 *     location — it is the epoch, not the sky.
 *   · SUN_AZIMUTH — the Sun's physical compass bearing for the observer
 *     (0° = N, 90° = E), the thing the dial hand must point at.
 *   · VISUAL_TIME — the azimuth mapped back onto the 26 × 28 × 7 grid
 *     (azimuth / 360 × 5,096 pulses), used to place dial hands/tick labels
 *     so they physically align with the Sun.
 *
 * DISPLAY RULE: the sun hand MUST point to SUN_AZIMUTH; the text stays
 * ORBITAL_TEXT.
 *
 * This implementation keeps the equation-of-time pulse (web/static/js/
 * kairos_time.js — Meeus ch. 28), so 5,096 pulses always span exactly one
 * apparent solar day: the orbital text never drifts from the real sky.
 * (The draft sinusoidal model 17.0129 ± 0.0251 s would have drifted ≈5 min
 * per day; it is intentionally not used.)
 *
 * Main-app reading layer only; the isolated watch face never loads this.
 */

// The 26 × 28 × 7 structure, mirrored from web/static/js/kairos_time.js.
const DUAL_TIME = {
    PULSES_PER_BEAT: 7,
    BEATS_PER_STRIDE: 28,
    STRIDES_PER_DAY: 26,
    TOTAL_PULSES_PER_DAY: 26 * 28 * 7,   // 5096
    PULSES_PER_STRIDE: 28 * 7,           // 196
};

function dualTimePad2(n) {
    return String(n).padStart(2, '0');
}

/**
 * The length of one Pulse in Gregorian seconds for the given date — the real
 * equation-of-time pulse (apparent solar day ÷ 5,096). Accepts a Date (the
 * EoT model needs the full date, not just the day of year).
 */
function calculatePulseLength(date) {
    if (typeof getPulseLength !== 'function') {
        if (typeof console !== 'undefined') console.warn('Kairos Kepler engine not loaded');
        return null;
    }
    return getPulseLength(date || new Date());
}

/**
 * The ORBITAL TEXT timestamp for a pulse count (0–5,095): the global
 * "HH:MM:SS" (Stride:Beat:Pulse) string. Same for every observer.
 *
 * The on-screen format is 1-indexed (01:01:01–26:28:07) to match the app's
 * approved header — the spec's 0-indexed breakdown is adapted so the string
 * returned here equals what is displayed.
 */
function getOrbitalTimestamp(currentPulses) {
    const total = Math.max(0, Math.min(DUAL_TIME.TOTAL_PULSES_PER_DAY - 1,
        Math.floor(currentPulses || 0)));
    const stride = Math.floor(total / DUAL_TIME.PULSES_PER_STRIDE);
    const remainder = total % DUAL_TIME.PULSES_PER_STRIDE;
    const beat = Math.floor(remainder / DUAL_TIME.PULSES_PER_BEAT);
    const pulse = remainder % DUAL_TIME.PULSES_PER_BEAT;
    return `${dualTimePad2(stride + 1)}:${dualTimePad2(beat + 1)}:${dualTimePad2(pulse + 1)}`;
}

/**
 * The Sun's physical compass bearing for an observer (0–360, North = 0) at
 * the ORBITAL moment: local midnight + currentPulses × pulse length, run
 * through the Solar Position Algorithm (vendored SunCalc).
 *
 * With the equation-of-time pulse this reconstructs ≈ the real current time,
 * so the result tracks the live azimuth (web/static/js/solar_time.js); the
 * dial itself uses the live azimuth directly.
 */
function getPhysicalSunAzimuth(lat, lon, date, currentPulses) {
    const now = date || new Date();
    const pulseLen = calculatePulseLength(now);
    if (pulseLen === null) return null;
    const elapsedMs = Math.floor(currentPulses || 0) * pulseLen * 1000;
    // The Kairos day starts at APPARENT solar midnight (the pulse count's
    // anchor — SunCalc solarNoon − 12 h, as in web/static/js/kairos_time.js),
    // so the reconstructed datetime is consistent with the orbital clock:
    // pulse 2,548 is apparent noon and the Sun is due south there. Without
    // the solar engine, fall back to local midnight.
    let dayStart;
    if (typeof SunCalc !== 'undefined' && typeof SunCalc.getTimes === 'function') {
        try {
            const noon = SunCalc.getTimes(now, lat, lon).solarNoon;
            dayStart = (noon instanceof Date && !isNaN(noon.getTime()))
                ? new Date(noon.getTime() - 12 * 3600 * 1000)
                : new Date(now.getFullYear(), now.getMonth(), now.getDate());
        } catch (e) { dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()); }
    } else {
        dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
    const orbitalDate = new Date(dayStart.getTime() + elapsedMs);
    if (typeof SunCalc === 'undefined' || typeof SunCalc.getPosition !== 'function') return null;
    const pos = SunCalc.getPosition(orbitalDate, lat, lon);
    // SunCalc azimuths are measured from SOUTH, clockwise → north-based.
    return ((((pos.azimuth + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) * 180 / Math.PI;
}

/**
 * Map a compass azimuth back onto the 26 × 28 × 7 dial: visual_pulses =
 * round(azimuth / 360 × 5,096), broken into Stride/Beat/Pulse (1-indexed,
 * wrapped so 360° = 0°).
 */
function getVisualDialTime(azimuthDegrees) {
    const az = ((azimuthDegrees % 360) + 360) % 360;
    const visualPulses = Math.round((az / 360) * DUAL_TIME.TOTAL_PULSES_PER_DAY)
        % DUAL_TIME.TOTAL_PULSES_PER_DAY;
    const stride = Math.floor(visualPulses / DUAL_TIME.PULSES_PER_STRIDE);
    const remainder = visualPulses % DUAL_TIME.PULSES_PER_STRIDE;
    const beat = Math.floor(remainder / DUAL_TIME.PULSES_PER_BEAT);
    const pulse = remainder % DUAL_TIME.PULSES_PER_BEAT;
    return {
        visualPulses,
        stride: stride + 1,
        beat: beat + 1,
        pulse: pulse + 1,
        formatted: `${dualTimePad2(stride + 1)}:${dualTimePad2(beat + 1)}:${dualTimePad2(pulse + 1)}`
    };
}

/**
 * The complete Dual-Time snapshot for a moment:
 *   { orbitalText, sunAzimuth, visualPulses, visualTime, pulseLength,
 *     dayOfYear }
 */
function getDualTime(date) {
    const now = date || new Date();
    if (typeof getKairosKeplerTime !== 'function') return null;
    const kairos = getKairosKeplerTime(now);
    const pulseCount = Math.floor(kairos.totalPulses);
    const orbitalText = getOrbitalTimestamp(pulseCount);
    let sunAzimuth = 0;
    if (typeof getSolarAzimuth === 'function') {
        try { sunAzimuth = getSolarAzimuth(); } catch (e) { /* ignore */ }
    }
    const visual = getVisualDialTime(sunAzimuth);
    return {
        orbitalText,
        sunAzimuth,
        visualPulses: visual.visualPulses,
        visualTime: visual.formatted,
        pulseLength: kairos.pulseLength,
        dayOfYear: kairos.dayOfYear
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports.calculatePulseLength = calculatePulseLength;
    module.exports.getOrbitalTimestamp = getOrbitalTimestamp;
    module.exports.getPhysicalSunAzimuth = getPhysicalSunAzimuth;
    module.exports.getVisualDialTime = getVisualDialTime;
    module.exports.getDualTime = getDualTime;
    module.exports.DUAL_TIME = DUAL_TIME;
}

