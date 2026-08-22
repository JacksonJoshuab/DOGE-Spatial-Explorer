import { createPublicKey } from "node:crypto";
import jwt, { JwtPayload } from "jsonwebtoken";

type FetchLike = typeof fetch;

type Jwk = JsonWebKey & { kid?: string; use?: string; alg?: string };

export interface VerifiedIdentity {
  subject: string;
  email?: string;
  displayName?: string;
  claims: JwtPayload;
}

export interface VerifyOidcTokenOptions {
  token: string;
  issuer: string | string[];
  audience: string;
  jwksUrl: string;
  fetchImpl?: FetchLike;
}

const jwksCache = new Map<string, { expiresAt: number; keys: Jwk[] }>();
const JWKS_CACHE_TTL_MS = 60 * 60 * 1000;

async function getJwks(jwksUrl: string, fetchImpl: FetchLike): Promise<Jwk[]> {
  const cached = jwksCache.get(jwksUrl);
  if (cached && cached.expiresAt > Date.now()) return cached.keys;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);

  try {
    const response = await fetchImpl(jwksUrl, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`JWKS endpoint returned ${response.status}`);
    }

    const body = await response.json() as { keys?: Jwk[] };
    if (!Array.isArray(body.keys) || body.keys.length === 0) {
      throw new Error("JWKS response did not contain signing keys");
    }

    jwksCache.set(jwksUrl, { keys: body.keys, expiresAt: Date.now() + JWKS_CACHE_TTL_MS });
    return body.keys;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Verifies an OIDC ID token against the issuer's published JSON Web Key Set.
 * Tokens are never accepted based on client-provided profile claims alone.
 */
export async function verifyOidcIdToken(options: VerifyOidcTokenOptions): Promise<VerifiedIdentity> {
  const decoded = jwt.decode(options.token, { complete: true });
  if (!decoded || typeof decoded === "string" || !decoded.header.kid) {
    throw new Error("Identity token is missing a signing key identifier");
  }

  const keys = await getJwks(options.jwksUrl, options.fetchImpl ?? globalThis.fetch);
  const jwk = keys.find((key) => key.kid === decoded.header.kid);
  if (!jwk) {
    // Rotate cache once before rejecting a token signed by a recently introduced key.
    jwksCache.delete(options.jwksUrl);
    const refreshed = await getJwks(options.jwksUrl, options.fetchImpl ?? globalThis.fetch);
    const refreshedKey = refreshed.find((key) => key.kid === decoded.header.kid);
    if (!refreshedKey) throw new Error("Identity token signing key is not trusted");
    return verifyWithJwk(options, refreshedKey);
  }

  return verifyWithJwk(options, jwk);
}

function verifyWithJwk(options: VerifyOidcTokenOptions, jwk: Jwk): VerifiedIdentity {
  const key = createPublicKey({ key: jwk as unknown as Record<string, string>, format: "jwk" });
  const issuer = Array.isArray(options.issuer)
    ? options.issuer.length > 0
      ? [options.issuer[0], ...options.issuer.slice(1)] as [string, ...string[]]
      : undefined
    : options.issuer;
  const claims = jwt.verify(options.token, key, {
    algorithms: ["RS256"],
    audience: options.audience,
    issuer,
    clockTolerance: 5,
  }) as JwtPayload;

  if (!claims.sub) throw new Error("Identity token is missing a subject claim");

  return {
    subject: claims.sub,
    email: typeof claims.email === "string" ? claims.email : undefined,
    displayName:
      typeof claims.name === "string"
        ? claims.name
        : typeof claims.preferred_username === "string"
          ? claims.preferred_username
          : undefined,
    claims,
  };
}

export function clearOidcJwksCache(): void {
  jwksCache.clear();
}
