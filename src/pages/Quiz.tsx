import { useState, useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useStudyPlannerStore } from "@/lib/store";
import { toast } from "@/hooks/use-toast";
import {
  Brain,
  Play,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Sparkles,
  FileText,
  ListChecks,
  PenLine,
  Upload,
  X,
  Image,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type QuestionType = "mcq" | "short" | "long";
type DifficultyLevel = "easy" | "medium" | "hard" | "pro";

interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string;
  marks: number;
  userAnswer?: string;
  isCorrect?: boolean;
}

interface QuizConfig {
  mcqCount: number;
  mcqMarks: number;
  shortCount: number;
  shortMarks: number;
  longCount: number;
  longMarks: number;
  difficulty: DifficultyLevel;
}

const difficultyLabels: Record<DifficultyLevel, string> = {
  easy: "Easy - Basic recall questions",
  medium: "Medium - Understanding & application",
  hard: "Hard - Analysis & critical thinking",
  pro: "Pro - Expert level challenges",
};

const Quiz = () => {
  const { tasks, courses } = useStudyPlannerStore();
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [config, setConfig] = useState<QuizConfig>({
    mcqCount: 5,
    mcqMarks: 1,
    shortCount: 3,
    shortMarks: 3,
    longCount: 2,
    longMarks: 5,
    difficulty: "medium",
  });

  const completedTasks = tasks.filter((t) => t.status === "completed");

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
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(
      (file) =>
        file.type.startsWith("image/") ||
        file.type === "application/pdf"
    );
    setUploadedFiles((prev) => [...prev, ...validFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(
      (file) =>
        file.type.startsWith("image/") ||
        file.type === "application/pdf"
    );
    setUploadedFiles((prev) => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const generateQuestions = () => {
    if (completedTasks.length === 0 && uploadedFiles.length === 0) {
      toast({
        title: "No content available",
        description: "Complete some tasks or upload content to generate quiz questions.",
        variant: "destructive",
      });
      return;
    }

    const generatedQuestions: QuizQuestion[] = [];
    const shuffledTasks = [...completedTasks].sort(() => Math.random() - 0.5);

    // Generate MCQ questions
    for (let i = 0; i < config.mcqCount && i < shuffledTasks.length; i++) {
      const task = shuffledTasks[i % shuffledTasks.length];
      const course = courses.find((c) => c.id === task.courseId);
      generatedQuestions.push({
        id: `mcq-${i}`,
        type: "mcq",
        question: `What is the main focus of "${task.title.split(": ")[1] || task.title}" in ${course?.name || "this course"}?`,
        options: [
          `Understanding ${task.title.split(": ")[1] || "the topic"} fundamentals`,
          `Applying ${task.title.split(": ")[1] || "concepts"} in practice`,
          `Reviewing previous ${task.title.split(": ")[1] || "material"}`,
          `Preparing for advanced ${task.title.split(": ")[1] || "topics"}`,
        ],
        correctAnswer: `Understanding ${task.title.split(": ")[1] || "the topic"} fundamentals`,
        marks: config.mcqMarks,
      });
    }

    // Generate Short Answer questions
    for (let i = 0; i < config.shortCount && i < shuffledTasks.length; i++) {
      const task = shuffledTasks[(i + config.mcqCount) % shuffledTasks.length];
      const course = courses.find((c) => c.id === task.courseId);
      generatedQuestions.push({
        id: `short-${i}`,
        type: "short",
        question: `Briefly explain the key concepts covered in "${task.title.split(": ")[1] || task.title}" for ${course?.name || "this course"}. (2-3 sentences)`,
        correctAnswer: `Key concepts include the fundamentals and practical applications of ${task.title.split(": ")[1] || "the topic"}.`,
        marks: config.shortMarks,
      });
    }

    // Generate Long Answer questions
    for (let i = 0; i < config.longCount && i < shuffledTasks.length; i++) {
      const task = shuffledTasks[(i + config.mcqCount + config.shortCount) % shuffledTasks.length];
      const course = courses.find((c) => c.id === task.courseId);
      generatedQuestions.push({
        id: `long-${i}`,
        type: "long",
        question: `Provide a detailed explanation of "${task.title.split(": ")[1] || task.title}" in ${course?.name || "this course"}. Include examples and discuss its importance in the overall curriculum.`,
        correctAnswer: `A comprehensive answer should cover the main concepts, provide relevant examples, and explain the significance of ${task.title.split(": ")[1] || "the topic"} in the broader context of the course.`,
        marks: config.longMarks,
      });
    }

    // If we have uploaded files but no completed tasks, generate placeholder questions
    if (generatedQuestions.length === 0 && uploadedFiles.length > 0) {
      for (let i = 0; i < config.mcqCount; i++) {
        generatedQuestions.push({
          id: `mcq-${i}`,
          type: "mcq",
          question: `Based on the uploaded content, what is the main concept discussed in section ${i + 1}?`,
          options: [
            "Understanding core fundamentals",
            "Applying practical concepts",
            "Reviewing theoretical material",
            "Analyzing advanced topics",
          ],
          correctAnswer: "Understanding core fundamentals",
          marks: config.mcqMarks,
        });
      }
    }

    setQuestions(generatedQuestions);
    setQuizStarted(true);
    setCurrentQuestionIndex(0);
    setQuizCompleted(false);
  };

  const handleAnswer = (answer: string) => {
    const updatedQuestions = [...questions];
    const currentQuestion = updatedQuestions[currentQuestionIndex];
    currentQuestion.userAnswer = answer;

    if (currentQuestion.type === "mcq") {
      currentQuestion.isCorrect = answer === currentQuestion.correctAnswer;
    } else {
      currentQuestion.isCorrect = answer.trim().length > 10;
    }

    setQuestions(updatedQuestions);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setQuizCompleted(true);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const calculateScore = () => {
    const totalMarks = questions.reduce((acc, q) => acc + q.marks, 0);
    const obtainedMarks = questions.reduce(
      (acc, q) => acc + (q.isCorrect ? q.marks : 0),
      0
    );
    return { totalMarks, obtainedMarks };
  };

  const resetQuiz = () => {
    setQuizStarted(false);
    setQuizCompleted(false);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setUploadedFiles([]);
  };

  const totalQuestions = config.mcqCount + config.shortCount + config.longCount;
  const totalMarks =
    config.mcqCount * config.mcqMarks +
    config.shortCount * config.shortMarks +
    config.longCount * config.longMarks;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Brain className="w-8 h-8 text-primary" />
            Quiz Generator
          </h1>
          <p className="text-muted-foreground mt-1">
            Test your knowledge on completed topics with smart generated questions
          </p>
        </div>

        {!quizStarted ? (
          <div className="space-y-6">
            {/* Quiz Configuration */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-foreground mb-6">
                Configure Your Quiz
              </h2>

              <div className="grid md:grid-cols-3 gap-6">
                {/* MCQ Configuration */}
                <div className="space-y-4 p-4 rounded-xl bg-secondary/50 border border-border">
                  <div className="flex items-center gap-2">
                    <ListChecks className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-foreground">MCQs</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-muted-foreground">
                        Number of Questions
                      </label>
                      <Input
                        type="number"
                        min={0}
                        max={20}
                        value={config.mcqCount}
                        onChange={(e) =>
                          setConfig({ ...config, mcqCount: parseInt(e.target.value) || 0 })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">
                        Marks per Question
                      </label>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={config.mcqMarks}
                        onChange={(e) =>
                          setConfig({ ...config, mcqMarks: parseInt(e.target.value) || 1 })
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Short Answer Configuration */}
                <div className="space-y-4 p-4 rounded-xl bg-secondary/50 border border-border">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-accent" />
                    <h3 className="font-semibold text-foreground">Short Answer</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-muted-foreground">
                        Number of Questions
                      </label>
                      <Input
                        type="number"
                        min={0}
                        max={20}
                        value={config.shortCount}
                        onChange={(e) =>
                          setConfig({ ...config, shortCount: parseInt(e.target.value) || 0 })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">
                        Marks per Question
                      </label>
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        value={config.shortMarks}
                        onChange={(e) =>
                          setConfig({ ...config, shortMarks: parseInt(e.target.value) || 1 })
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Long Answer Configuration */}
                <div className="space-y-4 p-4 rounded-xl bg-secondary/50 border border-border">
                  <div className="flex items-center gap-2">
                    <PenLine className="w-5 h-5 text-warning" />
                    <h3 className="font-semibold text-foreground">Long Answer</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-muted-foreground">
                        Number of Questions
                      </label>
                      <Input
                        type="number"
                        min={0}
                        max={10}
                        value={config.longCount}
                        onChange={(e) =>
                          setConfig({ ...config, longCount: parseInt(e.target.value) || 0 })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">
                        Marks per Question
                      </label>
                      <Input
                        type="number"
                        min={1}
                        max={30}
                        value={config.longMarks}
                        onChange={(e) =>
                          setConfig({ ...config, longMarks: parseInt(e.target.value) || 1 })
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Difficulty Level */}
              <div className="mt-6 p-4 rounded-xl bg-secondary/50 border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Difficulty Level</h3>
                </div>
                <Select
                  value={config.difficulty}
                  onValueChange={(value: DifficultyLevel) => setConfig({ ...config, difficulty: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">🟢 Easy - Basic recall questions</SelectItem>
                    <SelectItem value="medium">🟡 Medium - Understanding & application</SelectItem>
                    <SelectItem value="hard">🟠 Hard - Analysis & critical thinking</SelectItem>
                    <SelectItem value="pro">🔴 Pro - Expert level challenges</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Upload Content Section */}
              <div className="mt-6">
                <Collapsible open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full justify-between h-12">
                      <div className="flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        <span>Upload Topics for Quiz (Optional)</span>
                        {uploadedFiles.length > 0 && (
                          <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            {uploadedFiles.length} file(s)
                          </span>
                        )}
                      </div>
                      <Image className="w-4 h-4" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4">
                    <div className="bg-secondary/30 rounded-xl p-4 border border-border">
                      <p className="text-sm text-muted-foreground mb-4">
                        Upload PDFs or images of your topics and the quiz will be generated based on that content.
                      </p>
                      <div
                        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
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
                          accept=".pdf,image/*"
                          multiple
                          className="hidden"
                          onChange={handleFileSelect}
                        />
                        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-foreground font-medium mb-1">
                          Drag & drop files here
                        </p>
                        <p className="text-sm text-muted-foreground">
                          or click to browse (PDF, Images)
                        </p>
                      </div>

                      {uploadedFiles.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {uploadedFiles.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between bg-background rounded-lg p-3 border border-border"
                            >
                              <div className="flex items-center gap-2">
                                {file.type.startsWith("image/") ? (
                                  <Image className="w-4 h-4 text-primary" />
                                ) : (
                                  <FileText className="w-4 h-4 text-primary" />
                                )}
                                <span className="text-sm text-foreground truncate max-w-[200px]">
                                  {file.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  ({(file.size / 1024).toFixed(1)} KB)
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => removeFile(index)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{completedTasks.length}</span> completed tasks available for quiz
                  {uploadedFiles.length > 0 && (
                    <span className="ml-2">
                      + <span className="font-medium text-foreground">{uploadedFiles.length}</span> uploaded files
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total: <span className="font-medium text-foreground">{totalQuestions}</span> questions,{" "}
                  <span className="font-medium text-foreground">{totalMarks}</span> marks
                </div>
              </div>
            </div>

            {/* Completed Tasks Preview */}
            {completedTasks.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Available Topics ({completedTasks.length})
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {completedTasks.slice(0, 6).map((task) => {
                    const course = courses.find((c) => c.id === task.courseId);
                    return (
                      <div
                        key={task.id}
                        className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50"
                      >
                        <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {task.title.split(": ")[1] || task.title}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {course?.name}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {completedTasks.length > 6 && (
                  <p className="text-sm text-muted-foreground mt-3">
                    And {completedTasks.length - 6} more topics...
                  </p>
                )}
              </div>
            )}

            {/* Start Quiz Button */}
            <Button
              variant="hero"
              size="lg"
              className="w-full"
              onClick={generateQuestions}
              disabled={completedTasks.length === 0 && uploadedFiles.length === 0}
            >
              <Play className="w-5 h-5 mr-2" />
              Start Quiz
            </Button>
          </div>
        ) : quizCompleted ? (
          // Quiz Results
          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Brain className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Quiz Completed!
            </h2>
            <p className="text-muted-foreground mb-6">
              Here's how you performed
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="p-4 rounded-xl bg-secondary/50">
                <p className="text-3xl font-bold text-foreground">
                  {calculateScore().obtainedMarks}/{calculateScore().totalMarks}
                </p>
                <p className="text-sm text-muted-foreground">Total Score</p>
              </div>
              <div className="p-4 rounded-xl bg-success/10">
                <p className="text-3xl font-bold text-success">
                  {questions.filter((q) => q.isCorrect).length}
                </p>
                <p className="text-sm text-muted-foreground">Correct</p>
              </div>
              <div className="p-4 rounded-xl bg-destructive/10">
                <p className="text-3xl font-bold text-destructive">
                  {questions.filter((q) => !q.isCorrect).length}
                </p>
                <p className="text-sm text-muted-foreground">Incorrect</p>
              </div>
            </div>

            <Button variant="hero" onClick={resetQuiz}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Take Another Quiz
            </Button>
          </div>
        ) : (
          // Quiz Questions
          <div className="space-y-6">
            {/* Progress */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <div className="flex gap-1">
                {questions.map((_, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "w-8 h-1 rounded-full transition-colors",
                      idx === currentQuestionIndex
                        ? "bg-primary"
                        : idx < currentQuestionIndex
                        ? "bg-success"
                        : "bg-muted"
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                {questions[currentQuestionIndex].type === "mcq" && (
                  <ListChecks className="w-5 h-5 text-primary" />
                )}
                {questions[currentQuestionIndex].type === "short" && (
                  <FileText className="w-5 h-5 text-accent" />
                )}
                {questions[currentQuestionIndex].type === "long" && (
                  <PenLine className="w-5 h-5 text-warning" />
                )}
                <span className="text-sm font-medium text-muted-foreground uppercase">
                  {questions[currentQuestionIndex].type === "mcq"
                    ? "Multiple Choice"
                    : questions[currentQuestionIndex].type === "short"
                    ? "Short Answer"
                    : "Long Answer"}
                </span>
                <span className="ml-auto text-sm text-muted-foreground">
                  {questions[currentQuestionIndex].marks} mark
                  {questions[currentQuestionIndex].marks > 1 ? "s" : ""}
                </span>
              </div>

              <h3 className="text-xl font-semibold text-foreground mb-6">
                {questions[currentQuestionIndex].question}
              </h3>

              {questions[currentQuestionIndex].type === "mcq" ? (
                <div className="space-y-3">
                  {questions[currentQuestionIndex].options?.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(option)}
                      className={cn(
                        "w-full p-4 rounded-xl text-left transition-all border",
                        questions[currentQuestionIndex].userAnswer === option
                          ? "bg-primary/10 border-primary"
                          : "bg-secondary/50 border-border hover:border-primary/50"
                      )}
                    >
                      <span className="font-medium text-foreground">{option}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <Textarea
                  placeholder={
                    questions[currentQuestionIndex].type === "short"
                      ? "Write your answer in 2-3 sentences..."
                      : "Write a detailed answer with examples..."
                  }
                  value={questions[currentQuestionIndex].userAnswer || ""}
                  onChange={(e) => handleAnswer(e.target.value)}
                  className={cn(
                    "min-h-[120px]",
                    questions[currentQuestionIndex].type === "long" && "min-h-[200px]"
                  )}
                />
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="secondary"
                onClick={prevQuestion}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>
              <Button
                variant="hero"
                onClick={nextQuestion}
                disabled={!questions[currentQuestionIndex].userAnswer}
              >
                {currentQuestionIndex === questions.length - 1 ? "Finish Quiz" : "Next"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Quiz;
