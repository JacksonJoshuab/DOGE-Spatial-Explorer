const CACHE_PREFIX = "gsc-spatial-cognition-webkit-packed";
const CACHE = `${CACHE_PREFIX}-v2.1.3`;
const scoped = (path) => new URL(path, self.registration.scope).toString();
const APP_SHELL = ["./", "./index.html", "./boot.mjs", "./offline.html", "./privacy.html", "./support.html", "./404.html", "./manifest.webmanifest", "./icon.svg", "./payload/g00/000.txt", "./payload/g00/001.txt", "./payload/g00/002.txt", "./payload/g00/003.txt", "./payload/g01/004.txt", "./payload/g01/005.txt", "./payload/g01/006.txt", "./payload/g01/007.txt", "./payload/g02/008.txt", "./payload/g02/009.txt", "./payload/g02/010.txt", "./payload/g02/011.txt", "./payload/g03/012.txt", "./payload/g03/013.txt", "./payload/g03/014.txt", "./payload/g03/015.txt", "./payload/g04/016.txt", "./payload/g04/017.txt", "./payload/g04/018.txt", "./payload/g04/019.txt", "./payload/g05/020.txt", "./payload/g05/021.txt", "./payload/g05/022.txt", "./payload/g05/023.txt", "./payload/g06/024.txt", "./payload/g06/025.txt", "./payload/g06/026.txt", "./payload/g06/027.txt", "./payload/g07/028.txt", "./payload/g07/029.txt", "./payload/g07/030.txt", "./payload/g07/031.txt", "./payload/g08/032.txt", "./payload/g08/033.txt", "./payload/g08/034.txt", "./payload/g08/035.txt", "./payload/g09/036.txt", "./payload/g09/037.txt", "./payload/g09/038.txt", "./payload/g09/039.txt", "./payload/g10/040.txt", "./payload/g10/041.txt", "./payload/g10/042.txt", "./payload/g10/043.txt", "./payload/g11/044.txt", "./payload/g11/045.txt", "./payload/g11/046.txt", "./payload/g11/047.txt"].map(scoped);
self.addEventListener("install", (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())));
self.addEventListener("activate", (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim())));
async function navigation(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request)) || (await cache.match(scoped("./index.html"))) || (await cache.match(scoped("./offline.html")));
  }
}
async function asset(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && new URL(request.url).origin === self.location.origin) (await caches.open(CACHE)).put(request, response.clone());
  return response;
}
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || !request.url.startsWith("http")) return;
  event.respondWith(request.mode === "navigate" ? navigation(request) : asset(request));
});
