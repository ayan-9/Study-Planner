import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from './_lib/db';
import { scheduleConfigs } from './_lib/schema';
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
      const [config] = await db.select().from(scheduleConfigs).where(eq(scheduleConfigs.userId, userId));
      return res.status(200).json(config || { userId, selectedDates: [], availabilityStart: '09:00', availabilityEnd: '21:00', breakIntervals: [], selectedCourseIds: [] });
    }

    if (req.method === 'PUT') {
      const { selectedDates, availabilityStart, availabilityEnd, breakIntervals, selectedCourseIds } = req.body;
      await db.insert(scheduleConfigs)
        .values({ userId, selectedDates, availabilityStart, availabilityEnd, breakIntervals, selectedCourseIds })
        .onConflictDoUpdate({ target: scheduleConfigs.userId, set: { selectedDates, availabilityStart, availabilityEnd, breakIntervals, selectedCourseIds } });
      return res.status(200).json({ success: true });
    }

    return sendError(res, 405, 'Method not allowed');
  } catch (err: any) {
    const status = err.message?.includes('token') || err.message?.includes('Authorization') ? 401 : 500;
    return sendError(res, status, err.message || 'Error');
  }
}
