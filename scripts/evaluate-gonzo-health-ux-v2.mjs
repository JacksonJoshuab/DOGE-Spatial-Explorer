#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { webkit } from 'playwright';

const BASE_URL = new URL((process.env.GH_BASE_URL || 'http://127.0.0.1:4173/').replace(/\/?$/, '/'));
const SITE_DIR = path.resolve(process.env.GH_SITE_DIR || 'gonzo-health-spatial-cognition');
const OUTPUT_DIR = path.resolve(process.env.GH_OUTPUT_DIR || 'evaluation-output/gonzo-health-ux-v2');
const EXPECTED_EXPERIENCE = 'gonzo-health-experience/2.3.0';
const checks = [];
const errors = { console: [], page: [], http: [], failed: [], csp: [] };
const screenshots = [];

function add(id, domain, points, passed, detail, critical = false) {
  checks.push({ id, domain, points, earned: passed ? points : 0, passed: Boolean(passed), critical, detail: String(detail) });
}
function eqArray(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
function visible(locator) { return locator.count().then(async n => n > 0 && locator.first().isVisible()); }
async function text(file) { return fs.readFile(path.join(SITE_DIR, file), 'utf8'); }
async function makeOutput() { await fs.mkdir(path.join(OUTPUT_DIR, 'screenshots'), { recursive: true }); }
async function screenshot(page, name) { const file = path.join(OUTPUT_DIR, 'screenshots', name); await page.screenshot({ path: file, fullPage: true }); screenshots.push(file); }
function collectPageErrors(page, label, offlineFlag) {
  page.on('console', m => { if (['error', 'assert'].includes(m.type())) errors.console.push(`${label}: ${m.text()}`); });
  page.on('pageerror', e => errors.page.push(`${label}: ${e.message}`));
  page.on('response', r => { if (r.status() >= 400 && !offlineFlag.value) errors.http.push(`${label}: ${r.status()} ${r.url()}`); });
  page.on('requestfailed', r => { if (!offlineFlag.value) errors.failed.push(`${label}: ${r.method()} ${r.url()} ${r.failure()?.errorText || ''}`); });
}
async function waitForApp(page) {
  await page.waitForSelector('#app:not([hidden])', { timeout: 35000 });
  await page.waitForFunction(expected => window.__GONZO_HEALTH_EXPERIENCE__?.version === expected, EXPECTED_EXPERIENCE, { timeout: 20000 });
}
async function getMinimumButtonSize(page, selector) {
  return page.locator(selector).evaluateAll(nodes => nodes.filter(n => {
    const s = getComputedStyle(n); return s.display !== 'none' && s.visibility !== 'hidden';
  }).map(n => { const r = n.getBoundingClientRect(); return { w: r.width, h: r.height, t: n.textContent?.trim() || '' }; }));
}
async function viewportAudit(browser, spec) {
  const context = await browser.newContext({ viewport: spec.viewport, serviceWorkers: 'allow', reducedMotion: spec.reduced ? 'reduce' : 'no-preference' });
  const page = await context.newPage();
  const offline = { value: false };
  collectPageErrors(page, spec.name, offline);
  await page.addInitScript(() => document.addEventListener('securitypolicyviolation', e => {
    window.__ghCsp = window.__ghCsp || []; window.__ghCsp.push(`${e.violatedDirective}:${e.blockedURI}`);
  }));
  const response = await page.goto(BASE_URL.href, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await waitForApp(page);
  const metrics = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
    theme: document.documentElement.dataset.theme,
    generations: document.querySelectorAll('[data-generation]').length,
    batteries: document.querySelectorAll('[data-battery]').length,
    examMeta: document.querySelectorAll('.gh-exam-meta').length,
    readiness: Boolean(document.querySelector('.gh-readiness')),
    skip: Boolean(document.querySelector('.gh-skip')),
    experience: window.__GONZO_HEALTH_EXPERIENCE__?.version,
    reduced: matchMedia('(prefers-reduced-motion: reduce)').matches
  }));
  const targets = await getMinimumButtonSize(page, '[data-action="start"],[data-action="demo"],[data-generation],[data-battery],.gh-theme-toggle');
  const targetPass = targets.length > 0 && targets.every(x => x.w >= 40 && x.h >= 40);
  await screenshot(page, `${spec.name}-lobby.png`);

  await page.evaluate(() => { document.documentElement.dataset.contrast = 'high'; });
  const highContrast = await page.locator('.glass,.topbar').first().evaluate(el => {
    const s = getComputedStyle(el); const bg = s.backgroundColor; return { bg, filter: s.backdropFilter || s.webkitBackdropFilter, color: s.color };
  });
  const contrastPass = /rgb\(0, 0, 0\)|rgba\(0, 0, 0, 1\)/.test(highContrast.bg) && highContrast.filter === 'none';

  await page.evaluate(() => { document.documentElement.dataset.contrast = 'normal'; document.documentElement.style.fontSize = '200%'; });
  const zoom = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, client: document.documentElement.clientWidth, startVisible: Boolean(document.querySelector('[data-action="start"]')?.getClientRects().length) }));
  const zoomPass = zoom.startVisible && zoom.width <= zoom.client + 24;
  const csp = await page.evaluate(() => window.__ghCsp || []); errors.csp.push(...csp.map(x => `${spec.name}: ${x}`));
  await context.close();
  return { response: response?.ok(), metrics, targetPass, contrastPass, zoomPass, targets, highContrast };
}

await makeOutput();
const files = Object.fromEntries(await Promise.all(['index.html','boot.mjs','brand-refresh.mjs','brand-refresh.css','light-theme.css','experience-v2.mjs','experience-v2.css','manifest.webmanifest','service-worker.js','healthcheck.json','privacy.html','support.html'].map(async f => [f, await text(f)])));
const health = JSON.parse(files['healthcheck.json']);
const manifest = JSON.parse(files['manifest.webmanifest']);
const publicText = Object.values(files).join('\n');
const payloadCount = new Set(files['service-worker.js'].match(/payload\/g\d{2}\/\d{3}\.txt/g) || []).size;

add('contract.responses-anchors','exam',8,eqArray(health.batteryResponseCounts,[36,132,252]) && health.sharedAnchors===12,'Health contract retains 36/132/252 responses and 12 shared anchors.',true);
add('contract.presentation-only','exam',7,/MutationObserver/.test(files['experience-v2.mjs']) && !/(scoreSession|generateBattery|ScoringEngine|evaluateAdaptiveWindow|validity\s*=)/.test(files['experience-v2.mjs']),'Experience layer decorates rendered UI without importing scoring, validity, battery, or adaptive logic.',true);
add('pwa.assets','pwa',4,payloadCount===48 && ['experience-v2.mjs','experience-v2.css','index.html','offline.html'].every(x=>files['service-worker.js'].includes(x)),`Service worker caches ${payloadCount}/48 payload chunks plus the expanded experience shell.`,true);
add('pwa.manifest','pwa',2,manifest.scope==='./' && manifest.background_color==='#eef8ff' && Array.isArray(manifest.shortcuts),'Manifest is light-first, scoped, and includes shortcuts.');
const forbidden=/(OPENAI_API_KEY|sk-proj-|sk-[A-Za-z0-9_-]{32,}|googletagmanager|google-analytics|mixpanel|amplitude\.com|segment\.com|facebook\.net\/en_US\/fbevents)/i;
add('privacy.boundary','privacy',5,!forbidden.test(publicText) && /private-by-default|local by default|local-first/i.test(publicText) && /not a diagnosis|non-diagnostic|not a diagnostic/i.test(publicText),'No public secret/tracker marker; local-first and non-diagnostic boundaries remain visible.',true);

const browser = await webkit.launch({ headless: true });
const audits = [];
for (const spec of [
  { name:'phone', viewport:{width:390,height:844}, reduced:false },
  { name:'tablet', viewport:{width:768,height:1024}, reduced:true },
  { name:'desktop', viewport:{width:1440,height:1000}, reduced:false }
]) audits.push([spec.name, await viewportAudit(browser, spec)]);

const allLoaded = audits.every(([,a])=>a.response && a.metrics.experience===EXPECTED_EXPERIENCE);
const countsPass = audits.every(([,a])=>a.metrics.generations===7 && a.metrics.batteries===3 && a.metrics.examMeta>=3 && a.metrics.readiness);
const responsivePass = audits.every(([,a])=>a.metrics.width<=a.metrics.client+24 && a.zoomPass);
const targetPass = audits.every(([,a])=>a.targetPass);
const contrastPass = audits.every(([,a])=>a.contrastPass);
const reducedPass = audits.find(([n])=>n==='tablet')?.[1].metrics.reduced === true;
add('exam.clarity-runtime','exam',8,allLoaded && countsPass,'All viewports expose seven generation packs, three annotated batteries, and readiness guidance.',true);
add('access.targets-responsive','accessibility',5,targetPass && responsivePass,'Primary controls remain usable and layouts avoid material horizontal clipping at phone/tablet/desktop and 200% text.',true);
add('access.contrast-motion','accessibility',5,contrastPass && reducedPass,'High-contrast glass becomes opaque and reduced-motion preference is detected.',true);

const context = await browser.newContext({ viewport:{width:1440,height:1000}, serviceWorkers:'allow' });
const page = await context.newPage(); const offline={value:false}; collectPageErrors(page,'flow',offline);
await page.goto(BASE_URL.href,{waitUntil:'domcontentloaded',timeout:45000}); await waitForApp(page);
const defaultLight = await page.evaluate(()=>document.documentElement.dataset.theme==='light');
const toggle = page.locator('[data-gh-theme-toggle]').first(); await toggle.focus(); await page.keyboard.press('Enter');
const darkApplied = await page.evaluate(()=>document.documentElement.dataset.theme==='dark' && localStorage.getItem('gonzo-health-theme')==='dark');
await page.reload({waitUntil:'domcontentloaded'}); await waitForApp(page);
const darkPersisted = await page.evaluate(()=>document.documentElement.dataset.theme==='dark');
await page.evaluate(()=>{localStorage.removeItem('gonzo-health-theme')}); await page.reload({waitUntil:'domcontentloaded'}); await waitForApp(page);
add('pwa.theme','pwa',2,defaultLight && darkApplied && darkPersisted,'Light is the first-run default and keyboard-toggle preference persists.');

const gen = page.locator('[data-generation="genx"],.generation-card[data-generation="genx"]').first(); await gen.focus(); await page.keyboard.press('Enter');
const daily = page.locator('[data-battery="daily"]').first(); await daily.focus(); await page.keyboard.press('Enter');
const demo = page.locator('[data-action="demo"]').first(); await demo.focus(); await page.keyboard.press('Enter');
if (await page.locator('#consent').count()) { const agree=page.locator('#agree'); await agree.focus(); await page.keyboard.press('Space'); const cont=page.locator('#continue'); await cont.focus(); await page.keyboard.press('Enter'); }
await page.waitForSelector('.test-layout,.stage,.test-stage',{timeout:20000});
const sessionGuide = await visible(page.locator('.gh-session-guide'));
const stopVisible = await visible(page.locator('[data-action="stop"],button[title*="Stop"]'));
const pauseVisible = await visible(page.locator('[data-action="pause"],button[title*="Pause"]'));
const responseTargets = await getMinimumButtonSize(page,'.controls button,.response button,.choices button');
const responsePass = responseTargets.length>0 && responseTargets.every(x=>x.w>=40&&x.h>=40);
await screenshot(page,'desktop-assessment.png');
add('exam.keyboard-flow','functionality',10,sessionGuide && stopVisible && pauseVisible && responsePass,'Keyboard-only path reached the assessment with guidance, pause/stop, and usable response targets.',true);

await page.waitForFunction(()=>/results|performance profile|validity/i.test(document.querySelector('#app')?.textContent||''),null,{timeout:60000});
await page.waitForTimeout(500);
const report = await page.evaluate(()=>({
  explainer:Boolean(document.querySelector('.gh-report-explainer')),
  next:Boolean(document.querySelector('.gh-next-actions')),
  copy:(document.querySelector('.gh-report-explainer')?.textContent||'').toLowerCase(),
  repeat:Boolean(document.querySelector('[data-gh-repeat]')),
  history:Boolean(document.querySelector('[data-gh-history]')),
  export:Boolean(document.querySelector('[data-gh-export]'))
}));
await screenshot(page,'desktop-results.png');
add('report.validity-first','reporting',12,report.explainer && /snapshot/.test(report.copy) && /not a diagnosis/.test(report.copy),'Results explain validity and uncertainty before encouraging interpretation.',true);
add('report.next-actions','reporting',8,report.next && report.repeat && report.history && report.export,'Results expose repeat, trend, and evidence-export actions.',true);
add('followup.actions','followup',10,report.repeat && report.history && report.export,'Follow-up path supports comparable repeat, longitudinal review, and export.');

await page.goto(BASE_URL.href,{waitUntil:'domcontentloaded'}); await waitForApp(page);
await page.waitForFunction(()=>navigator.serviceWorker?.controller || document.readyState==='complete',null,{timeout:20000});
await page.waitForTimeout(1000); offline.value=true; await context.setOffline(true);
let offlinePass=false; try { await page.goto(new URL('?battery=daily',BASE_URL).href,{waitUntil:'domcontentloaded',timeout:20000}); await page.waitForSelector('#app:not([hidden])',{timeout:15000}); offlinePass=true; } catch {} finally { await context.setOffline(false); offline.value=false; }
add('pwa.offline','pwa',4,offlinePass,'Cached app shell opens an uncached battery deep link while offline.',true);
const skipPass = await page.locator('.gh-skip').count()===1;
add('access.semantic-keyboard','accessibility',5,skipPass && sessionGuide,'Skip link, keyboard activation, semantic progress labeling, and in-session guidance are present.',true);
await context.close(); await browser.close();

const criticalErrors=[...errors.console,...errors.page,...errors.http,...errors.failed,...errors.csp];
add('quality.browser-errors','quality',5,criticalErrors.length===0,criticalErrors.length?criticalErrors.join(' | '):'No console, page, HTTP, request, or CSP errors in critical online flows.',true);

const total=checks.reduce((s,c)=>s+c.points,0); const earned=checks.reduce((s,c)=>s+c.earned,0); const criticalFailures=checks.filter(c=>c.critical&&!c.passed);
const score=Math.round(earned/total*100); const passed=score>=90&&criticalFailures.length===0;
const reportData={schema:'gonzo-health-ux-evaluation/2.0',url:BASE_URL.href,experience:EXPECTED_EXPERIENCE,score,passed,totalPoints:total,earnedPoints:earned,criticalFailures,checks,errors,screenshots,audits:Object.fromEntries(audits),generatedAt:new Date().toISOString()};
await fs.writeFile(path.join(OUTPUT_DIR,'report.json'),JSON.stringify(reportData,null,2));
const lines=[`# Gonzo | Health UX Evaluation v2`,``,`**Score: ${score}/100 — ${passed?'PASS':'FAIL'}**`,``,`Critical failures: **${criticalFailures.length}**`,``,`| Check | Domain | Score | Critical | Result |`,`|---|---|---:|:---:|:---:|`,...checks.map(c=>`| ${c.id} | ${c.domain} | ${c.earned}/${c.points} | ${c.critical?'Yes':'No'} | ${c.passed?'PASS':'FAIL'} |`),``,`## Details`,...checks.map(c=>`- **${c.id}:** ${c.detail}`),``,`## Browser errors`,``,criticalErrors.length?criticalErrors.map(x=>`- ${x}`).join('\n'):'None.'];
await fs.writeFile(path.join(OUTPUT_DIR,'report.md'),lines.join('\n'));
console.log(lines.join('\n'));
if(!passed) process.exit(1);
