/** Sunrise-to-sunrise Kairos clock. SunCalc events are predictions, not observations.
 * Each light/dark half contains 13 × 28 × 7 = 2548 locally variable pulses.
 * When no sunrise or sunset exists (polar day/night), return null explicitly.
 */
(function () {
    'use strict';
    const STRIDES_PER_HALF = 13;
    const PULSES_PER_HALF = STRIDES_PER_HALF * 28 * 7;

    // An observed event replaces only the predicted event for its own day and
    // location. An unpaired observation leaves the other boundary predicted.
    function substituteEvents(predicted, observations, kind, lat, lon) {
        if (!Array.isArray(observations)) observations = [];
        return predicted.map(time => {
            const matches = observations.filter(event => event && event.kind === kind &&
                event.lat === lat && event.lon === lon &&
                typeof event.timestamp === 'string' &&
                Number.isFinite(Date.parse(event.timestamp)) &&
                Math.abs(Date.parse(event.timestamp) - time) < 6 * 3600000);
            return matches.length
                ? { time: Date.parse(matches[matches.length - 1].timestamp), observed: true }
                : { time, observed: false };
        }).sort((a, b) => a.time - b.time);
    }

    function getKairosObservationalTime(date, lat, lon, observations) {
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
        const sunrises = substituteEvents([...rises].sort((a, b) => a - b),
            observations, 'sunrise', lat, lon);
        const sunsets = substituteEvents([...sets].sort((a, b) => a - b),
            observations, 'sunset', lat, lon);
        const previous = sunrises.filter(event => event.time <= now).pop();
        const next = sunrises.find(event => event.time > now);
        if (!previous || !next) return null;
        const previousSunrise = previous.time;
        const nextSunrise = next.time;
        const setting = sunsets.find(event => event.time > previousSunrise && event.time < nextSunrise);
        if (!setting) return null;
        const sunset = setting.time;
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
            nextSunrise: new Date(nextSunrise),
            sunriseObserved: previous.observed,
            sunsetObserved: setting.observed
        };
    }

    function getKairosObservationalPulseLength(date, lat, lon, observations) {
        const clock = getKairosObservationalTime(date, lat, lon, observations);
        return clock ? clock.pulseLength : null;
    }

    const api = { STRIDES_PER_HALF, PULSES_PER_HALF, getKairosObservationalTime,
        getKairosObservationalPulseLength };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (typeof window !== 'undefined') Object.assign(window, api);
})();