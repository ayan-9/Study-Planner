import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../_lib/db';
import { users, passwordResetTokens } from '../_lib/schema';
import { hashPassword, sendError } from '../_lib/auth';
import { eq, and, gt } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return sendError(res, 405, 'Method not allowed');

  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return sendError(res, 400, 'token and newPassword are required');
    if (newPassword.length < 6) return sendError(res, 400, 'Password must be at least 6 characters');

    // Find valid, unused, non-expired token
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.used, false),
          gt(passwordResetTokens.expiresAt, new Date())
        )
      );

    if (!resetToken) return sendError(res, 400, 'This reset link is invalid or has expired. Please request a new one.');

    // Update password
    const hashed = await hashPassword(newPassword);
    await db.update(users).set({ password: hashed }).where(eq(users.id, resetToken.userId));

    // Mark token as used
    await db.update(passwordResetTokens).set({ used: true }).where(eq(passwordResetTokens.id, resetToken.id));

    return res.status(200).json({ message: 'Password updated successfully. You can now log in.' });
  } catch (err: any) {
    return sendError(res, 500, err.message || 'Failed to reset password');
  }
}
