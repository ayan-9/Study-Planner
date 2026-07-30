import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../_lib/db';
import { tasks } from '../../_lib/schema';
import { authenticateRequest, sendError } from '../../_lib/auth';
import { eq, and } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { userId } = authenticateRequest(req);
    const { id } = req.query as { id: string };

    if (req.method === 'PATCH') {
      const { status } = req.body;
      const [updated] = await db.update(tasks)
        .set({ status })
        .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
        .returning();
      if (!updated) return sendError(res, 404, 'Task not found');
      return res.status(200).json(updated);
    }

    return sendError(res, 405, 'Method not allowed');
  } catch (err: any) {
    const status = err.message?.includes('token') || err.message?.includes('Authorization') ? 401 : 500;
    return sendError(res, status, err.message || 'Error');
  }
}
