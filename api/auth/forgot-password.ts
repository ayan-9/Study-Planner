import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../_lib/db';
import { users, passwordResetTokens } from '../_lib/schema';
import { sendError, generateId } from '../_lib/auth';
import { eq } from 'drizzle-orm';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return sendError(res, 405, 'Method not allowed');

  try {
    const { email } = req.body;
    if (!email) return sendError(res, 400, 'Email is required');

    // Always return success even if email not found (security best practice)
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    if (!user) return res.status(200).json({ message: 'If this email exists, a reset link has been sent.' });

    // Delete any existing unused tokens for this user
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));

    // Generate a secure token
    const token = generateId() + generateId() + generateId();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.insert(passwordResetTokens).values({
      id: generateId(),
      userId: user.id,
      token,
      expiresAt,
    });

    const appUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.APP_URL || 'http://localhost:8080';

    const resetLink = `${appUrl}/reset-password?token=${token}`;

    await resend.emails.send({
      from: 'StudyPlan Pro <noreply@resend.dev>',
      to: user.email,
      subject: 'Reset your StudyPlan Pro password',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #0ea5e9;">StudyPlan Pro</h2>
          <h3>Reset Your Password</h3>
          <p>Hi ${user.name},</p>
          <p>We received a request to reset your password. Click the button below to set a new password:</p>
          <a href="${resetLink}"
            style="display:inline-block;background:#0ea5e9;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">
            Reset Password
          </a>
          <p style="color:#666;font-size:13px;">This link expires in <strong>1 hour</strong>. If you didn't request this, you can safely ignore this email.</p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0;"/>
          <p style="color:#999;font-size:12px;">StudyPlan Pro — Your Smart Study Companion</p>
        </div>
      `,
    });

    return res.status(200).json({ message: 'If this email exists, a reset link has been sent.' });
  } catch (err: any) {
    return sendError(res, 500, err.message || 'Failed to send reset email');
  }
}
