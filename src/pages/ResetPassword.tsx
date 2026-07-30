import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, BookOpen, Lock, CheckCircle2, AlertCircle } from "lucide-react";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      toast({ title: "Invalid link", description: "This reset link is missing a token. Please request a new one.", variant: "destructive" });
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirm) {
      toast({ title: "Missing fields", description: "Please fill in both password fields.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Too short", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirm) {
      toast({ title: "Passwords don't match", description: "Please make sure both passwords are the same.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await api.auth.resetPassword(token, newPassword);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err: any) {
      toast({ title: "Reset failed", description: err.message || "This link may have expired. Please request a new one.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">StudyPlan Pro</h1>
          <p className="text-muted-foreground mt-1">Set a new password</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          {!token ? (
            /* No token state */
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-2">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Invalid Reset Link</h2>
              <p className="text-muted-foreground text-sm">This link is invalid or expired. Please request a new one.</p>
              <Link to="/forgot-password">
                <Button variant="hero" className="w-full h-11 mt-2">Request New Link</Button>
              </Link>
            </div>
          ) : success ? (
            /* Success state */
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-2">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Password Updated!</h2>
              <p className="text-muted-foreground text-sm">
                Your password has been changed successfully. Redirecting you to login...
              </p>
              <div className="w-full bg-muted rounded-full h-1 mt-4 overflow-hidden">
                <div className="bg-primary h-1 animate-[grow_3s_linear_forwards]" style={{ width: "100%" }} />
              </div>
            </div>
          ) : (
            /* Form state */
            <>
              <h2 className="text-xl font-semibold text-foreground mb-2">Set New Password</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Choose a strong password that you haven't used before.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="Min. 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10 h-12"
                      autoFocus
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="Re-enter password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className="pl-10 h-12"
                    />
                  </div>
                </div>

                {/* Password strength hint */}
                {newPassword && (
                  <div className="flex gap-1">
                    {[1,2,3,4].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                        newPassword.length >= i * 3
                          ? i <= 1 ? "bg-red-500" : i <= 2 ? "bg-orange-500" : i <= 3 ? "bg-yellow-500" : "bg-green-500"
                          : "bg-muted"
                      }`} />
                    ))}
                  </div>
                )}

                <Button type="submit" variant="hero" className="w-full h-12 mt-2" disabled={loading}>
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Updating password...</> : "Update Password"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
