const CHUNKS = ["payload/g00/000.txt", "payload/g00/001.txt", "payload/g00/002.txt", "payload/g00/003.txt", "payload/g01/004.txt", "payload/g01/005.txt", "payload/g01/006.txt", "payload/g01/007.txt", "payload/g02/008.txt", "payload/g02/009.txt", "payload/g02/010.txt", "payload/g02/011.txt", "payload/g03/012.txt", "payload/g03/013.txt", "payload/g03/014.txt", "payload/g03/015.txt", "payload/g04/016.txt", "payload/g04/017.txt", "payload/g04/018.txt", "payload/g04/019.txt", "payload/g05/020.txt", "payload/g05/021.txt", "payload/g05/022.txt", "payload/g05/023.txt", "payload/g06/024.txt", "payload/g06/025.txt", "payload/g06/026.txt", "payload/g06/027.txt", "payload/g07/028.txt", "payload/g07/029.txt", "payload/g07/030.txt", "payload/g07/031.txt", "payload/g08/032.txt", "payload/g08/033.txt", "payload/g08/034.txt", "payload/g08/035.txt", "payload/g09/036.txt", "payload/g09/037.txt", "payload/g09/038.txt", "payload/g09/039.txt", "payload/g10/040.txt", "payload/g10/041.txt", "payload/g10/042.txt", "payload/g10/043.txt", "payload/g11/044.txt", "payload/g11/045.txt", "payload/g11/046.txt", "payload/g11/047.txt"];
const boot = document.querySelector("#boot");
const app = document.querySelector("#app");
const storyboard = document.querySelector('[data-action="storyboard"]');

function fail(error) {
  console.error("Unable to open the packed WebKit release", error);
  boot.innerHTML = `<div class="mark">G|H</div><strong>Unable to open the lab</strong><p>This WebKit release requires a current Safari, WKWebView, or modern browser with gzip DecompressionStream support. <a href="./support.html" style="color:#6fe7ff">Open support</a>.</p>`;
}

try {
  if (!("DecompressionStream" in window)) throw new Error("DecompressionStream is unavailable");
  const parts = await Promise.all(CHUNKS.map(async (path) => {
    const response = await fetch(`./${path}`, { cache: "no-cache" });
    if (!response.ok) throw new Error(`Failed to load ${path} (${response.status})`);
    return response.text();
  }));
  const binary = atob(parts.join(""));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
  const payload = JSON.parse(await new Response(stream).text());
  if (payload.schema !== "gsc-webkit-packed/1" || typeof payload.css !== "string" || typeof payload.js !== "string") throw new Error("Invalid deployment payload");
  const style = document.createElement("style");
  style.textContent = payload.css;
  document.head.append(style);
  app.hidden = false;
  storyboard.hidden = false;
  boot.remove();
  const moduleURL = URL.createObjectURL(new Blob([payload.js], { type: "text/javascript" }));
  try { await import(moduleURL); } finally { URL.revokeObjectURL(moduleURL); }
} catch (error) {
  fail(error);
}
