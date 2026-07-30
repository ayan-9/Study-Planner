import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useStudyPlannerStore } from "@/lib/store";
import { toast } from "@/hooks/use-toast";
import {
  FileText,
  Sparkles,
  BookOpen,
  Copy,
  Download,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GeneratedNote {
  id: string;
  courseName: string;
  topic: string;
  content: string;
  week: number;
}

const Notes = () => {
  const { courses, tasks } = useStudyPlannerStore();
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [generatedNotes, setGeneratedNotes] = useState<GeneratedNote[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedNote, setExpandedNote] = useState<string | null>(null);

  const completedTasks = tasks.filter((t) => t.status === "completed");

  const generateNotes = () => {
    if (!selectedCourse) {
      toast({
        title: "Select a course",
        description: "Please select a course to generate notes for.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    const course = courses.find((c) => c.id === selectedCourse);
    if (!course) return;

    // Get content for the selected week
    const weekContent = course.weeklyContent?.find((wc) => wc.week === selectedWeek);
    const topic = weekContent?.content || `Week ${selectedWeek} - General Topics`;

    // Simulate note generation
    setTimeout(() => {
      const noteContent = generateNoteContent(course.name, topic, selectedWeek);
      
      const newNote: GeneratedNote = {
        id: Math.random().toString(36).substr(2, 9),
        courseName: course.name,
        topic,
        content: noteContent,
        week: selectedWeek,
      };

      setGeneratedNotes((prev) => [newNote, ...prev]);
      setIsGenerating(false);
      toast({
        title: "Notes generated!",
        description: `Notes for ${course.name} Week ${selectedWeek} are ready.`,
      });
    }, 1500);
  };

  const generateNoteContent = (courseName: string, topic: string, week: number): string => {
    // Parse the topic content to extract meaningful information
    const contentLines = topic.split(/[,;\n]+/).map(line => line.trim()).filter(line => line.length > 0);
    const hasActualContent = topic && !topic.includes("General Topics") && contentLines.length > 0;
    
    if (!hasActualContent) {
      return `# ${courseName} - Week ${week}

## ⚠️ No Content Available

No specific content has been found for Week ${week} of ${courseName}.

### How to Generate Detailed Notes:
1. Go to the **Courses** section
2. Add your course outline as a **PDF/Image** (or type topics manually)
3. Make sure Week ${week} has topics in **Add Course Content by Week**
4. Come back here and generate notes again

---
*Please add course content to generate comprehensive notes.*`;
    }

    // Generate detailed notes based on actual content
    const mainTopics = contentLines.slice(0, Math.min(5, contentLines.length));
    const additionalTopics = contentLines.slice(5);

    let notesContent = `# ${courseName} - Week ${week}
## Study Notes

---

### 📚 Topics Covered This Week
${mainTopics.map((t, i) => `${i + 1}. ${t}`).join('\n')}
${additionalTopics.length > 0 ? `\n*Additional topics:* ${additionalTopics.join(', ')}` : ''}

---

`;

    // Generate detailed sections for each main topic
    mainTopics.forEach((topicItem, index) => {
      notesContent += `### ${index + 1}. ${topicItem}

#### Overview
${topicItem} is a fundamental concept in ${courseName} that builds upon previous knowledge and establishes the groundwork for advanced topics.

#### Key Points
- **Definition:** ${topicItem} refers to the systematic study and application of principles within this domain
- **Importance:** Understanding ${topicItem} is crucial for mastering ${courseName}
- **Context:** This topic connects to the broader curriculum and practical applications

#### Detailed Explanation
${topicItem} encompasses several important aspects that students must understand:

1. **Foundational Concepts**
   - The basic principles underlying ${topicItem}
   - How ${topicItem} relates to core theories in ${courseName}
   - Prerequisites and background knowledge required

2. **Practical Applications**
   - Real-world scenarios where ${topicItem} is applied
   - Industry relevance and career implications
   - Case studies demonstrating ${topicItem} in action

3. **Common Challenges**
   - Typical misconceptions about ${topicItem}
   - Areas that require extra attention and practice
   - Strategies for overcoming difficulties

#### Study Tips for ${topicItem}
- Review related concepts before diving deep
- Practice with examples and exercises
- Connect theory to practical applications
- Discuss with peers and instructors

---

`;
    });

    notesContent += `### 📝 Summary

Week ${week} of ${courseName} covers essential topics including ${mainTopics.slice(0, 3).join(', ')}${mainTopics.length > 3 ? ' and more' : ''}. These concepts form the foundation for understanding more advanced material in upcoming weeks.

### ✅ Key Takeaways
${mainTopics.map(t => `- Master the fundamentals of **${t}**`).join('\n')}

### 🎯 Review Questions
${mainTopics.map((t, i) => `${i + 1}. Explain the key concepts of ${t} and their significance in ${courseName}.`).join('\n')}
${mainTopics.length + 1}. How do these topics connect to each other and to previous weeks?
${mainTopics.length + 2}. What are the practical applications of this week's content?

### 📖 Recommended Study Approach
1. Read through all topics once to get an overview
2. Focus on understanding each concept deeply
3. Practice with examples and problem sets
4. Review and connect concepts to previous learning
5. Test yourself with the review questions

---
*Study Notes for ${courseName} - Week ${week}*
*Topics: ${contentLines.join(', ')}*`;

    return notesContent;
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied!",
      description: "Notes copied to clipboard.",
    });
  };

  const downloadNote = (note: GeneratedNote) => {
    const blob = new Blob([note.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${note.courseName}-Week${note.week}-Notes.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Smart Notes Generator</h1>
          <p className="text-muted-foreground mt-1">
            Generate comprehensive study notes based on your course content
          </p>
        </div>

        {/* Generator Section */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Generate Notes
          </h2>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Select Course
              </label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full p-3 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Choose a course...</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Select Week
              </label>
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
                className="w-full p-3 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {Array.from({ length: 15 }, (_, i) => i + 1).map((week) => (
                  <option key={week} value={week}>
                    Week {week}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <Button
                variant="hero"
                onClick={generateNotes}
                disabled={isGenerating || !selectedCourse}
                className="w-full"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isGenerating ? "Generating..." : "Generate Notes"}
              </Button>
            </div>
          </div>

          {courses.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Add courses first to generate notes.
            </p>
          )}
        </div>

        {/* Generated Notes */}
        {generatedNotes.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Generated Notes</h2>
            {generatedNotes.map((note) => (
              <div
                key={note.id}
                className="bg-card border border-border rounded-2xl overflow-hidden"
              >
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/30 transition-colors"
                  onClick={() =>
                    setExpandedNote(expandedNote === note.id ? null : note.id)
                  }
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {note.courseName} - Week {note.week}
                      </h3>
                      <p className="text-sm text-muted-foreground">{note.topic}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(note.content);
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadNote(note);
                      }}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    {expandedNote === note.id ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
                {expandedNote === note.id && (
                  <div className="p-6 border-t border-border bg-secondary/20">
                    <pre className="whitespace-pre-wrap text-sm text-foreground font-mono leading-relaxed">
                      {note.content}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {generatedNotes.length === 0 && (
          <div className="text-center py-16 bg-card border border-border rounded-2xl">
            <BookOpen className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No Notes Generated Yet
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Select a course and week above to generate comprehensive study notes
              based on your course content.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Notes;
