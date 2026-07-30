import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { isAuthenticated } from "@/lib/api";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import Roadmap from "./pages/Roadmap";
import IntensiveRoadmap from "./pages/IntensiveRoadmap";
import Progress from "./pages/Progress";
import Settings from "./pages/Settings";
import Quiz from "./pages/Quiz";
import Notes from "./pages/Notes";
import Lectures from "./pages/Lectures";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protect dashboard routes — redirect to login if not authenticated
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/dashboard/courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
          <Route path="/dashboard/roadmap" element={<ProtectedRoute><Roadmap /></ProtectedRoute>} />
          <Route path="/dashboard/roadmap/intensive" element={<ProtectedRoute><IntensiveRoadmap /></ProtectedRoute>} />
          <Route path="/dashboard/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
          <Route path="/dashboard/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/dashboard/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
          <Route path="/dashboard/lectures" element={<ProtectedRoute><Lectures /></ProtectedRoute>} />
          <Route path="/dashboard/quiz" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
