const CACHE_PREFIX = "gsc-spatial-cognition-";
const CACHE = `${CACHE_PREFIX}experience-v8`;
const CORE = [
  "./", "./index.html", "./boot.mjs", "./brand-refresh.mjs", "./brand-refresh.css", "./light-theme.css",
  "./experience-v2.mjs", "./experience-v2.css", "./experience-state.css", "./manifest.webmanifest",
  "./brand-icon.svg", "./icon.svg", "./brand-hero.svg", "./generation-media.svg", "./offline.html",
  "./privacy.html", "./support.html", "./healthcheck.json", "./robots.txt"
];
const PAYLOAD = [
  "payload/g00/000.txt", "payload/g00/001.txt", "payload/g00/002.txt", "payload/g00/003.txt",
  "payload/g01/004.txt", "payload/g01/005.txt", "payload/g01/006.txt", "payload/g01/007.txt",
  "payload/g02/008.txt", "payload/g02/009.txt", "payload/g02/010.txt", "payload/g02/011.txt",
  "payload/g03/012.txt", "payload/g03/013.txt", "payload/g03/014.txt", "payload/g03/015.txt",
  "payload/g04/016.txt", "payload/g04/017.txt", "payload/g04/018.txt", "payload/g04/019.txt",
  "payload/g05/020.txt", "payload/g05/021.txt", "payload/g05/022.txt", "payload/g05/023.txt",
  "payload/g06/024.txt", "payload/g06/025.txt", "payload/g06/026.txt", "payload/g06/027.txt",
  "payload/g07/028.txt", "payload/g07/029.txt", "payload/g07/030.txt", "payload/g07/031.txt",
  "payload/g08/032.txt", "payload/g08/033.txt", "payload/g08/034.txt", "payload/g08/035.txt",
  "payload/g09/036.txt", "payload/g09/037.txt", "payload/g09/038.txt", "payload/g09/039.txt",
  "payload/g10/040.txt", "payload/g10/041.txt", "payload/g10/042.txt", "payload/g10/043.txt",
  "payload/g11/044.txt", "payload/g11/045.txt", "payload/g11/046.txt", "payload/g11/047.txt"
];
self.addEventListener("install", event => event.waitUntil(
  caches.open(CACHE).then(cache => cache.addAll([...CORE, ...PAYLOAD])).then(() => self.skipWaiting())
));
self.addEventListener("activate", event => event.waitUntil(
  caches.keys()
    .then(keys => Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE).map(key => caches.delete(key))))
    .then(() => self.clients.claim())
));
async function networkFirst(request, fallbacks = []) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request, { cache: "no-store" });
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const exact = await cache.match(request);
    if (exact) return exact;
    for (const fallback of fallbacks) {
      const cached = await cache.match(fallback);
      if (cached) return cached;
    }
    throw new Error("No cached response available");
  }
}
async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && new URL(request.url).origin === self.location.origin) cache.put(request, response.clone());
  return response;
}
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith("/healthcheck.json")) {
    event.respondWith(networkFirst(event.request, ["./healthcheck.json"]));
    return;
  }
  if (event.request.mode === "navigate") {
    event.respondWith(networkFirst(event.request, ["./index.html", "./", "./offline.html"]));
    return;
  }
  event.respondWith(cacheFirst(event.request));
});
