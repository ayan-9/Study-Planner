import { useState, useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useStudyPlannerStore, Course } from "@/lib/store";
import { extractWeeklyTopicsFromFile } from "@/lib/syllabusParser";
import { toast } from "@/hooks/use-toast";
import {
  Plus,
  Upload,
  FileText,
  Trash2,
  BookOpen,
  X,
  ChevronDown,
  ChevronUp,
  PenLine,
  Loader2,
  Eye,
  Calendar,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface WeeklyContent {
  [key: number]: string;
}

const Courses = () => {
  const { courses, addCourse, removeCourse } = useStudyPlannerStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newCourseName, setNewCourseName] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isParsingSyllabus, setIsParsingSyllabus] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [weeklyContent, setWeeklyContent] = useState<WeeklyContent>({});
  const [isWeeklyContentOpen, setIsWeeklyContentOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [viewingCourse, setViewingCourse] = useState<typeof courses[0] | null>(null);

  const handleAddCourse = async () => {
    if (!newCourseName.trim()) {
      toast({
        title: "Course name required",
        description: "Please enter a name for your course.",
        variant: "destructive",
      });
      return;
    }

    // Parse syllabus (optional) into week-by-week topics.
    // Manual typed content always overrides extracted content.
    const extracted = new Map<number, string>();

    if (uploadedFile) {
      setIsParsingSyllabus(true);
      try {
        const extractedTopics = await extractWeeklyTopicsFromFile(uploadedFile);
        extractedTopics.forEach((t) => extracted.set(t.week, t.content));

        if (extractedTopics.length === 0) {
          toast({
            title: "Could not detect weekly topics",
            description: "Try a clearer PDF/image, or type topics manually in the weekly section.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Syllabus topics extracted",
            description: `Found topics for ${extractedTopics.length} week(s).`,
          });
        }
      } catch (e) {
        console.error(e);
        toast({
          title: "Syllabus could not be read",
          description: "Upload a clear PDF/image, or type topics manually in the weekly section.",
          variant: "destructive",
        });
      } finally {
        setIsParsingSyllabus(false);
      }
    }

    // Manual content (optional)
    Object.entries(weeklyContent)
      .filter(([_, content]) => content.trim())
      .forEach(([week, content]) => extracted.set(parseInt(week), content.trim()));

    const mergedWeeklyContent = Array.from(extracted.entries())
      .filter(([week, content]) => Number.isFinite(week) && week >= 1 && week <= 15 && !!content)
      .sort(([a], [b]) => a - b)
      .map(([week, content]) => ({ week, content }));

    const newCourse: Course = {
      id: Math.random().toString(36).substr(2, 9),
      name: newCourseName.trim(),
      color: "",
      fileName: uploadedFile?.name,
      weeklyContent: mergedWeeklyContent.length > 0 ? mergedWeeklyContent : undefined,
      createdAt: new Date(),
    };

    addCourse(newCourse);
    setNewCourseName("");
    setUploadedFile(null);
    setWeeklyContent({});
    setIsAdding(false);
    setIsWeeklyContentOpen(false);

    toast({
      title: "Course added",
      description: `${newCourse.name} has been added to your courses.`,
    });
  };

  const handleRemoveCourse = (course: Course) => {
    removeCourse(course.id);
    toast({
      title: "Course removed",
      description: `${course.name} has been removed from your courses.`,
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleWeeklyContentChange = (week: number, content: string) => {
    setWeeklyContent((prev) => ({
      ...prev,
      [week]: content,
    }));
  };

  const hasWeeklyContent = Object.values(weeklyContent).some((content) => content.trim());

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Courses</h1>
            <p className="text-muted-foreground mt-1">
              Manage your courses and upload syllabi
            </p>
          </div>
          {!isAdding && courses.length < 15 && (
            <Button variant="hero" onClick={() => setIsAdding(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Course
            </Button>
          )}
        </div>

        {/* Add Course Form */}
        {isAdding && (
          <div className="bg-card border border-border rounded-2xl p-6 animate-slide-up">
            <h2 className="text-xl font-semibold text-foreground mb-6">
              Add New Course
            </h2>
            <div className="space-y-6">
              {/* Course Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Course Name <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="e.g., Introduction to Computer Science"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  className="h-12"
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Upload Syllabus (Optional)
                </label>
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                    isDragging
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.bmp,.gif,.tiff,.tif,.heic"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  {uploadedFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileText className="w-8 h-8 text-primary" />
                      <div className="text-left">
                        <p className="font-medium text-foreground">{uploadedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(uploadedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadedFile(null);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-foreground font-medium mb-1">
                        Drag & drop your file here
                      </p>
                      <p className="text-sm text-muted-foreground">
                        or click to browse (PDF, DOC, Images)
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Weekly Content Input */}
              <div>
                <Collapsible open={isWeeklyContentOpen} onOpenChange={setIsWeeklyContentOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full justify-between h-12">
                      <div className="flex items-center gap-2">
                        <PenLine className="w-4 h-4" />
                        <span>Add Course Content by Week (Optional)</span>
                        {hasWeeklyContent && (
                          <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            Content Added
                          </span>
                        )}
                      </div>
                      {isWeeklyContentOpen ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4">
                    <div className="bg-secondary/30 rounded-xl p-4 border border-border">
                      <p className="text-sm text-muted-foreground mb-4">
                        For those who don't have PDF or images, you can type your course content week by week.
                      </p>
                      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        {Array.from({ length: 15 }, (_, i) => i + 1).map((week) => (
                          <div key={week} className="space-y-2">
                            <label className="block text-sm font-medium text-foreground">
                              Week {week.toString().padStart(2, "0")}
                            </label>
                            <Textarea
                              placeholder={`Enter topics/content for Week ${week.toString().padStart(2, "0")}...`}
                              value={weeklyContent[week] || ""}
                              onChange={(e) => handleWeeklyContentChange(week, e.target.value)}
                              className="min-h-[80px] resize-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsAdding(false);
                    setNewCourseName("");
                    setUploadedFile(null);
                    setWeeklyContent({});
                    setIsWeeklyContentOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button variant="hero" onClick={handleAddCourse} disabled={isParsingSyllabus}>
                  {isParsingSyllabus ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Reading syllabus...
                    </>
                  ) : (
                    "Add Course"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Courses Grid */}
        {courses.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-card border border-border rounded-2xl p-6 hover:shadow-soft transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${course.color}20` }}
                  >
                    <BookOpen className="w-6 h-6" style={{ color: course.color }} />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                    onClick={() => handleRemoveCourse(course)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {course.name}
                </h3>
                {course.fileName && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="w-4 h-4" />
                    <span className="truncate">{course.fileName}</span>
                  </div>
                )}
                {course.weeklyContent && course.weeklyContent.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                    <PenLine className="w-4 h-4" />
                    <span>{course.weeklyContent.length} weeks of content</span>
                  </div>
                )}
                {/* View Content Button */}
                {course.weeklyContent && course.weeklyContent.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 w-full gap-2 text-primary border-primary/30 hover:bg-primary/10"
                    onClick={() => setViewingCourse(course)}
                  >
                    <Eye className="w-4 h-4" />
                    View Course Content
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          !isAdding && (
            <div className="bg-card border border-border border-dashed rounded-2xl p-12 text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No courses yet
              </h3>
              <p className="text-muted-foreground mb-6">
                Add your first course to start planning your study schedule.
              </p>
              <Button variant="hero" onClick={() => setIsAdding(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Course
              </Button>
            </div>
          )
        )}

        {/* Info Card */}
        {courses.length > 0 && courses.length < 15 && (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
            <h3 className="font-semibold text-foreground mb-2">
              💡 Tip: Add more courses
            </h3>
            <p className="text-muted-foreground text-sm">
              You can add up to 15 courses per semester. The more courses you add, the more comprehensive your study plan will be.
            </p>
          </div>
        )}
      </div>

      {/* ─── Course Content Viewer Modal ────────────────────── */}
      {viewingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${viewingCourse.color}20` }}
                >
                  <BookOpen className="w-5 h-5" style={{ color: viewingCourse.color }} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">{viewingCourse.name}</h2>
                  {viewingCourse.fileName && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <FileText className="w-3 h-3" /> {viewingCourse.fileName}
                    </p>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setViewingCourse(null)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto p-6 space-y-4">
              {Array.isArray(viewingCourse.weeklyContent) && viewingCourse.weeklyContent.length > 0 ? (
                viewingCourse.weeklyContent.map((weekData: any, idx: number) => {
                  const weekNum = weekData.week ?? (idx + 1);
                  const content = weekData.content ?? weekData.topics ?? weekData ?? "";
                  const contentStr = typeof content === "string" ? content : JSON.stringify(content, null, 2);
                  if (!contentStr.trim()) return null;
                  return (
                    <div key={idx} className="bg-secondary/30 border border-border rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                          style={{ backgroundColor: viewingCourse.color }}
                        >
                          {weekNum}
                        </div>
                        <span className="font-semibold text-foreground text-sm">Week {weekNum}</span>
                        <Calendar className="w-3 h-3 text-muted-foreground ml-auto" />
                      </div>
                      <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{contentStr}</p>
                    </div>
                  );
                })
              ) : viewingCourse.weeklyContent && typeof viewingCourse.weeklyContent === "object" ? (
                Object.entries(viewingCourse.weeklyContent).map(([week, content]: [string, any]) => (
                  <div key={week} className="bg-secondary/30 border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: viewingCourse.color }}
                      >
                        {week}
                      </div>
                      <span className="font-semibold text-foreground text-sm">Week {week}</span>
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                      {typeof content === "string" ? content : JSON.stringify(content, null, 2)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p>No content available for this course.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border shrink-0 flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                {Array.isArray(viewingCourse.weeklyContent) ? viewingCourse.weeklyContent.length : Object.keys(viewingCourse.weeklyContent || {}).length} weeks stored in database
              </span>
              <Button variant="outline" onClick={() => setViewingCourse(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Courses;
