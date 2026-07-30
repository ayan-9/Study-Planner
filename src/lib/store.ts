import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, isAuthenticated } from './api';

export interface Course {
  id: string;
  name: string;
  color: string;
  fileName?: string;
  weeklyContent?: { week: number; content: string }[];
  createdAt: Date;
}

export interface Task {
  id: string;
  courseId: string;
  title: string;
  description: string;
  week: number;
  day: number;
  status: 'completed' | 'pending' | 'overdue';
  dueDate: Date;
  startTime: string;
  endTime: string;
}

export interface FreeTime {
  dailyHours: number;
  weeklyAvailability: { [key: string]: boolean };
}

export interface BreakInterval {
  id: string;
  startTime: string; // "13:00"
  endTime: string;   // "14:00"
}

export interface ScheduleConfig {
  selectedDates: string[]; // ISO date strings
  availabilityStart: string; // "09:00"
  availabilityEnd: string;   // "21:00"
  breakIntervals: BreakInterval[];
  selectedCourseIds: string[]; // empty = all courses
}

export interface Profile {
  name: string;
  email: string;
}

export type Theme = 'light' | 'dark' | 'system';

interface StudyPlannerState {
  courses: Course[];
  tasks: Task[];
  freeTime: FreeTime;
  scheduleConfig: ScheduleConfig;
  profile: Profile;
  theme: Theme;
  addCourse: (course: Course) => void;
  removeCourse: (id: string) => void;
  updateCourse: (id: string, updates: Partial<Course>) => void;
  setTasks: (tasks: Task[]) => void;
  updateTaskStatus: (id: string, status: Task['status']) => void;
  setFreeTime: (freeTime: FreeTime) => void;
  setScheduleConfig: (config: Partial<ScheduleConfig>) => void;
  setProfile: (profile: Profile) => void;
  setTheme: (theme: Theme) => void;
  generateRoadmap: () => void;
  syncFromDb: () => Promise<void>;
}

const courseColors = [
  'hsl(187, 85%, 43%)',
  'hsl(15, 90%, 60%)',
  'hsl(142, 76%, 36%)',
  'hsl(38, 92%, 50%)',
  'hsl(262, 83%, 58%)',
  'hsl(330, 81%, 60%)',
  'hsl(200, 75%, 50%)',
  'hsl(45, 85%, 55%)',
  'hsl(280, 70%, 50%)',
  'hsl(170, 80%, 40%)',
  'hsl(350, 75%, 55%)',
  'hsl(220, 80%, 55%)',
  'hsl(90, 70%, 45%)',
  'hsl(30, 85%, 50%)',
  'hsl(300, 65%, 55%)',
];

const generateId = () => Math.random().toString(36).substr(2, 9);

const topicsByWeek = [
  'Introduction & Overview',
  'Core Fundamentals',
  'Basic Concepts',
  'Intermediate Topics',
  'Advanced Principles',
  'Case Studies',
  'Practical Applications',
  'Review & Practice',
  'Deep Dive Sessions',
  'Project Work',
  'Analysis & Synthesis',
  'Critical Review',
  'Mock Exercises',
  'Final Review',
  'Exam Preparation',
];

// Helper: parse "HH:MM" to minutes since midnight
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

// Helper: minutes since midnight to "HH:MM"
function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// Get available time slots for a day (availability minus breaks)
function getAvailableSlots(
  availStart: string,
  availEnd: string,
  breaks: BreakInterval[]
): { start: number; end: number }[] {
  const dayStart = timeToMinutes(availStart);
  const dayEnd = timeToMinutes(availEnd);

  // Sort breaks by start time
  const sortedBreaks = [...breaks]
    .map(b => ({ start: timeToMinutes(b.startTime), end: timeToMinutes(b.endTime) }))
    .filter(b => b.start < dayEnd && b.end > dayStart)
    .sort((a, b) => a.start - b.start);

  const slots: { start: number; end: number }[] = [];
  let cursor = dayStart;

  for (const brk of sortedBreaks) {
    if (brk.start > cursor) {
      slots.push({ start: cursor, end: Math.min(brk.start, dayEnd) });
    }
    cursor = Math.max(cursor, brk.end);
  }

  if (cursor < dayEnd) {
    slots.push({ start: cursor, end: dayEnd });
  }

  return slots;
}

export const useStudyPlannerStore = create<StudyPlannerState>()(
  persist(
    (set, get) => ({
      courses: [],
      tasks: [],
      freeTime: {
        dailyHours: 3,
        weeklyAvailability: {
          monday: true,
          tuesday: true,
          wednesday: true,
          thursday: true,
          friday: true,
          saturday: false,
          sunday: false,
        },
      },
      scheduleConfig: {
        selectedDates: [],
        availabilityStart: '09:00',
        availabilityEnd: '21:00',
        breakIntervals: [],
        selectedCourseIds: [],
      },
      profile: {
        name: '',
        email: '',
      },
      theme: 'system',
      addCourse: (course) => {
        const color = courseColors[get().courses.length % courseColors.length];
        const withColor = { ...course, color };
        set((state) => ({ courses: [...state.courses, withColor] }));
        if (isAuthenticated()) api.courses.create(withColor).catch(console.error);
      },
      removeCourse: (id) => {
        set((state) => ({
          courses: state.courses.filter((c) => c.id !== id),
          tasks: state.tasks.filter((t) => t.courseId !== id),
        }));
        if (isAuthenticated()) api.courses.remove(id).catch(console.error);
      },
      updateCourse: (id, updates) => {
        set((state) => ({
          courses: state.courses.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        }));
        if (isAuthenticated()) api.courses.update(id, updates).catch(console.error);
      },
      setTasks: (tasks) => {
        set({ tasks });
        if (isAuthenticated()) api.tasks.setAll(tasks).catch(console.error);
      },
      updateTaskStatus: (id, status) => {
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, status } : t)),
        }));
        if (isAuthenticated()) api.tasks.updateStatus(id, { status }).catch(console.error);
      },
      setFreeTime: (freeTime) => {
        set({ freeTime });
        if (isAuthenticated()) api.freeTime.set(freeTime).catch(console.error);
      },
      setScheduleConfig: (config) => {
        set((state) => ({
          scheduleConfig: { ...state.scheduleConfig, ...config },
        }));
        if (isAuthenticated()) api.scheduleConfig.set({ ...get().scheduleConfig, ...config }).catch(console.error);
      },
      setProfile: (profile) => {
        set({ profile });
        if (isAuthenticated()) api.profile.set(profile).catch(console.error);
      },
      setTheme: (theme) => set({ theme }),
      syncFromDb: async () => {
        if (!isAuthenticated()) return;
        try {
          const [courses, tasks, profile, freeTime, scheduleConfig] = await Promise.all([
            api.courses.getAll(),
            api.tasks.getAll(),
            api.profile.get(),
            api.freeTime.get(),
            api.scheduleConfig.get(),
          ]);
          set({
            courses: courses.map((c: any) => ({ ...c, createdAt: new Date(c.createdAt) })),
            tasks: tasks.map((t: any) => ({ ...t, dueDate: new Date(t.dueDate) })),
            profile: { name: profile.name || '', email: profile.email || '' },
            freeTime: { dailyHours: freeTime.dailyHours, weeklyAvailability: freeTime.weeklyAvailability },
            scheduleConfig: {
              selectedDates: scheduleConfig.selectedDates || [],
              availabilityStart: scheduleConfig.availabilityStart || '09:00',
              availabilityEnd: scheduleConfig.availabilityEnd || '21:00',
              breakIntervals: scheduleConfig.breakIntervals || [],
              selectedCourseIds: scheduleConfig.selectedCourseIds || [],
            },
          });
        } catch (err) {
          console.error('syncFromDb failed:', err);
        }
      },
      generateRoadmap: () => {
        const { courses, scheduleConfig } = get();
        if (courses.length === 0) return;

        const { selectedDates, availabilityStart, availabilityEnd, breakIntervals, selectedCourseIds } = scheduleConfig;

        // If no dates selected, use legacy behavior (15 weeks from today)
        const useLegacy = selectedDates.length === 0;

        // Filter courses if specific ones are selected
        const coursesToSchedule = selectedCourseIds.length > 0
          ? courses.filter(c => selectedCourseIds.includes(c.id))
          : courses;

        if (coursesToSchedule.length === 0) return;

        const newTasks: Task[] = [];

        if (useLegacy) {
          // Legacy 15-week generation
          const { freeTime } = get();
          const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const availableDays = Object.entries(freeTime.weeklyAvailability)
            .filter(([_, available]) => available)
            .map(([day]) => day);

          if (availableDays.length === 0) return;

          const startDate = new Date();
          const hoursPerDay = freeTime.dailyHours;
          const coursesCount = coursesToSchedule.length;
          const hoursPerCourse = Math.max(1, Math.floor(hoursPerDay / Math.min(coursesCount, 3)));

          for (let week = 1; week <= 15; week++) {
            let courseIndex = 0;
            
            availableDays.forEach((dayName) => {
              const weekStartDate = new Date(startDate);
              weekStartDate.setDate(weekStartDate.getDate() + (week - 1) * 7);
              
              const targetDayIndex = dayNames.indexOf(dayName);
              const currentDayIndex = weekStartDate.getDay();
              let daysToAdd = targetDayIndex - currentDayIndex;
              if (daysToAdd < 0) daysToAdd += 7;
              
              const taskDate = new Date(weekStartDate);
              taskDate.setDate(taskDate.getDate() + daysToAdd);

              let startHour = 9;
              const coursesForToday = coursesToSchedule.slice(courseIndex, courseIndex + Math.ceil(coursesCount / availableDays.length));
              
              coursesForToday.forEach((course) => {
                const endHour = Math.min(startHour + hoursPerCourse, 24);
                const startTime = `${startHour.toString().padStart(2, '0')}:00`;
                const endTime = `${endHour.toString().padStart(2, '0')}:00`;

                const weeklyContent = course.weeklyContent?.find((wc) => wc.week === week);
                const hasAnyContent = (course.weeklyContent?.length ?? 0) > 0;
                if (hasAnyContent && !weeklyContent) return;
                const topic = weeklyContent?.content || topicsByWeek[week - 1];
                const isPast = taskDate < new Date();
                const status: Task['status'] = isPast ? (Math.random() > 0.3 ? 'completed' : 'overdue') : 'pending';

                newTasks.push({
                  id: generateId(),
                  courseId: course.id,
                  title: `${course.name}: ${topic}`,
                  description: `Study ${topic.toLowerCase()} for ${course.name}. Duration: ${hoursPerCourse} hour(s).`,
                  week,
                  day: targetDayIndex + 1,
                  status,
                  dueDate: taskDate,
                  startTime,
                  endTime,
                });

                startHour = endHour;
              });

              courseIndex = (courseIndex + coursesForToday.length) % coursesCount;
            });
          }
        } else {
          // New date-based scheduling with breaks (Intensive Mode)
          const sortedDates = [...selectedDates].sort();
          const daySlots = getAvailableSlots(availabilityStart, availabilityEnd, breakIntervals);

          const totalMinutesPerDay = daySlots.reduce(
            (sum, slot) => sum + (slot.end - slot.start),
            0
          );
          const totalMinutesOverall = totalMinutesPerDay * sortedDates.length;

          // Collect all topics from all selected courses
          const allTopics: { course: Course; week: number; topic: string }[] = [];
          coursesToSchedule.forEach((course) => {
            const hasAnyContent = (course.weeklyContent?.length ?? 0) > 0;

            if (hasAnyContent) {
              course.weeklyContent!.forEach((wc) => {
                if (wc.week >= 1 && wc.week <= 15 && wc.content?.trim()) {
                  allTopics.push({ course, week: wc.week, topic: wc.content.trim() });
                }
              });
              return;
            }

            for (let week = 1; week <= 15; week++) {
              allTopics.push({ course, week, topic: topicsByWeek[week - 1] });
            }
          });

          // Nothing to schedule
          if (sortedDates.length === 0 || daySlots.length === 0 || allTopics.length === 0 || totalMinutesOverall <= 0) {
            set({ tasks: [] });
            return;
          }

          // Allocate time across ALL topics so the timetable fills the chosen slots.
          // If the user selected too few minutes for too many topics, we still schedule as many as we can.
          const minutesPerTopic = Math.max(1, Math.floor(totalMinutesOverall / allTopics.length));

          const today = new Date();
          today.setHours(0, 0, 0, 0);

          let topicIndex = 0;

          for (const dateStr of sortedDates) {
            if (topicIndex >= allTopics.length) break;

            // Force local-midnight parsing to avoid timezone shifting the day.
            const taskDate = new Date(`${dateStr}T00:00:00`);

            for (let slotIdx = 0; slotIdx < daySlots.length && topicIndex < allTopics.length; slotIdx++) {
              const slot = daySlots[slotIdx];
              let slotCursor = slot.start;

              while (topicIndex < allTopics.length && slotCursor < slot.end) {
                const remaining = slot.end - slotCursor;
                if (remaining <= 0) break;

                const durationMins = Math.max(1, Math.min(minutesPerTopic, remaining));

                const { course, week, topic } = allTopics[topicIndex];
                const startTime = minutesToTime(slotCursor);
                const endTime = minutesToTime(slotCursor + durationMins);

                const isPast = taskDate < today;
                const status: Task['status'] = isPast ? 'overdue' : 'pending';

                newTasks.push({
                  id: generateId(),
                  courseId: course.id,
                  title: `${course.name}: ${topic}`,
                  description: `Study ${topic.toLowerCase()} for ${course.name}. Duration: ${Math.round((durationMins / 60) * 10) / 10} hour(s).`,
                  week,
                  day: taskDate.getDay() + 1,
                  status,
                  dueDate: taskDate,
                  startTime,
                  endTime,
                });

                slotCursor += durationMins;
                topicIndex++;
              }
            }
          }
        }

        set({
          tasks: newTasks
            .sort((a, b) => {
              const dateDiff = a.dueDate.getTime() - b.dueDate.getTime();
              if (dateDiff !== 0) return dateDiff;
              return a.startTime.localeCompare(b.startTime);
            }),
        });
      },
    }),
    {
      name: 'study-planner-storage',
    }
  )
);
