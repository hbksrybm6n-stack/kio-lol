import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Loader2, Check } from "lucide-react";
import { authApi } from "@/lib/api";

type Status = "idle" | "loading" | "success";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      await authApi.forgotPassword(email);
      setStatus("success");
    } catch {
      toast.error("Something went wrong.");
      setStatus("idle");
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
          {status === "success" ? (
            <div className="text-center py-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <Check size={20} className="text-emerald-400" />
              </div>
              <h1 className="text-lg font-semibold text-white mb-1">Check your email</h1>
              <p className="text-sm text-[var(--color-nx-text-dim)] mb-6">
                We sent a reset link to <span className="text-white">{email}</span>
              </p>
              <Link to="/login" className="text-sm text-white font-medium hover:opacity-80 transition-opacity">Back to sign in</Link>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-semibold text-white mb-0.5">Reset password</h1>
              <p className="text-sm text-[var(--color-nx-text-dim)] mb-6">Enter your email and we&apos;ll send you a reset link.</p>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-nx-text-muted)] mb-1.5">Email</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-lg border border-white/[0.08] bg-[var(--color-nx-bg)] px-3.5 py-2.5 text-sm text-white placeholder:text-[var(--color-nx-text-dim)] outline-none transition-colors focus:border-white/20"
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full rounded-lg bg-white text-black py-2.5 text-sm font-semibold hover:bg-white/90 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {status === "loading" ? <><Loader2 size={15} className="animate-spin" /> Sending...</> : "Send reset link"}
                </button>
              </form>
            </>
          )}
        </div>

        {status !== "success" && (
          <p className="mt-5 text-center text-sm text-[var(--color-nx-text-dim)]">
            Remember your password?{" "}
            <Link to="/login" className="text-white font-medium hover:opacity-80 transition-opacity">Sign in</Link>
          </p>
        )}
      </div>
    </div>
  );
}
