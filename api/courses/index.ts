import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../_lib/db';
import { courses } from '../../_lib/schema';
import { authenticateRequest, sendError, generateId } from '../../_lib/auth';
import { eq, and } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { userId } = authenticateRequest(req);

    if (req.method === 'GET') {
      const all = await db.select().from(courses).where(eq(courses.userId, userId));
      return res.status(200).json(all);
    }

    if (req.method === 'POST') {
      const { name, color, fileName, weeklyContent, createdAt } = req.body;
      if (!name) return sendError(res, 400, 'name is required');
      const id = generateId();
      const [created] = await db.insert(courses).values({
        id, userId, name, color: color || '', fileName, weeklyContent,
        createdAt: createdAt ? new Date(createdAt) : new Date(),
      }).returning();
      return res.status(201).json(created);
    }

    return sendError(res, 405, 'Method not allowed');
  } catch (err: any) {
    const status = err.message?.includes('token') || err.message?.includes('Authorization') ? 401 : 500;
    return sendError(res, status, err.message || 'Error');
  }
}
