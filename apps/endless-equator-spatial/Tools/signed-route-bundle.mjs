#!/usr/bin/env node
import {
  createHash,
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  sign as signBytes,
  verify as verifyBytes
} from 'node:crypto';
import { chmod, readFile, writeFile } from 'node:fs/promises';

const DOMAIN = Buffer.from('com.gonzosocialclub.endlessequator.routebundle.v1\0');
const MAX_BUNDLE_BYTES = 25_000_000;
const MAX_MANIFEST_BYTES = 1_000_000;
const MAX_GPX_BYTES = 20_000_000;

const [command, ...rest] = process.argv.slice(2);
const args = parseArgs(rest);

try {
  switch (command) {
    case 'generate-key':
      await generateKey(args);
      break;
    case 'public-key':
      await printPublicKey(args);
      break;
    case 'sign':
      await signBundle(args);
      break;
    case 'verify':
      await verifyBundle(args);
      break;
    default:
      usage();
      process.exitCode = 64;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

async function generateKey(options) {
  const privateKeyPath = required(options, 'private-key-out');
  const signerPath = required(options, 'signer-out');
  const keyID = required(options, 'key-id');
  const displayName = required(options, 'display-name');
  const { privateKey } = generateKeyPairSync('ed25519');
  const privatePEM = privateKey.export({ format: 'pem', type: 'pkcs8' });
  await writeFile(privateKeyPath, privatePEM, { mode: 0o600 });
  await chmod(privateKeyPath, 0o600);
  const signer = signerRecord(privateKey, keyID, displayName);
  await writeFile(signerPath, `${JSON.stringify(signer, null, 2)}\n`, { mode: 0o600 });
  console.log(JSON.stringify({ privateKeyPath, signerPath, keyID }, null, 2));
}

async function printPublicKey(options) {
  const privateKey = createPrivateKey(await readFile(required(options, 'private-key')));
  const signer = signerRecord(
    privateKey,
    required(options, 'key-id'),
    required(options, 'display-name')
  );
  process.stdout.write(`${JSON.stringify(signer, null, 2)}\n`);
}

async function signBundle(options) {
  const manifestPath = required(options, 'manifest');
  const gpxPath = required(options, 'gpx');
  const privateKeyPath = required(options, 'private-key');
  const keyID = required(options, 'key-id');
  const outputPath = required(options, 'out');

  const [manifestJSON, gpx, privateKeyPEM] = await Promise.all([
    readBounded(manifestPath, MAX_MANIFEST_BYTES),
    readBounded(gpxPath, MAX_GPX_BYTES),
    readFile(privateKeyPath)
  ]);
  const manifest = JSON.parse(manifestJSON.toString('utf8'));
  validateManifest(manifest, gpx, new Date());
  const privateKey = createPrivateKey(privateKeyPEM);
  if (privateKey.asymmetricKeyType !== 'ed25519') {
    throw new Error('The route-bundle private key must be Ed25519.');
  }
  const signature = signBytes(null, signaturePayload(manifestJSON, gpx), privateKey);
  if (signature.length !== 64) throw new Error('Unexpected Ed25519 signature length.');

  const envelope = {
    formatVersion: '1.0',
    keyID,
    manifestJSON: manifestJSON.toString('base64'),
    gpx: gpx.toString('base64'),
    signature: signature.toString('base64'),
    createdAt: new Date().toISOString()
  };
  const output = Buffer.from(`${JSON.stringify(envelope, null, 2)}\n`);
  if (output.length > MAX_BUNDLE_BYTES) throw new Error('The signed bundle exceeds 25 MB.');
  await writeFile(outputPath, output);
  console.log(JSON.stringify({
    outputPath,
    keyID,
    routeID: manifest.routeID,
    bundleSHA256: sha256(output),
    gpxSHA256: sha256(gpx),
    expiresAt: manifest.expiresAt
  }, null, 2));
}

async function verifyBundle(options) {
  const bundlePath = required(options, 'bundle');
  const bundle = await readBounded(bundlePath, MAX_BUNDLE_BYTES);
  const envelope = JSON.parse(bundle.toString('utf8'));
  validateEnvelope(envelope);

  const manifestJSON = decodeBase64(envelope.manifestJSON, 'manifestJSON');
  const gpx = decodeBase64(envelope.gpx, 'gpx');
  const signature = decodeBase64(envelope.signature, 'signature');
  if (manifestJSON.length > MAX_MANIFEST_BYTES) throw new Error('Manifest exceeds 1 MB.');
  if (gpx.length > MAX_GPX_BYTES) throw new Error('GPX exceeds 20 MB.');
  if (signature.length !== 64) throw new Error('Invalid Ed25519 signature length.');

  const rawPublicKey = options['public-key-base64']
    ? decodeBase64(options['public-key-base64'], 'public-key-base64')
    : await findTrustedPublicKey(required(options, 'trusted-signers'), envelope.keyID);
  if (rawPublicKey.length !== 32) throw new Error('Ed25519 public key must be 32 bytes.');
  const publicKey = publicKeyFromRaw(rawPublicKey);
  const valid = verifyBytes(null, signaturePayload(manifestJSON, gpx), publicKey, signature);
  if (!valid) throw new Error('Signed route-bundle signature is invalid.');

  const manifest = JSON.parse(manifestJSON.toString('utf8'));
  validateManifest(manifest, gpx, new Date());
  console.log(JSON.stringify({
    valid: true,
    keyID: envelope.keyID,
    routeID: manifest.routeID,
    routeVersion: manifest.routeVersion,
    bundleSHA256: sha256(bundle),
    gpxSHA256: sha256(gpx),
    expiresAt: manifest.expiresAt
  }, null, 2));
}

function validateEnvelope(envelope) {
  if (!envelope || envelope.formatVersion !== '1.0') {
    throw new Error(`Unsupported route-bundle format: ${envelope?.formatVersion ?? 'missing'}.`);
  }
  for (const field of ['keyID', 'manifestJSON', 'gpx', 'signature', 'createdAt']) {
    if (typeof envelope[field] !== 'string' || envelope[field].length === 0) {
      throw new Error(`Bundle field ${field} is required.`);
    }
  }
  parseDate(envelope.createdAt, 'createdAt');
}

function validateManifest(manifest, gpx, now) {
  for (const field of ['routeID', 'routeVersion', 'gpxFileName', 'gpxSHA256']) {
    requireText(manifest[field], field);
  }
  if (!manifest.gpxFileName.toLowerCase().endsWith('.gpx')) {
    throw new Error('gpxFileName must end in .gpx.');
  }
  if (manifest.status !== 'operationalCandidate') {
    throw new Error('Manifest status must be operationalCandidate.');
  }
  if (manifest.gpxSHA256.toLowerCase() !== sha256(gpx)) {
    throw new Error('Manifest GPX SHA-256 does not match the bundled bytes.');
  }

  for (const field of ['name', 'organization', 'role', 'contactEvidenceRef']) {
    requireText(manifest.verifiedBy?.[field], `verifiedBy.${field}`);
  }
  const verifiedAt = parseDate(manifest.verifiedAt, 'verifiedAt');
  const accessCheckedAt = parseDate(manifest.accessCheckedAt, 'accessCheckedAt');
  const weatherCheckedAt = parseDate(manifest.weatherCheckedAt, 'weatherCheckedAt');
  const expiresAt = parseDate(manifest.expiresAt, 'expiresAt');
  const riderAcknowledgedAt = parseDate(manifest.riderAcknowledgedAt, 'riderAcknowledgedAt');
  const tolerance = 5 * 60_000;
  if (verifiedAt - now > tolerance || accessCheckedAt - now > tolerance ||
      weatherCheckedAt - now > tolerance || riderAcknowledgedAt - now > tolerance) {
    throw new Error('Manifest contains materially future-dated evidence.');
  }
  if (now - accessCheckedAt > 72 * 60 * 60_000) throw new Error('Access check is older than 72 hours.');
  if (now - weatherCheckedAt > 24 * 60 * 60_000) throw new Error('Weather check is older than 24 hours.');
  if (expiresAt <= now || expiresAt < verifiedAt) throw new Error('Manifest is expired or has an invalid expiry.');
  if (riderAcknowledgedAt < verifiedAt) throw new Error('Rider acknowledgement predates verification.');

  if (!Array.isArray(manifest.officialSources) || manifest.officialSources.length === 0) {
    throw new Error('At least one official source is required.');
  }
  for (const source of manifest.officialSources) {
    requireText(source.label, 'officialSources.label');
    requireText(source.authority, 'officialSources.authority');
    requireText(source.evidenceRef, 'officialSources.evidenceRef');
    const checkedAt = parseDate(source.checkedAt, 'officialSources.checkedAt');
    if (checkedAt - now > tolerance || now - checkedAt > 72 * 60 * 60_000) {
      throw new Error('An official source is stale or future-dated.');
    }
  }

  for (const permit of manifest.permits ?? []) {
    requireText(permit.permitType, 'permits.permitType');
    requireText(permit.authority, 'permits.authority');
    requireText(permit.evidenceRef, 'permits.evidenceRef');
    if (!['approved', 'notRequired'].includes(permit.status)) {
      throw new Error(`Permit ${permit.permitType} is not approved or notRequired.`);
    }
    if (permit.validFrom && parseDate(permit.validFrom, 'permits.validFrom') - now > tolerance) {
      throw new Error(`Permit ${permit.permitType} is not yet valid.`);
    }
    if (permit.validUntil && parseDate(permit.validUntil, 'permits.validUntil') <= now) {
      throw new Error(`Permit ${permit.permitType} is expired.`);
    }
  }

  if (!Array.isArray(manifest.segments) || manifest.segments.length === 0) {
    throw new Error('At least one route segment is required.');
  }
  for (const segment of manifest.segments) validateSegment(segment, now, tolerance);

  if (!['GO', 'CONDITIONAL_GO'].includes(manifest.goNoGo?.decision)) {
    throw new Error('The signed go/no-go decision does not authorize departure.');
  }
  requireText(manifest.goNoGo.decidedBy, 'goNoGo.decidedBy');
  requireText(manifest.goNoGo.evidenceRef, 'goNoGo.evidenceRef');
  const decidedAt = parseDate(manifest.goNoGo.decidedAt, 'goNoGo.decidedAt');
  if (decidedAt < verifiedAt || decidedAt - now > tolerance) {
    throw new Error('goNoGo.decidedAt is invalid.');
  }
  if (manifest.goNoGo.decision === 'CONDITIONAL_GO' &&
      (!Array.isArray(manifest.goNoGo.conditions) || !manifest.goNoGo.conditions.some(nonempty))) {
    throw new Error('CONDITIONAL_GO requires explicit conditions.');
  }
}

function validateSegment(segment, now, tolerance) {
  for (const field of ['id', 'from', 'to', 'surface', 'evidenceRef']) {
    requireText(segment[field], `segments.${field}`);
  }
  if (!['open', 'conditional'].includes(segment.status)) {
    throw new Error(`Segment ${segment.id} is closed or unknown.`);
  }
  if (segment.status === 'conditional' &&
      (!Array.isArray(segment.conditions) || !segment.conditions.some(nonempty))) {
    throw new Error(`Conditional segment ${segment.id} requires explicit conditions.`);
  }
  const checkedAt = parseDate(segment.checkedAt, `segments.${segment.id}.checkedAt`);
  if (checkedAt - now > tolerance || now - checkedAt > 72 * 60 * 60_000) {
    throw new Error(`Segment ${segment.id} was not checked within 72 hours.`);
  }
  if (segment.bailout?.available !== true) throw new Error(`Segment ${segment.id} has no confirmed bailout.`);
  requireText(segment.bailout.description, `segments.${segment.id}.bailout.description`);
  if (segment.protectedArea?.insideOrAdjacent) {
    requireText(segment.protectedArea.authority, `segments.${segment.id}.protectedArea.authority`);
    requireText(segment.protectedArea.permitEvidenceRef, `segments.${segment.id}.protectedArea.permitEvidenceRef`);
  }
  if (segment.landownerPermission?.required) {
    if (segment.landownerPermission.status !== 'approved') {
      throw new Error(`Segment ${segment.id} lacks approved landowner permission.`);
    }
    requireText(segment.landownerPermission.evidenceRef, `segments.${segment.id}.landownerPermission.evidenceRef`);
  }
}

function signaturePayload(manifestJSON, gpx) {
  return Buffer.concat([DOMAIN, uint64(manifestJSON.length), manifestJSON, uint64(gpx.length), gpx]);
}

function signerRecord(privateKey, keyID, displayName) {
  const jwk = createPublicKey(privateKey).export({ format: 'jwk' });
  const raw = decodeBase64URL(jwk.x);
  if (raw.length !== 32) throw new Error('Unexpected Ed25519 public-key length.');
  return {
    keyID,
    displayName,
    publicKeyBase64: raw.toString('base64'),
    enabled: true,
    validFrom: null,
    validUntil: null
  };
}

async function findTrustedPublicKey(path, keyID) {
  const records = JSON.parse((await readBounded(path, MAX_MANIFEST_BYTES)).toString('utf8'));
  const signer = records.find(record => record.keyID === keyID && record.enabled !== false);
  if (!signer) throw new Error(`Signer ${keyID} is not trusted.`);
  const now = new Date();
  if (signer.validFrom && parseDate(signer.validFrom, 'signer.validFrom') > now) throw new Error('Signer is not yet valid.');
  if (signer.validUntil && parseDate(signer.validUntil, 'signer.validUntil') <= now) throw new Error('Signer is expired.');
  return decodeBase64(signer.publicKeyBase64, 'publicKeyBase64');
}

function publicKeyFromRaw(raw) {
  const prefix = Buffer.from('302a300506032b6570032100', 'hex');
  return createPublicKey({ key: Buffer.concat([prefix, raw]), format: 'der', type: 'spki' });
}

async function readBounded(path, maximum) {
  const data = await readFile(path);
  if (data.length > maximum) throw new Error(`${path} exceeds the ${maximum}-byte limit.`);
  return data;
}

function parseArgs(values) {
  const result = {};
  for (let index = 0; index < values.length; index += 1) {
    const token = values[index];
    if (!token.startsWith('--')) throw new Error(`Unexpected argument: ${token}`);
    const name = token.slice(2);
    const value = values[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for --${name}`);
    result[name] = value;
    index += 1;
  }
  return result;
}

function required(options, name) {
  const value = options[name];
  if (!value) throw new Error(`--${name} is required.`);
  return value;
}

function requireText(value, field) {
  if (typeof value !== 'string' || value.trim().length === 0) throw new Error(`${field} is required.`);
}

function parseDate(value, field) {
  const date = new Date(value);
  if (typeof value !== 'string' || Number.isNaN(date.valueOf())) throw new Error(`${field} must be an ISO 8601 timestamp.`);
  return date;
}

function decodeBase64(value, field) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9+/]*={0,2}$/.test(value) || value.length % 4 !== 0) {
    throw new Error(`${field} is not valid base64.`);
  }
  return Buffer.from(value, 'base64');
}

function decodeBase64URL(value) {
  return Buffer.from(value.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

function uint64(value) {
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(value));
  return buffer;
}

function sha256(data) {
  return createHash('sha256').update(data).digest('hex');
}

function nonempty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function usage() {
  console.error(`Usage:
  node Tools/signed-route-bundle.mjs generate-key --private-key-out signer.pem --signer-out signer.json --key-id ID --display-name NAME
  node Tools/signed-route-bundle.mjs public-key --private-key signer.pem --key-id ID --display-name NAME
  node Tools/signed-route-bundle.mjs sign --manifest manifest.json --gpx route.gpx --private-key signer.pem --key-id ID --out route.eqroute
  node Tools/signed-route-bundle.mjs verify --bundle route.eqroute --trusted-signers trusted-route-signers.json
  node Tools/signed-route-bundle.mjs verify --bundle route.eqroute --public-key-base64 BASE64`);
}
