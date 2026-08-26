#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const SCHEMA_VERSION = "gonzo-health-webkit-evaluation/1.0";
const DEFAULT_URL = "https://jacksonjoshuab.github.io/DOGE-Spatial-Explorer/gonzo-health-spatial-cognition/";
const EXPECTED_BRAND = "gonzo-health-webkit-brand/1.0.0";
const DOMAIN_WEIGHTS = Object.freeze({ brand: 25, functionality: 30, pwa: 20, privacy: 15, deployment: 10 });

function parseArgs(argv) {
  const output = { url: DEFAULT_URL, browser: "webkit", requireLive: false, siteDir: null, json: null, markdown: null, screenshots: null };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--require-live") output.requireLive = true;
    else if (token.startsWith("--")) {
      const key = token.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${token}`);
      output[key] = value;
      index += 1;
    }
  }
  output.url = new URL(output.url.endsWith("/") ? output.url : `${output.url}/`).href;
  if (output.siteDir) output.siteDir = path.resolve(output.siteDir);
  if (output.json) output.json = path.resolve(output.json);
  if (output.markdown) output.markdown = path.resolve(output.markdown);
  if (output.screenshots) output.screenshots = path.resolve(output.screenshots);
  return output;
}

const options = parseArgs(process.argv.slice(2));
const checks = [];
const browserEvidence = { consoleErrors: [], pageErrors: [], failedRequests: [], cspViolations: [], httpErrors: [] };
const screenshotPaths = [];

function check({ id, domain, critical = false, points, passed, detail }) {
  if (!(domain in DOMAIN_WEIGHTS)) throw new Error(`Unknown domain ${domain}`);
  checks.push({ id, domain, critical, pointsPossible: points, pointsEarned: passed ? points : 0, passed: Boolean(passed), detail: String(detail) });
}

async function ensureParent(filePath) {
  if (filePath) await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function loadText(relativePath) {
  if (options.siteDir) {
    return fs.readFile(path.join(options.siteDir, relativePath), "utf8");
  }
  const response = await fetch(new URL(relativePath, options.url), { redirect: "follow", cache: "no-store" });
  if (!response.ok) throw new Error(`${relativePath} returned HTTP ${response.status}`);
  return response.text();
}

async function probe(relativePath) {
  const url = new URL(relativePath, options.url);
  const started = performance.now();
  try {
    const response = await fetch(url, { redirect: "follow", cache: "no-store" });
    return { relativePath, url: url.href, ok: response.ok, status: response.status, contentType: response.headers.get("content-type"), durationMs: Math.round(performance.now() - started) };
  } catch (error) {
    return { relativePath, url: url.href, ok: false, status: 0, contentType: null, durationMs: Math.round(performance.now() - started), error: error.message };
  }
}

function occurrences(source, expression) {
  return [...source.matchAll(expression)].map((match) => match[0]);
}

function unique(values) {
  return [...new Set(values)];
}

const requiredTextAssets = [
  "index.html", "boot.mjs", "brand-refresh.mjs", "brand-refresh.css", "manifest.webmanifest",
  "service-worker.js", "healthcheck.json", "privacy.html", "support.html"
];
const requiredHttpAssets = [
  "./", "index.html", "boot.mjs", "brand-refresh.mjs", "brand-refresh.css", "manifest.webmanifest",
  "service-worker.js", "healthcheck.json", "privacy.html", "support.html", "offline.html",
  "brand-icon.svg", "brand-hero.svg", "generation-media.svg", "payload/g00/000.txt", "payload/g11/047.txt"
];

const source = {};
for (const asset of requiredTextAssets) {
  try { source[asset] = await loadText(asset); }
  catch (error) { source[asset] = ""; browserEvidence.httpErrors.push(`${asset}: ${error.message}`); }
}

let manifest = null;
let health = null;
try { manifest = JSON.parse(source["manifest.webmanifest"]); } catch {}
try { health = JSON.parse(source["healthcheck.json"]); } catch {}

const index = source["index.html"];
const brandJS = source["brand-refresh.mjs"];
const brandCSS = source["brand-refresh.css"];
const serviceWorker = source["service-worker.js"];
const allPublicText = Object.values(source).join("\n");
const payloadChunks = unique(occurrences(serviceWorker, /payload\/g\d{2}\/\d{3}\.txt/g));
const brandFilesPresent = ["brand-refresh.mjs", "brand-refresh.css"].every((file) => source[file].length > 0) && /brand-icon\.svg/.test(index) && /brand-hero\.svg/.test(brandJS) && /generation-media\.svg/.test(brandCSS);

check({
  id: "brand.static-assets",
  domain: "brand",
  critical: true,
  points: 5,
  passed: brandFilesPresent,
  detail: brandFilesPresent ? "Brand module, stylesheet, icon, hero, and generation media are referenced." : "One or more required branded assets are absent or unreferenced."
});

const manifestValid = Boolean(
  manifest && manifest.name?.includes("Gonzo | Health") && manifest.start_url && manifest.scope === "./" &&
  Array.isArray(manifest.icons) && manifest.icons.some((item) => item.src?.includes("brand-icon.svg")) &&
  Array.isArray(manifest.screenshots) && manifest.screenshots.length >= 2 &&
  Array.isArray(manifest.shortcuts) && manifest.shortcuts.length >= 3
);
check({ id: "pwa.manifest-contract", domain: "pwa", critical: true, points: 5, passed: manifestValid, detail: manifestValid ? "Branded manifest includes install metadata, icons, screenshots, and shortcuts." : "Manifest is missing required branded PWA fields." });

const swValid = payloadChunks.length === 48 && ["brand-refresh.mjs", "brand-refresh.css", "brand-icon.svg", "brand-hero.svg", "generation-media.svg", "offline.html"].every((item) => serviceWorker.includes(item));
check({ id: "pwa.service-worker-contract", domain: "pwa", critical: true, points: 5, passed: swValid, detail: `Service worker references ${payloadChunks.length}/48 payload chunks and ${swValid ? "all" : "not all"} branded offline assets.` });

const webkitMetaValid = [
  "viewport-fit=cover", "apple-mobile-web-app-capable", "black-translucent", "Content-Security-Policy", "safe-area-inset-top"
].every((marker) => index.includes(marker));
check({ id: "pwa.webkit-metadata", domain: "pwa", points: 3, passed: webkitMetaValid, detail: webkitMetaValid ? "Safe-area, standalone, status-bar, and CSP metadata are present." : "One or more WebKit metadata controls are missing." });

const forbidden = /(OPENAI_API_KEY|sk-proj-|sk-[A-Za-z0-9_-]{32,}|google-analytics|googletagmanager|mixpanel|segment\.com|amplitude\.com|facebook\.net\/en_US\/fbevents)/i;
const forbiddenMatch = allPublicText.match(forbidden);
check({ id: "privacy.no-secrets-or-trackers", domain: "privacy", critical: true, points: 5, passed: !forbiddenMatch, detail: forbiddenMatch ? `Forbidden public token/tracker marker found: ${forbiddenMatch[0]}` : "No provider key, common analytics tracker, or advertising SDK marker found in public text assets." });

const localSafetyCopy = /local-first|local by default|remains local|data remains local/i.test(allPublicText) && /not a diagnostic|non-diagnostic|not a diagnosis/i.test(allPublicText);
check({ id: "privacy.local-safety-copy", domain: "privacy", critical: true, points: 4, passed: localSafetyCopy, detail: localSafetyCopy ? "Local-first and non-diagnostic boundaries are visible." : "Required local-first or non-diagnostic copy is missing." });

const healthValid = Boolean(
  health && health.status === "ok" && health.brandVersion === EXPECTED_BRAND && health.generationPacks === 7 &&
  JSON.stringify(health.batteryResponseCounts) === JSON.stringify([36, 132, 252]) && health.sharedAnchors === 12 && health.diagnostic === false
);
check({ id: "deployment.health-contract", domain: "deployment", critical: true, points: 3, passed: healthValid, detail: healthValid ? "Health check matches the seven-pack, 36/132/252-response, twelve-anchor, non-diagnostic contract." : "Health check is missing or disagrees with the release contract." });

const presentationOnly = /MutationObserver/.test(brandJS) && !/(scoreSession|generateBattery|evaluateAdaptiveWindow|ScoringEngine|validity\s*=)/.test(brandJS);
check({ id: "brand.presentation-only", domain: "brand", points: 2, passed: presentationOnly, detail: presentationOnly ? "Brand module observes and decorates the rendered DOM without importing scoring or battery logic." : "Brand module may be coupled to assessment logic." });

const probes = await Promise.all(requiredHttpAssets.map(probe));
const failedProbes = probes.filter((item) => !item.ok);
check({ id: "deployment.asset-http", domain: "deployment", critical: true, points: 4, passed: failedProbes.length === 0, detail: failedProbes.length ? `Failed assets: ${failedProbes.map((item) => `${item.relativePath}(${item.status || item.error})`).join(", ")}` : `All ${probes.length} required app, media, policy, and payload endpoints returned successfully.` });

const policyProbes = probes.filter((item) => ["privacy.html", "support.html"].includes(item.relativePath));
check({ id: "privacy.policy-pages", domain: "privacy", points: 3, passed: policyProbes.length === 2 && policyProbes.every((item) => item.ok), detail: policyProbes.every((item) => item.ok) ? "Privacy and support pages are reachable." : "Privacy or support page is unavailable." });

if (options.requireLive) {
  const isLive = options.url.startsWith("https://") && !/localhost|127\.0\.0\.1/.test(options.url);
  if (!isLive) browserEvidence.httpErrors.push("--require-live was supplied for a non-public URL.");
}

async function loadPlaywright() {
  const require = createRequire(import.meta.url);
  const searchRoot = path.resolve("evaluation/gonzo-health-webkit");
  const resolved = require.resolve("playwright", { paths: [searchRoot, process.cwd()] });
  return import(pathToFileURL(resolved).href);
}

let browser = null;
let context = null;
let page = null;
let booted = false;
let brandReady = false;
let generationCount = 0;
let batteryCount = 0;
let generationSelectionWorked = false;
let demoStarted = false;
let assessmentControlsWorked = false;
let resultsReached = false;
let statePersisted = false;
let serviceWorkerReady = false;
let offlineWorked = false;
let brandMediaWorked = false;
let capabilityCount = 0;
let proofCount = 0;
let generationMediaCount = 0;
let externalRuntimeRequests = [];

try {
  const playwright = await loadPlaywright();
  const browserType = playwright[options.browser];
  if (!browserType) throw new Error(`Unsupported Playwright browser: ${options.browser}`);
  browser = await browserType.launch({ headless: true });
  context = await browser.newContext({ viewport: { width: 1440, height: 1050 }, serviceWorkers: "allow", reducedMotion: "no-preference" });
  page = await context.newPage();

  page.on("console", (message) => {
    if (["error", "assert"].includes(message.type())) browserEvidence.consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => browserEvidence.pageErrors.push(error.message));
  page.on("requestfailed", (request) => browserEvidence.failedRequests.push(`${request.method()} ${request.url()} — ${request.failure()?.errorText || "failed"}`));
  page.on("response", (response) => {
    if (response.status() >= 400) browserEvidence.httpErrors.push(`${response.status()} ${response.url()}`);
  });
  page.on("request", (request) => {
    const requestURL = new URL(request.url());
    if (!["data:", "blob:"].includes(requestURL.protocol) && requestURL.origin !== new URL(options.url).origin) externalRuntimeRequests.push(request.url());
  });
  await page.addInitScript(() => {
    document.addEventListener("securitypolicyviolation", (event) => {
      window.__gscCSPViolations = window.__gscCSPViolations || [];
      window.__gscCSPViolations.push(`${event.violatedDirective}: ${event.blockedURI}`);
    });
  });

  const navigation = await page.goto(options.url, { waitUntil: "domcontentloaded", timeout: 45_000 });
  if (!navigation?.ok()) throw new Error(`Navigation returned HTTP ${navigation?.status() ?? "unknown"}`);
  await page.waitForSelector("#app:not([hidden])", { timeout: 35_000 });
  await page.waitForFunction(() => window.__GONZO_HEALTH_BRAND__?.ready === true, null, { timeout: 20_000 });
  await page.waitForSelector(".hero.brand-hero", { timeout: 15_000 });
  booted = true;
  brandReady = await page.evaluate((expected) => document.documentElement.dataset.gonzoBrand === expected && document.querySelector(".gh-headline")?.textContent.replace(/\s+/g, " ").trim() === "Focus. Remember. Thrive.", EXPECTED_BRAND);

  generationCount = await page.locator("[data-generation]").count();
  batteryCount = await page.locator("[data-battery]").count();
  generationMediaCount = await page.locator("[data-generation] .gh-generation-media").count();
  capabilityCount = await page.locator(".gh-capability").count();
  proofCount = await page.locator(".gh-proof").count();
  brandMediaWorked = await page.evaluate(() => {
    const hero = document.querySelector(".gh-hero-media");
    const mark = document.querySelector(".gh-brand-mark");
    return Boolean(hero && mark && hero.complete && hero.naturalWidth > 0 && mark.complete && mark.naturalWidth > 0);
  });

  if (options.screenshots) {
    await fs.mkdir(options.screenshots, { recursive: true });
    const lobbyPath = path.join(options.screenshots, "01-lobby.png");
    await page.screenshot({ path: lobbyPath, fullPage: true });
    screenshotPaths.push(lobbyPath);
  }

  const genX = page.locator('[data-generation="genx"]');
  await genX.click();
  await page.waitForTimeout(250);
  generationSelectionWorked = await page.locator('[data-generation="genx"].selected').count() === 1;

  await page.locator('[data-battery="daily"]').click();
  await page.locator('[data-action="demo"]').click();
  const consent = page.locator("#consent");
  if (await consent.count()) {
    await page.locator("#agree").check();
    await page.locator("#continue").click();
  }
  await page.waitForSelector(".test-layout", { timeout: 15_000 });
  demoStarted = true;
  assessmentControlsWorked = await page.evaluate(() => Boolean(
    document.querySelector(".testbar") && document.querySelector("#clock") &&
    document.querySelector("#bar") && document.querySelector(".evidence") &&
    document.querySelector('[data-action="pause"]') && document.querySelector('[data-action="stop"]')
  ));

  if (options.screenshots) {
    const assessmentPath = path.join(options.screenshots, "02-assessment.png");
    await page.screenshot({ path: assessmentPath, fullPage: true });
    screenshotPaths.push(assessmentPath);
  }

  try {
    await page.waitForFunction(() => !document.querySelector(".test-layout") && /(accuracy|validity|recommendation|session complete|performance)/i.test(document.body.innerText), null, { timeout: 35_000 });
    resultsReached = true;
  } catch {
    page.once("dialog", (dialog) => dialog.accept());
    const stop = page.locator('[data-action="stop"]');
    if (await stop.count()) await stop.click();
    await page.waitForFunction(() => !document.querySelector(".test-layout") && /(accuracy|validity|recommendation|session|performance)/i.test(document.body.innerText), null, { timeout: 15_000 });
    resultsReached = true;
  }

  if (options.screenshots) {
    const resultsPath = path.join(options.screenshots, "03-results.png");
    await page.screenshot({ path: resultsPath, fullPage: true });
    screenshotPaths.push(resultsPath);
  }

  statePersisted = await page.evaluate(() => Object.keys(localStorage).some((key) => /gsc|spatial|cognition/i.test(key)) && localStorage.length > 0);

  serviceWorkerReady = await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) return false;
    try { await Promise.race([navigator.serviceWorker.ready, new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 12_000))]); return true; }
    catch { return false; }
  });

  if (serviceWorkerReady) {
    try {
      await page.goto(options.url, { waitUntil: "networkidle", timeout: 25_000 });
      await page.waitForSelector("#app:not([hidden])", { timeout: 25_000 });
      await context.setOffline(true);
      await page.reload({ waitUntil: "domcontentloaded", timeout: 20_000 });
      offlineWorked = await page.evaluate(() => Boolean(document.querySelector("#app:not([hidden])") || /offline|spatial cognition/i.test(document.body.innerText)));
    } catch {
      offlineWorked = false;
    } finally {
      await context.setOffline(false);
    }
  }

  browserEvidence.cspViolations.push(...await page.evaluate(() => window.__gscCSPViolations || []));
} catch (error) {
  browserEvidence.pageErrors.push(`Evaluator: ${error.message}`);
} finally {
  await context?.setOffline(false).catch(() => {});
  await browser?.close().catch(() => {});
}

check({ id: "functionality.boot", domain: "functionality", critical: true, points: 5, passed: booted, detail: booted ? "Packed payload opened and the app became visible in Playwright WebKit." : "App did not boot in Playwright WebKit." });
check({ id: "brand.runtime-marker", domain: "brand", critical: true, points: 6, passed: brandReady, detail: brandReady ? `Runtime reports ${EXPECTED_BRAND} and displays “Focus. Remember. Thrive.”` : "Expected brand runtime marker or hero message was not observed." });
check({ id: "brand.media-runtime", domain: "brand", critical: true, points: 5, passed: brandMediaWorked, detail: brandMediaWorked ? "Brand icon and neural hero media decoded successfully." : "Brand icon or neural hero failed to decode." });
check({ id: "brand.generation-media", domain: "brand", critical: true, points: 5, passed: generationCount === 7 && generationMediaCount === 7, detail: `Observed ${generationCount} generation controls and ${generationMediaCount} branded media treatments.` });
check({ id: "brand.capabilities-and-proof", domain: "brand", points: 4, passed: capabilityCount === 6 && proofCount === 3, detail: `Observed ${capabilityCount}/6 capability icons and ${proofCount}/3 proof cards.` });

check({ id: "functionality.measurement-controls", domain: "functionality", critical: true, points: 5, passed: generationCount === 7 && batteryCount === 3, detail: `Observed ${generationCount}/7 generation controls and ${batteryCount}/3 battery controls.` });
check({ id: "functionality.generation-selection", domain: "functionality", points: 3, passed: generationSelectionWorked, detail: generationSelectionWorked ? "Generation X selection updated state and selected styling." : "Generation selection did not update selected state." });
check({ id: "functionality.demo-consent-start", domain: "functionality", critical: true, points: 5, passed: demoStarted, detail: demoStarted ? "Accelerated Daily demonstration passed through consent and opened the assessment screen." : "Demo or consent flow did not reach assessment." });
check({ id: "functionality.assessment-runtime", domain: "functionality", critical: true, points: 5, passed: assessmentControlsWorked, detail: assessmentControlsWorked ? "Timer, progress, evidence panel, pause, and participant stop controls were present." : "One or more critical assessment controls were missing." });
check({ id: "functionality.results", domain: "functionality", critical: true, points: 5, passed: resultsReached, detail: resultsReached ? "The demonstration reached a scored results state." : "No scored results state was reached." });
check({ id: "functionality.local-persistence", domain: "functionality", points: 2, passed: statePersisted, detail: statePersisted ? "Browser-local state was written after the session." : "No local session state was detected." });

check({ id: "pwa.service-worker-runtime", domain: "pwa", points: 4, passed: serviceWorkerReady, detail: serviceWorkerReady ? "Service worker installed and became ready in WebKit." : "Service worker did not become ready in WebKit." });
check({ id: "pwa.offline-runtime", domain: "pwa", points: 3, passed: offlineWorked, detail: offlineWorked ? "The experience remained available after WebKit was switched offline." : "Offline reload did not produce the cached app or offline screen." });

const uniqueExternal = unique(externalRuntimeRequests).filter((url) => !url.startsWith("blob:") && !url.startsWith("data:"));
check({ id: "privacy.no-external-runtime", domain: "privacy", points: 3, passed: uniqueExternal.length === 0, detail: uniqueExternal.length ? `Unexpected cross-origin requests: ${uniqueExternal.join(", ")}` : "No cross-origin runtime request or tracker was observed." });

const criticalBrowserErrors = unique([
  ...browserEvidence.consoleErrors,
  ...browserEvidence.pageErrors,
  ...browserEvidence.failedRequests,
  ...browserEvidence.cspViolations,
  ...browserEvidence.httpErrors.filter((item) => !/favicon/i.test(item))
]);
check({ id: "deployment.browser-errors", domain: "deployment", critical: true, points: 3, passed: criticalBrowserErrors.length === 0, detail: criticalBrowserErrors.length ? `${criticalBrowserErrors.length} critical browser/deployment errors: ${criticalBrowserErrors.slice(0, 5).join(" | ")}` : "Zero critical console, page, request, CSP, or HTTP errors were observed." });

const domainSummary = Object.fromEntries(Object.keys(DOMAIN_WEIGHTS).map((domain) => {
  const items = checks.filter((item) => item.domain === domain);
  return [domain, {
    pointsEarned: items.reduce((sum, item) => sum + item.pointsEarned, 0),
    pointsPossible: items.reduce((sum, item) => sum + item.pointsPossible, 0),
    checksPassed: items.filter((item) => item.passed).length,
    checksTotal: items.length
  }];
}));

const score = checks.reduce((sum, item) => sum + item.pointsEarned, 0);
const criticalFailures = checks.filter((item) => item.critical && !item.passed).map((item) => ({ id: item.id, detail: item.detail }));
const status = criticalFailures.length || score < 80 ? "FAIL" : score < 90 ? "CAUTION" : "PASS";
const report = {
  schemaVersion: SCHEMA_VERSION,
  evaluatedAt: new Date().toISOString(),
  target: { url: options.url, siteDirectory: options.siteDir, browser: options.browser, requireLive: options.requireLive },
  status,
  score,
  scorePossible: 100,
  criticalFailures,
  domains: domainSummary,
  checks,
  browser: { ...browserEvidence, externalRequests: uniqueExternal, criticalErrors: criticalBrowserErrors },
  deploymentProbes: probes,
  artifacts: { screenshots: screenshotPaths }
};

function markdownFor(value) {
  const lines = [
    "# Gonzo | Health WebKit Evaluation",
    "",
    `- **Status:** ${value.status}`,
    `- **Score:** ${value.score}/${value.scorePossible}`,
    `- **Evaluated:** ${value.evaluatedAt}`,
    `- **Target:** ${value.target.url}`,
    `- **Browser:** ${value.target.browser}`,
    `- **Critical failures:** ${value.criticalFailures.length}`,
    `- **Critical browser errors:** ${value.browser.criticalErrors.length}`,
    "",
    "## Domain scores",
    "",
    "| Domain | Score | Checks |",
    "|---|---:|---:|"
  ];
  for (const [domain, item] of Object.entries(value.domains)) lines.push(`| ${domain} | ${item.pointsEarned}/${item.pointsPossible} | ${item.checksPassed}/${item.checksTotal} |`);
  lines.push("", "## Checks", "", "| Gate | Critical | Result | Points | Evidence |", "|---|:---:|:---:|---:|---|");
  for (const item of value.checks) lines.push(`| \`${item.id}\` | ${item.critical ? "yes" : "no"} | ${item.passed ? "PASS" : "FAIL"} | ${item.pointsEarned}/${item.pointsPossible} | ${item.detail.replaceAll("|", "\\|")} |`);
  if (value.criticalFailures.length) {
    lines.push("", "## Critical failures", "");
    for (const failure of value.criticalFailures) lines.push(`- **${failure.id}:** ${failure.detail}`);
  }
  if (value.browser.criticalErrors.length) {
    lines.push("", "## Browser errors", "", "```text", ...value.browser.criticalErrors, "```");
  }
  if (value.artifacts.screenshots.length) {
    lines.push("", "## Screenshots", "");
    for (const item of value.artifacts.screenshots) lines.push(`- ${item}`);
  }
  lines.push("", "## Decision", "", value.status === "PASS" ? "Release evaluation passed. Brand, WebKit/PWA, privacy, and core assessment gates are green." : "Release promotion is blocked until every critical failure is resolved and the evaluator returns PASS.");
  return `${lines.join("\n")}\n`;
}

if (options.json) {
  await ensureParent(options.json);
  await fs.writeFile(options.json, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}
if (options.markdown) {
  await ensureParent(options.markdown);
  await fs.writeFile(options.markdown, markdownFor(report), "utf8");
}

console.log(JSON.stringify({ status, score, criticalFailures: criticalFailures.length, criticalBrowserErrors: criticalBrowserErrors.length, report: options.json, summary: options.markdown }, null, 2));
process.exitCode = status === "PASS" ? 0 : 1;
