import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useStudyPlannerStore } from "@/lib/store";
import { toast } from "@/hooks/use-toast";
import {
  User,
  Bell,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  FileText,
  Save,
} from "lucide-react";
import { format } from "date-fns";

const Settings = () => {
  const { courses, tasks, freeTime, setFreeTime, profile, setProfile } = useStudyPlannerStore();
  const [notifications, setNotifications] = useState(true);
  const [emailReminders, setEmailReminders] = useState(false);
  const [displayName, setDisplayName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);

  useEffect(() => {
    setDisplayName(profile.name);
    setEmail(profile.email);
  }, [profile]);

  const handleSaveProfile = () => {
    setProfile({ name: displayName, email });
    toast({
      title: "Profile saved!",
      description: "Your profile information has been updated.",
    });
  };

  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const pendingTasks = tasks.filter((t) => t.status === "pending").length;
  const overdueTasks = tasks.filter((t) => t.status === "overdue").length;
  const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const handleExportHTML = () => {
    const courseStats = courses.map((course) => {
      const courseTasks = tasks.filter((t) => t.courseId === course.id);
      const courseCompleted = courseTasks.filter((t) => t.status === "completed").length;
      const courseProgress = courseTasks.length > 0 ? Math.round((courseCompleted / courseTasks.length) * 100) : 0;
      return { ...course, total: courseTasks.length, completed: courseCompleted, progress: courseProgress };
    });

    const weeklyStats = Array.from({ length: 15 }, (_, i) => {
      const week = i + 1;
      const weekTasks = tasks.filter((t) => t.week === week);
      return {
        week,
        total: weekTasks.length,
        done: weekTasks.filter((t) => t.status === "completed").length,
        pending: weekTasks.filter((t) => t.status === "pending").length,
        overdue: weekTasks.filter((t) => t.status === "overdue").length,
      };
    });

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Study Planner Progress Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', sans-serif; background: #f8fafc; color: #1e293b; padding: 40px; }
    .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #e2e8f0; }
    .header h1 { font-size: 28px; color: #0891b2; margin-bottom: 8px; }
    .header p { color: #64748b; font-size: 14px; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
    .stat-card { background: linear-gradient(135deg, #f0fdfa, #ecfeff); border-radius: 12px; padding: 20px; text-align: center; }
    .stat-value { font-size: 32px; font-weight: 700; }
    .stat-value.primary { color: #0891b2; }
    .stat-value.success { color: #10b981; }
    .stat-value.warning { color: #f59e0b; }
    .stat-value.danger { color: #ef4444; }
    .stat-label { font-size: 12px; color: #64748b; margin-top: 4px; }
    .progress-bar { height: 12px; background: #e2e8f0; border-radius: 999px; overflow: hidden; margin-top: 24px; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #0891b2, #06b6d4); border-radius: 999px; }
    .section { margin-top: 32px; }
    .section h2 { font-size: 18px; margin-bottom: 16px; color: #334155; }
    .course-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .course-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; }
    .course-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .course-dot { width: 12px; height: 12px; border-radius: 50%; }
    .course-name { font-weight: 600; }
    .course-progress { font-size: 12px; color: #64748b; }
    .mini-bar { height: 6px; background: #e2e8f0; border-radius: 999px; margin-top: 8px; overflow: hidden; }
    .mini-fill { height: 100%; border-radius: 999px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
    th, td { padding: 10px; text-align: center; border-bottom: 1px solid #e2e8f0; }
    th { background: #f1f5f9; font-weight: 600; }
    td:first-child, th:first-child { text-align: left; }
    .text-success { color: #10b981; }
    .text-warning { color: #f59e0b; }
    .text-danger { color: #ef4444; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 12px; }
    @media print { body { padding: 0; background: white; } .container { box-shadow: none; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📚 Study Planner Progress Report</h1>
      <p>Generated on ${format(new Date(), "EEEE, MMMM dd, yyyy")}</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value primary">${completionRate}%</div>
        <div class="stat-label">Completion Rate</div>
      </div>
      <div class="stat-card">
        <div class="stat-value success">${completedTasks}</div>
        <div class="stat-label">Completed</div>
      </div>
      <div class="stat-card">
        <div class="stat-value warning">${pendingTasks}</div>
        <div class="stat-label">Pending</div>
      </div>
      <div class="stat-card">
        <div class="stat-value danger">${overdueTasks}</div>
        <div class="stat-label">Overdue</div>
      </div>
    </div>
    <div class="progress-bar">
      <div class="progress-fill" style="width: ${completionRate}%"></div>
    </div>

    <div class="section">
      <h2>Courses (${courses.length})</h2>
      <div class="course-grid">
        ${courseStats.map(c => `
          <div class="course-card">
            <div class="course-header">
              <div class="course-dot" style="background: ${c.color}"></div>
              <span class="course-name">${c.name}</span>
            </div>
            <div class="course-progress">${c.completed}/${c.total} tasks completed</div>
            <div class="mini-bar">
              <div class="mini-fill" style="width: ${c.progress}%; background: ${c.color}"></div>
            </div>
          </div>
        `).join("")}
      </div>
    </div>

    <div class="section">
      <h2>Weekly Breakdown (15 Weeks)</h2>
      <table>
        <thead>
          <tr>
            <th>Week</th>
            <th>Total</th>
            <th>✓ Done</th>
            <th>⏳ Pending</th>
            <th>⚠ Overdue</th>
          </tr>
        </thead>
        <tbody>
          ${weeklyStats.map(w => `
            <tr>
              <td><strong>Week ${w.week}</strong></td>
              <td>${w.total}</td>
              <td class="text-success">${w.done}</td>
              <td class="text-warning">${w.pending}</td>
              <td class="text-danger">${w.overdue}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>

    <div class="footer">
      <p>Generated by Student Study Planner • Keep up the great work! 🎓</p>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "study-planner-progress-report.html";
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Report exported!",
      description: "Open the HTML file and use Print → Save as PDF for best results.",
    });
  };

  const handleClearData = () => {
    if (confirm("Are you sure you want to clear all data? This cannot be undone.")) {
      localStorage.removeItem("study-planner-storage");
      window.location.reload();
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-2xl">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Customize your study planner experience
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Profile</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Display Name
              </label>
              <Input 
                placeholder="Enter your name" 
                className="max-w-md" 
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email (for reminders)
              </label>
              <Input 
                type="email" 
                placeholder="your@email.com" 
                className="max-w-md" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button onClick={handleSaveProfile} className="mt-2">
              <Save className="w-4 h-4 mr-2" />
              Save Profile
            </Button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-warning" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Notifications</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Push Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Get reminders for upcoming tasks
                </p>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Email Reminders</p>
                <p className="text-sm text-muted-foreground">
                  Weekly summary of your progress
                </p>
              </div>
              <Switch checked={emailReminders} onCheckedChange={setEmailReminders} />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-success" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Study Preferences</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Default Daily Hours
              </label>
              <div className="flex items-center gap-4 max-w-md">
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={freeTime.dailyHours}
                  onChange={(e) =>
                    setFreeTime({ ...freeTime, dailyHours: parseInt(e.target.value) })
                  }
                  className="flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <span className="text-lg font-semibold text-foreground w-20">
                  {freeTime.dailyHours} hours
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Download className="w-5 h-5 text-accent" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Data Management</h2>
          </div>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={handleExportHTML}>
                <FileText className="w-4 h-4 mr-2" />
                Export Progress Report
              </Button>
              <Button variant="secondary">
                <Upload className="w-4 h-4 mr-2" />
                Import Data
              </Button>
            </div>
            <div className="pt-4 border-t border-border">
              <Button variant="destructive" onClick={handleClearData}>
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All Data
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                This will permanently delete all your courses, tasks, and settings.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-6">
          <h3 className="font-semibold text-foreground mb-4">Your Stats</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-foreground">{courses.length}</p>
              <p className="text-sm text-muted-foreground">Courses</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{tasks.length}</p>
              <p className="text-sm text-muted-foreground">Total Tasks</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{completedTasks}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;