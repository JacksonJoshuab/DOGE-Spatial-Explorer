// auth.ts
// DOGE Spatial Explorer — Authentication Routes

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { verifyOidcIdToken } from '../providers/oidc.js';
import { verifyMetaAccessToken } from '../providers/meta.js';
import { getMicrosoftProfile } from '../providers/microsoftGraph.js';
import { issueSession } from '../providers/session.js';

export const authRouter: Router = Router();

const users = new Map<string, any>();

function respondWithSession(
  res: Response,
  identity: { userId: string; displayName: string; email?: string; provider: 'password' | 'apple' | 'microsoft' | 'meta' },
) {
  const token = issueSession(identity);
  return res.json({
    token,
    user: {
      id: identity.userId,
      displayName: identity.displayName,
      email: identity.email,
      provider: identity.provider,
    },
  });
}

function providerError(res: Response, provider: string, error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown provider error';
  console.warn(`[Auth] ${provider} sign-in failed: ${message}`);
  return res.status(401).json({ error: `${provider} sign-in could not be verified` });
}

// Register
authRouter.post('/register', async (req: Request, res: Response) => {
  const { email, password, displayName } = req.body;

  if (users.has(email)) {
    return res.status(409).json({ error: 'User already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = {
    id: uuidv4(),
    email,
    displayName: displayName || email.split('@')[0],
    passwordHash: hashedPassword,
    createdAt: new Date().toISOString(),
  };

  users.set(email, user);

  res.status(201);
  return respondWithSession(res, {
    userId: user.id,
    email: user.email,
    displayName: user.displayName,
    provider: 'password',
  });
});

// Login
authRouter.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = users.get(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  return respondWithSession(res, {
    userId: user.id,
    email: user.email,
    displayName: user.displayName,
    provider: 'password',
  });
});

// Refresh token
authRouter.post('/refresh', async (req: Request, res: Response) => {
  const { token } = req.body as { token?: string };
  if (!token) return res.status(400).json({ error: 'Token is required' });

  try {
    const { verifySession } = await import('../providers/session.js');
    const decoded = verifySession(token);
    return respondWithSession(res, decoded);
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

// Apple Sign In (visionOS/iPadOS/tvOS). The identity token is checked against Apple's JWKS.
authRouter.post('/apple', async (req: Request, res: Response) => {
  const { identityToken, fullName } = req.body as {
    identityToken?: string;
    fullName?: { givenName?: string; familyName?: string };
  };
  if (!identityToken) return res.status(400).json({ error: 'Apple identity token is required' });
  if (!process.env.APPLE_CLIENT_ID) return res.status(503).json({ error: 'Apple sign-in is not configured' });

  try {
    const identity = await verifyOidcIdToken({
      token: identityToken,
      audience: process.env.APPLE_CLIENT_ID,
      issuer: 'https://appleid.apple.com',
      jwksUrl: 'https://appleid.apple.com/auth/keys',
    });
    const submittedName = [fullName?.givenName, fullName?.familyName].filter(Boolean).join(' ').trim();
    return respondWithSession(res, {
      userId: `apple:${identity.subject}`,
      email: identity.email,
      displayName: submittedName || identity.displayName || identity.email || 'Apple user',
      provider: 'apple',
    });
  } catch (error) {
    return providerError(res, 'Apple', error);
  }
});

// Microsoft Entra ID sign-in. The frontend must request the configured client ID as audience.
authRouter.post('/microsoft', async (req: Request, res: Response) => {
  const { idToken, accessToken } = req.body as { idToken?: string; accessToken?: string };
  const tenantId = process.env.MICROSOFT_TENANT_ID;
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  if (!idToken) return res.status(400).json({ error: 'Microsoft ID token is required' });
  if (!tenantId || !clientId) return res.status(503).json({ error: 'Microsoft sign-in is not configured' });

  try {
    const issuer = `https://login.microsoftonline.com/${tenantId}/v2.0`;
    const identity = await verifyOidcIdToken({
      token: idToken,
      audience: clientId,
      issuer,
      jwksUrl: `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`,
    });
    const graphProfile = accessToken ? await getMicrosoftProfile(accessToken).catch(() => undefined) : undefined;

    return respondWithSession(res, {
      userId: `microsoft:${identity.subject}`,
      email: graphProfile?.email ?? graphProfile?.userPrincipalName ?? identity.email,
      displayName: graphProfile?.displayName ?? identity.displayName ?? identity.email ?? 'Microsoft user',
      provider: 'microsoft',
    });
  } catch (error) {
    return providerError(res, 'Microsoft', error);
  }
});

// Meta Quest/Horizon sign-in. Access tokens are introspected server-side with the Meta app secret.
authRouter.post('/meta', async (req: Request, res: Response) => {
  const { accessToken, displayName } = req.body as { accessToken?: string; displayName?: string };
  if (!accessToken) return res.status(400).json({ error: 'Meta access token is required' });

  try {
    const identity = await verifyMetaAccessToken(accessToken);
    return respondWithSession(res, {
      userId: `meta:${identity.subject}`,
      displayName: displayName?.trim() || 'Meta Quest user',
      provider: 'meta',
    });
  } catch (error) {
    return providerError(res, 'Meta', error);
  }
});
