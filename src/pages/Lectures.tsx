import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useStudyPlannerStore } from "@/lib/store";
import { toast } from "@/hooks/use-toast";
import {
  Video,
  Search,
  ExternalLink,
  Youtube,
  Globe,
  BookOpen,
  Play,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LectureResult {
  id: string;
  title: string;
  platform: string;
  url: string;
  description: string;
  duration?: string;
}

const platforms = [
  { id: "youtube", name: "YouTube", icon: Youtube, color: "hsl(0, 100%, 50%)" },
  { id: "coursera", name: "Coursera", icon: Globe, color: "hsl(210, 100%, 50%)" },
  { id: "khan", name: "Khan Academy", icon: BookOpen, color: "hsl(142, 76%, 36%)" },
  { id: "edx", name: "edX", icon: Globe, color: "hsl(350, 80%, 50%)" },
  { id: "udemy", name: "Udemy", icon: Play, color: "hsl(280, 70%, 50%)" },
];

const Lectures = () => {
  const { courses, tasks } = useStudyPlannerStore();
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [customTopic, setCustomTopic] = useState<string>("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["youtube"]);
  const [lectureResults, setLectureResults] = useState<LectureResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const course = courses.find((c) => c.id === selectedCourse);
  const topics = course?.weeklyContent?.filter((wc) => wc.content) || [];

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((p) => p !== platformId)
        : [...prev, platformId]
    );
  };

  const searchLectures = () => {
    const searchTopic = customTopic || selectedTopic;
    if (!searchTopic) {
      toast({
        title: "Enter a topic",
        description: "Please enter or select a topic to search for lectures.",
        variant: "destructive",
      });
      return;
    }

    if (selectedPlatforms.length === 0) {
      toast({
        title: "Select platforms",
        description: "Please select at least one platform to search.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);

    // Simulate lecture search results
    setTimeout(() => {
      const results: LectureResult[] = selectedPlatforms.flatMap((platformId) => {
        const platform = platforms.find((p) => p.id === platformId);
        return [
          {
            id: `${platformId}-1-${Math.random().toString(36).substr(2, 9)}`,
            title: `${searchTopic} - Complete Tutorial`,
            platform: platform?.name || platformId,
            url: getSearchUrl(platformId, searchTopic),
            description: `Comprehensive lecture covering all aspects of ${searchTopic}. Great for beginners and intermediate learners.`,
            duration: "45:30",
          },
          {
            id: `${platformId}-2-${Math.random().toString(36).substr(2, 9)}`,
            title: `Advanced ${searchTopic} Concepts`,
            platform: platform?.name || platformId,
            url: getSearchUrl(platformId, searchTopic),
            description: `Deep dive into advanced topics related to ${searchTopic}. Includes practical examples and case studies.`,
            duration: "1:15:00",
          },
        ];
      });

      setLectureResults(results);
      setIsSearching(false);
      toast({
        title: "Search complete!",
        description: `Found ${results.length} lectures on ${searchTopic}.`,
      });
    }, 1500);
  };

  const getSearchUrl = (platformId: string, topic: string): string => {
    const encodedTopic = encodeURIComponent(topic);
    switch (platformId) {
      case "youtube":
        return `https://www.youtube.com/results?search_query=${encodedTopic}+lecture`;
      case "coursera":
        return `https://www.coursera.org/search?query=${encodedTopic}`;
      case "khan":
        return `https://www.khanacademy.org/search?referer=%2F&page_search_query=${encodedTopic}`;
      case "edx":
        return `https://www.edx.org/search?q=${encodedTopic}`;
      case "udemy":
        return `https://www.udemy.com/courses/search/?q=${encodedTopic}`;
      default:
        return `https://www.google.com/search?q=${encodedTopic}+lecture`;
    }
  };

  const getPlatformIcon = (platformName: string) => {
    const platform = platforms.find((p) => p.name === platformName);
    if (platform) {
      const Icon = platform.icon;
      return <Icon className="w-5 h-5" style={{ color: platform.color }} />;
    }
    return <Globe className="w-5 h-5 text-muted-foreground" />;
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Lecture Finder</h1>
          <p className="text-muted-foreground mt-1">
            Find lectures from top platforms based on your course topics
          </p>
        </div>

        {/* Search Section */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            Search Lectures
          </h2>

          <div className="space-y-4">
            {/* Course Selection */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Select Course (Optional)
                </label>
                <select
                  value={selectedCourse}
                  onChange={(e) => {
                    setSelectedCourse(e.target.value);
                    setSelectedTopic("");
                  }}
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

              {selectedCourse && topics.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Select Topic from Course
                  </label>
                  <select
                    value={selectedTopic}
                    onChange={(e) => {
                      setSelectedTopic(e.target.value);
                      setCustomTopic("");
                    }}
                    className="w-full p-3 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Choose a topic...</option>
                    {topics.map((wc) => (
                      <option key={wc.week} value={wc.content}>
                        Week {wc.week}: {wc.content}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Custom Topic */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Or Enter Custom Topic
              </label>
              <input
                type="text"
                value={customTopic}
                onChange={(e) => {
                  setCustomTopic(e.target.value);
                  setSelectedTopic("");
                }}
                placeholder="e.g., Introduction to Machine Learning"
                className="w-full p-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Platform Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Select Platforms
              </label>
              <div className="flex flex-wrap gap-2">
                {platforms.map((platform) => {
                  const Icon = platform.icon;
                  const isSelected = selectedPlatforms.includes(platform.id);
                  return (
                    <button
                      key={platform.id}
                      onClick={() => togglePlatform(platform.id)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {platform.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search Button */}
            <Button
              variant="hero"
              onClick={searchLectures}
              disabled={isSearching || (!customTopic && !selectedTopic)}
              className="w-full md:w-auto"
            >
              <Search className="w-4 h-4 mr-2" />
              {isSearching ? "Searching..." : "Search Lectures"}
            </Button>
          </div>
        </div>

        {/* Search Results */}
        {lectureResults.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              Found {lectureResults.length} Lectures
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {lectureResults.map((lecture) => (
                <div
                  key={lecture.id}
                  className="bg-card border border-border rounded-2xl p-5 hover:shadow-soft transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                      {getPlatformIcon(lecture.platform)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-foreground line-clamp-2">
                          {lecture.title}
                        </h3>
                      </div>
                      <p className="text-sm text-primary font-medium mt-1">
                        {lecture.platform}
                        {lecture.duration && (
                          <span className="text-muted-foreground ml-2">
                            • {lecture.duration}
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {lecture.description}
                      </p>
                      <a
                        href={lecture.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-3"
                      >
                        Open on {lecture.platform}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {lectureResults.length === 0 && (
          <div className="text-center py-16 bg-card border border-border rounded-2xl">
            <Video className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Find Lectures on Any Topic
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Enter a topic or select from your course content to find relevant
              lectures from YouTube, Coursera, Khan Academy, and more.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Lectures;
