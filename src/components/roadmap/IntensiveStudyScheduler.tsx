import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useStudyPlannerStore, BreakInterval } from "@/lib/store";
import { toast } from "@/hooks/use-toast";
import {
  CalendarIcon,
  Clock,
  Plus,
  Trash2,
  Sparkles,
  BookOpen,
  Zap,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, differenceInDays, addDays } from "date-fns";

interface IntensiveStudySchedulerProps {
  onScheduleGenerated: () => void;
}

const IntensiveStudyScheduler = ({ onScheduleGenerated }: IntensiveStudySchedulerProps) => {
  const { courses, scheduleConfig, setScheduleConfig, generateRoadmap } = useStudyPlannerStore();
  
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [availabilityStart, setAvailabilityStart] = useState("08:00");
  const [availabilityEnd, setAvailabilityEnd] = useState("23:00");
  const [breaks, setBreaks] = useState<BreakInterval[]>([]);
  const [newBreakStart, setNewBreakStart] = useState("13:00");
  const [newBreakEnd, setNewBreakEnd] = useState("14:00");
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);

  const handleDateSelect = (dates: Date[] | undefined) => {
    setSelectedDates(dates || []);
  };

  const handleAddBreak = () => {
    if (!newBreakStart || !newBreakEnd) return;
    const newBreak: BreakInterval = {
      id: Math.random().toString(36).substr(2, 9),
      startTime: newBreakStart,
      endTime: newBreakEnd,
    };
    setBreaks([...breaks, newBreak]);
    setNewBreakStart("13:00");
    setNewBreakEnd("14:00");
  };

  const handleRemoveBreak = (id: string) => {
    setBreaks(breaks.filter((b) => b.id !== id));
  };

  const handleCourseToggle = (courseId: string, checked: boolean) => {
    if (checked) {
      setSelectedCourseIds([...selectedCourseIds, courseId]);
    } else {
      setSelectedCourseIds(selectedCourseIds.filter((id) => id !== courseId));
    }
  };

  const handleSelectAllCourses = () => {
    if (selectedCourseIds.length === courses.length) {
      setSelectedCourseIds([]);
    } else {
      setSelectedCourseIds(courses.map((c) => c.id));
    }
  };

  const handleGenerateSchedule = () => {
    if (selectedDates.length === 0) {
      toast({
        title: "No dates selected",
        description: "Please select at least one date on the calendar.",
        variant: "destructive",
      });
      return;
    }

    if (courses.length === 0) {
      toast({
        title: "No courses added",
        description: "Please add courses before generating a schedule.",
        variant: "destructive",
      });
      return;
    }

    // Update schedule config - use local date format to avoid timezone issues
    const localDateStrings = selectedDates.map((d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    });
    setScheduleConfig({
      selectedDates: localDateStrings,
      availabilityStart,
      availabilityEnd,
      breakIntervals: breaks,
      selectedCourseIds: selectedCourseIds.length > 0 ? selectedCourseIds : courses.map((c) => c.id),
    });

    // Generate roadmap with a small delay to ensure state is updated
    setTimeout(() => {
      generateRoadmap();
      toast({
        title: "Intensive Schedule Generated! 🔥",
        description: `Your ${selectedDates.length}-day study plan is ready. Cover everything before your exam!`,
      });
      onScheduleGenerated();
    }, 100);
  };

  // Calculate total study hours available
  const calculateTotalHours = () => {
    const startMins = parseInt(availabilityStart.split(":")[0]) * 60 + parseInt(availabilityStart.split(":")[1]);
    const endMins = parseInt(availabilityEnd.split(":")[0]) * 60 + parseInt(availabilityEnd.split(":")[1]);
    const availableMins = endMins - startMins;
    
    const breakMins = breaks.reduce((total, brk) => {
      const bStart = parseInt(brk.startTime.split(":")[0]) * 60 + parseInt(brk.startTime.split(":")[1]);
      const bEnd = parseInt(brk.endTime.split(":")[0]) * 60 + parseInt(brk.endTime.split(":")[1]);
      return total + (bEnd - bStart);
    }, 0);
    
    const netMinsPerDay = Math.max(0, availableMins - breakMins);
    const totalHours = (netMinsPerDay * selectedDates.length) / 60;
    
    return { perDay: (netMinsPerDay / 60).toFixed(1), total: totalHours.toFixed(1) };
  };

  const hours = calculateTotalHours();
  const coursesToShow = selectedCourseIds.length > 0 
    ? courses.filter(c => selectedCourseIds.includes(c.id)) 
    : courses;

  return (
    <div className="bg-gradient-to-br from-warning/5 via-card to-destructive/5 border-2 border-warning/30 rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
          <Zap className="w-6 h-6 text-warning" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            Intensive Study Mode
            <span className="text-xs bg-warning/20 text-warning px-2 py-0.5 rounded-full font-medium">
              Last-Minute Prep
            </span>
          </h2>
          <p className="text-sm text-muted-foreground">
            For students who need to cover the entire syllabus in a few days
          </p>
        </div>
      </div>

      {/* Date Selection */}
      <div className="space-y-4">
        <h3 className="text-md font-semibold text-foreground flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-warning" />
          Step 1: Select Your Available Days
        </h3>
        <p className="text-sm text-muted-foreground">
          Pick the dates you have available for intensive studying. The schedule will distribute all topics across these days.
        </p>
        
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="bg-card/50 rounded-xl p-4 border border-border">
            <Calendar
              mode="multiple"
              selected={selectedDates}
              onSelect={handleDateSelect}
              className="pointer-events-auto"
              numberOfMonths={1}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            />
          </div>
          
          <div className="flex-1 space-y-4">
            <div className="bg-card/50 rounded-xl p-4 border border-border">
              <p className="text-sm font-medium text-foreground mb-2">
                Selected Days: <span className="text-warning font-bold">{selectedDates.length}</span>
              </p>
              {selectedDates.length > 0 ? (
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {selectedDates.sort((a, b) => a.getTime() - b.getTime()).map((d) => (
                    <span
                      key={d.toISOString()}
                      className="bg-warning/10 text-warning px-2 py-1 rounded text-xs font-medium"
                    >
                      {format(d, "EEE, MMM dd")}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Click on dates in the calendar to select them
                </p>
              )}
            </div>

            {/* Quick Date Presets */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const tomorrow = addDays(new Date(), 1);
                  setSelectedDates([tomorrow]);
                }}
                className="text-xs"
              >
                Tomorrow Only
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const dates = [];
                  for (let i = 1; i <= 3; i++) {
                    dates.push(addDays(new Date(), i));
                  }
                  setSelectedDates(dates);
                }}
                className="text-xs"
              >
                Next 3 Days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const dates = [];
                  for (let i = 1; i <= 7; i++) {
                    dates.push(addDays(new Date(), i));
                  }
                  setSelectedDates(dates);
                }}
                className="text-xs"
              >
                Next Week
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Time Availability */}
      <div className="space-y-4 pt-4 border-t border-border">
        <h3 className="text-md font-semibold text-foreground flex items-center gap-2">
          <Clock className="w-4 h-4 text-warning" />
          Step 2: Set Your Daily Availability
        </h3>
        <p className="text-sm text-muted-foreground">
          What hours are you available to study each day?
        </p>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Start Time
            </label>
            <Input
              type="time"
              value={availabilityStart}
              onChange={(e) => setAvailabilityStart(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              End Time
            </label>
            <Input
              type="time"
              value={availabilityEnd}
              onChange={(e) => setAvailabilityEnd(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Break Intervals */}
      <div className="space-y-4 pt-4 border-t border-border">
        <h3 className="text-md font-semibold text-foreground flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-warning" />
          Step 3: Add Break Times (Optional)
        </h3>
        <p className="text-sm text-muted-foreground">
          Add times when you need breaks (lunch, dinner, rest). Your schedule will avoid these slots.
        </p>

        {/* Existing breaks */}
        {breaks.length > 0 && (
          <div className="space-y-2">
            {breaks.map((brk) => (
              <div
                key={brk.id}
                className="flex items-center justify-between bg-card/50 rounded-lg px-4 py-2 border border-border"
              >
                <span className="text-sm font-medium text-foreground">
                  🍽️ {brk.startTime} - {brk.endTime}
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
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex-1 min-w-[120px]">
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Break Start
            </label>
            <Input
              type="time"
              value={newBreakStart}
              onChange={(e) => setNewBreakStart(e.target.value)}
            />
          </div>
          <div className="flex-1 min-w-[120px]">
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

        {/* Quick break presets */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setBreaks([
                ...breaks,
                { id: Math.random().toString(36).substr(2, 9), startTime: "13:00", endTime: "14:00" },
              ]);
            }}
            className="text-xs"
          >
            + Lunch (1-2 PM)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setBreaks([
                ...breaks,
                { id: Math.random().toString(36).substr(2, 9), startTime: "19:00", endTime: "20:00" },
              ]);
            }}
            className="text-xs"
          >
            + Dinner (7-8 PM)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setBreaks([
                ...breaks,
                { id: Math.random().toString(36).substr(2, 9), startTime: "16:00", endTime: "16:30" },
              ]);
            }}
            className="text-xs"
          >
            + Short Break (4-4:30 PM)
          </Button>
        </div>
      </div>

      {/* Course Selection */}
      <div className="space-y-4 pt-4 border-t border-border">
        <h3 className="text-md font-semibold text-foreground flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-warning" />
          Step 4: Select Courses to Cover
        </h3>
        <p className="text-sm text-muted-foreground">
          Choose which courses to include in your intensive schedule. Leave all unchecked to include all.
        </p>

        {courses.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <Checkbox
                id="intensive-select-all"
                checked={selectedCourseIds.length === courses.length}
                onCheckedChange={handleSelectAllCourses}
              />
              <label
                htmlFor="intensive-select-all"
                className="text-sm font-medium cursor-pointer"
              >
                {selectedCourseIds.length === courses.length ? "Deselect All" : "Select All"}
              </label>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer",
                    selectedCourseIds.includes(course.id)
                      ? "border-warning bg-warning/5"
                      : "border-border bg-card/50 hover:bg-card"
                  )}
                  onClick={() =>
                    handleCourseToggle(course.id, !selectedCourseIds.includes(course.id))
                  }
                >
                  <Checkbox
                    checked={selectedCourseIds.includes(course.id)}
                    onCheckedChange={(checked) => handleCourseToggle(course.id, checked as boolean)}
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
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No courses added yet. Add courses first to schedule them.
          </p>
        )}
      </div>

      {/* Summary & Generate */}
      {selectedDates.length > 0 && courses.length > 0 && (
        <div className="bg-warning/10 rounded-xl p-4 border border-warning/20">
          <h4 className="font-semibold text-foreground mb-2">📊 Schedule Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Study Days</p>
              <p className="text-lg font-bold text-warning">{selectedDates.length}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Hours/Day</p>
              <p className="text-lg font-bold text-warning">{hours.perDay}h</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Hours</p>
              <p className="text-lg font-bold text-warning">{hours.total}h</p>
            </div>
            <div>
              <p className="text-muted-foreground">Courses</p>
              <p className="text-lg font-bold text-warning">
                {selectedCourseIds.length > 0 ? selectedCourseIds.length : courses.length}
              </p>
            </div>
          </div>
        </div>
      )}

      <Button
        variant="hero"
        size="lg"
        onClick={handleGenerateSchedule}
        disabled={selectedDates.length === 0 || courses.length === 0}
        className="w-full bg-gradient-to-r from-warning to-destructive hover:from-warning/90 hover:to-destructive/90"
      >
        <Sparkles className="w-5 h-5 mr-2" />
        Generate Intensive Schedule
      </Button>
    </div>
  );
};

export default IntensiveStudyScheduler;
