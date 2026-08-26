const BRAND_VERSION = "gonzo-health-webkit-brand/1.0.0";
const app = document.querySelector("#app");

document.documentElement.dataset.gonzoBrand = BRAND_VERSION;

const icons = {
  focus: `<svg viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="ghIconGradient"><stop stop-color="#55eaff"/><stop offset="1" stop-color="#ff54c8"/></linearGradient></defs><circle cx="16" cy="16" r="11" fill="none" stroke-width="2.6"/><circle cx="16" cy="16" r="5" fill="none" stroke-width="2.6"/><path d="M16 2v5M16 25v5M2 16h5M25 16h5" fill="none" stroke-width="2.6" stroke-linecap="round"/></svg>`,
  memory: `<svg viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="ghIconGradient"><stop stop-color="#55eaff"/><stop offset="1" stop-color="#ff54c8"/></linearGradient></defs><path d="M12 5c-4 0-7 3-7 7 0 2 1 4 3 5-1 5 2 9 7 9h2V8c-1-2-3-3-5-3zM20 5c4 0 7 3 7 7 0 2-1 4-3 5 1 5-2 9-7 9h-2V8c1-2 3-3 5-3z" fill="none" stroke-width="2.2" stroke-linejoin="round"/><path d="M9 12h5M23 12h-5M9 20h5M23 20h-5" fill="none" stroke-width="2" stroke-linecap="round"/></svg>`,
  speed: `<svg viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="ghIconGradient"><stop stop-color="#55eaff"/><stop offset="1" stop-color="#ff54c8"/></linearGradient></defs><path d="M18 2 7 18h8l-1 12 11-17h-8z" fill="none" stroke-width="2.5" stroke-linejoin="round"/></svg>`,
  calm: `<svg viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="ghIconGradient"><stop stop-color="#55eaff"/><stop offset="1" stop-color="#ff54c8"/></linearGradient></defs><path d="M27 5C16 5 7 11 7 21c0 4 3 7 7 7 10 0 15-10 13-23z" fill="none" stroke-width="2.4"/><path d="M6 27c5-8 10-12 17-17" fill="none" stroke-width="2.4" stroke-linecap="round"/></svg>`,
  progress: `<svg viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="ghIconGradient"><stop stop-color="#55eaff"/><stop offset="1" stop-color="#ff54c8"/></linearGradient></defs><rect x="4" y="5" width="24" height="22" rx="4" fill="none" stroke-width="2.2"/><polyline points="8,21 13,16 17,19 24,11" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  privacy: `<svg viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="ghIconGradient"><stop stop-color="#55eaff"/><stop offset="1" stop-color="#ff54c8"/></linearGradient></defs><path d="M16 3 27 7v8c0 7-4 12-11 14C9 27 5 22 5 15V7z" fill="none" stroke-width="2.3"/><rect x="11" y="14" width="10" height="8" rx="2" fill="none" stroke-width="2"/><path d="M13 14v-2a3 3 0 0 1 6 0v2" fill="none" stroke-width="2"/></svg>`
};

const capabilities = [
  ["focus", "Focus"], ["memory", "Memory"], ["speed", "Speed"],
  ["calm", "Calm"], ["progress", "Progress"], ["privacy", "Privacy"]
];

function addBrandMark(scope = app) {
  scope.querySelectorAll(".brand").forEach((brand) => {
    if (brand.querySelector(".gh-brand-mark")) return;
    const image = document.createElement("img");
    image.className = "gh-brand-mark";
    image.src = "./brand-icon.svg";
    image.alt = "Gonzo Health";
    brand.prepend(image);
  });
}

function enhanceHero() {
  const hero = app.querySelector(".hero");
  if (!hero || hero.dataset.ghEnhanced === BRAND_VERSION) return;
  hero.dataset.ghEnhanced = BRAND_VERSION;
  hero.classList.add("brand-hero");

  const copy = hero.firstElementChild;
  const eyebrow = copy?.querySelector(".eyebrow");
  const heading = copy?.querySelector("h1");
  const paragraph = copy?.querySelector("p");
  if (eyebrow) eyebrow.textContent = "180-second interactive cognitive wellness prototype";
  if (heading) {
    heading.className = "gh-headline";
    heading.innerHTML = "<span>Focus.</span><span>Remember.</span><span class=\"gh-gradient\">Thrive.</span>";
  }
  if (paragraph) paragraph.textContent = "A quick, private-by-default way to explore focus, memory, response control, and cognitive flexibility across every generation.";

  if (copy && !copy.querySelector(".gh-capabilities")) {
    const strip = document.createElement("div");
    strip.className = "gh-capabilities";
    strip.setAttribute("aria-label", "Experience capabilities");
    strip.innerHTML = capabilities.map(([key, label]) => `<span class="gh-capability">${icons[key]}<b>${label}</b></span>`).join("");
    const actions = copy.querySelector(".actions");
    copy.insertBefore(strip, actions || null);
  }

  const primary = copy?.querySelector('.actions [data-action="start"]');
  const demo = copy?.querySelector('.actions [data-action="demo"]');
  if (primary && /daily/i.test(primary.textContent)) primary.textContent = "Begin 180-Second Test →";
  if (demo) demo.textContent = "▶ Watch Walkthrough";

  const preview = hero.querySelector(".preview");
  if (preview) {
    preview.innerHTML = `<img class="gh-hero-media" src="./brand-hero.svg" alt="Original luminous neural portrait representing spatial cognition"><div class="gh-measure-chip"><i>⌁</i><span><strong>Measure what matters.</strong><small>Focus · Memory · Cognitive wellness</small></span></div>`;
  }
}

function enhanceGenerations() {
  app.querySelectorAll(".generation[data-generation]").forEach((card) => {
    if (card.querySelector(".gh-generation-media")) return;
    const media = document.createElement("div");
    media.className = "gh-generation-media";
    media.setAttribute("aria-hidden", "true");
    card.prepend(media);
  });
}

function addProofGrid() {
  const bridge = app.querySelector(".bridge");
  if (!bridge || app.querySelector(".gh-proof-grid")) return;
  const section = document.createElement("section");
  section.className = "gh-proof-grid";
  section.setAttribute("aria-label", "Results, privacy, and science");
  section.innerHTML = `
    <article class="gh-proof"><span class="eyebrow">Results that matter</span><h3>Your performance profile</h3><div class="gh-score"><strong>742</strong><span>/1000 sample score</span></div><div class="gh-meter"><i></i></div><p>Separate accuracy, reaction time, interference, flexibility, memory, and consistency—without turning one session into a diagnosis.</p><button type="button" data-gh-sample>View sample evaluation →</button></article>
    <article class="gh-proof"><span class="eyebrow">Your privacy, protected</span><h3>Local by default</h3><ul><li>No account required for the core test</li><li>Assessment evidence stays in this browser</li><li>You control export and deletion</li></ul><p><a href="./privacy.html">Read the privacy boundary →</a></p></article>
    <article class="gh-proof"><span class="eyebrow">Built on science</span><h3>Comparable by design</h3><p>The 3-, 15-, and 30-minute batteries share twelve invariant anchor trials while nostalgia changes only the engagement layer.</p><p><a href="./support.html">How the prototype works →</a></p></article>`;
  bridge.insertAdjacentElement("afterend", section);
  section.querySelector("[data-gh-sample]")?.addEventListener("click", () => app.querySelector('[data-action="sample"]')?.click());
}

function enhanceFooter() {
  app.querySelectorAll("footer").forEach((footer) => {
    if (footer.querySelector(".gh-footer-mark")) return;
    const mark = document.createElement("span");
    mark.className = "gh-footer-mark";
    mark.innerHTML = `<img src="./brand-icon.svg" alt=""><b>Gonzo | Health</b>`;
    footer.prepend(mark);
  });
}

function enhance() {
  if (!app || app.hidden) return;
  addBrandMark();
  enhanceHero();
  enhanceGenerations();
  addProofGrid();
  enhanceFooter();
}

let scheduled = false;
const observer = new MutationObserver(() => {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => { scheduled = false; enhance(); });
});
observer.observe(app, { childList: true, subtree: true });
enhance();

window.addEventListener("pageshow", enhance);
window.__GONZO_HEALTH_BRAND__ = Object.freeze({ version: BRAND_VERSION, ready: true });
