import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../_lib/db';
import { tasks } from '../../_lib/schema';
import { authenticateRequest, sendError, generateId } from '../../_lib/auth';
import { eq } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { userId } = authenticateRequest(req);

    if (req.method === 'GET') {
      const all = await db.select().from(tasks).where(eq(tasks.userId, userId));
      return res.status(200).json(all);
    }

    if (req.method === 'PUT') {
      const newTasks: any[] = req.body;
      await db.delete(tasks).where(eq(tasks.userId, userId));
      if (Array.isArray(newTasks) && newTasks.length > 0) {
        await db.insert(tasks).values(
          newTasks.map(t => ({
            id: t.id || generateId(),
            userId,
            courseId: t.courseId,
            title: t.title,
            description: t.description || '',
            week: t.week,
            day: t.day,
            status: t.status || 'pending',
            dueDate: new Date(t.dueDate),
            startTime: t.startTime,
            endTime: t.endTime,
          }))
        );
      }
      return res.status(200).json({ success: true });
    }

    return sendError(res, 405, 'Method not allowed');
  } catch (err: any) {
    const status = err.message?.includes('token') || err.message?.includes('Authorization') ? 401 : 500;
    return sendError(res, status, err.message || 'Error');
  }
}
