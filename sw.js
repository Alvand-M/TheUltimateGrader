// Ultimate Grader - offline support
// The app is saved on the tablet after the first visit. When you are online it checks for a newer version first;
// when you are offline (or the connection is slow) it opens the saved copy.
const CACHE = 'ultimate-grader-v1';
const FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) { return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith((async function () {
    const cache = await caches.open(CACHE);
    const network = fetch(e.request).then(function (res) {
      if (res && res.ok) cache.put(e.request, res.clone());
      return res;
    });
    const timeout = new Promise(function (resolve) { setTimeout(function () { resolve(null); }, 2500); });
    try {
      const res = await Promise.race([network, timeout]);
      if (res) return res;
    } catch (err) { /* offline */ }
    const cached = await cache.match(e.request, { ignoreSearch: true }) || await cache.match('./index.html');
    if (cached) return cached;
    return network;
  })());
});
