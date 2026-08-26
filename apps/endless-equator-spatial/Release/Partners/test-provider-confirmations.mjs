#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const fixtureURL = new URL('./provider-confirmations.ci.json', import.meta.url);
const validatorURL = new URL('./verify-provider-confirmations.mjs', import.meta.url);
const fixture = JSON.parse(await readFile(fixtureURL, 'utf8'));
const work = await mkdtemp(join(tmpdir(), 'endless-equator-provider-test-'));

function run(path) {
  return spawnSync(process.execPath, [validatorURL.pathname, path], { encoding: 'utf8' });
}
function expect(condition, message, output = '') {
  if (!condition) {
    console.error(message);
    if (output) console.error(output);
    process.exitCode = 1;
  }
}

try {
  const noGoPath = join(work, 'no-go.json');
  await writeFile(noGoPath, JSON.stringify(fixture, null, 2));
  const noGo = run(noGoPath);
  expect(noGo.status === 0, 'Fail-closed NO_GO fixture was rejected', noGo.stdout + noGo.stderr);

  const unauthorizedGo = structuredClone(fixture);
  unauthorizedGo.decision = 'GO';
  const unauthorizedGoPath = join(work, 'unauthorized-go.json');
  await writeFile(unauthorizedGoPath, JSON.stringify(unauthorizedGo, null, 2));
  const go = run(unauthorizedGoPath);
  expect(go.status !== 0, 'GO was accepted without written provider confirmations', go.stdout + go.stderr);
  expect(go.stdout.includes('requires at least one'), 'GO failure did not identify missing provider categories', go.stdout);
  expect(go.stdout.includes('not written-confirmed'), 'GO failure did not identify the unconfirmed critical guide', go.stdout);

  const falseConfirmation = structuredClone(fixture);
  falseConfirmation.records[0].status = 'WRITTEN_CONFIRMED';
  const falseConfirmationPath = join(work, 'false-confirmation.json');
  await writeFile(falseConfirmationPath, JSON.stringify(falseConfirmation, null, 2));
  const falseResult = run(falseConfirmationPath);
  expect(falseResult.status !== 0, 'Written confirmation status was accepted without written evidence', falseResult.stdout + falseResult.stderr);
  expect(falseResult.stdout.includes('without written confirmation evidence'), 'Missing written-evidence failure was not explicit', falseResult.stdout);

  if (!process.exitCode) console.log(JSON.stringify({ passed: true, scenarios: 3 }, null, 2));
} finally {
  await rm(work, { recursive: true, force: true });
}
