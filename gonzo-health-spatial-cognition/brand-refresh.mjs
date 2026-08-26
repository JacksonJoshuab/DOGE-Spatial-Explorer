const BRAND_VERSION = "gonzo-health-webkit-brand/1.1.1";
const app = document.querySelector("#app");
const THEME_KEY = "gonzo-health-theme";
document.documentElement.dataset.gonzoBrand = BRAND_VERSION;

const icons = {
  focus:'<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="11" fill="none" stroke-width="2.6"/><circle cx="16" cy="16" r="5" fill="none" stroke-width="2.6"/><path d="M16 2v5M16 25v5M2 16h5M25 16h5" fill="none" stroke-width="2.6" stroke-linecap="round"/></svg>',
  memory:'<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M12 5c-4 0-7 3-7 7 0 2 1 4 3 5-1 5 2 9 7 9h2V8c-1-2-3-3-5-3zM20 5c4 0 7 3 7 7 0 2-1 4-3 5 1 5-2 9-7 9h-2V8c1-2 3-3 5-3z" fill="none" stroke-width="2.2" stroke-linejoin="round"/></svg>',
  speed:'<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M18 2 7 18h8l-1 12 11-17h-8z" fill="none" stroke-width="2.5" stroke-linejoin="round"/></svg>',
  calm:'<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M27 5C16 5 7 11 7 21c0 4 3 7 7 7 10 0 15-10 13-23z" fill="none" stroke-width="2.4"/></svg>',
  progress:'<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="4" y="5" width="24" height="22" rx="4" fill="none" stroke-width="2.2"/><polyline points="8,21 13,16 17,19 24,11" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  privacy:'<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3 27 7v8c0 7-4 12-11 14C9 27 5 22 5 15V7z" fill="none" stroke-width="2.3"/></svg>'
};
const capabilities=[["focus","Focus"],["memory","Memory"],["speed","Speed"],["calm","Calm"],["progress","Progress"],["privacy","Privacy"]];

function initialTheme(){try{return localStorage.getItem(THEME_KEY)==="dark"?"dark":"light"}catch{return"light"}}
function applyTheme(theme,persist=true){
  const value=theme==="dark"?"dark":"light";
  document.documentElement.dataset.theme=value;
  document.documentElement.style.colorScheme=value;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content",value==="dark"?"#030816":"#eef8ff");
  if(persist){try{localStorage.setItem(THEME_KEY,value)}catch{}}
  document.querySelectorAll("[data-gh-theme-toggle]").forEach(button=>{
    button.setAttribute("aria-pressed",String(value==="dark"));
    button.setAttribute("aria-label",value==="dark"?"Use light appearance":"Use dark appearance");
    button.title=value==="dark"?"Use light appearance":"Use dark appearance";
    button.textContent=value==="dark"?"☀︎":"◐";
  });
}
applyTheme(initialTheme(),false);

function brandNodes(){return app?.querySelectorAll(".brand, .brand-lockup")||[]}
function heroNode(){return app?.querySelector(".hero, .hero-stage")}
function generationNodes(){return app?.querySelectorAll(".generation[data-generation], .generation-card[data-generation]")||[]}
function bridgeNode(){return app?.querySelector(".bridge, .anchor-bridge, .anchor-panel")}

function addBrandMark(){
  brandNodes().forEach(brand=>{
    if(!brand.querySelector(".gh-brand-mark")){const img=document.createElement("img");img.className="gh-brand-mark";img.src="./brand-icon.svg";img.alt="Gonzo Health";brand.prepend(img)}
  });
  if(!app?.querySelector("[data-gh-theme-toggle]")){
    const host=app?.querySelector(".topbar, .testbar, header");
    if(host){const button=document.createElement("button");button.type="button";button.className="gh-theme-toggle";button.dataset.ghThemeToggle="";button.addEventListener("click",()=>applyTheme(document.documentElement.dataset.theme==="dark"?"light":"dark"));host.append(button)}
  }
  applyTheme(document.documentElement.dataset.theme,false);
}
function enhanceHero(){
  const hero=heroNode();if(!hero||hero.dataset.ghEnhanced===BRAND_VERSION)return;hero.dataset.ghEnhanced=BRAND_VERSION;hero.classList.add("brand-hero");
  const copy=hero.querySelector(".hero-copy, .hero-content")||hero.firstElementChild||hero;
  const eyebrow=copy.querySelector(".eyebrow"),heading=copy.querySelector("h1"),paragraph=copy.querySelector("p");
  if(eyebrow)eyebrow.textContent="180-second interactive cognitive wellness prototype";
  if(heading){heading.classList.add("gh-headline");heading.innerHTML='<span>Focus.</span><span>Remember.</span><span class="gh-gradient">Thrive.</span>'}
  if(paragraph)paragraph.textContent="A quick, private-by-default way to explore focus, memory, response control, and cognitive flexibility across every generation.";
  if(!copy.querySelector(".gh-capabilities")){const strip=document.createElement("div");strip.className="gh-capabilities";strip.innerHTML=capabilities.map(([key,label])=>`<span class="gh-capability">${icons[key]}<b>${label}</b></span>`).join("");copy.append(strip)}
  const preview=hero.querySelector(".preview, .hero-visual, .hero-media");
  if(preview&&!preview.querySelector(".gh-hero-media")){preview.innerHTML='<img class="gh-hero-media" src="./brand-hero.svg" alt="Original luminous neural portrait representing spatial cognition"><div class="gh-measure-chip"><i>⌁</i><span><strong>Measure what matters.</strong><small>Focus · Memory · Cognitive wellness</small></span></div>'}
}
function enhanceGenerations(){generationNodes().forEach(card=>{card.classList.add("generation");if(!card.querySelector(".gh-generation-media")){const media=document.createElement("div");media.className="gh-generation-media";media.setAttribute("aria-hidden","true");card.prepend(media)}})}
function enhanceBatteries(){app?.querySelectorAll(".battery[data-battery], .battery-card[data-battery]").forEach(card=>{if(card.querySelector(".gh-battery-badge"))return;const badge=document.createElement("span");badge.className="gh-battery-badge";badge.textContent=card.dataset.battery==="daily"?"Everyday":card.dataset.battery==="standard"?"Deeper":"Research";card.prepend(badge)})}
function addProofGrid(){
  const bridge=bridgeNode();if(!bridge||app.querySelector(".gh-proof-grid"))return;
  const section=document.createElement("section");section.className="gh-proof-grid";section.innerHTML='<article class="gh-proof"><span class="eyebrow">Results that matter</span><h3>Your performance profile</h3><div class="gh-score"><strong>742</strong><span>/1000 sample score</span></div><div class="gh-meter"><i></i></div><p>Separate accuracy, reaction time, interference, flexibility, memory, and consistency—without turning one session into a diagnosis.</p></article><article class="gh-proof"><span class="eyebrow">Your privacy, protected</span><h3>Local by default</h3><ul><li>No account required for the core test</li><li>Assessment evidence stays in this browser</li><li>You control export and deletion</li></ul><p><a href="./privacy.html">Read the privacy boundary →</a></p></article><article class="gh-proof"><span class="eyebrow">Built on science</span><h3>Comparable by design</h3><p>The 3-, 15-, and 30-minute batteries share twelve invariant anchor trials while nostalgia changes only the engagement layer.</p></article>';
  bridge.insertAdjacentElement("afterend",section);
}
function addQuickActions(){
  const hero=heroNode();if(!hero||app.querySelector(".gh-quick-actions"))return;const host=hero.querySelector(".actions, .hero-actions")||hero;
  const row=document.createElement("div");row.className="gh-quick-actions";row.innerHTML='<button type="button" data-gh-history>↗ Recent results</button><button type="button" data-gh-privacy>⌾ Privacy</button><button type="button" data-gh-install>＋ Install app</button>';host.insertAdjacentElement("afterend",row);
  row.querySelector("[data-gh-history]")?.addEventListener("click",()=>app.querySelector('[data-nav="history"], [data-action="history"]')?.click());
  row.querySelector("[data-gh-privacy]")?.addEventListener("click",()=>location.href="./privacy.html");
  row.querySelector("[data-gh-install]")?.addEventListener("click",()=>alert("On iPhone or iPad: Share → Add to Home Screen."));
}
function routeStartupView(){
  if(window.__GONZO_STARTUP_ROUTE_DONE__)return;
  const params=new URLSearchParams(location.search);
  if(params.get("view")==="history"||params.get("results")==="latest"){
    const target=app?.querySelector('[data-nav="history"], [data-action="history"]');
    if(target){window.__GONZO_STARTUP_ROUTE_DONE__=true;target.click()}
  }
}
function enhance(){if(!app||app.hidden)return;addBrandMark();enhanceHero();enhanceGenerations();enhanceBatteries();addQuickActions();addProofGrid();routeStartupView()}
let scheduled=false;const observer=new MutationObserver(()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;enhance()})});observer.observe(app,{childList:true,subtree:true});enhance();window.addEventListener("pageshow",enhance);window.__GONZO_HEALTH_BRAND__=Object.freeze({version:BRAND_VERSION,ready:true,defaultTheme:"light"});
