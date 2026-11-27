/*
 * مقاضي — offline support
 * The shopping list has to open inside a supermarket with a weak signal, so
 * every file is fetched from the network when it answers quickly and from
 * the last saved copy when it does not. Nothing is ever served stale while
 * the network is healthy, so a new week's data shows up on the next open.
 */
const CACHE = 'maqadi-v4';
// Every module app.js imports, so the app also starts offline on its first visit after an update.
const SHELL = ['./', 'index.html', 'app.css', 'app.js', 'lib/plan.js', 'lib/htm-preact.js', 'lib/barcode.js', 'lib/scan.js', 'lib/budget.js', 'lib/prefs.js', 'lib/receipt.js', 'lib/savings.js', 'lib/season.js',
  'fonts/readex-pro-arabic.woff2', 'fonts/readex-pro-latin.woff2', 'icons/logo.svg', 'icons/icon-192.png', 'data/current.json'];
const PATIENCE_MS = 4000;

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE && key.startsWith('maqadi-')).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  // Resized product photos are many and change weekly; the browser's own cache keeps them.
  if (url.pathname.startsWith('/_vercel/')) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const saved = await cache.match(request, { ignoreSearch: request.mode === 'navigate' });

    const fresh = fetch(request).then(response => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    });

    if (!saved) return fresh;
    // A saved copy exists: give the network a few seconds, then fall back.
    const timeout = new Promise(resolve => setTimeout(() => resolve(null), PATIENCE_MS));
    const response = await Promise.race([fresh.catch(() => null), timeout]);
    return response && response.ok ? response : saved;
  })());
});
