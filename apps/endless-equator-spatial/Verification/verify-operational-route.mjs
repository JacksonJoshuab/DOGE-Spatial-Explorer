#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const [manifestPath, gpxPath] = process.argv.slice(2);
if (!manifestPath || !gpxPath) {
  console.error('Usage: node Verification/verify-operational-route.mjs <manifest.json> <route.gpx>');
  process.exit(64);
}

const [manifestText, gpx] = await Promise.all([
  readFile(manifestPath, 'utf8'),
  readFile(gpxPath)
]);
const manifest = JSON.parse(manifestText);
const errors = [];
const warnings = [];
const now = Date.now();
const hours = value => (now - Date.parse(value)) / 3_600_000;
const placeholder = value => typeof value === 'string' && /REPLACE|PRIVATE-EVIDENCE-REPLACE/i.test(value);
const requireText = (value, label) => {
  if (typeof value !== 'string' || value.trim().length < 2 || placeholder(value)) errors.push(`${label} is missing or still a placeholder`);
};
const requireDate = (value, label) => {
  if (!value || Number.isNaN(Date.parse(value))) errors.push(`${label} is not a valid timestamp`);
};

requireText(manifest.routeID, 'routeID');
requireText(manifest.routeVersion, 'routeVersion');
requireText(manifest.gpxFileName, 'gpxFileName');
requireText(manifest.verifiedBy?.name, 'verifiedBy.name');
requireText(manifest.verifiedBy?.organization, 'verifiedBy.organization');
requireText(manifest.verifiedBy?.contactEvidenceRef, 'verifiedBy.contactEvidenceRef');
for (const field of ['verifiedAt', 'accessCheckedAt', 'weatherCheckedAt', 'expiresAt', 'riderAcknowledgedAt']) requireDate(manifest[field], field);

const actualHash = createHash('sha256').update(gpx).digest('hex');
if (String(manifest.gpxSHA256 || '').toLowerCase() !== actualHash) {
  errors.push(`GPX SHA-256 mismatch: manifest=${manifest.gpxSHA256 || 'missing'} actual=${actualHash}`);
}
if (manifest.gpxFileName !== gpxPath.split(/[\\/]/).at(-1)) {
  errors.push(`gpxFileName does not match supplied file: ${manifest.gpxFileName} vs ${gpxPath.split(/[\\/]/).at(-1)}`);
}
if (manifest.status !== 'operationalCandidate') errors.push('status must be operationalCandidate');
if (Date.parse(manifest.expiresAt) <= now) errors.push('route manifest is expired');
if (hours(manifest.accessCheckedAt) < 0 || hours(manifest.accessCheckedAt) > 72) errors.push('access check must be within the last 72 hours');
if (hours(manifest.weatherCheckedAt) < 0 || hours(manifest.weatherCheckedAt) > 24) errors.push('weather check must be within the last 24 hours');
if (hours(manifest.riderAcknowledgedAt) < 0 || Date.parse(manifest.riderAcknowledgedAt) < Date.parse(manifest.verifiedAt)) errors.push('rider acknowledgement must follow route verification');

if (!Array.isArray(manifest.officialSources) || manifest.officialSources.length === 0) errors.push('at least one official source check is required');
for (const [index, source] of (manifest.officialSources || []).entries()) {
  requireText(source.authority, `officialSources[${index}].authority`);
  requireText(source.evidenceRef, `officialSources[${index}].evidenceRef`);
  requireDate(source.checkedAt, `officialSources[${index}].checkedAt`);
}

for (const [index, permit] of (manifest.permits || []).entries()) {
  requireText(permit.authority, `permits[${index}].authority`);
  requireText(permit.evidenceRef, `permits[${index}].evidenceRef`);
  if (!['approved', 'notRequired'].includes(permit.status)) errors.push(`permit ${permit.permitType || index} is ${permit.status || 'missing'}`);
}

if (!Array.isArray(manifest.segments) || manifest.segments.length === 0) errors.push('no route segments supplied');
for (const [index, segment] of (manifest.segments || []).entries()) {
  const label = segment.id || `segment-${index}`;
  requireText(segment.id, `segments[${index}].id`);
  requireText(segment.evidenceRef, `${label}.evidenceRef`);
  requireDate(segment.checkedAt, `${label}.checkedAt`);
  if (hours(segment.checkedAt) < 0 || hours(segment.checkedAt) > 72) errors.push(`${label} was not checked within 72 hours`);
  if (!['open', 'conditional'].includes(segment.status)) errors.push(`${label} status is ${segment.status || 'missing'}`);
  if (segment.status === 'conditional' && (!Array.isArray(segment.conditions) || segment.conditions.length === 0)) errors.push(`${label} is conditional without explicit conditions`);
  if (!segment.bailout?.available || !segment.bailout?.description) warnings.push(`${label} has no confirmed bailout`);
  if (segment.protectedArea?.insideOrAdjacent) {
    requireText(segment.protectedArea.authority, `${label}.protectedArea.authority`);
    requireText(segment.protectedArea.permitEvidenceRef, `${label}.protectedArea.permitEvidenceRef`);
  }
  if (segment.landownerPermission?.required) {
    if (segment.landownerPermission.status !== 'approved') errors.push(`${label} lacks approved landowner permission`);
    requireText(segment.landownerPermission.evidenceRef, `${label}.landownerPermission.evidenceRef`);
  }
}

if (!manifest.goNoGo || !['GO', 'CONDITIONAL_GO'].includes(manifest.goNoGo.decision)) errors.push('goNoGo.decision must be GO or CONDITIONAL_GO');
if (manifest.goNoGo?.decision === 'CONDITIONAL_GO' && (!Array.isArray(manifest.goNoGo.conditions) || manifest.goNoGo.conditions.length === 0)) errors.push('CONDITIONAL_GO requires explicit conditions');
requireText(manifest.goNoGo?.decidedBy, 'goNoGo.decidedBy');
requireText(manifest.goNoGo?.evidenceRef, 'goNoGo.evidenceRef');
requireDate(manifest.goNoGo?.decidedAt, 'goNoGo.decidedAt');

const report = {
  valid: errors.length === 0,
  routeID: manifest.routeID,
  gpxSHA256: actualHash,
  evaluatedAt: new Date().toISOString(),
  expiresAt: manifest.expiresAt,
  segmentCount: manifest.segments?.length || 0,
  errors,
  warnings
};
console.log(JSON.stringify(report, null, 2));
process.exit(errors.length ? 1 : 0);
