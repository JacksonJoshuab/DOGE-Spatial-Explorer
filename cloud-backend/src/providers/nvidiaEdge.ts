import { createHash, createHmac, timingSafeEqual } from "node:crypto";

type Environment = Record<string, string | undefined>;
const MAX_AGE_MS = 5 * 60 * 1000;
const replayNonces = new Map<string, number>();

export interface JetsonRegistration {
  deviceId: string;
  timestamp: number;
  signature: string;
}

export interface JetsonTelemetryEnvelope {
  deviceId: string;
  timestamp: number;
  nonce: string;
  payload: Record<string, unknown>;
  signature: string;
}

export function createJetsonRegistrationSignature(deviceId: string, timestamp: number, secret: string): string {
  return createHmac("sha256", secret).update(`${deviceId}.${timestamp}`).digest("hex");
}

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(object[key])}`).join(",")}}`;
}

function telemetryMessage(deviceId: string, timestamp: number, nonce: string, payload: Record<string, unknown>): string {
  const digest = createHash("sha256").update(canonicalize(payload)).digest("hex");
  return `${deviceId}.${timestamp}.${nonce}.${digest}`;
}

/** Validates a short-lived HMAC signed by a provisioned Jetson edge device. */
export function verifyJetsonRegistration(registration: JetsonRegistration, env: Environment = process.env, now = Date.now()): boolean {
  const secret = env.NVIDIA_JETSON_SHARED_SECRET;
  if (!secret) throw new Error("Set NVIDIA_JETSON_SHARED_SECRET to enable Jetson device registration");
  if (!Number.isSafeInteger(registration.timestamp) || Math.abs(now - registration.timestamp) > MAX_AGE_MS) return false;
  const expected = Buffer.from(createJetsonRegistrationSignature(registration.deviceId, registration.timestamp, secret), "hex");
  const supplied = Buffer.from(registration.signature, "hex");
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}

export function createJetsonTelemetrySignature(deviceId: string, timestamp: number, nonce: string, payload: Record<string, unknown>, secret: string): string {
  return createHmac("sha256", secret).update(telemetryMessage(deviceId, timestamp, nonce, payload)).digest("hex");
}

/** Verifies telemetry integrity and rejects duplicate nonces until the timestamp window expires. */
export function verifyJetsonTelemetry(envelope: JetsonTelemetryEnvelope, env: Environment = process.env, now = Date.now()): boolean {
  const secret = env.NVIDIA_JETSON_SHARED_SECRET;
  if (!secret) throw new Error("Set NVIDIA_JETSON_SHARED_SECRET to enable Jetson telemetry");
  if (!envelope.deviceId || !envelope.nonce || envelope.nonce.length > 128 || !Number.isSafeInteger(envelope.timestamp) || Math.abs(now - envelope.timestamp) > MAX_AGE_MS) return false;
  for (const [key, expiresAt] of replayNonces) if (expiresAt <= now) replayNonces.delete(key);
  const replayKey = `${envelope.deviceId}.${envelope.nonce}`;
  if (replayNonces.has(replayKey)) return false;
  const expected = Buffer.from(createJetsonTelemetrySignature(envelope.deviceId, envelope.timestamp, envelope.nonce, envelope.payload, secret), "hex");
  const supplied = Buffer.from(envelope.signature, "hex");
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return false;
  replayNonces.set(replayKey, now + MAX_AGE_MS);
  return true;
}

export function clearJetsonReplayCache(): void { replayNonces.clear(); }
