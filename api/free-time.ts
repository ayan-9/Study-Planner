import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from './_lib/db';
import { freeTimeSettings } from './_lib/schema';
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
      const [ft] = await db.select().from(freeTimeSettings).where(eq(freeTimeSettings.userId, userId));
      return res.status(200).json(ft || { userId, dailyHours: 3, weeklyAvailability: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: false, sunday: false } });
    }

    if (req.method === 'PUT') {
      const { dailyHours, weeklyAvailability } = req.body;
      await db.insert(freeTimeSettings)
        .values({ userId, dailyHours, weeklyAvailability })
        .onConflictDoUpdate({ target: freeTimeSettings.userId, set: { dailyHours, weeklyAvailability } });
      return res.status(200).json({ success: true });
    }

    return sendError(res, 405, 'Method not allowed');
  } catch (err: any) {
    const status = err.message?.includes('token') || err.message?.includes('Authorization') ? 401 : 500;
    return sendError(res, status, err.message || 'Error');
  }
}
