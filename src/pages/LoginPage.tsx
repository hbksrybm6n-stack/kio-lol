import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export default function LoginPage() {
  const navigate = useNavigate();
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || !password) { toast.error("Please fill in all fields."); return; }
    setLoading(true);
    try {
      await authApi.login(email, password);
      await refreshProfile();
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-nx-bg)] flex items-center justify-center px-5">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-block">
            <span className="text-xl font-bold text-white">kio</span>
            <span className="text-xl font-medium text-[var(--color-nx-text-dim)]">.lol</span>
          </Link>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-[var(--color-nx-surface)] p-7">
          <h1 className="text-lg font-semibold text-white mb-0.5">Welcome back</h1>
          <p className="text-sm text-[var(--color-nx-text-dim)] mb-6">Sign in to your account.</p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[var(--color-nx-text-muted)] mb-1.5">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-lg border border-white/[0.08] bg-[var(--color-nx-bg)] px-3.5 py-2.5 text-sm text-white placeholder:text-[var(--color-nx-text-dim)] outline-none transition-colors focus:border-white/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-nx-text-muted)] mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-white/[0.08] bg-[var(--color-nx-bg)] px-3.5 py-2.5 pr-10 text-sm text-white placeholder:text-[var(--color-nx-text-dim)] outline-none transition-colors focus:border-white/20"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-nx-text-dim)] hover:text-white transition-colors p-1">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-[var(--color-nx-text-dim)] hover:text-white transition-colors">Forgot password?</Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-white text-black py-2.5 text-sm font-semibold hover:bg-white/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 size={15} className="animate-spin" /> Signing in...</> : "Sign in"}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-[var(--color-nx-text-dim)]">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="text-white font-medium hover:opacity-80 transition-opacity">Create one</Link>
        </p>
      </div>
    </div>
  );
}
