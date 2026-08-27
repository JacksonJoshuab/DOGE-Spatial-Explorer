#!/usr/bin/env node
import fs from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';

const sourceURL = new URL('./evaluate-gonzo-health-ux-v2.3.mjs', import.meta.url);
const runtimeURL = new URL('./.evaluate-gonzo-health-ux-v2.3.5-localtls.runtime.mjs', import.meta.url);
let source = fs.readFileSync(sourceURL, 'utf8');
const expected = "const EXPERIENCE='gonzo-health-experience/2.3.2';";
if (!source.includes(expected)) {
  throw new Error('The base evaluator version contract changed unexpectedly.');
}
source = source.replace(expected, "const EXPERIENCE='gonzo-health-experience/2.3.5';");
source = source.replaceAll("serviceWorkers:'allow'", "serviceWorkers:'allow',ignoreHTTPSErrors:true");
fs.writeFileSync(runtimeURL, source);
const runtimePath = fileURLToPath(runtimeURL);
process.on('exit', () => {
  try { fs.unlinkSync(runtimePath); } catch {}
});
await import(`${pathToFileURL(runtimePath).href}?run=${Date.now()}`);
