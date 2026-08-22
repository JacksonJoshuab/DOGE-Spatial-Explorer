// DOGE Spatial Explorer — Authentication Routes

import { Router, Request, Response } from 'express';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { verifyOidcIdToken } from '../providers/oidc.js';
import { verifyMetaAccessToken } from '../providers/meta.js';
import { getMicrosoftProfile, probeMicrosoftGraph } from '../providers/microsoftGraph.js';
import { issueSession } from '../providers/session.js';

export const authRouter: Router = Router();

const users = new Map<string, any>();
const oidcNonces = new Map<string, { provider: 'apple' | 'microsoft'; expiresAt: number }>();
const NONCE_TTL_MS = 10 * 60 * 1000;

function nonceRequired(): boolean { return process.env.REQUIRE_OIDC_NONCE !== 'false'; }
function nonceKey(provider: 'apple' | 'microsoft', nonce: string): string { return `${provider}:${nonce}`; }

function hasIssuedNonce(provider: 'apple' | 'microsoft', nonce: string | undefined): boolean {
  if (!nonce) return false;
  const key = nonceKey(provider, nonce);
  const item = oidcNonces.get(key);
  if (!item || item.expiresAt <= Date.now()) { oidcNonces.delete(key); return false; }
  return true;
}

function consumeIssuedNonce(provider: 'apple' | 'microsoft', nonce: string): void { oidcNonces.delete(nonceKey(provider, nonce)); }

function respondWithSession(res: Response, identity: { userId: string; displayName: string; email?: string; provider: 'password' | 'apple' | 'microsoft' | 'meta' }) {
  const token = issueSession(identity);
  return res.json({ token, user: { id: identity.userId, displayName: identity.displayName, email: identity.email, provider: identity.provider } });
}

function providerError(res: Response, provider: string, error: unknown) {
  console.warn(`[Auth] ${provider} sign-in failed: ${error instanceof Error ? error.message : 'Unknown provider error'}`);
  return res.status(401).json({ error: `${provider} sign-in could not be verified` });
}

authRouter.post('/register', async (req: Request, res: Response) => {
  const { email, password, displayName } = req.body;
  if (users.has(email)) return res.status(409).json({ error: 'User already exists' });
  const user = { id: uuidv4(), email, displayName: displayName || email.split('@')[0], passwordHash: await bcrypt.hash(password, 12), createdAt: new Date().toISOString() };
  users.set(email, user);
  res.status(201);
  return respondWithSession(res, { userId: user.id, email: user.email, displayName: user.displayName, provider: 'password' });
});

authRouter.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = users.get(email);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: 'Invalid credentials' });
  return respondWithSession(res, { userId: user.id, email: user.email, displayName: user.displayName, provider: 'password' });
});

authRouter.post('/refresh', async (req: Request, res: Response) => {
  const { token } = req.body as { token?: string };
  if (!token) return res.status(400).json({ error: 'Token is required' });
  try {
    const { verifySession } = await import('../providers/session.js');
    return respondWithSession(res, verifySession(token));
  } catch { return res.status(401).json({ error: 'Invalid token' }); }
});

// The returned value must be sent to the identity provider and supplied with the matching ID token.
authRouter.post('/nonce', (req: Request, res: Response) => {
  const provider = req.body?.provider as 'apple' | 'microsoft' | undefined;
  if (provider !== 'apple' && provider !== 'microsoft') return res.status(400).json({ error: 'Provider must be apple or microsoft' });
  const nonce = randomBytes(32).toString('base64url');
  const expiresAt = Date.now() + NONCE_TTL_MS;
  for (const [key, item] of oidcNonces) if (item.expiresAt <= Date.now()) oidcNonces.delete(key);
  oidcNonces.set(nonceKey(provider, nonce), { provider, expiresAt });
  return res.json({ provider, nonce, expiresAt: new Date(expiresAt).toISOString() });
});

authRouter.post('/apple', async (req: Request, res: Response) => {
  const { identityToken, fullName, nonce } = req.body as { identityToken?: string; fullName?: { givenName?: string; familyName?: string }; nonce?: string };
  if (!identityToken) return res.status(400).json({ error: 'Apple identity token is required' });
  if (!process.env.APPLE_CLIENT_ID) return res.status(503).json({ error: 'Apple sign-in is not configured' });
  if (nonceRequired() && !hasIssuedNonce('apple', nonce)) return res.status(401).json({ error: 'A valid Apple sign-in nonce is required' });
  try {
    const identity = await verifyOidcIdToken({ token: identityToken, audience: process.env.APPLE_CLIENT_ID, issuer: 'https://appleid.apple.com', jwksUrl: 'https://appleid.apple.com/auth/keys', nonce });
    if (nonce) consumeIssuedNonce('apple', nonce);
    const submittedName = [fullName?.givenName, fullName?.familyName].filter(Boolean).join(' ').trim();
    return respondWithSession(res, { userId: `apple:${identity.subject}`, email: identity.email, displayName: submittedName || identity.displayName || identity.email || 'Apple user', provider: 'apple' });
  } catch (error) { return providerError(res, 'Apple', error); }
});

authRouter.post('/microsoft', async (req: Request, res: Response) => {
  const { idToken, accessToken, nonce } = req.body as { idToken?: string; accessToken?: string; nonce?: string };
  const tenantId = process.env.MICROSOFT_TENANT_ID;
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  if (!idToken) return res.status(400).json({ error: 'Microsoft ID token is required' });
  if (!tenantId || !clientId) return res.status(503).json({ error: 'Microsoft sign-in is not configured' });
  if (nonceRequired() && !hasIssuedNonce('microsoft', nonce)) return res.status(401).json({ error: 'A valid Microsoft sign-in nonce is required' });
  try {
    const identity = await verifyOidcIdToken({ token: idToken, audience: clientId, issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`, jwksUrl: `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`, nonce });
    if (nonce) consumeIssuedNonce('microsoft', nonce);
    const graphProfile = accessToken ? await getMicrosoftProfile(accessToken).catch(() => undefined) : undefined;
    return respondWithSession(res, { userId: `microsoft:${identity.subject}`, email: graphProfile?.email ?? graphProfile?.userPrincipalName ?? identity.email, displayName: graphProfile?.displayName ?? identity.displayName ?? identity.email ?? 'Microsoft user', provider: 'microsoft' });
  } catch (error) { return providerError(res, 'Microsoft', error); }
});

// Performs a delegated User.Read readiness check and never returns the submitted access token.
authRouter.post('/microsoft/graph-readiness', async (req: Request, res: Response) => {
  const { accessToken } = req.body as { accessToken?: string };
  if (!accessToken) return res.status(400).json({ error: 'Microsoft delegated access token is required' });
  const readiness = await probeMicrosoftGraph(accessToken);
  return res.status(readiness.ready ? 200 : 401).json(readiness);
});

authRouter.post('/meta', async (req: Request, res: Response) => {
  const { accessToken, displayName } = req.body as { accessToken?: string; displayName?: string };
  if (!accessToken) return res.status(400).json({ error: 'Meta access token is required' });
  try {
    const identity = await verifyMetaAccessToken(accessToken);
    return respondWithSession(res, { userId: `meta:${identity.subject}`, displayName: displayName?.trim() || 'Meta Quest user', provider: 'meta' });
  } catch (error) { return providerError(res, 'Meta', error); }
});
