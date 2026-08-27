#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { webkit } from 'playwright';

const BASE_URL = new URL((process.env.GH_BASE_URL || 'https://127.0.0.1:4173/').replace(/\/?$/, '/'));
const SITE_DIR = path.resolve(process.env.GH_SITE_DIR || 'gonzo-health-spatial-cognition');
const OUTPUT_DIR = path.resolve(process.env.GH_OUTPUT_DIR || 'evaluation-output/gonzo-health-ux-v2');
const EXPECTED_EXPERIENCE = 'gonzo-health-experience/2.3.0';
const checks = [];
const errors = { console: [], page: [], http: [], failed: [], csp: [] };
const screenshots = [];
let fatalError = null;

function add(id, domain, points, passed, detail, critical = false) {
  checks.push({ id, domain, points, earned: passed ? points : 0, passed: Boolean(passed), critical, detail: String(detail) });
}
function equalJSON(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
async function readText(file) { return fs.readFile(path.join(SITE_DIR, file), 'utf8'); }
async function ensureOutput() { await fs.mkdir(path.join(OUTPUT_DIR, 'screenshots'), { recursive: true }); }
async function capture(page, name) {
  const file = path.join(OUTPUT_DIR, 'screenshots', name);
  await page.screenshot({ path: file, fullPage: true });
  screenshots.push(file);
}
async function isVisible(locator) {
  return (await locator.count()) > 0 && await locator.first().isVisible();
}
function collectErrors(page, label, offline) {
  page.on('console', message => {
    if (['error', 'assert'].includes(message.type())) errors.console.push(`${label}: ${message.text()}`);
  });
  page.on('pageerror', error => errors.page.push(`${label}: ${error.message}`));
  page.on('response', response => {
    if (!offline.value && response.status() >= 400) errors.http.push(`${label}: ${response.status()} ${response.url()}`);
  });
  page.on('requestfailed', request => {
    if (!offline.value) errors.failed.push(`${label}: ${request.method()} ${request.url()} ${request.failure()?.errorText || ''}`);
  });
}
async function waitForApp(page) {
  await page.waitForSelector('#app:not([hidden])', { timeout: 35_000 });
  await page.waitForFunction(expected => window.__GONZO_HEALTH_EXPERIENCE__?.version === expected, EXPECTED_EXPERIENCE, { timeout: 20_000 });
}
async function visibleSizes(page, selector) {
  return page.locator(selector).evaluateAll(nodes => nodes.filter(node => {
    const style = getComputedStyle(node);
    return style.display !== 'none' && style.visibility !== 'hidden' && node.getClientRects().length > 0;
  }).map(node => {
    const rect = node.getBoundingClientRect();
    return { width: rect.width, height: rect.height, label: node.getAttribute('aria-label') || node.textContent?.trim() || '' };
  }));
}
function buttonByName(page, pattern) { return page.getByRole('button', { name: pattern }).first(); }
async function activateWithKeyboard(page, locator) {
  await locator.waitFor({ state: 'visible', timeout: 15_000 });
  await locator.focus();
  await page.keyboard.press('Enter');
}
async function installCSPCollector(page) {
  await page.addInitScript(() => {
    window.__ghCsp = [];
    document.addEventListener('securitypolicyviolation', event => {
      window.__ghCsp.push(`${event.violatedDirective}:${event.blockedURI}`);
    });
  });
}

await ensureOutput();
const requiredFiles = [
  'index.html', 'boot.mjs', 'brand-refresh.mjs', 'brand-refresh.css', 'light-theme.css',
  'experience-v2.mjs', 'experience-v2.css', 'manifest.webmanifest', 'service-worker.js',
  'healthcheck.json', 'privacy.html', 'support.html'
];
const files = Object.fromEntries(await Promise.all(requiredFiles.map(async file => [file, await readText(file)])));
const health = JSON.parse(files['healthcheck.json']);
const manifest = JSON.parse(files['manifest.webmanifest']);
const publicSource = Object.values(files).join('\n');
const payloadCount = new Set(files['service-worker.js'].match(/payload\/g\d{2}\/\d{3}\.txt/g) || []).size;

add('contract.responses-anchors', 'exam', 10,
  equalJSON(health.batteryResponseCounts, [36, 132, 252]) && health.sharedAnchors === 12,
  'The release contract retains 36/132/252 responses and 12 shared anchors.', true);
add('contract.presentation-only', 'exam', 5,
  /MutationObserver/.test(files['experience-v2.mjs']) &&
  !/(scoreSession|generateBattery|ScoringEngine|evaluateAdaptiveWindow|measurementModelVersion\s*=|validity\s*=)/.test(files['experience-v2.mjs']),
  'The experience module decorates rendered UI without importing scoring, battery generation, validity, or adaptation.', true);
add('pwa.assets', 'pwa', 5,
  payloadCount === 48 && ['experience-v2.mjs', 'experience-v2.css', 'index.html', 'offline.html'].every(item => files['service-worker.js'].includes(item)),
  `The service worker caches ${payloadCount}/48 payload chunks and the expanded app shell.`, true);
const forbidden = /(OPENAI_API_KEY|sk-proj-|sk-[A-Za-z0-9_-]{32,}|googletagmanager|google-analytics|mixpanel|amplitude\.com|segment\.com|facebook\.net\/en_US\/fbevents)/i;
add('privacy.boundary', 'privacy', 5,
  !forbidden.test(publicSource) && /private-by-default|local by default|local-first/i.test(publicSource) && /not a diagnosis|non-diagnostic|not a diagnostic/i.test(publicSource),
  'No provider secret or tracker marker is present; local-first and non-diagnostic boundaries remain visible.', true);

let browser;
try {
  browser = await webkit.launch({ headless: true });

  const viewportResults = [];
  for (const spec of [
    { name: 'phone', viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference' },
    { name: 'tablet', viewport: { width: 768, height: 1024 }, reducedMotion: 'reduce' },
    { name: 'desktop', viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' }
  ]) {
    const context = await browser.newContext({ viewport: spec.viewport, reducedMotion: spec.reducedMotion, serviceWorkers: 'allow' });
    const page = await context.newPage();
    const offline = { value: false };
    collectErrors(page, spec.name, offline);
    await installCSPCollector(page);
    const response = await page.goto(BASE_URL.href, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await waitForApp(page);
    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      theme: document.documentElement.dataset.theme,
      generations: document.querySelectorAll('[data-generation]').length,
      batteries: document.querySelectorAll('[data-battery]').length,
      examMeta: document.querySelectorAll('.gh-exam-meta').length,
      readiness: Boolean(document.querySelector('.gh-readiness')),
      skipLink: Boolean(document.querySelector('.gh-skip')),
      experience: window.__GONZO_HEALTH_EXPERIENCE__?.version,
      reduced: matchMedia('(prefers-reduced-motion: reduce)').matches
    }));
    const targets = await visibleSizes(page, '[data-generation],[data-battery],[data-action="start"],[data-action="demo"],.gh-theme-toggle');
    const targetPass = targets.length >= 8 && targets.every(target => target.width >= 42 && target.height >= 42);
    await capture(page, `${spec.name}-lobby.png`);

    await page.evaluate(() => { document.documentElement.dataset.contrast = 'high'; });
    const highContrast = await page.locator('.glass,.topbar').first().evaluate(element => {
      const style = getComputedStyle(element);
      return { background: style.backgroundColor, backdrop: style.backdropFilter || style.webkitBackdropFilter || 'none' };
    });
    const contrastPass = /rgb\(0, 0, 0\)|rgba\(0, 0, 0, 1\)/.test(highContrast.background) && highContrast.backdrop === 'none';

    await page.evaluate(() => {
      document.documentElement.dataset.contrast = 'normal';
      document.documentElement.style.fontSize = '200%';
    });
    const zoom = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      primaryVisible: [...document.querySelectorAll('button')].some(button => /start daily|begin 180-second|18-second demo/i.test(button.textContent || '') && button.getClientRects().length)
    }));
    const csp = await page.evaluate(() => window.__ghCsp || []);
    errors.csp.push(...csp.map(item => `${spec.name}: ${item}`));
    viewportResults.push({ spec, responseOK: response?.ok(), metrics, targets, targetPass, contrastPass, zoomPass: zoom.primaryVisible && zoom.scrollWidth <= zoom.clientWidth + 32, highContrast });
    await context.close();
  }

  add('exam.clarity-runtime', 'exam', 10,
    viewportResults.every(result => result.responseOK && result.metrics.experience === EXPECTED_EXPERIENCE && result.metrics.generations === 7 && result.metrics.batteries === 3 && result.metrics.examMeta >= 3 && result.metrics.readiness),
    'Phone, tablet, and desktop expose seven generation packs, three annotated batteries, and readiness guidance.', true);
  add('access.targets-responsive', 'accessibility', 10,
    viewportResults.every(result => result.targetPass && result.metrics.scrollWidth <= result.metrics.clientWidth + 32 && result.zoomPass),
    'Primary controls meet the touch-target tolerance and layouts avoid material clipping at normal and 200% text.', true);
  add('access.contrast-motion', 'accessibility', 10,
    viewportResults.every(result => result.contrastPass) && viewportResults.find(result => result.spec.name === 'tablet')?.metrics.reduced === true,
    'High-contrast glass is opaque and the reduced-motion preference is honored.', true);

  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'allow' });
  const page = await context.newPage();
  const offline = { value: false };
  collectErrors(page, 'flow', offline);
  await installCSPCollector(page);
  await page.goto(BASE_URL.href, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await waitForApp(page);

  const defaultLight = await page.evaluate(() => document.documentElement.dataset.theme === 'light');
  const themeToggle = page.locator('[data-gh-theme-toggle]').first();
  await activateWithKeyboard(page, themeToggle);
  const darkApplied = await page.evaluate(() => document.documentElement.dataset.theme === 'dark' && localStorage.getItem('gonzo-health-theme') === 'dark');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForApp(page);
  const darkPersisted = await page.evaluate(() => document.documentElement.dataset.theme === 'dark');
  await page.evaluate(() => localStorage.removeItem('gonzo-health-theme'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForApp(page);
  add('pwa.theme', 'pwa', 5, defaultLight && darkApplied && darkPersisted,
    'Light is the first-run default and the keyboard-operated appearance preference persists.');

  const generation = page.locator('[data-generation="genx"]').first();
  const daily = page.locator('[data-battery="daily"]').first();
  await activateWithKeyboard(page, generation);
  await activateWithKeyboard(page, daily);
  const demo = buttonByName(page, /run 18-second demo|watch walkthrough|18-second|\bdemo\b/i);
  await activateWithKeyboard(page, demo);

  const checkbox = page.locator('#agree,input[type="checkbox"]').first();
  if (await checkbox.count()) {
    await checkbox.waitFor({ state: 'visible', timeout: 10_000 });
    if (!(await checkbox.isChecked())) await checkbox.check();
    const continueButton = buttonByName(page, /continue|begin|start assessment/i);
    if (await continueButton.count()) await activateWithKeyboard(page, continueButton);
  }

  await page.waitForSelector('.test-layout,.stage,.test-stage', { timeout: 20_000 });
  const sessionGuide = await isVisible(page.locator('.gh-session-guide'));
  const stopVisible = await isVisible(page.locator('[data-action="stop"],button[title*="Stop" i]'));
  const pauseVisible = await isVisible(page.locator('[data-action="pause"],button[title*="Pause" i]'));
  const responseTargets = await visibleSizes(page, '.controls button,.response button,.choices button,.responses button');
  const responsePass = responseTargets.length > 0 && responseTargets.every(target => target.width >= 42 && target.height >= 42);
  await capture(page, 'desktop-assessment.png');
  add('exam.keyboard-flow', 'functionality', 15,
    sessionGuide && stopVisible && pauseVisible && responsePass,
    'A keyboard-only path reaches the assessment with guidance, pause/stop controls, and usable response targets.', true);

  await page.waitForFunction(() => /results|performance profile|validity/i.test(document.querySelector('#app')?.textContent || ''), null, { timeout: 75_000 });
  await page.waitForSelector('.gh-report-explainer', { timeout: 10_000 });
  const report = await page.evaluate(() => ({
    explainer: Boolean(document.querySelector('.gh-report-explainer')),
    nextActions: Boolean(document.querySelector('.gh-next-actions')),
    text: (document.querySelector('.gh-report-explainer')?.textContent || '').toLowerCase(),
    repeat: Boolean(document.querySelector('[data-gh-repeat]')),
    history: Boolean(document.querySelector('[data-gh-history]')),
    export: Boolean(document.querySelector('[data-gh-export]'))
  }));
  await capture(page, 'desktop-results.png');
  add('report.validity-first', 'reporting', 10,
    report.explainer && /snapshot/.test(report.text) && /not a diagnosis/.test(report.text),
    'Results explain uncertainty and the non-diagnostic boundary before encouraging interpretation.', true);
  add('report.next-actions', 'reporting', 5,
    report.nextActions && report.repeat && report.history && report.export,
    'Results expose comparable repeat, trend review, and evidence-export actions.');

  await page.goto(BASE_URL.href, { waitUntil: 'domcontentloaded' });
  await waitForApp(page);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller), null, { timeout: 25_000 }).catch(async () => {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitForApp(page);
    await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller), null, { timeout: 15_000 });
  });
  offline.value = true;
  await context.setOffline(true);
  let offlinePass = false;
  try {
    await page.goto(new URL('?battery=daily&uxAudit=offline', BASE_URL).href, { waitUntil: 'domcontentloaded', timeout: 20_000 });
    await page.waitForSelector('#app:not([hidden])', { timeout: 15_000 });
    offlinePass = true;
  } catch {
    offlinePass = false;
  } finally {
    await context.setOffline(false);
    offline.value = false;
  }
  add('pwa.offline', 'pwa', 5, offlinePass,
    'The cached app shell opens a previously uncached battery deep link while offline.', true);

  const flowCSP = await page.evaluate(() => window.__ghCsp || []).catch(() => []);
  errors.csp.push(...flowCSP.map(item => `flow: ${item}`));
  await context.close();
} catch (error) {
  fatalError = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  add('evaluation.execution', 'quality', 0, false, fatalError, true);
} finally {
  if (browser) await browser.close();
}

const criticalErrors = [...errors.console, ...errors.page, ...errors.http, ...errors.failed, ...errors.csp];
add('quality.browser-errors', 'quality', 5,
  criticalErrors.length === 0,
  criticalErrors.length ? criticalErrors.join(' | ') : 'No console, page, HTTP, request, or CSP errors occurred in critical online flows.', true);

const total = checks.reduce((sum, check) => sum + check.points, 0);
const earned = checks.reduce((sum, check) => sum + check.earned, 0);
const criticalFailures = checks.filter(check => check.critical && !check.passed);
const score = total ? Math.round((earned / total) * 100) : 0;
const passed = score >= 90 && criticalFailures.length === 0 && !fatalError;
const reportData = {
  schema: 'gonzo-health-ux-evaluation/2.1',
  url: BASE_URL.href,
  experience: EXPECTED_EXPERIENCE,
  score,
  passed,
  totalPoints: total,
  earnedPoints: earned,
  fatalError,
  criticalFailures,
  checks,
  errors,
  screenshots,
  generatedAt: new Date().toISOString()
};
await fs.writeFile(path.join(OUTPUT_DIR, 'report.json'), JSON.stringify(reportData, null, 2));
const lines = [
  '# Gonzo | Health UX Evaluation v2', '',
  `**Score: ${score}/100 — ${passed ? 'PASS' : 'FAIL'}**`, '',
  `Critical failures: **${criticalFailures.length}**`, '',
  '| Check | Domain | Score | Critical | Result |',
  '|---|---|---:|:---:|:---:|',
  ...checks.map(check => `| ${check.id} | ${check.domain} | ${check.earned}/${check.points} | ${check.critical ? 'Yes' : 'No'} | ${check.passed ? 'PASS' : 'FAIL'} |`),
  '', '## Details',
  ...checks.map(check => `- **${check.id}:** ${check.detail}`),
  '', '## Browser errors', '',
  criticalErrors.length ? criticalErrors.map(item => `- ${item}`).join('\n') : 'None.',
  ...(fatalError ? ['', '## Fatal evaluator error', '', fatalError] : [])
];
await fs.writeFile(path.join(OUTPUT_DIR, 'report.md'), lines.join('\n'));
console.log(lines.join('\n'));
if (!passed) process.exit(1);
