import { useMemo } from "react";
import { useStudyPlannerStore, Task } from "@/lib/store";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, ArrowDown, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const ScheduleFlowchartView = () => {
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
        <h3 className="text-lg font-semibold text-foreground">🔄 Study Flowchart</h3>
        <p className="text-sm text-muted-foreground">
          Click on any task to mark it as done
        </p>
      </div>

      {/* Flowchart Style View */}
      <div className="relative">
        {tasksByDate.map(({ date, tasks: dayTasks }, dayIdx) => {
          // Parse date with local timezone to avoid off-by-one issues
          const displayDate = new Date(`${date}T00:00:00`);
          return (
          <div key={date} className="relative">
            {/* Day Header */}
            <div className="flex items-center gap-4 mb-4">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-primary/50 flex flex-col items-center justify-center text-primary-foreground shadow-lg">
                <span className="text-2xl font-bold">{format(displayDate, "dd")}</span>
                <span className="text-xs font-medium">{format(displayDate, "EEE")}</span>
                <span className="text-[10px]">{format(displayDate, "MMM yyyy")}</span>
              </div>
              <div className="flex-1 h-0.5 bg-gradient-to-r from-primary to-transparent" />
            </div>

            {/* Tasks for this day */}
            <div className="ml-12 pl-8 border-l-2 border-primary/30 space-y-4 pb-8">
              {dayTasks.map((task, taskIdx) => {
                const course = courses.find((c) => c.id === task.courseId);
                const isCompleted = task.status === "completed";

                return (
                  <div key={task.id} className="relative">
                    {/* Connection dot */}
                    <div
                      className={cn(
                        "absolute -left-[25px] top-4 w-4 h-4 rounded-full border-2 transition-all",
                        isCompleted
                          ? "bg-success border-success"
                          : "bg-card border-primary"
                      )}
                    >
                      {isCompleted && (
                        <CheckCircle2 className="w-3 h-3 text-success-foreground absolute -top-0.5 -left-0.5" />
                      )}
                    </div>

                    {/* Task Card */}
                    <div
                      className={cn(
                        "bg-card border-2 rounded-xl p-4 transition-all cursor-pointer hover:shadow-lg",
                        isCompleted
                          ? "border-success/30 bg-success/5"
                          : "border-border hover:border-primary/50"
                      )}
                      onClick={() => {
                        if (!isCompleted) {
                          handleMarkDone(task.id);
                        }
                      }}
                    >
                      <div className="flex items-start gap-4">
                        {/* Course Color & Icon */}
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${course?.color}20` }}
                        >
                          <BookOpen
                            className="w-6 h-6"
                            style={{ color: course?.color }}
                          />
                        </div>

                        {/* Task Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-semibold text-foreground">{task.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {task.description}
                              </p>
                            </div>
                            {isCompleted ? (
                              <CheckCircle2 className="w-6 h-6 text-success flex-shrink-0" />
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkDone(task.id);
                                }}
                                className="flex-shrink-0"
                              >
                                Mark Done
                              </Button>
                            )}
                          </div>

                          {/* Time slot */}
                          <div className="flex items-center gap-4 mt-3">
                            <span
                              className="text-xs font-medium px-2 py-1 rounded-full"
                              style={{
                                backgroundColor: `${course?.color}20`,
                                color: course?.color,
                              }}
                            >
                              {course?.name}
                            </span>
                            <span className="text-sm font-medium text-primary">
                              ⏰ {task.startTime} - {task.endTime}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Arrow to next task */}
                    {taskIdx < dayTasks.length - 1 && (
                      <div className="flex justify-center py-2">
                        <ArrowDown className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Day completion summary */}
            <div className="ml-12 pl-8 mb-8">
              <div className="bg-secondary/50 rounded-lg p-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Day {dayIdx + 1} Progress
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-success transition-all"
                      style={{
                        width: `${(dayTasks.filter((t) => t.status === "completed").length / dayTasks.length) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {dayTasks.filter((t) => t.status === "completed").length}/{dayTasks.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
          );
        })}

        {/* Final Summary */}
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-success to-success/50 flex flex-col items-center justify-center text-success-foreground shadow-lg">
            <CheckCircle2 className="w-8 h-8" />
            <span className="text-xs font-medium mt-1">Complete!</span>
          </div>
          <div className="flex-1 bg-success/10 border border-success/20 rounded-xl p-4">
            <p className="font-semibold text-foreground">
              🎓 Syllabus Coverage Complete
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {tasks.filter((t) => t.status === "completed").length} of {tasks.length} tasks completed
              ({Math.round((tasks.filter((t) => t.status === "completed").length / tasks.length) * 100)}%)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleFlowchartView;
