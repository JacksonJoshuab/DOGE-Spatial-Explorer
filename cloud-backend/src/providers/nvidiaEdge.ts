import { createHmac, timingSafeEqual } from "node:crypto";

type Environment = Record<string, string | undefined>;

export interface JetsonRegistration {
  deviceId: string;
  timestamp: number;
  signature: string;
}

export function createJetsonRegistrationSignature(deviceId: string, timestamp: number, secret: string): string {
  return createHmac("sha256", secret).update(`${deviceId}.${timestamp}`).digest("hex");
}

/**
 * Validates a short-lived HMAC signed by a provisioned Jetson edge device.
 */
export function verifyJetsonRegistration(
  registration: JetsonRegistration,
  env: Environment = process.env,
  now = Date.now(),
): boolean {
  const secret = env.NVIDIA_JETSON_SHARED_SECRET;
  if (!secret) throw new Error("Set NVIDIA_JETSON_SHARED_SECRET to enable Jetson device registration");
  if (!Number.isSafeInteger(registration.timestamp) || Math.abs(now - registration.timestamp) > 5 * 60 * 1000) {
    return false;
  }

  const expected = Buffer.from(createJetsonRegistrationSignature(registration.deviceId, registration.timestamp, secret), "hex");
  const supplied = Buffer.from(registration.signature, "hex");
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}
