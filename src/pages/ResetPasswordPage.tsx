import { useState, type FormEvent } from "react";
import { useSearchParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff, Loader2, Check } from "lucide-react";
import { authApi } from "@/lib/api";

type Status = "idle" | "loading" | "success" | "invalid";

function getStrength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[a-z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

const strengthColor = ["", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500", "bg-emerald-400"];

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<Status>(token ? "idle" : "invalid");
  const [confirmTouched, setConfirmTouched] = useState(false);

  const strength = getStrength(password);
  const passwordsMatch = password.length > 0 && password === confirm;
  const confirmError = confirmTouched && confirm.length > 0 && !passwordsMatch;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token || password.length < 8 || password !== confirm) return;
    setStatus("loading");
    try {
      await authApi.resetPasswordWithToken(token, password);
      setStatus("success");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
      setStatus("idle");
    }
  }

  const inputClass = "w-full rounded-lg border border-white/[0.08] bg-[var(--color-nx-bg)] px-3.5 py-2.5 text-sm text-white placeholder:text-[var(--color-nx-text-dim)] outline-none transition-colors focus:border-white/20";

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
          {status === "invalid" ? (
            <div className="text-center py-4">
              <h1 className="text-lg font-semibold text-white mb-1">Invalid link</h1>
              <p className="text-sm text-[var(--color-nx-text-dim)] mb-6">This reset link is invalid or has expired.</p>
              <Link to="/forgot-password" className="text-sm text-white font-medium hover:opacity-80 transition-opacity">Request a new link</Link>
            </div>
          ) : status === "success" ? (
            <div className="text-center py-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <Check size={20} className="text-emerald-400" />
              </div>
              <h1 className="text-lg font-semibold text-white mb-1">Password changed</h1>
              <p className="text-sm text-[var(--color-nx-text-dim)] mb-6">You can now sign in with your new password.</p>
              <Link to="/login" className="text-sm text-white font-medium hover:opacity-80 transition-opacity">Sign in</Link>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-semibold text-white mb-0.5">New password</h1>
              <p className="text-sm text-[var(--color-nx-text-dim)] mb-6">Choose a strong password for your account.</p>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-nx-text-muted)] mb-1.5">New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className={`${inputClass} pr-10`}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-nx-text-dim)] hover:text-white transition-colors p-1">
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <div className="mt-2 flex gap-1">
                      {[1,2,3,4,5].map((i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength ? strengthColor[strength] : "bg-white/[0.06]"}`} />
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--color-nx-text-muted)] mb-1.5">Confirm Password</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Repeat your password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    onBlur={() => setConfirmTouched(true)}
                    required
                    className={inputClass}
                  />
                  {confirmError && <p className="text-[11px] text-red-400 mt-1">Passwords do not match</p>}
                </div>

                <button
                  type="submit"
                  disabled={status === "loading" || password.length < 8 || !passwordsMatch}
                  className="w-full rounded-lg bg-white text-black py-2.5 text-sm font-semibold hover:bg-white/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {status === "loading" ? <><Loader2 size={15} className="animate-spin" /> Resetting...</> : "Reset password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
