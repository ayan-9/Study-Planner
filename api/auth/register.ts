import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../_lib/db';
import { users, profiles, scheduleConfigs, freeTimeSettings } from '../_lib/schema';
import { hashPassword, signToken, generateId, sendError } from '../_lib/auth';
import { eq } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return sendError(res, 405, 'Method not allowed');

  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) return sendError(res, 400, 'email, password and name are required');
    if (password.length < 6) return sendError(res, 400, 'Password must be at least 6 characters');

    const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    if (existing.length > 0) return sendError(res, 409, 'An account with this email already exists');

    const id = generateId();
    const hashed = await hashPassword(password);

    await db.insert(users).values({ id, email: email.toLowerCase(), password: hashed, name });
    await db.insert(profiles).values({ userId: id, name, email: email.toLowerCase() });
    await db.insert(scheduleConfigs).values({ userId: id });
    await db.insert(freeTimeSettings).values({ userId: id });

    const token = signToken({ userId: id, email: email.toLowerCase() });
    return res.status(201).json({ token, user: { id, email: email.toLowerCase(), name } });
  } catch (err: any) {
    return sendError(res, 500, err.message || 'Registration failed');
  }
}
