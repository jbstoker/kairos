// Kairos service worker.
//
// Update policy (the app must never be pinned to a stale version):
//   - Navigations (the page itself) are NETWORK-FIRST: when online the newest
//     index.html always loads; the cached shell is only a fallback for
//     offline use. This is what prevents "my browser still shows the old app".
//   - Everything else (scripts, styles, images) is cache-first with a network
//     fallback that also populates the cache.
//   - On install we skipWaiting() and on activate we clients.claim(), so a
//     newly deployed app takes control of already-open tabs right away, and
//     any older cache versions are deleted.

const CACHE_NAME = 'kairos-v45';
const APP_SHELL = [
    'index.html', 'style.css', 'static/css/mobile.css', 'i18n.js', 'app.js',
    'checksum_selfcheck.js',
    'tabs.js', 'planets.js', 'observation_methods.js', 'seasonal_defaults.js',
    'seasonal_display.js', 'phytochemical_defaults.js',
    'phytochemical_display.js', 'kst_display.js', 'help_data.js', 'help.js',
    'lib/suncalc.js', 'manifest.json', 'site.webmanifest', 'logo.svg',
    'favicon-16x16.png', 'favicon-32x32.png', 'apple-touch-icon.png',
    'icon-192.png',
    'static/icons.svg',
    'static/js/lens_manager.js', 'static/js/energy_data.js',
    'static/js/solar_time.js', 'static/js/astronomy_engine.js',
    'static/js/canvas_renderer.js',
    'static/js/app_controller.js', 'static/js/unified_display.js',
    'static/js/mobile.js',
    // Wearable watch face (web/watch.html) — isolated from the main app.
    'watch.html', 'watch.webmanifest', 'static/css/watch.css',
    'static/js/watch.js', 'static/js/kairos_calendar.js'
];

self.addEventListener('install', e => {
    self.skipWaiting();
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
    );
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME)
                .map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', e => {
    if (e.request.mode === 'navigate') {
        // Network-first for the page itself.
        e.respondWith(
            fetch(e.request)
                .then(res => {
                    const copy = res.clone();
                    caches.open(CACHE_NAME).then(c => c.put(e.request, copy));
                    return res;
                })
                .catch(() => caches.match(e.request)
                    .then(r => r || caches.match('index.html')))
        );
        return;
    }
    // Cache-first for assets, with a network fallback that fills the cache.
    e.respondWith(
        caches.match(e.request).then(r => r || fetch(e.request).then(res => {
            const copy = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(e.request, copy));
            return res;
        }))
    );
});

