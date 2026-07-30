import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../_lib/db';
import { users } from '../_lib/schema';
import { comparePassword, signToken, sendError } from '../_lib/auth';
import { eq } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return sendError(res, 405, 'Method not allowed');

  try {
    const { email, password } = req.body;
    if (!email || !password) return sendError(res, 400, 'email and password are required');

    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    if (!user) return sendError(res, 401, 'Invalid email or password');

    const valid = await comparePassword(password, user.password);
    if (!valid) return sendError(res, 401, 'Invalid email or password');

    const token = signToken({ userId: user.id, email: user.email });
    return res.status(200).json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err: any) {
    return sendError(res, 500, err.message || 'Login failed');
  }
}
