/**
 * Local development server — mirrors all Vercel serverless API routes as Express endpoints.
 * Run with: npm run server
 * Then run frontend with: npm run dev
 * Or run both together with: npm run dev:full
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { db } from '../api/_lib/db';
import {
  users, courses, tasks, profiles, scheduleConfigs, freeTimeSettings, passwordResetTokens,
} from '../api/_lib/schema';
import {
  hashPassword, comparePassword, signToken, verifyToken, generateId,
} from '../api/_lib/auth';
import { eq, and, gt } from 'drizzle-orm';
import { Resend } from 'resend';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;

// ─── Auth middleware helper ───────────────────────────────────
function getUser(req: express.Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) throw new Error('Missing or invalid Authorization header');
  const token = authHeader.slice(7);
  return verifyToken(token) as { userId: string; email: string };
}

// ─── AUTH ─────────────────────────────────────────────────────

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'email, password and name are required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    if (existing.length > 0) return res.status(409).json({ error: 'An account with this email already exists' });

    const id = generateId();
    const hashed = await hashPassword(password);
    await db.insert(users).values({ id, email: email.toLowerCase(), password: hashed, name });
    await db.insert(profiles).values({ userId: id, name, email: email.toLowerCase() });
    await db.insert(scheduleConfigs).values({ userId: id });
    await db.insert(freeTimeSettings).values({ userId: id });

    const token = signToken({ userId: id, email: email.toLowerCase() });
    return res.status(201).json({ token, user: { id, email: email.toLowerCase(), name } });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const valid = await comparePassword(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const token = signToken({ userId: user.id, email: user.email });
    return res.status(200).json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Login failed' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const { userId } = getUser(req);
    const [user] = await db.select({ id: users.id, email: users.email, name: users.name }).from(users).where(eq(users.id, userId));
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.status(200).json(user);
  } catch (err: any) {
    return res.status(err.message?.includes('token') || err.message?.includes('Authorization') ? 401 : 500).json({ error: err.message });
  }
});

// ─── COURSES ──────────────────────────────────────────────────

app.get('/api/courses', async (req, res) => {
  try {
    const { userId } = getUser(req);
    const all = await db.select().from(courses).where(eq(courses.userId, userId));
    return res.json(all);
  } catch (err: any) {
    return res.status(err.message?.includes('Authorization') ? 401 : 500).json({ error: err.message });
  }
});

app.post('/api/courses', async (req, res) => {
  try {
    const { userId } = getUser(req);
    const { name, color, fileName, weeklyContent, createdAt } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const id = generateId();
    const [created] = await db.insert(courses).values({
      id, userId, name, color: color || '', fileName, weeklyContent,
      createdAt: createdAt ? new Date(createdAt) : new Date(),
    }).returning();
    return res.status(201).json(created);
  } catch (err: any) {
    return res.status(err.message?.includes('Authorization') ? 401 : 500).json({ error: err.message });
  }
});

app.patch('/api/courses/:id', async (req, res) => {
  try {
    const { userId } = getUser(req);
    const { name, color, fileName, weeklyContent } = req.body;
    const [updated] = await db.update(courses)
      .set({ name, color, fileName, weeklyContent })
      .where(and(eq(courses.id, req.params.id), eq(courses.userId, userId)))
      .returning();
    if (!updated) return res.status(404).json({ error: 'Course not found' });
    return res.json(updated);
  } catch (err: any) {
    return res.status(err.message?.includes('Authorization') ? 401 : 500).json({ error: err.message });
  }
});

app.delete('/api/courses/:id', async (req, res) => {
  try {
    const { userId } = getUser(req);
    await db.delete(courses).where(and(eq(courses.id, req.params.id), eq(courses.userId, userId)));
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(err.message?.includes('Authorization') ? 401 : 500).json({ error: err.message });
  }
});

// ─── TASKS ────────────────────────────────────────────────────

app.get('/api/tasks', async (req, res) => {
  try {
    const { userId } = getUser(req);
    const all = await db.select().from(tasks).where(eq(tasks.userId, userId));
    return res.json(all);
  } catch (err: any) {
    return res.status(err.message?.includes('Authorization') ? 401 : 500).json({ error: err.message });
  }
});

app.put('/api/tasks', async (req, res) => {
  try {
    const { userId } = getUser(req);
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
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(err.message?.includes('Authorization') ? 401 : 500).json({ error: err.message });
  }
});

app.patch('/api/tasks/:id', async (req, res) => {
  try {
    const { userId } = getUser(req);
    const { status } = req.body;
    const [updated] = await db.update(tasks)
      .set({ status })
      .where(and(eq(tasks.id, req.params.id), eq(tasks.userId, userId)))
      .returning();
    if (!updated) return res.status(404).json({ error: 'Task not found' });
    return res.json(updated);
  } catch (err: any) {
    return res.status(err.message?.includes('Authorization') ? 401 : 500).json({ error: err.message });
  }
});

// ─── PROFILE ──────────────────────────────────────────────────

app.get('/api/profile', async (req, res) => {
  try {
    const { userId } = getUser(req);
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return res.json(profile || { userId, name: '', email: '' });
  } catch (err: any) {
    return res.status(err.message?.includes('Authorization') ? 401 : 500).json({ error: err.message });
  }
});

app.put('/api/profile', async (req, res) => {
  try {
    const { userId } = getUser(req);
    const { name, email } = req.body;
    await db.insert(profiles).values({ userId, name: name || '', email: email || '' })
      .onConflictDoUpdate({ target: profiles.userId, set: { name: name || '', email: email || '' } });
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(err.message?.includes('Authorization') ? 401 : 500).json({ error: err.message });
  }
});

// ─── SCHEDULE CONFIG ──────────────────────────────────────────

app.get('/api/schedule-config', async (req, res) => {
  try {
    const { userId } = getUser(req);
    const [config] = await db.select().from(scheduleConfigs).where(eq(scheduleConfigs.userId, userId));
    return res.json(config || { userId, selectedDates: [], availabilityStart: '09:00', availabilityEnd: '21:00', breakIntervals: [], selectedCourseIds: [] });
  } catch (err: any) {
    return res.status(err.message?.includes('Authorization') ? 401 : 500).json({ error: err.message });
  }
});

app.put('/api/schedule-config', async (req, res) => {
  try {
    const { userId } = getUser(req);
    const { selectedDates, availabilityStart, availabilityEnd, breakIntervals, selectedCourseIds } = req.body;
    await db.insert(scheduleConfigs)
      .values({ userId, selectedDates, availabilityStart, availabilityEnd, breakIntervals, selectedCourseIds })
      .onConflictDoUpdate({ target: scheduleConfigs.userId, set: { selectedDates, availabilityStart, availabilityEnd, breakIntervals, selectedCourseIds } });
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(err.message?.includes('Authorization') ? 401 : 500).json({ error: err.message });
  }
});

// ─── FREE TIME ────────────────────────────────────────────────

app.get('/api/free-time', async (req, res) => {
  try {
    const { userId } = getUser(req);
    const [ft] = await db.select().from(freeTimeSettings).where(eq(freeTimeSettings.userId, userId));
    return res.json(ft || { userId, dailyHours: 3, weeklyAvailability: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: false, sunday: false } });
  } catch (err: any) {
    return res.status(err.message?.includes('Authorization') ? 401 : 500).json({ error: err.message });
  }
});

app.put('/api/free-time', async (req, res) => {
  try {
    const { userId } = getUser(req);
    const { dailyHours, weeklyAvailability } = req.body;
    await db.insert(freeTimeSettings)
      .values({ userId, dailyHours, weeklyAvailability })
      .onConflictDoUpdate({ target: freeTimeSettings.userId, set: { dailyHours, weeklyAvailability } });
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(err.message?.includes('Authorization') ? 401 : 500).json({ error: err.message });
  }
});

// ─── FORGOT PASSWORD ──────────────────────────────────────────

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    if (!user) return res.status(200).json({ message: 'If this email exists, a reset link has been sent.' });

    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));

    const token = generateId() + generateId() + generateId();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await db.insert(passwordResetTokens).values({ id: generateId(), userId: user.id, token, expiresAt });

    const resetLink = `http://localhost:8080/reset-password?token=${token}`;

    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'StudyPlan Pro <noreply@resend.dev>',
        to: user.email,
        subject: 'Reset your StudyPlan Pro password',
        html: `<p>Hi ${user.name},</p><p><a href="${resetLink}">Click here to reset your password</a></p><p>This link expires in 1 hour.</p>`,
      });
    } else {
      // Dev fallback: log reset link to console
      console.log(`\n🔑 Password Reset Link for ${user.email}:\n${resetLink}\n`);
    }

    return res.status(200).json({ message: 'If this email exists, a reset link has been sent.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to send reset email' });
  }
});

// ─── RESET PASSWORD ───────────────────────────────────────────

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: 'token and newPassword are required' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

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

    if (!resetToken) return res.status(400).json({ error: 'This reset link is invalid or has expired. Please request a new one.' });

    const hashed = await hashPassword(newPassword);
    await db.update(users).set({ password: hashed }).where(eq(users.id, resetToken.userId));
    await db.update(passwordResetTokens).set({ used: true }).where(eq(passwordResetTokens.id, resetToken.id));

    return res.status(200).json({ message: 'Password updated successfully. You can now log in.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to reset password' });
  }
});

// ─── START ────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n✅ Local API server running at http://localhost:${PORT}/api\n`);
});
