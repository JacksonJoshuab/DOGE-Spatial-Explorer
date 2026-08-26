#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const fixturePath = new URL('./release-evidence.ci.json', import.meta.url);
const validatorPath = new URL('./verify-release-evidence.mjs', import.meta.url);
const fixture = JSON.parse(await readFile(fixturePath, 'utf8'));
const workspace = await mkdtemp(join(tmpdir(), 'endless-equator-release-evidence-'));

function run(path) {
  return spawnSync(process.execPath, [validatorPath.pathname, path], { encoding: 'utf8' });
}
function expect(condition, message, details = '') {
  if (!condition) {
    console.error(message);
    if (details) console.error(details);
    process.exitCode = 1;
  }
}

try {
  const validPath = join(workspace, 'valid-no-go.json');
  await writeFile(validPath, JSON.stringify(fixture, null, 2));
  const valid = run(validPath);
  expect(valid.status === 0, 'Valid NO_GO fixture was rejected', valid.stdout + valid.stderr);

  const unauthorizedGo = structuredClone(fixture);
  unauthorizedGo.decision = 'OPERATIONAL_GO';
  const unauthorizedGoPath = join(workspace, 'unauthorized-go.json');
  await writeFile(unauthorizedGoPath, JSON.stringify(unauthorizedGo, null, 2));
  const unauthorized = run(unauthorizedGoPath);
  expect(unauthorized.status !== 0, 'OPERATIONAL_GO was accepted while mandatory gates were blocked', unauthorized.stdout + unauthorized.stderr);
  expect(unauthorized.stdout.includes('requires gate'), 'Unauthorized GO failure did not identify mandatory gate failures', unauthorized.stdout);
  expect(unauthorized.stdout.includes('requires PRODUCT approval'), 'Unauthorized GO failure did not identify missing approvals', unauthorized.stdout);

  const evidenceFreePass = structuredClone(fixture);
  evidenceFreePass.gates[0].status = 'PASSED';
  evidenceFreePass.gates[0].blockers = [];
  const evidenceFreePassPath = join(workspace, 'evidence-free-pass.json');
  await writeFile(evidenceFreePassPath, JSON.stringify(evidenceFreePass, null, 2));
  const evidenceFree = run(evidenceFreePassPath);
  expect(evidenceFree.status !== 0, 'A gate was accepted as PASSED without evidence', evidenceFree.stdout + evidenceFree.stderr);
  expect(evidenceFree.stdout.includes('PASSED without evidence'), 'Missing-evidence failure was not explicit', evidenceFree.stdout);

  const expiredEvidence = structuredClone(fixture);
  expiredEvidence.gates[0].status = 'PASSED';
  expiredEvidence.gates[0].blockers = [];
  expiredEvidence.gates[0].expiresAt = '2020-01-01T00:00:00Z';
  expiredEvidence.gates[0].evidence = [{
    id: 'A-EXPIRED_BUILD',
    kind: 'BUILD_LOG',
    label: 'Expired synthetic build record',
    scope: 'CI negative test only',
    result: 'PASS',
    capturedAt: '2020-01-01T00:00:00Z',
    validUntil: '2020-01-02T00:00:00Z',
    sourceRef: 'CI-FIXTURE-NOT-EVIDENCE',
    sha256: 'a'.repeat(64),
    containsSensitiveData: false,
    redactedPublicSummaryRef: null
  }];
  const expiredPath = join(workspace, 'expired.json');
  await writeFile(expiredPath, JSON.stringify(expiredEvidence, null, 2));
  const expired = run(expiredPath);
  expect(expired.status !== 0, 'Expired PASS evidence was accepted', expired.stdout + expired.stderr);
  expect(expired.stdout.includes('expired'), 'Expired evidence failure was not explicit', expired.stdout);

  if (!process.exitCode) {
    console.log(JSON.stringify({ passed: true, scenarios: 4 }, null, 2));
  }
} finally {
  await rm(workspace, { recursive: true, force: true });
}
