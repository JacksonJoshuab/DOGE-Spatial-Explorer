const CACHE = 'endless-equator-v3';
const SHELL = ['/', '/index.html', '/styles.css', '/app.js', '/manifest.webmanifest'];
const CANONICAL_API = new Set(['/api/areas', '/api/route']);

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname === '/api/mapkit-token') {
    event.respondWith(fetch(event.request));
    return;
  }

  if (CANONICAL_API.has(url.pathname)) {
    event.respondWith(networkFirstCanonical(event.request));
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match('/index.html')));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
      }
      return response;
    }))
  );
});

async function networkFirstCanonical(request) {
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Canonical API returned ${response.status}`);
    const cache = await caches.open(CACHE);
    await cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(
      JSON.stringify({ error: 'Canonical expedition data is unavailable offline on this device.' }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store'
        }
      }
    );
  }
}
