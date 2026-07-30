import { useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useStudyPlannerStore, BreakInterval } from "@/lib/store";
import { toast } from "@/hooks/use-toast";
import {
  CalendarDays,
  List,
  Grid3X3,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  TableIcon,
  Plus,
  Trash2,
  CalendarIcon,
  Settings2,
  Zap,
  BarChart3,
  GitBranch,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import ScheduleChartView from "@/components/roadmap/ScheduleChartView";
import ScheduleFlowchartView from "@/components/roadmap/ScheduleFlowchartView";

const Roadmap = () => {
  const {
    courses,
    tasks,
    freeTime,
    scheduleConfig,
    setFreeTime,
    setScheduleConfig,
    generateRoadmap,
    updateTaskStatus,
  } = useStudyPlannerStore();

  const [viewMode, setViewMode] = useState<"calendar" | "list" | "timetable" | "chart" | "flowchart">("list");
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [newBreakStart, setNewBreakStart] = useState("13:00");
  const [newBreakEnd, setNewBreakEnd] = useState("14:00");
  

  const handleGenerateRoadmap = () => {
    if (courses.length === 0) {
      toast({
        title: "No courses added",
        description: "Please add at least one course before generating a roadmap.",
        variant: "destructive",
      });
      return;
    }

    generateRoadmap();
    toast({
      title: "Roadmap generated! 🎉",
      description: "Your personalized study plan is ready.",
    });
  };

  const handleToggleDay = (day: string) => {
    setFreeTime({
      ...freeTime,
      weeklyAvailability: {
        ...freeTime.weeklyAvailability,
        [day]: !freeTime.weeklyAvailability[day],
      },
    });
  };

  const handleDateSelect = (dates: Date[] | undefined) => {
    if (!dates) {
      setScheduleConfig({ selectedDates: [] });
      return;
    }
    // Use local date format to avoid timezone issues
    const localDateStrings = dates.map((d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    });
    setScheduleConfig({ selectedDates: localDateStrings });
  };

  const handleAddBreak = () => {
    if (!newBreakStart || !newBreakEnd) return;
    const newBreak: BreakInterval = {
      id: Math.random().toString(36).substr(2, 9),
      startTime: newBreakStart,
      endTime: newBreakEnd,
    };
    setScheduleConfig({
      breakIntervals: [...scheduleConfig.breakIntervals, newBreak],
    });
    setNewBreakStart("13:00");
    setNewBreakEnd("14:00");
  };

  const handleRemoveBreak = (id: string) => {
    setScheduleConfig({
      breakIntervals: scheduleConfig.breakIntervals.filter((b) => b.id !== id),
    });
  };

  const handleCourseToggle = (courseId: string, checked: boolean) => {
    if (checked) {
      setScheduleConfig({
        selectedCourseIds: [...scheduleConfig.selectedCourseIds, courseId],
      });
    } else {
      setScheduleConfig({
        selectedCourseIds: scheduleConfig.selectedCourseIds.filter((id) => id !== courseId),
      });
    }
  };

  const handleSelectAllCourses = () => {
    if (scheduleConfig.selectedCourseIds.length === courses.length) {
      setScheduleConfig({ selectedCourseIds: [] });
    } else {
      setScheduleConfig({ selectedCourseIds: courses.map((c) => c.id) });
    }
  };

  const weekTasks = tasks.filter((t) => t.week === selectedWeek);
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-success" />;
      case "pending":
        return <Clock className="w-5 h-5 text-warning" />;
      case "overdue":
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-success/10 border-success/20";
      case "pending":
        return "bg-warning/10 border-warning/20";
      case "overdue":
        return "bg-destructive/10 border-destructive/20";
      default:
        return "bg-card border-border";
    }
  };

  const getTasksByDate = () => {
    const grouped: { [key: string]: typeof tasks } = {};
    weekTasks.forEach((task) => {
      const dateKey = format(new Date(task.dueDate), "yyyy-MM-dd");
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(task);
    });
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  };

  // Convert selected date strings to Date objects for the calendar - use local parsing
  const selectedDatesAsObjects = scheduleConfig.selectedDates.map((s) => new Date(`${s}T00:00:00`));

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Study Roadmap</h1>
            <p className="text-muted-foreground mt-1">
              Your personalized study plan
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Button asChild variant="outline" className="gap-2">
              <Link to="/dashboard/roadmap/intensive">
                <Zap className="w-4 h-4" />
                Intensive Mode
              </Link>
            </Button>

            <div className="flex bg-secondary rounded-lg p-1">
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4 mr-2" />
                List
              </Button>
              <Button
                variant={viewMode === "timetable" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("timetable")}
              >
                <TableIcon className="w-4 h-4 mr-2" />
                Timetable
              </Button>
              <Button
                variant={viewMode === "chart" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("chart")}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Chart
              </Button>
              <Button
                variant={viewMode === "flowchart" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("flowchart")}
              >
                <GitBranch className="w-4 h-4 mr-2" />
                Flow
              </Button>
              <Button
                variant={viewMode === "calendar" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("calendar")}
              >
                <Grid3X3 className="w-4 h-4 mr-2" />
                Calendar
              </Button>
            </div>
          </div>
        </div>


        {/* Schedule Configuration */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Settings2 className="w-5 h-5" />
                Schedule Configuration
              </h2>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  {isAdvancedOpen ? "Hide Options" : "Show Advanced Options"}
                </Button>
              </CollapsibleTrigger>
            </div>

            {/* Basic: Available Days (legacy) */}
            <div className="grid lg:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Daily Study Hours (Legacy Mode)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="12"
                    value={freeTime.dailyHours}
                    onChange={(e) =>
                      setFreeTime({ ...freeTime, dailyHours: parseInt(e.target.value) })
                    }
                    className="flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <span className="text-lg font-semibold text-foreground w-20">
                    {freeTime.dailyHours} hrs
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Available Days (Legacy Mode)
                </label>
                <div className="flex flex-wrap gap-2">
                  {days.map((day) => (
                    <button
                      key={day}
                      onClick={() => handleToggleDay(day)}
                      className={cn(
                        "px-3 py-2 rounded-lg text-sm font-medium capitalize transition-all",
                        freeTime.weeklyAvailability[day]
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                      )}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <CollapsibleContent className="space-y-6">
              {/* Advanced: Date Picker */}
              <div className="pt-4 border-t border-border">
                <h3 className="text-md font-semibold text-foreground mb-4 flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  Select Specific Dates (Advanced)
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Pick specific dates to schedule your study sessions. Leave empty to use the legacy 15-week mode.
                </p>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="bg-secondary/30 rounded-xl p-4">
                    <Calendar
                      mode="multiple"
                      selected={selectedDatesAsObjects}
                      onSelect={handleDateSelect}
                      className="pointer-events-auto"
                      numberOfMonths={2}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="bg-secondary/30 rounded-xl p-4">
                      <p className="text-sm font-medium text-foreground mb-2">
                        Selected Dates: {scheduleConfig.selectedDates.length}
                      </p>
                      {scheduleConfig.selectedDates.length > 0 ? (
                        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                          {scheduleConfig.selectedDates.sort().map((d) => (
                            <span
                              key={d}
                              className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium"
                            >
                              {format(new Date(d), "MMM dd")}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          No dates selected. Will use legacy 15-week mode.
                        </p>
                      )}
                      {scheduleConfig.selectedDates.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2"
                          onClick={() => setScheduleConfig({ selectedDates: [] })}
                        >
                          Clear All Dates
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Time Availability */}
              <div className="pt-4 border-t border-border">
                <h3 className="text-md font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Daily Time Availability
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Start Time
                    </label>
                    <Input
                      type="time"
                      value={scheduleConfig.availabilityStart}
                      onChange={(e) =>
                        setScheduleConfig({ availabilityStart: e.target.value })
                      }
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      End Time
                    </label>
                    <Input
                      type="time"
                      value={scheduleConfig.availabilityEnd}
                      onChange={(e) =>
                        setScheduleConfig({ availabilityEnd: e.target.value })
                      }
                      className="w-full"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Your study sessions will be scheduled between{" "}
                  <span className="font-medium">{scheduleConfig.availabilityStart}</span> and{" "}
                  <span className="font-medium">{scheduleConfig.availabilityEnd}</span>.
                </p>
              </div>

              {/* Break Intervals */}
              <div className="pt-4 border-t border-border">
                <h3 className="text-md font-semibold text-foreground mb-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Break Intervals
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add break times when you're unavailable (e.g., lunch, dinner, rest).
                </p>

                {/* Existing breaks */}
                {scheduleConfig.breakIntervals.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {scheduleConfig.breakIntervals.map((brk) => (
                      <div
                        key={brk.id}
                        className="flex items-center justify-between bg-secondary/50 rounded-lg px-4 py-2"
                      >
                        <span className="text-sm font-medium text-foreground">
                          {brk.startTime} - {brk.endTime}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveBreak(brk.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new break */}
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Break Start
                    </label>
                    <Input
                      type="time"
                      value={newBreakStart}
                      onChange={(e) => setNewBreakStart(e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Break End
                    </label>
                    <Input
                      type="time"
                      value={newBreakEnd}
                      onChange={(e) => setNewBreakEnd(e.target.value)}
                    />
                  </div>
                  <Button variant="secondary" onClick={handleAddBreak}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Break
                  </Button>
                </div>
              </div>

              {/* Course Selection */}
              <div className="pt-4 border-t border-border">
                <h3 className="text-md font-semibold text-foreground mb-4 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Courses to Schedule
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Select which courses to include in your roadmap. Leave all unchecked to schedule all courses.
                </p>

                {courses.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-border">
                      <Checkbox
                        id="select-all"
                        checked={scheduleConfig.selectedCourseIds.length === courses.length}
                        onCheckedChange={handleSelectAllCourses}
                      />
                      <label
                        htmlFor="select-all"
                        className="text-sm font-medium cursor-pointer"
                      >
                        {scheduleConfig.selectedCourseIds.length === courses.length
                          ? "Deselect All"
                          : "Select All"}
                      </label>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {courses.map((course) => (
                        <div
                          key={course.id}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer",
                            scheduleConfig.selectedCourseIds.includes(course.id)
                              ? "border-primary bg-primary/5"
                              : "border-border bg-secondary/30 hover:bg-secondary/50"
                          )}
                          onClick={() =>
                            handleCourseToggle(
                              course.id,
                              !scheduleConfig.selectedCourseIds.includes(course.id)
                            )
                          }
                        >
                          <Checkbox
                            checked={scheduleConfig.selectedCourseIds.includes(course.id)}
                            onCheckedChange={(checked) =>
                              handleCourseToggle(course.id, checked as boolean)
                            }
                          />
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: course.color }}
                          />
                          <span className="text-sm font-medium text-foreground truncate">
                            {course.name}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {scheduleConfig.selectedCourseIds.length === 0
                        ? "All courses will be scheduled."
                        : `${scheduleConfig.selectedCourseIds.length} course(s) selected.`}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No courses added yet. Add courses first to schedule them.
                  </p>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="mt-6 pt-6 border-t border-border">
            <Button variant="hero" onClick={handleGenerateRoadmap}>
              <Sparkles className="w-4 h-4 mr-2" />
              {tasks.length > 0 ? "Regenerate Roadmap" : "Generate Roadmap"}
            </Button>
          </div>
        </div>

        {/* Roadmap Content */}
        {tasks.length > 0 ? (
          <>
            {/* Week Navigation */}
            <div className="flex items-center justify-between bg-card border border-border rounded-xl p-4">
              <Button
                variant="ghost"
                onClick={() => setSelectedWeek(Math.max(1, selectedWeek - 1))}
                disabled={selectedWeek === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <div className="flex items-center gap-2 overflow-x-auto px-4">
                {Array.from({ length: 15 }, (_, i) => i + 1).map((week) => (
                  <button
                    key={week}
                    onClick={() => setSelectedWeek(week)}
                    className={cn(
                      "w-10 h-10 rounded-lg font-medium transition-all flex-shrink-0",
                      selectedWeek === week
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                    )}
                  >
                    {week}
                  </button>
                ))}
              </div>
              <Button
                variant="ghost"
                onClick={() => setSelectedWeek(Math.min(15, selectedWeek + 1))}
                disabled={selectedWeek === 15}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {/* Week Header */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground">Week {selectedWeek}</h2>
              <p className="text-muted-foreground">
                {weekTasks.length} tasks scheduled
              </p>
            </div>

            {/* Timetable View */}
            {viewMode === "timetable" && (
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-secondary/50">
                      <th className="text-left p-4 font-semibold text-foreground border-b border-border">Day</th>
                      <th className="text-left p-4 font-semibold text-foreground border-b border-border">Date</th>
                      <th className="text-left p-4 font-semibold text-foreground border-b border-border">Time Slot</th>
                      <th className="text-left p-4 font-semibold text-foreground border-b border-border">Topics to Cover</th>
                      <th className="text-left p-4 font-semibold text-foreground border-b border-border">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getTasksByDate().length > 0 ? (
                      getTasksByDate().map(([dateKey, dateTasks]) => {
                        const date = new Date(dateKey);
                        return dateTasks.map((task, idx) => {
                          const course = courses.find((c) => c.id === task.courseId);
                          return (
                            <tr
                              key={task.id}
                              className={cn(
                                "border-b border-border last:border-0 hover:bg-secondary/30 transition-colors",
                                idx > 0 && "border-t-0"
                              )}
                            >
                              {idx === 0 && (
                                <>
                                  <td
                                    className="p-4 font-medium text-foreground align-top"
                                    rowSpan={dateTasks.length}
                                  >
                                    {format(date, "EEEE")}
                                  </td>
                                  <td
                                    className="p-4 text-muted-foreground align-top"
                                    rowSpan={dateTasks.length}
                                  >
                                    {format(date, "MMM dd, yyyy")}
                                  </td>
                                </>
                              )}
                              <td className="p-4">
                                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                                  <Clock className="w-4 h-4" />
                                  {task.startTime} - {task.endTime}
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="flex items-start gap-3">
                                  <div
                                    className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                                    style={{ backgroundColor: course?.color }}
                                  />
                                  <div>
                                    <p className="font-medium text-foreground">{task.title}</p>
                                    <p className="text-sm text-muted-foreground mt-0.5">
                                      {task.description}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(task.status)}
                                  <span
                                    className={cn(
                                      "text-sm font-medium capitalize",
                                      task.status === "completed" && "text-success",
                                      task.status === "pending" && "text-warning",
                                      task.status === "overdue" && "text-destructive"
                                    )}
                                  >
                                    {task.status}
                                  </span>
                                  {task.status !== "completed" && (
                                    <Button
                                      variant="success"
                                      size="sm"
                                      className="ml-2"
                                      onClick={() => {
                                        updateTaskStatus(task.id, "completed");
                                        toast({
                                          title: "Task completed!",
                                          description: "Great progress!",
                                        });
                                      }}
                                    >
                                      <CheckCircle2 className="w-3 h-3" />
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        });
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                          No tasks scheduled for this week
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* List View */}
            {viewMode === "list" && (
              <div className="space-y-4">
                {weekTasks.length > 0 ? (
                  weekTasks.map((task) => {
                    const course = courses.find((c) => c.id === task.courseId);
                    return (
                      <div
                        key={task.id}
                        className={cn(
                          "border rounded-2xl p-5 transition-all hover:shadow-soft",
                          getStatusBg(task.status)
                        )}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${course?.color}20` }}
                          >
                            <BookOpen
                              className="w-5 h-5"
                              style={{ color: course?.color }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h3 className="font-semibold text-foreground">
                                  {task.title}
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {task.description}
                                </p>
                                <p className="text-xs text-primary mt-2">
                                  {format(new Date(task.dueDate), "EEEE, MMM dd")} • {task.startTime} - {task.endTime}
                                </p>
                              </div>
                              {getStatusIcon(task.status)}
                            </div>
                            <div className="flex items-center gap-4 mt-4">
                              {task.status !== "completed" && (
                                <Button
                                  variant="success"
                                  size="sm"
                                  onClick={() => {
                                    updateTaskStatus(task.id, "completed");
                                    toast({
                                      title: "Task completed! 🎉",
                                      description: "Great job! Keep up the good work.",
                                    });
                                  }}
                                >
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Mark as Done
                                </Button>
                              )}
                              {task.status === "completed" && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => updateTaskStatus(task.id, "pending")}
                                >
                                  Mark as Pending
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 bg-card border border-border rounded-2xl">
                    <CalendarDays className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground">No tasks for this week</p>
                  </div>
                )}
              </div>
            )}

            {/* Calendar View */}
            {viewMode === "calendar" && (
              <div className="grid grid-cols-7 gap-3">
                {days.map((day) => (
                  <div key={day} className="text-center">
                    <div className="text-sm font-medium text-muted-foreground mb-2 capitalize">
                      {day.slice(0, 3)}
                    </div>
                    <div className="space-y-2">
                      {weekTasks
                        .filter((t) => {
                          const taskDay = new Date(t.dueDate).getDay();
                          const dayIndex = days.indexOf(day);
                          return taskDay === (dayIndex + 1) % 7;
                        })
                        .map((task) => {
                          const course = courses.find((c) => c.id === task.courseId);
                          return (
                            <div
                              key={task.id}
                              className={cn(
                                "p-2 rounded-lg text-xs cursor-pointer transition-all hover:scale-105",
                                getStatusBg(task.status)
                              )}
                              onClick={() => {
                                if (task.status !== "completed") {
                                  updateTaskStatus(task.id, "completed");
                                  toast({
                                    title: "Task completed!",
                                    description: task.title,
                                  });
                                }
                              }}
                            >
                              <div
                                className="w-full h-1 rounded mb-1"
                                style={{ backgroundColor: course?.color }}
                              />
                              <p className="font-medium text-foreground truncate">
                                {course?.name}
                              </p>
                              <p className="text-muted-foreground truncate text-[10px]">
                                {task.startTime}
                              </p>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Chart View */}
            {viewMode === "chart" && <ScheduleChartView />}

            {/* Flowchart View */}
            {viewMode === "flowchart" && <ScheduleFlowchartView />}
          </>
        ) : (
          <div className="bg-card border border-border rounded-2xl p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <CalendarDays className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No roadmap generated yet
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {courses.length === 0
                ? "Add your courses first, then generate your personalized study roadmap."
                : "Configure your schedule above and click 'Generate Roadmap' to create your study plan."}
            </p>
            {courses.length === 0 && (
              <Link to="/dashboard/courses">
                <Button variant="hero">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Add Courses First
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Roadmap;
