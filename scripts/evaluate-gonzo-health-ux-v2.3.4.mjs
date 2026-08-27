#!/usr/bin/env node
import fs from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';

const sourceURL = new URL('./evaluate-gonzo-health-ux-v2.3.mjs', import.meta.url);
const runtimeURL = new URL('./.evaluate-gonzo-health-ux-v2.3.4.runtime.mjs', import.meta.url);
const source = fs.readFileSync(sourceURL, 'utf8');
const expected = "const EXPERIENCE='gonzo-health-experience/2.3.2';";
const replacement = "const EXPERIENCE='gonzo-health-experience/2.3.4';";
if (!source.includes(expected)) {
  throw new Error('The base evaluator version contract changed unexpectedly.');
}
fs.writeFileSync(runtimeURL, source.replace(expected, replacement));
const runtimePath = fileURLToPath(runtimeURL);
process.on('exit', () => {
  try { fs.unlinkSync(runtimePath); } catch {}
});
await import(`${pathToFileURL(runtimePath).href}?run=${Date.now()}`);
