import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, Calendar, BarChart3, CheckCircle2, Clock, Sparkles, Sun, Moon, Monitor, Mail, Phone } from "lucide-react";
import heroImage from "@/assets/hero-students.png";
import { useStudyPlannerStore, Theme } from "@/lib/store";
import { useEffect } from "react";

const Index = () => {
  const { theme, setTheme } = useStudyPlannerStore();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  const themeOptions: { value: Theme; icon: typeof Sun; label: string }[] = [
    { value: "light", icon: Sun, label: "Light" },
    { value: "dark", icon: Moon, label: "Dark" },
    { value: "system", icon: Monitor, label: "Default" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-foreground">StudyPlanner</span>
          </Link>
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
              {themeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  className={`p-2 rounded-md transition-all ${
                    theme === option.value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title={option.label}
                >
                  <option.icon className="w-4 h-4" />
                </button>
              ))}
            </div>
            <Link to="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link to="/register">
              <Button variant="hero" size="sm">Sign Up</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 gradient-hero">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-up">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-2 text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                Smart Study Planning
              </div>
              <h1 className="text-5xl lg:text-6xl font-extrabold text-foreground leading-tight mb-6">
                Plan Smarter.{" "}
                <span className="text-gradient">Study Better.</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Upload your course content and get a personalized 15-week study roadmap based on your free time. Stay organized, track progress, and ace your semester.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/register">
                  <Button variant="hero" size="xl">
                    Get Started Free
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="hero-outline" size="xl">
                    Sign In
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-8 mt-10">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <span className="text-sm text-muted-foreground">Free to use</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <span className="text-sm text-muted-foreground">Sign-up required</span>
                </div>
              </div>
            </div>
            <div className="relative animate-slide-up animation-delay-200">
              <div className="relative z-10">
                <img 
                  src={heroImage} 
                  alt="Students studying together" 
                  className="w-full h-auto rounded-2xl shadow-elegant"
                />
              </div>
              <div className="absolute -inset-4 gradient-primary opacity-20 blur-3xl rounded-full" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Everything you need to{" "}
              <span className="text-gradient">ace your semester</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Our smart planning tools help you organize, prioritize, and track your studies effectively.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: BookOpen,
                title: "Course Management",
                description: "Upload syllabi, organize materials, and keep all your courses in one place.",
                color: "primary",
              },
              {
                icon: Calendar,
                title: "Smart Scheduling",
                description: "Generate a personalized 15-week study plan that fits your available time.",
                color: "accent",
              },
              {
                icon: BarChart3,
                title: "Progress Tracking",
                description: "Visualize your progress with intuitive charts and stay motivated.",
                color: "success",
              },
              {
                icon: Clock,
                title: "Time Optimization",
                description: "Make the most of your study sessions with smart time allocation.",
                color: "warning",
              },
              {
                icon: CheckCircle2,
                title: "Task Management",
                description: "Break down your syllabus into manageable daily and weekly tasks.",
                color: "primary",
              },
              {
                icon: Sparkles,
                title: "Smart Powered",
                description: "Intelligent algorithms prioritize what matters most for your success.",
                color: "accent",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-card border border-border rounded-2xl p-6 hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 group"
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-${feature.color}/10 group-hover:scale-110 transition-transform`}
                >
                  <feature.icon className={`w-6 h-6 text-${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-6 bg-secondary/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Get started in <span className="text-gradient">3 simple steps</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Add Your Courses",
                description: "Upload your syllabus or course content. We support PDFs, images, and documents.",
              },
              {
                step: "02",
                title: "Set Your Schedule",
                description: "Tell us your available study hours and we'll create a realistic plan.",
              },
              {
                step: "03",
                title: "Start Learning",
                description: "Follow your personalized roadmap and track your progress daily.",
              },
            ].map((item, index) => (
              <div key={index} className="flex flex-col">
                <div className="text-6xl font-bold text-primary/10 select-none mb-4">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="bg-card border border-border rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 gradient-primary opacity-5" />
            <div className="relative z-10">
              <h2 className="text-4xl font-bold text-foreground mb-4">
                Ready to transform your study habits?
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
                Join thousands of students who are already studying smarter, not harder.
              </p>
              <Link to="/register">
                <Button variant="hero" size="xl">
                  Start Planning Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-foreground">StudyPlanner</span>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            © 2025 Student Study Planner, Made by Muhammad Ayan Anwer.
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span>+92 345 2284536</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span>muhammadayananwer5@gmail.com</span>
            </div>
          </div>
          <p className="text-muted-foreground text-xs mt-4">
            For teaming up, feel free to contact!
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
