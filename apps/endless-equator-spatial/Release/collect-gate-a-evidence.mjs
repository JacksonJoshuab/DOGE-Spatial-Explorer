#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';

const [sourceCommit, outputPath = 'Build/RC1/release-evidence.gate-a.json'] = process.argv.slice(2);
const repository = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN;
const apiBase = process.env.GITHUB_API_URL || 'https://api.github.com';
const requiredWorkflowNames = (process.env.REQUIRED_GATE_A_WORKFLOWS || [
  'Endless Equator Spatial',
  'Endless Equator Security',
  'Endless Equator Main Xcode 27'
].join('\n')).split(/\r?\n|,/).map(value => value.trim()).filter(Boolean);
const maxArtifactBytes = Number(process.env.MAX_GATE_A_ARTIFACT_BYTES || 300_000_000);

if (!repository || !token) {
  console.error('GITHUB_REPOSITORY and GITHUB_TOKEN are required.');
  process.exit(64);
}
if (!/^[a-fA-F0-9]{40}$/.test(String(sourceCommit || ''))) {
  console.error('Usage: node Release/collect-gate-a-evidence.mjs <40-character-source-commit> [output.json]');
  process.exit(64);
}
if (requiredWorkflowNames.length === 0) {
  console.error('At least one required Gate A workflow name is required.');
  process.exit(64);
}

const templateURL = new URL('./release-evidence.ci.json', import.meta.url);
const evidence = JSON.parse(await readFile(templateURL, 'utf8'));
const outputDirectory = join(process.cwd(), 'Build', 'RC1', 'gate-a-evidence');
await mkdir(outputDirectory, { recursive: true });
await mkdir(join(process.cwd(), basename(outputPath) === outputPath ? '.' : outputPath.split('/').slice(0, -1).join('/')), { recursive: true });

async function github(path, { binary = false } = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'endless-equator-release-evidence'
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(binary ? 120_000 : 30_000)
  });
  if (!response.ok) {
    throw new Error(`GitHub API ${response.status} for ${path}`);
  }
  return binary ? Buffer.from(await response.arrayBuffer()) : response.json();
}
function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}
function safeName(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70);
}
function evidenceID(prefix, value, suffix = '') {
  return `A-${prefix}_${safeName(value).replaceAll('-', '_').toUpperCase()}${suffix}`.slice(0, 80);
}

const runsResponse = await github(`/repos/${repository}/actions/runs?head_sha=${sourceCommit}&per_page=100`);
const runs = runsResponse.workflow_runs || [];
const selectedRuns = [];
const blockers = [];

for (const workflowName of requiredWorkflowNames) {
  const candidates = runs
    .filter(run => run.name === workflowName)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const selected = candidates.find(run => run.status === 'completed' && run.conclusion === 'success');
  if (!selected) {
    const newest = candidates[0];
    blockers.push(newest
      ? `${workflowName} has no successful completed run for ${sourceCommit}; newest status=${newest.status}, conclusion=${newest.conclusion || 'none'}, run=${newest.id}.`
      : `${workflowName} has no run for exact source commit ${sourceCommit}.`);
  } else {
    selectedRuns.push(selected);
  }
}

const collected = [];
for (const run of selectedRuns) {
  const workflowSlug = safeName(run.name);
  const jobsResponse = await github(`/repos/${repository}/actions/runs/${run.id}/jobs?per_page=100`);
  const normalizedRun = {
    repository,
    sourceCommit,
    workflowName: run.name,
    workflowID: run.workflow_id,
    runID: run.id,
    runNumber: run.run_number,
    runAttempt: run.run_attempt,
    event: run.event,
    status: run.status,
    conclusion: run.conclusion,
    createdAt: run.created_at,
    updatedAt: run.updated_at,
    htmlURL: run.html_url,
    headSHA: run.head_sha,
    jobs: (jobsResponse.jobs || []).map(job => ({
      id: job.id,
      name: job.name,
      status: job.status,
      conclusion: job.conclusion,
      startedAt: job.started_at,
      completedAt: job.completed_at,
      htmlURL: job.html_url,
      runnerName: job.runner_name,
      runnerGroupName: job.runner_group_name,
      labels: job.labels,
      steps: (job.steps || []).map(step => ({
        name: step.name,
        status: step.status,
        conclusion: step.conclusion,
        number: step.number,
        startedAt: step.started_at,
        completedAt: step.completed_at
      }))
    }))
  };
  const metadataBytes = Buffer.from(JSON.stringify(normalizedRun, null, 2));
  const metadataPath = join(outputDirectory, `${workflowSlug}-run-${run.id}.json`);
  await writeFile(metadataPath, metadataBytes);
  collected.push({
    id: evidenceID('RUN', run.name),
    kind: run.name.includes('Security') ? 'SECURITY_SCAN' : 'BUILD_LOG',
    label: `${run.name} successful run metadata`,
    scope: `Exact commit ${sourceCommit}; run ${run.id}; all job and step conclusions captured.`,
    result: 'PASS',
    capturedAt: run.updated_at,
    validUntil: null,
    sourceRef: `${run.html_url} | repository artifact ${metadataPath}`,
    sha256: sha256(metadataBytes),
    containsSensitiveData: false,
    redactedPublicSummaryRef: null
  });

  const logArchive = await github(`/repos/${repository}/actions/runs/${run.id}/logs`, { binary: true });
  const logPath = join(outputDirectory, `${workflowSlug}-run-${run.id}-logs.zip`);
  await writeFile(logPath, logArchive);
  collected.push({
    id: evidenceID('LOGS', run.name),
    kind: run.name.includes('Security') ? 'SECURITY_SCAN' : 'BUILD_LOG',
    label: `${run.name} GitHub Actions logs`,
    scope: `Complete log archive for exact-commit successful run ${run.id}.`,
    result: 'PASS',
    capturedAt: run.updated_at,
    validUntil: null,
    sourceRef: `${run.logs_url} | repository artifact ${logPath}`,
    sha256: sha256(logArchive),
    containsSensitiveData: false,
    redactedPublicSummaryRef: null
  });

  const artifactsResponse = await github(`/repos/${repository}/actions/runs/${run.id}/artifacts?per_page=100`);
  for (const artifact of artifactsResponse.artifacts || []) {
    if (artifact.expired) {
      blockers.push(`${run.name} artifact ${artifact.name} is already expired.`);
      continue;
    }
    if (artifact.size_in_bytes > maxArtifactBytes) {
      blockers.push(`${run.name} artifact ${artifact.name} is ${artifact.size_in_bytes} bytes, above collection limit ${maxArtifactBytes}.`);
      continue;
    }
    let digest = typeof artifact.digest === 'string' && artifact.digest.startsWith('sha256:')
      ? artifact.digest.slice('sha256:'.length)
      : null;
    let archivePath = null;
    if (!digest) {
      const archive = await github(`/repos/${repository}/actions/artifacts/${artifact.id}/zip`, { binary: true });
      digest = sha256(archive);
      archivePath = join(outputDirectory, `${workflowSlug}-artifact-${artifact.id}-${safeName(artifact.name)}.zip`);
      await writeFile(archivePath, archive);
    }
    collected.push({
      id: evidenceID('ARTIFACT', `${run.name}-${artifact.id}`),
      kind: run.name.includes('Security') ? 'SECURITY_SCAN' : 'ARCHIVE',
      label: `${run.name} artifact: ${artifact.name}`,
      scope: `Artifact ${artifact.id}, ${artifact.size_in_bytes} bytes, produced by exact-commit run ${run.id}.`,
      result: 'PASS',
      capturedAt: artifact.created_at,
      validUntil: artifact.expires_at || null,
      sourceRef: `${artifact.archive_download_url}${archivePath ? ` | repository artifact ${archivePath}` : ''}`,
      sha256: digest,
      containsSensitiveData: false,
      redactedPublicSummaryRef: null
    });
  }
}

const gateA = evidence.gates.find(gate => gate.id === 'A');
gateA.owner = {
  name: 'Automated GitHub Actions evidence collector',
  role: 'Engineering release evidence collector',
  organization: repository,
  contactEvidenceRef: `https://github.com/${repository}/actions`
};
gateA.checkedAt = new Date().toISOString();
gateA.expiresAt = null;
gateA.status = blockers.length === 0 && selectedRuns.length === requiredWorkflowNames.length ? 'PASSED' : 'BLOCKED';
gateA.blockers = blockers;
gateA.evidence = collected;
evidence.sourceCommit = sourceCommit;
evidence.generatedAt = new Date().toISOString();
evidence.decision = 'NO_GO';
evidence.notes = `Gate A was collected automatically from exact-commit GitHub workflow evidence. All nonengineering release and Ecuador operational gates remain fail-closed.`;

await writeFile(outputPath, `${JSON.stringify(evidence, null, 2)}\n`);
const summary = {
  validGateA: gateA.status === 'PASSED',
  repository,
  sourceCommit,
  requiredWorkflows: requiredWorkflowNames,
  selectedRuns: selectedRuns.map(run => ({ name: run.name, id: run.id, number: run.run_number, url: run.html_url })),
  evidenceCount: collected.length,
  blockers,
  outputPath
};
console.log(JSON.stringify(summary, null, 2));
process.exit(gateA.status === 'PASSED' ? 0 : 1);
