import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from './_lib/db';
import { profiles } from './_lib/schema';
import { authenticateRequest, sendError } from './_lib/auth';
import { eq } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { userId } = authenticateRequest(req);

    if (req.method === 'GET') {
      const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
      return res.status(200).json(profile || { userId, name: '', email: '' });
    }

    if (req.method === 'PUT') {
      const { name, email } = req.body;
      await db.insert(profiles)
        .values({ userId, name: name || '', email: email || '' })
        .onConflictDoUpdate({ target: profiles.userId, set: { name: name || '', email: email || '' } });
      return res.status(200).json({ success: true });
    }

    return sendError(res, 405, 'Method not allowed');
  } catch (err: any) {
    const status = err.message?.includes('token') || err.message?.includes('Authorization') ? 401 : 500;
    return sendError(res, status, err.message || 'Error');
  }
}
