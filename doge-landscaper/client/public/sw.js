/**
 * DOGE-Landscaper Service Worker v1
 * Strategy:
 *   - GLB model (23MB): Cache-first with network fallback — once cached, loads instantly offline
 *   - App shell (HTML/JS/CSS): Network-first with cache fallback — always fresh when online
 *   - All other assets: Stale-while-revalidate
 */

const CACHE_NAME = "doge-landscaper-v3";
const GLB_CACHE_NAME = "doge-landscaper-glb-v3";

// The 31MB final LiDAR scan (buffer:0 added to all bufferViews — Three.js r183 compatible)
const GLB_URL = "https://d2xsxph8kpxj0f.cloudfront.net/116029439/cao3qXUUr9zrMdetSxxjdj/backyard-final_93fbdb48.glb";

// ── Install: pre-cache the GLB in the background ──────────────────────────────
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(GLB_CACHE_NAME).then(async (cache) => {
      try {
        // Pre-fetch and cache the GLB silently during install
        const response = await fetch(GLB_URL, { mode: "cors" });
        if (response.ok) {
          await cache.put(GLB_URL, response);
          console.log("[SW] GLB pre-cached successfully");
        }
      } catch (e) {
        // Network unavailable during install — that's fine, will cache on first use
        console.log("[SW] GLB pre-cache skipped (offline):", e.message);
      }
    })
  );
});

// ── Activate: clean up old caches ────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== GLB_CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: route requests ─────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // GLB model: cache-first (instant on repeat visits, even offline)
  if (url === GLB_URL) {
    event.respondWith(
      caches.open(GLB_CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) {
          console.log("[SW] GLB served from cache ⚡");
          return cached;
        }
        // Not cached yet — fetch, cache, and return
        try {
          const response = await fetch(event.request);
          if (response.ok) {
            cache.put(event.request, response.clone());
            console.log("[SW] GLB fetched and cached");
          }
          return response;
        } catch (e) {
          // Truly offline and not cached yet
          return new Response("GLB not available offline", { status: 503 });
        }
      })
    );
    return;
  }

  // App shell (same origin): network-first, cache fallback
  if (url.startsWith(self.location.origin)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Everything else: stale-while-revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      const networkFetch = fetch(event.request).then((response) => {
        if (response.ok) cache.put(event.request, response.clone());
        return response;
      }).catch(() => cached);
      return cached || networkFetch;
    })
  );
});

// ── Message: allow app to trigger cache status check ─────────────────────────
self.addEventListener("message", (event) => {
  if (event.data?.type === "CHECK_GLB_CACHE") {
    caches.open(GLB_CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(GLB_URL);
      event.ports[0]?.postMessage({ cached: !!cached });
    });
  }
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
