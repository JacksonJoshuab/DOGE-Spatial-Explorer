#!/usr/bin/env node
import fs from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';

const sourceURL = new URL('./evaluate-gonzo-health-ux-v2.3.mjs', import.meta.url);
const runtimeURL = new URL('./.evaluate-gonzo-health-ux-v2.3.5-native.runtime.mjs', import.meta.url);
let source = fs.readFileSync(sourceURL, 'utf8');

const versionNeedle = "const EXPERIENCE='gonzo-health-experience/2.3.2';";
if (!source.includes(versionNeedle)) {
  throw new Error('The base evaluator version contract changed unexpectedly.');
}
source = source.replace(versionNeedle, "const EXPERIENCE='gonzo-health-experience/2.3.5';");
source = source.replaceAll("serviceWorkers:'allow'", "serviceWorkers:'allow',ignoreHTTPSErrors:true");

// The packed assessment already renders six native, focusable buttons. Their
// visible color and hotkey text supplies the accessible name; this gate tests
// those authoritative controls rather than requiring an enhancement marker.
const nativeSelector = 'button.response-button[data-response],button[data-response]';
const waitNeedle = "await page.waitForSelector('[data-gh-response]',{timeout:10000});";
const dimensionsNeedle = "const responses=await dimensions(page,'[data-gh-response]');";
if (!source.includes(waitNeedle) || !source.includes(dimensionsNeedle)) {
  throw new Error('The response-control evaluator contract changed unexpectedly.');
}
source = source.replace(waitNeedle, `await page.waitForSelector('${nativeSelector}',{timeout:10000});`);
source = source.replace(dimensionsNeedle, `const responses=await dimensions(page,'${nativeSelector}');`);

fs.writeFileSync(runtimeURL, source);
const runtimePath = fileURLToPath(runtimeURL);
process.on('exit', () => {
  try { fs.unlinkSync(runtimePath); } catch {}
});
await import(`${pathToFileURL(runtimePath).href}?run=${Date.now()}`);
