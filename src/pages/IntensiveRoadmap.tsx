import { useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import IntensiveStudyScheduler from "@/components/roadmap/IntensiveStudyScheduler";
import ScheduleChartView from "@/components/roadmap/ScheduleChartView";
import ScheduleFlowchartView from "@/components/roadmap/ScheduleFlowchartView";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BarChart3, ChevronLeft, GitBranch, Zap } from "lucide-react";

const IntensiveRoadmap = () => {
  const [viewMode, setViewMode] = useState<"chart" | "flowchart">("chart");

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-warning/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Intensive Mode</h1>
              <p className="text-sm text-muted-foreground">
                Last-minute prep: generate a complete timetable across selected days.
              </p>
            </div>
          </div>

          <Button asChild variant="outline" className="gap-2 w-fit">
            <Link to="/dashboard/roadmap">
              <ChevronLeft className="w-4 h-4" />
              Back to Roadmap
            </Link>
          </Button>
        </header>

        {/* Configuration */}
        <IntensiveStudyScheduler
          onScheduleGenerated={() => {
            setViewMode("chart");
            requestAnimationFrame(() => {
              document
                .getElementById("intensive-timetable")
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            });
          }}
        />

        {/* Timetable */}
        <section id="intensive-timetable" className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-lg font-semibold text-foreground">Your timetable</h2>

            <div className="flex bg-secondary rounded-lg p-1">
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
            </div>
          </div>

          <div
            className={cn(
              "rounded-2xl",
              viewMode === "flowchart" && "bg-card border border-border p-4"
            )}
          >
            {viewMode === "chart" ? <ScheduleChartView /> : <ScheduleFlowchartView />}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default IntensiveRoadmap;
