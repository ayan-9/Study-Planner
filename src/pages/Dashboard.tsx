import { useEffect } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useStudyPlannerStore } from "@/lib/store";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Plus,
  ArrowRight,
} from "lucide-react";

const Dashboard = () => {
  const { courses, tasks, syncFromDb } = useStudyPlannerStore();

  useEffect(() => { syncFromDb(); }, []);

  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const pendingTasks = tasks.filter((t) => t.status === "pending").length;
  const overdueTasks = tasks.filter((t) => t.status === "overdue").length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const upcomingTasks = tasks
    .filter((t) => t.status === "pending")
    .slice(0, 5);

  const motivationalMessages = [
    "Keep pushing! You're making great progress! 🚀",
    "Every task completed is a step closer to success! 💪",
    "You've got this! Stay focused and consistent! ⭐",
    "Great work! Your dedication is paying off! 🎯",
    "One day at a time - you're doing amazing! 🌟",
  ];

  const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Welcome back! 👋</h1>
            <p className="text-muted-foreground mt-1">
              {courses.length > 0
                ? randomMessage
                : "Let's get started by adding your courses!"}
            </p>
          </div>
          {courses.length === 0 && (
            <Link to="/dashboard/courses">
              <Button variant="hero">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Course
              </Button>
            </Link>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-soft transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Courses</p>
                <p className="text-2xl font-bold text-foreground">{courses.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-soft transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-foreground">{completedTasks}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-soft transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-foreground">{pendingTasks}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-soft transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-foreground">{overdueTasks}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Overview & Upcoming Tasks */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Progress Card */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">Overall Progress</h2>
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Completion Rate</span>
                <span className="text-2xl font-bold text-foreground">{completionRate}%</span>
              </div>
              <div className="h-4 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full gradient-primary rounded-full transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {completedTasks} of {totalTasks} tasks completed
                </span>
                <Link
                  to="/dashboard/progress"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  View Details
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Upcoming Tasks */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">Upcoming Tasks</h2>
              <CalendarDays className="w-5 h-5 text-primary" />
            </div>
            {upcomingTasks.length > 0 ? (
              <div className="space-y-3">
                {upcomingTasks.map((task) => {
                  const course = courses.find((c) => c.id === task.courseId);
                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                    >
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: course?.color || "hsl(var(--primary))" }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {task.title}
                        </p>
                        <p className="text-xs text-muted-foreground">Week {task.week}</p>
                      </div>
                    </div>
                  );
                })}
                <Link to="/dashboard/roadmap">
                  <Button variant="ghost" className="w-full mt-2">
                    View All Tasks
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarDays className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">No upcoming tasks</p>
                {courses.length > 0 && (
                  <Link to="/dashboard/roadmap">
                    <Button variant="outline" className="mt-4">
                      Generate Roadmap
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        {courses.length > 0 && (
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <Link to="/dashboard/courses">
                <Button variant="secondary">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Course
                </Button>
              </Link>
              <Link to="/dashboard/roadmap">
                <Button variant="secondary">
                  <CalendarDays className="w-4 h-4 mr-2" />
                  View Roadmap
                </Button>
              </Link>
              <Link to="/dashboard/progress">
                <Button variant="secondary">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Check Progress
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
