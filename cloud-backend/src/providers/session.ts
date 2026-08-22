import jwt from "jsonwebtoken";

export interface SessionIdentity {
  userId: string;
  displayName: string;
  email?: string;
  provider: "password" | "apple" | "microsoft" | "meta";
}

const SESSION_ISSUER = "doge-spatial";
const SESSION_AUDIENCE = "doge-spatial-clients";

export function getSessionSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET is required in production");
  }
  return "development-only-secret-not-for-production";
}

export function issueSession(identity: SessionIdentity): string {
  return jwt.sign(identity, getSessionSecret(), {
    expiresIn: "7d",
    issuer: SESSION_ISSUER,
    audience: SESSION_AUDIENCE,
  });
}

export function verifySession(token: string): SessionIdentity {
  return jwt.verify(token, getSessionSecret(), {
    issuer: SESSION_ISSUER,
    audience: SESSION_AUDIENCE,
  }) as SessionIdentity;
}
