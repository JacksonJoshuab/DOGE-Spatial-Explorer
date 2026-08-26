#!/usr/bin/env node
import { readFile } from 'node:fs/promises';

const [ledgerPath] = process.argv.slice(2);
if (!ledgerPath) {
  console.error('Usage: node Release/Partners/verify-provider-confirmations.mjs <provider-confirmations.json>');
  process.exit(64);
}

const ledger = JSON.parse(await readFile(ledgerPath, 'utf8'));
const now = Date.now();
const errors = [];
const warnings = [];
const confirmedStatuses = new Set(['WRITTEN_CONFIRMED', 'CONDITIONAL_CONFIRMED']);
const categoriesRequiredForGo = new Set([
  'LOCAL_GUIDE',
  'ROUTE_VERIFIER',
  'MOTORCYCLE_FLEET',
  'HOTEL',
  'PROTECTED_AREA_AUTHORITY',
  'MEDICAL_EVACUATION',
  'RECOVERY_SUPPORT',
  'PRODUCTION_FIXER'
]);
const placeholders = /REPLACE|TBD|TODO|UNKNOWN|TO_SOURCE|VERIFY_CURRENT/i;

function validDate(value) { return typeof value === 'string' && !Number.isNaN(Date.parse(value)); }
function expired(value) { return validDate(value) && Date.parse(value) <= now; }
function requireText(value, label) {
  if (typeof value !== 'string' || value.trim().length < 2) errors.push(`${label} is missing`);
  else if (placeholders.test(value)) errors.push(`${label} contains a placeholder`);
}

requireText(ledger.expeditionID, 'expeditionID');
if (!['NO_GO', 'CONDITIONAL_GO', 'GO'].includes(ledger.decision)) errors.push('decision is invalid');
if (!/^\d{4}-\d{2}-\d{2}$/.test(String(ledger.dateWindow?.start || ''))) errors.push('dateWindow.start is invalid');
if (!/^\d{4}-\d{2}-\d{2}$/.test(String(ledger.dateWindow?.end || ''))) errors.push('dateWindow.end is invalid');
if (ledger.dateWindow?.start && ledger.dateWindow?.end && ledger.dateWindow.start > ledger.dateWindow.end) errors.push('dateWindow.end precedes dateWindow.start');
if (!validDate(ledger.generatedAt)) errors.push('generatedAt is invalid');
if (!Array.isArray(ledger.records) || ledger.records.length === 0) errors.push('records must contain at least one provider record');

const records = new Map();
const categoriesPresent = new Set();
for (const [index, record] of (ledger.records || []).entries()) {
  const prefix = `records[${index}]`;
  if (!/^[A-Z]+-[0-9]{3,5}$/.test(String(record.id || ''))) errors.push(`${prefix}.id is invalid`);
  if (records.has(record.id)) errors.push(`record ${record.id} is duplicated`);
  records.set(record.id, record);
  categoriesPresent.add(record.category);
  requireText(record.candidateName, `${prefix}.candidateName`);
  requireText(record.area, `${prefix}.area`);
  requireText(record.owner, `${prefix}.owner`);
  if (!validDate(record.checkedAt)) errors.push(`${prefix}.checkedAt is invalid`);

  const confirmed = confirmedStatuses.has(record.status);
  if (confirmed) {
    requireText(record.legalEntity, `${record.id}.legalEntity`);
    requireText(record.contactEvidenceRef, `${record.id}.contactEvidenceRef`);
    requireText(record.emergencyContactEvidenceRef, `${record.id}.emergencyContactEvidenceRef`);
    if (!record.writtenConfirmationEvidence) errors.push(`${record.id} is confirmed without written confirmation evidence`);
    else {
      requireText(record.writtenConfirmationEvidence.sourceRef, `${record.id}.writtenConfirmationEvidence.sourceRef`);
      requireText(record.writtenConfirmationEvidence.signedBy, `${record.id}.writtenConfirmationEvidence.signedBy`);
      if (!/^[a-fA-F0-9]{64}$/.test(String(record.writtenConfirmationEvidence.sha256 || ''))) errors.push(`${record.id} written confirmation SHA-256 is invalid`);
      if (!validDate(record.writtenConfirmationEvidence.capturedAt)) errors.push(`${record.id} confirmation capturedAt is invalid`);
    }
    if (!validDate(record.confirmedAt)) errors.push(`${record.id}.confirmedAt is invalid`);
    if (!validDate(record.validFrom) || !validDate(record.validUntil)) errors.push(`${record.id} confirmation validity window is incomplete`);
    if (expired(record.validUntil)) errors.push(`${record.id} confirmation is expired`);
    if (!Array.isArray(record.confirmedScope) || record.confirmedScope.length === 0) errors.push(`${record.id} is confirmed without confirmed scope`);
    if (record.status === 'CONDITIONAL_CONFIRMED' && (!Array.isArray(record.restrictions) || record.restrictions.length === 0)) errors.push(`${record.id} is conditional without restrictions`);

    if (record.insurance?.required) {
      if (record.insurance.status !== 'VERIFIED') errors.push(`${record.id} requires insurance but status is ${record.insurance?.status || 'missing'}`);
      requireText(record.insurance.evidenceRef, `${record.id}.insurance.evidenceRef`);
      requireText(record.insurance.limitsSummary, `${record.id}.insurance.limitsSummary`);
    }
    for (const permit of record.permits || []) {
      if (!['APPROVED', 'NOT_REQUIRED'].includes(permit.status)) errors.push(`${record.id} permit ${permit.type || 'unnamed'} is ${permit.status || 'missing'}`);
      if (permit.status === 'APPROVED') {
        requireText(permit.evidenceRef, `${record.id} permit evidenceRef`);
        if (permit.validUntil && expired(permit.validUntil)) errors.push(`${record.id} permit ${permit.type} is expired`);
      }
    }
  } else if (record.requiredForOperation && !['REMOVED', 'DECLINED'].includes(record.status)) {
    warnings.push(`${record.id} is required for operation but status is ${record.status}`);
  }

  if (record.backupRecordID && record.backupRecordID === record.id) errors.push(`${record.id} cannot be its own backup`);
}

for (const record of records.values()) {
  if (record.backupRecordID && !records.has(record.backupRecordID)) errors.push(`${record.id} references missing backup ${record.backupRecordID}`);
}

if (ledger.decision !== 'NO_GO') {
  for (const category of categoriesRequiredForGo) {
    if (!categoriesPresent.has(category)) errors.push(`decision ${ledger.decision} requires at least one ${category} record`);
  }
  for (const record of records.values()) {
    if (record.requiredForOperation && !confirmedStatuses.has(record.status)) errors.push(`${record.id} is required for operation but not written-confirmed`);
  }
  const requiredHotels = [...records.values()].filter(record => record.category === 'HOTEL' && record.requiredForOperation);
  if (requiredHotels.length < 5) errors.push(`${ledger.decision} requires the full overnight plan; fewer than five required hotel records are present`);
  const protectedAreas = [...records.values()].filter(record => record.category === 'PROTECTED_AREA_AUTHORITY' && record.requiredForOperation);
  if (protectedAreas.length < 2) errors.push(`${ledger.decision} requires separate current authority records for the Cayambe-Coca and Cotopaxi scopes`);
  const unbackedCritical = [...records.values()].filter(record => record.requiredForOperation && ['LOCAL_GUIDE', 'MOTORCYCLE_FLEET', 'MEDICAL_EVACUATION', 'RECOVERY_SUPPORT'].includes(record.category) && !record.backupRecordID);
  for (const record of unbackedCritical) warnings.push(`${record.id} is a critical dependency without a recorded backup`);
}

const report = {
  valid: errors.length === 0,
  expeditionID: ledger.expeditionID,
  decision: ledger.decision,
  evaluatedAt: new Date().toISOString(),
  recordCount: records.size,
  confirmedCount: [...records.values()].filter(record => confirmedStatuses.has(record.status)).length,
  requiredUnconfirmed: [...records.values()].filter(record => record.requiredForOperation && !confirmedStatuses.has(record.status)).map(record => record.id),
  errors,
  warnings
};
console.log(JSON.stringify(report, null, 2));
process.exit(errors.length ? 1 : 0);
