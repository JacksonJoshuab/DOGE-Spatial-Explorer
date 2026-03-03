// auth.ts
// DOGE Spatial Explorer — Authentication Routes

import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const users = new Map<string, any>();

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

  const token = jwt.sign(
    { userId: user.id, email: user.email, displayName: user.displayName },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.status(201).json({
    token,
    user: { id: user.id, email: user.email, displayName: user.displayName },
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

  const token = jwt.sign(
    { userId: user.id, email: user.email, displayName: user.displayName },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: { id: user.id, email: user.email, displayName: user.displayName },
  });
});

// Refresh token
authRouter.post('/refresh', async (req: Request, res: Response) => {
  const { token } = req.body;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const newToken = jwt.sign(
      { userId: decoded.userId, email: decoded.email, displayName: decoded.displayName },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token: newToken });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Apple Sign In (for visionOS/iPadOS/tvOS)
authRouter.post('/apple', async (req: Request, res: Response) => {
  const { identityToken, authorizationCode, fullName } = req.body;

  // In production, verify the Apple identity token with Apple's servers
  const userId = uuidv4();
  const displayName = fullName?.givenName
    ? `${fullName.givenName} ${fullName.familyName || ''}`
    : 'Apple User';

  const token = jwt.sign(
    { userId, displayName, provider: 'apple' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: { id: userId, displayName, provider: 'apple' },
  });
});
