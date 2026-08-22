/**
 * Kairos Watch Face — the wearable clock (web/watch.html).
 *
 * Renders ONLY the clock: the true solar time (12:00 = solar noon), a tiny
 * azimuth + moon meta line, and a compact Kairos date line. Add ?min=1 (or
 * ?minimal=1) for a pure clock with no captions.
 *
 * Isolation: this page loads ONLY lib/suncalc.js, static/js/solar_time.js and
 * static/js/kairos_calendar.js — never the main app scripts — so the watch
 * face can never break the existing web app.
 *
 * Location: inherits the app's stored kairos_location; ?lat=&lon= fixes one
 * (e.g. a wall-mounted watch); otherwise one silent GPS attempt, else the
 * app default 52°N 5°E.
 *
 * Battery: the DOM is only touched when the displayed strings actually change;
 * the face re-renders instantly on raise/focus (visibilitychange/focus/pageshow).
 */

(function () {
    "use strict";

    const DEFAULT_LOCATION = { lat: 52.0, lon: 5.0 };
    const TICK_MS = 2000;

    let location = DEFAULT_LOCATION;
    let minimal = false;
    let last = { time: "", meta: "", date: "" };

    // Shared calendar helpers (web/static/js/kairos_calendar.js) — referenced
    // via window so the same code runs in the browser and under Node tests.
    const KC = (typeof window !== "undefined" && window.KairosCalendar) || null;

    function el(id) {
        return (typeof document !== "undefined" && document.getElementById)
            ? document.getElementById(id) : null;
    }

    function setText(id, text) {
        const node = el(id);
        if (node) node.textContent = text;
    }

    function readLocation() {
        // 1) explicit ?lat=&lon= override — persisted as the watch's location.
        try {
            const q = new URLSearchParams(
                (typeof window !== "undefined" && window.location) ? window.location.search : "");
            const lat = parseFloat(q.get("lat"));
            const lon = parseFloat(q.get("lon"));
            if (Number.isFinite(lat) && Number.isFinite(lon)
                && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
                location = { lat: lat, lon: lon };
                try { localStorage.setItem("kairos_location", JSON.stringify(location)); } catch (e) { /* ignore */ }
                return;
            }
        } catch (e) { /* ignore */ }

        // 2) the location the main app already knows (shared kairos_location).
        try {
            const saved = localStorage.getItem("kairos_location");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && typeof parsed.lat === "number" && typeof parsed.lon === "number") {
                    location = { lat: parsed.lat, lon: parsed.lon };
                    return;
                }
            }
        } catch (e) { /* ignore */ }

        // 3) one-shot GPS (a watch may have none — fails silently).
        if (typeof navigator !== "undefined" && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                pos => {
                    location = { lat: pos.coords.latitude, lon: pos.coords.longitude };
                    try { localStorage.setItem("kairos_location", JSON.stringify(location)); } catch (e) { /* ignore */ }
                    render();
                },
                () => { /* ignore */ },
                { timeout: 4000, maximumAge: 600000 });
        }
    }

    function render() {
        const now = new Date();

        // The clock: TRUE SOLAR TIME (via the shared engine; wall clock fallback).
        let hours;
        try {
            hours = (typeof getKairosTime === "function") ? getKairosTime() : null;
        } catch (e) { hours = null; }
        if (hours === null) {
            hours = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
        }
        const hh = Math.floor(hours) % 24;
        const mm = Math.floor((hours - Math.floor(hours)) * 60);
        const time = String(hh).padStart(2, "0") + ":" + String(mm).padStart(2, "0");

        let meta = "";
        let date = "";
        if (!minimal) {
            // ☀ azimuth — the Sun's true bearing (0° = N), like the main app.
            let az = null;
            try {
                if (typeof getSolarAzimuth === "function") az = getSolarAzimuth();
            } catch (e) { /* ignore */ }

            // 🌙 moon phase + lunar age.
            let emoji = "🌑";
            let age = 0;
            try {
                if (KC && typeof SunCalc !== "undefined" && SunCalc.getMoonIllumination) {
                    const illum = SunCalc.getMoonIllumination(now);
                    emoji = KC.moonEmojiFromPhase(illum.phase);
                    age = (illum.phase % 1) * 29.53058867;
                }
            } catch (e) { /* ignore */ }
            meta = "☀ " + (az !== null ? az.toFixed(1) + "°" : "--.-°")
                + "   " + emoji + " " + age.toFixed(1) + "d";

            // Kairos date: weekday · month day · season.
            if (KC) {
                let season = "";
                try {
                    if (typeof SunCalc !== "undefined" && SunCalc.getSolarLongitude) {
                        season = KC.getSeason(SunCalc.getSolarLongitude(now));
                    }
                } catch (e) { /* ignore */ }
                const kd = KC.kairosDate(KC.kairosDayOfYear(now));
                date = kd.weekday + " · " + kd.month + " " + kd.day + (season ? " · " + season : "");
            }
        }

        // Touch the DOM only when the displayed strings actually change.
        if (time !== last.time) setText("time", time);
        if (meta !== last.meta) setText("meta", meta);
        if (date !== last.date) setText("date", date);
        last = { time: time, meta: meta, date: date };
    }

    function tick() {
        render();
        setTimeout(tick, TICK_MS);
    }

    function start() {
        try {
            const q = new URLSearchParams(
                (typeof window !== "undefined" && window.location) ? window.location.search : "");
            minimal = q.get("min") === "1" || q.get("minimal") === "1";
            if (minimal && typeof document !== "undefined" && document.body) {
                document.body.classList.add("minimal");
            }
        } catch (e) { /* ignore */ }

        readLocation();
        tick();

        // Refresh instantly on raise/wake instead of waiting for the next tick.
        if (typeof document !== "undefined" && document.addEventListener) {
            document.addEventListener("visibilitychange", tick);
        }
        if (typeof window !== "undefined" && window.addEventListener) {
            window.addEventListener("focus", tick);
            window.addEventListener("pageshow", tick);
        }
    }

    // start() runs on DOMContentLoaded in the browser, immediately in Node.
    if (typeof document !== "undefined" && document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
        start();
    }

    // Testable/debug handle.
    if (typeof window !== "undefined") {
        window.KairosWatch = { render: render, getLocation: () => location, isMinimal: () => minimal };
    }
})();
