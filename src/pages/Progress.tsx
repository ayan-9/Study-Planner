import DashboardLayout from "@/components/layout/DashboardLayout";
import { useStudyPlannerStore } from "@/lib/store";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  TrendingUp,
  Target,
  Award,
  Flame,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";

const Progress = () => {
  const { courses, tasks } = useStudyPlannerStore();

  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const pendingTasks = tasks.filter((t) => t.status === "pending").length;
  const overdueTasks = tasks.filter((t) => t.status === "overdue").length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Pie chart data
  const statusData = [
    { name: "Completed", value: completedTasks, color: "hsl(142, 76%, 36%)" },
    { name: "Pending", value: pendingTasks, color: "hsl(38, 92%, 50%)" },
    { name: "Overdue", value: overdueTasks, color: "hsl(0, 72%, 51%)" },
  ].filter((d) => d.value > 0);

  // Course progress data
  const courseProgressData = courses.map((course) => {
    const courseTasks = tasks.filter((t) => t.courseId === course.id);
    const completed = courseTasks.filter((t) => t.status === "completed").length;
    const total = courseTasks.length;
    return {
      name: course.name.length > 15 ? course.name.slice(0, 15) + "..." : course.name,
      fullName: course.name,
      completed,
      remaining: total - completed,
      color: course.color,
    };
  });

  // Weekly progress data - now shows course-wise progress per week
  const weeklyProgressData = courses.map((course) => {
    const courseTasks = tasks.filter((t) => t.courseId === course.id);
    const completed = courseTasks.filter((t) => t.status === "completed").length;
    return {
      name: course.name.length > 12 ? course.name.slice(0, 12) + "..." : course.name,
      fullName: course.name,
      completed,
      total: courseTasks.length,
      color: course.color,
    };
  });

  // Calculate streak (consecutive completed tasks)
  const calculateStreak = () => {
    let streak = 0;
    const sortedTasks = [...tasks].sort(
      (a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
    );
    for (const task of sortedTasks) {
      if (task.status === "completed") {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const streak = calculateStreak();

  const motivationalMessage = () => {
    if (completionRate >= 80) return "Outstanding! You're crushing it! 🏆";
    if (completionRate >= 60) return "Great progress! Keep the momentum! 💪";
    if (completionRate >= 40) return "You're on track! Stay consistent! 🎯";
    if (completionRate >= 20) return "Good start! Build those habits! 🌱";
    return "Every journey starts with a single step! 🚀";
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Progress Analytics</h1>
          <p className="text-muted-foreground mt-1">{motivationalMessage()}</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold text-foreground">{completionRate}%</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tasks Done</p>
                <p className="text-2xl font-bold text-foreground">
                  {completedTasks}/{totalTasks}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <Flame className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Streak</p>
                <p className="text-2xl font-bold text-foreground">{streak} days</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Award className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Courses Active</p>
                <p className="text-2xl font-bold text-foreground">{courses.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Task Status Distribution */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-6">
              Task Status Distribution
            </h2>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No tasks yet. Generate a roadmap to see your progress.
              </div>
            )}
          </div>

          {/* Course Progress */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-6">
              Course Progress
            </h2>
            {courseProgressData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={courseProgressData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value, name, props) => [
                      value,
                      name === "completed" ? "Completed" : "Remaining",
                    ]}
                    labelFormatter={(label, payload) => {
                      if (payload && payload[0]) {
                        return payload[0].payload.fullName;
                      }
                      return label;
                    }}
                  />
                  <Bar dataKey="completed" fill="hsl(142, 76%, 36%)" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="remaining" fill="hsl(var(--muted))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Add courses to see progress breakdown.
              </div>
            )}
          </div>
        </div>

        {/* Weekly Progress - Course-wise */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-6">
            Weekly Progress by Course
          </h2>
          {weeklyProgressData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyProgressData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value, name) => [
                    value,
                    name === "completed" ? "Tasks Completed" : "Total Tasks",
                  ]}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      return payload[0].payload.fullName;
                    }
                    return label;
                  }}
                />
                <Bar dataKey="completed" fill="hsl(187, 85%, 43%)" radius={[0, 4, 4, 0]} name="completed" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Add courses and generate a roadmap to see weekly progress.
            </div>
          )}
        </div>

        {/* Task Status Legend */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-xl font-bold text-foreground">{completedTasks}</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-xl font-bold text-foreground">{pendingTasks}</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Overdue</p>
              <p className="text-xl font-bold text-foreground">{overdueTasks}</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Progress;
