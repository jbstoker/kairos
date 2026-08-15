self.addEventListener('install', e => {
    e.waitUntil(
        caches.open('kairos-v7').then(cache => {
            return cache.addAll(['index.html', 'style.css', 'app.js', 'checksum_selfcheck.js', 'planets.js', 'observation_methods.js', 'seasonal_defaults.js', 'seasonal_display.js', 'kst_display.js', 'help_data.js', 'help.js', 'lib/suncalc.js', 'manifest.json']);
        })
    );
});

self.addEventListener('fetch', e => {
    e.respondWith(
        caches.match(e.request).then(r => r || fetch(e.request))
    );
});
