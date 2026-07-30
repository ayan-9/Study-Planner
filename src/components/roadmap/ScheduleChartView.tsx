import { useMemo } from "react";
import { useStudyPlannerStore, Task } from "@/lib/store";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const ScheduleChartView = () => {
  const { tasks, courses, updateTaskStatus } = useStudyPlannerStore();

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const grouped: { [key: string]: Task[] } = {};
    tasks.forEach((task) => {
      // Use local date formatting to avoid timezone issues
      const dueDate = new Date(task.dueDate);
      const year = dueDate.getFullYear();
      const month = String(dueDate.getMonth() + 1).padStart(2, '0');
      const day = String(dueDate.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(task);
    });
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, tasks]) => ({
        date,
        tasks: tasks.sort((a, b) => a.startTime.localeCompare(b.startTime)),
      }));
  }, [tasks]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-success/20 border-success text-success";
      case "pending":
        return "bg-warning/20 border-warning text-warning";
      case "overdue":
        return "bg-destructive/20 border-destructive text-destructive";
      default:
        return "bg-muted border-border text-muted-foreground";
    }
  };

  const handleMarkDone = (taskId: string) => {
    updateTaskStatus(taskId, "completed");
    toast({
      title: "Task completed! 🎉",
      description: "Great progress! Keep going!",
    });
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 bg-card border border-border rounded-2xl">
        <p className="text-muted-foreground">No tasks to display. Generate a schedule first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">📊 Schedule Chart View</h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span className="text-muted-foreground">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-warning" />
            <span className="text-muted-foreground">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive" />
            <span className="text-muted-foreground">Overdue</span>
          </div>
        </div>
      </div>

      {/* Gantt-style Chart */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header - Time slots from 6am to midnight */}
            <div className="flex border-b border-border bg-secondary/30">
              <div className="w-32 flex-shrink-0 p-3 font-semibold text-foreground border-r border-border">
                Date
              </div>
              <div className="flex-1 flex">
                {Array.from({ length: 18 }, (_, i) => i + 6).map((hour) => (
                  <div
                    key={hour}
                    className="flex-1 p-2 text-xs text-center text-muted-foreground border-r border-border/50"
                  >
                    {hour}:00
                  </div>
                ))}
              </div>
            </div>

            {/* Rows - Each day */}
            {tasksByDate.map(({ date, tasks: dayTasks }) => {
              // Parse date with local timezone to avoid off-by-one issues
              const displayDate = new Date(`${date}T00:00:00`);
              return (
              <div key={date} className="flex border-b border-border last:border-0">
                <div className="w-32 flex-shrink-0 p-3 border-r border-border bg-secondary/10">
                  <p className="font-medium text-foreground text-sm">
                    {format(displayDate, "EEE")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(displayDate, "MMM dd")}
                  </p>
                </div>
                <div className="flex-1 relative h-20">
                  {/* Time grid lines */}
                  <div className="absolute inset-0 flex">
                    {Array.from({ length: 18 }, (_, i) => (
                      <div
                        key={i}
                        className="flex-1 border-r border-border/20"
                      />
                    ))}
                  </div>

                  {/* Task blocks */}
                  {dayTasks.map((task) => {
                    const course = courses.find((c) => c.id === task.courseId);
                    const startHour = parseInt(task.startTime.split(":")[0]);
                    const startMin = parseInt(task.startTime.split(":")[1]);
                    const endHour = parseInt(task.endTime.split(":")[0]);
                    const endMin = parseInt(task.endTime.split(":")[1]);

                    const startPercent = ((startHour - 6 + startMin / 60) / 18) * 100;
                    const endPercent = ((endHour - 6 + endMin / 60) / 18) * 100;
                    const width = endPercent - startPercent;

                    return (
                      <div
                        key={task.id}
                        className={cn(
                          "absolute top-2 h-16 rounded-lg border-2 p-1 flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.02] hover:z-10",
                          getStatusColor(task.status)
                        )}
                        style={{
                          left: `${Math.max(0, startPercent)}%`,
                          width: `${Math.max(5, width)}%`,
                          backgroundColor: `${course?.color}20`,
                          borderColor: course?.color,
                        }}
                        onClick={() => {
                          if (task.status !== "completed") {
                            handleMarkDone(task.id);
                          }
                        }}
                        title={`${task.title}\n${task.startTime} - ${task.endTime}\nClick to mark as done`}
                      >
                        <p className="text-[10px] font-medium text-foreground truncate">
                          {course?.name}
                        </p>
                        <p className="text-[9px] text-muted-foreground truncate">
                          {task.startTime}-{task.endTime}
                        </p>
                        {task.status === "completed" && (
                          <CheckCircle2 className="w-3 h-3 text-success absolute top-1 right-1" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Progress Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-foreground">{tasks.length}</p>
          <p className="text-sm text-muted-foreground">Total Tasks</p>
        </div>
        <div className="bg-success/10 border border-success/20 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-success">
            {tasks.filter((t) => t.status === "completed").length}
          </p>
          <p className="text-sm text-muted-foreground">Completed</p>
        </div>
        <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-warning">
            {tasks.filter((t) => t.status === "pending").length}
          </p>
          <p className="text-sm text-muted-foreground">Pending</p>
        </div>
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-primary">
            {Math.round((tasks.filter((t) => t.status === "completed").length / tasks.length) * 100)}%
          </p>
          <p className="text-sm text-muted-foreground">Progress</p>
        </div>
      </div>
    </div>
  );
};

export default ScheduleChartView;
