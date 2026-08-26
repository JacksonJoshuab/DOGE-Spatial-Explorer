#!/usr/bin/env node
import { readFile } from 'node:fs/promises';

const [evidencePath, expectedCommit] = process.argv.slice(2);
if (!evidencePath) {
  console.error('Usage: node Release/verify-release-evidence.mjs <release-evidence.json> [expected-40-char-commit]');
  process.exit(64);
}

const evidence = JSON.parse(await readFile(evidencePath, 'utf8'));
const now = Date.now();
const errors = [];
const warnings = [];
const placeholders = /(^|[-_\s])(REPLACE|TBD|TODO|UNKNOWN|PRIVATE-REF-REPLACE)([-_\s]|$)/i;
const allowedDecisions = new Set(['NO_GO', 'INTERNAL_TESTFLIGHT', 'CONTROLLED_REHEARSAL', 'OPERATIONAL_GO', 'CONDITIONAL_GO']);
const allowedStatuses = new Set(['NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'PASSED', 'NOT_APPLICABLE', 'EXPIRED']);
const mandatoryGateIDs = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const requiredApprovals = {
  INTERNAL_TESTFLIGHT: ['PRODUCT', 'APPLE_RELEASE', 'PRIVACY', 'ACCESSIBILITY'],
  CONTROLLED_REHEARSAL: ['PRODUCT', 'APPLE_RELEASE', 'PRIVACY', 'ACCESSIBILITY', 'SECURITY', 'PLATFORM_OPERATIONS', 'EXPEDITION_OPERATIONS', 'SAFETY'],
  OPERATIONAL_GO: ['PRODUCT', 'APPLE_RELEASE', 'PRIVACY', 'ACCESSIBILITY', 'SECURITY', 'PLATFORM_OPERATIONS', 'EXPEDITION_OPERATIONS', 'SAFETY', 'ROUTE_VERIFIER', 'GO_NO_GO_AUTHORITY'],
  CONDITIONAL_GO: ['PRODUCT', 'APPLE_RELEASE', 'PRIVACY', 'ACCESSIBILITY', 'SECURITY', 'PLATFORM_OPERATIONS', 'EXPEDITION_OPERATIONS', 'SAFETY', 'ROUTE_VERIFIER', 'GO_NO_GO_AUTHORITY']
};

function requireText(value, label, { allowPlaceholder = false } = {}) {
  if (typeof value !== 'string' || value.trim().length < 2) errors.push(`${label} is missing`);
  else if (!allowPlaceholder && placeholders.test(value)) errors.push(`${label} still contains a placeholder`);
}
function requireDate(value, label) {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) errors.push(`${label} is not a valid date-time`);
}
function isExpired(value) {
  return value && !Number.isNaN(Date.parse(value)) && Date.parse(value) <= now;
}

if (evidence.product !== 'Endless Equator Spatial Navigator') errors.push('product must be Endless Equator Spatial Navigator');
if (!/^RC[0-9]+$/.test(String(evidence.releaseCandidate || ''))) errors.push('releaseCandidate must match RC<number>');
if (!/^[a-fA-F0-9]{40}$/.test(String(evidence.sourceCommit || ''))) errors.push('sourceCommit must be a 40-character Git commit');
if (expectedCommit && evidence.sourceCommit.toLowerCase() !== expectedCommit.toLowerCase()) errors.push(`sourceCommit ${evidence.sourceCommit} does not match expected commit ${expectedCommit}`);
if (!allowedDecisions.has(evidence.decision)) errors.push('decision is invalid');
requireDate(evidence.generatedAt, 'generatedAt');
if (isExpired(evidence.expiresAt)) errors.push('release evidence index is expired');

if (!Array.isArray(evidence.gates)) errors.push('gates must be an array');
const gates = new Map();
for (const [index, gate] of (evidence.gates || []).entries()) {
  const prefix = `gates[${index}]`;
  if (!mandatoryGateIDs.includes(gate.id)) errors.push(`${prefix}.id is invalid`);
  if (gates.has(gate.id)) errors.push(`gate ${gate.id} is duplicated`);
  gates.set(gate.id, gate);
  requireText(gate.name, `${prefix}.name`);
  if (!allowedStatuses.has(gate.status)) errors.push(`${prefix}.status is invalid`);
  requireText(gate.owner?.name, `${prefix}.owner.name`);
  requireText(gate.owner?.role, `${prefix}.owner.role`);
  requireText(gate.owner?.organization, `${prefix}.owner.organization`);
  requireText(gate.owner?.contactEvidenceRef, `${prefix}.owner.contactEvidenceRef`);
  requireDate(gate.checkedAt, `${prefix}.checkedAt`);
  if (isExpired(gate.expiresAt) && gate.status === 'PASSED') errors.push(`gate ${gate.id} is marked PASSED but expired`);
  if (!Array.isArray(gate.mandatoryFor) || gate.mandatoryFor.length === 0) errors.push(`${prefix}.mandatoryFor is empty`);
  if (!Array.isArray(gate.evidence)) errors.push(`${prefix}.evidence must be an array`);

  const evidenceIDs = new Set();
  for (const [evidenceIndex, item] of (gate.evidence || []).entries()) {
    const itemPrefix = `${prefix}.evidence[${evidenceIndex}]`;
    requireText(item.id, `${itemPrefix}.id`);
    if (evidenceIDs.has(item.id)) errors.push(`evidence ID ${item.id} is duplicated in gate ${gate.id}`);
    evidenceIDs.add(item.id);
    if (!String(item.id || '').startsWith(`${gate.id}-`)) errors.push(`${itemPrefix}.id must begin with ${gate.id}-`);
    requireText(item.label, `${itemPrefix}.label`);
    requireText(item.scope, `${itemPrefix}.scope`);
    requireText(item.sourceRef, `${itemPrefix}.sourceRef`);
    requireDate(item.capturedAt, `${itemPrefix}.capturedAt`);
    if (!/^[a-fA-F0-9]{64}$/.test(String(item.sha256 || ''))) errors.push(`${itemPrefix}.sha256 must be 64 hexadecimal characters`);
    if (isExpired(item.validUntil) && item.result === 'PASS') errors.push(`${itemPrefix} is expired but marked PASS`);
    if (item.containsSensitiveData === true && !item.redactedPublicSummaryRef) warnings.push(`${itemPrefix} contains sensitive data and has no redacted public summary reference`);
    if (gate.status === 'PASSED' && item.result !== 'PASS' && item.result !== 'INFORMATIONAL') errors.push(`gate ${gate.id} is PASSED but ${item.id} result is ${item.result}`);
  }

  if (gate.status === 'PASSED' && gate.evidence.length === 0) errors.push(`gate ${gate.id} is PASSED without evidence`);
  if (gate.status === 'PASSED' && Array.isArray(gate.blockers) && gate.blockers.length > 0) errors.push(`gate ${gate.id} is PASSED but still lists blockers`);
  if (['BLOCKED', 'EXPIRED'].includes(gate.status) && (!Array.isArray(gate.blockers) || gate.blockers.length === 0)) errors.push(`gate ${gate.id} is ${gate.status} without a blocker explanation`);
}
for (const id of mandatoryGateIDs) if (!gates.has(id)) errors.push(`mandatory gate ${id} is missing`);

if (evidence.decision !== 'NO_GO') {
  for (const gate of gates.values()) {
    if ((gate.mandatoryFor || []).includes(evidence.decision) && !['PASSED', 'NOT_APPLICABLE'].includes(gate.status)) {
      errors.push(`decision ${evidence.decision} requires gate ${gate.id}, but its status is ${gate.status}`);
    }
  }
}

const approvals = Array.isArray(evidence.approvals) ? evidence.approvals : [];
if (!Array.isArray(evidence.approvals)) errors.push('approvals must be an array');
const approvalRoles = new Map();
for (const [index, approval] of approvals.entries()) {
  const prefix = `approvals[${index}]`;
  requireText(approval.name, `${prefix}.name`);
  requireText(approval.evidenceRef, `${prefix}.evidenceRef`);
  requireDate(approval.signedAt, `${prefix}.signedAt`);
  if (approvalRoles.has(approval.role)) errors.push(`approval role ${approval.role} is duplicated`);
  approvalRoles.set(approval.role, approval);
  if (approval.decision === 'REJECT' && evidence.decision !== 'NO_GO') errors.push(`${approval.role} rejected the release, so decision must be NO_GO`);
  if (approval.decision === 'APPROVE_WITH_CONDITIONS' && (!Array.isArray(approval.conditions) || approval.conditions.length === 0)) errors.push(`${approval.role} approved with conditions but no conditions are recorded`);
}
for (const role of requiredApprovals[evidence.decision] || []) {
  const approval = approvalRoles.get(role);
  if (!approval) errors.push(`decision ${evidence.decision} requires ${role} approval`);
  else if (!['APPROVE', 'APPROVE_WITH_CONDITIONS'].includes(approval.decision)) errors.push(`${role} approval does not authorize ${evidence.decision}`);
}
if (evidence.decision === 'CONDITIONAL_GO') {
  const conditionalApprovals = approvals.filter(approval => approval.decision === 'APPROVE_WITH_CONDITIONS');
  if (conditionalApprovals.length === 0) errors.push('CONDITIONAL_GO requires at least one explicit conditional approval');
}

const report = {
  valid: errors.length === 0,
  product: evidence.product,
  releaseCandidate: evidence.releaseCandidate,
  sourceCommit: evidence.sourceCommit,
  decision: evidence.decision,
  evaluatedAt: new Date().toISOString(),
  gateStatus: Object.fromEntries([...gates].map(([id, gate]) => [id, gate.status])),
  approvalRoles: [...approvalRoles.keys()].sort(),
  errors,
  warnings
};
console.log(JSON.stringify(report, null, 2));
process.exit(errors.length ? 1 : 0);
