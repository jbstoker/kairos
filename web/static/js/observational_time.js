/** Sunrise-to-sunrise Kairos clock. SunCalc events are predictions, not observations.
 * Each light/dark half contains 13 × 28 × 7 = 2548 locally variable pulses.
 * When no sunrise or sunset exists (polar day/night), return null explicitly.
 */
(function () {
    'use strict';
    const STRIDES_PER_HALF = 13;
    const PULSES_PER_HALF = STRIDES_PER_HALF * 28 * 7;

    function getKairosObservationalTime(date, lat, lon) {
        if (!(date instanceof Date) || !Number.isFinite(date.getTime()) ||
            !Number.isFinite(lat) || !Number.isFinite(lon) ||
            lat < -90 || lat > 90 || lon < -180 || lon > 180 ||
            typeof SunCalc === 'undefined' || typeof SunCalc.getTimes !== 'function') return null;

        const now = date.getTime();
        const rises = new Set();
        const sets = new Set();
        // SunCalc.getTimes uses a longitude-dependent Julian cycle, not the
        // civil date; sample generously across UTC and DST boundaries.
        for (let offset = -3; offset <= 3; offset++) {
            const times = SunCalc.getTimes(new Date(now + offset * 86400000), lat, lon);
            if (times.sunrise instanceof Date && Number.isFinite(times.sunrise.getTime()))
                rises.add(times.sunrise.getTime());
            if (times.sunset instanceof Date && Number.isFinite(times.sunset.getTime()))
                sets.add(times.sunset.getTime());
        }
        const sunrises = [...rises].sort((a, b) => a - b);
        const sunsets = [...sets].sort((a, b) => a - b);
        const previousSunrise = sunrises.filter(t => t <= now).pop();
        const nextSunrise = sunrises.find(t => t > now);
        if (previousSunrise === undefined || nextSunrise === undefined) return null;
        const sunset = sunsets.find(t => t > previousSunrise && t < nextSunrise);
        if (sunset === undefined) return null;
        const isLight = now < sunset;
        const start = isLight ? previousSunrise : sunset;
        const end = isLight ? sunset : nextSunrise;
        const duration = (end - start) / 1000;
        if (!(duration > 0)) return null;
        const elapsed = Math.min(PULSES_PER_HALF - 1, Math.floor((now - start) / (end - start) * PULSES_PER_HALF));
        const stride = Math.floor(elapsed / 196) + 1;
        const beat = Math.floor(elapsed % 196 / 7) + 1;
        const pulse = elapsed % 7 + 1;
        const pad = n => String(n).padStart(2, '0');
        return {
            half: isLight ? 'light' : 'dark', isLight, stride, beat, pulse,
            display: `${pad(stride)}:${pad(beat)}:${pad(pulse)}`,
            halfDisplay: `${isLight ? '☀️' : '🌙'} ${stride}/13`,
            pulseLength: duration / PULSES_PER_HALF,
            start: new Date(start), end: new Date(end),
            sunrise: new Date(previousSunrise), sunset: new Date(sunset),
            nextSunrise: new Date(nextSunrise)
        };
    }

    function getKairosObservationalPulseLength(date, lat, lon) {
        const clock = getKairosObservationalTime(date, lat, lon);
        return clock ? clock.pulseLength : null;
    }

    const api = { STRIDES_PER_HALF, PULSES_PER_HALF, getKairosObservationalTime,
        getKairosObservationalPulseLength };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (typeof window !== 'undefined') Object.assign(window, api);
})();