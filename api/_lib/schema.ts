import { pgTable, text, integer, timestamp, jsonb, varchar, boolean } from 'drizzle-orm/pg-core';


// ─── USERS ──────────────────────────────────────────────────
export const users = pgTable('users', {
  id: text('id').primaryKey(), // UUID-like random string
  email: text('email').notNull().unique(),
  password: text('password').notNull(), // bcrypt hash
  name: text('name').notNull().default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── COURSES ────────────────────────────────────────────────
export const courses = pgTable('courses', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').notNull().default(''),
  fileName: text('file_name'),
  weeklyContent: jsonb('weekly_content').$type<{ week: number; content: string }[]>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── TASKS ──────────────────────────────────────────────────
export const tasks = pgTable('tasks', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  courseId: text('course_id').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  week: integer('week').notNull(),
  day: integer('day').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  dueDate: timestamp('due_date').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
});

// ─── PROFILES ───────────────────────────────────────────────
export const profiles = pgTable('profiles', {
  userId: text('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull().default(''),
  email: text('email').notNull().default(''),
});

// ─── SCHEDULE CONFIG ────────────────────────────────────────
export const scheduleConfigs = pgTable('schedule_configs', {
  userId: text('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  selectedDates: jsonb('selected_dates').$type<string[]>().default([]),
  availabilityStart: text('availability_start').notNull().default('09:00'),
  availabilityEnd: text('availability_end').notNull().default('21:00'),
  breakIntervals: jsonb('break_intervals').$type<{ id: string; startTime: string; endTime: string }[]>().default([]),
  selectedCourseIds: jsonb('selected_course_ids').$type<string[]>().default([]),
});

// ─── FREE TIME SETTINGS ────────────────────────────────────
export const freeTimeSettings = pgTable('free_time_settings', {
  userId: text('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  dailyHours: integer('daily_hours').notNull().default(3),
  weeklyAvailability: jsonb('weekly_availability').$type<{ [key: string]: boolean }>().default({
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
  }),
});

// ─── PASSWORD RESET TOKENS ────────────────────────────────────
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  used: boolean('used').notNull().default(false),
});
