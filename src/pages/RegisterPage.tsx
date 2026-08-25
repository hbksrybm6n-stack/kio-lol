import { useState, useEffect, useCallback, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, Check, X } from "lucide-react";
import toast from "react-hot-toast";
import { authApi, profileApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { validateUsername, debounce } from "@/lib/utils";

type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid";

function getPasswordStrength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[a-z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

const strengthLabel = ["", "Very Weak", "Weak", "Fair", "Strong", "Very Strong"];
const strengthColor = ["", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500", "bg-emerald-400"];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuthStore();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [usernameError, setUsernameError] = useState("");
  const [confirmTouched, setConfirmTouched] = useState(false);

  const strength = getPasswordStrength(password);
  const passwordsMatch = password.length > 0 && password === confirm;
  const confirmError = confirmTouched && confirm.length > 0 && !passwordsMatch;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const u = params.get("username");
    if (u) setUsername(u.toLowerCase().replace(/[^a-z0-9_]/g, ""));
  }, []);

  const checkUsername = useCallback(
    debounce(async (value: string) => {
      if (!value) { setUsernameStatus("idle"); setUsernameError(""); return; }
      const v = validateUsername(value);
      if (!v.valid) { setUsernameStatus("invalid"); setUsernameError(v.error || "Invalid"); return; }
      setUsernameStatus("checking");
      setUsernameError("");
      try {
        const res = await profileApi.checkUsernameAvailable(value);
        if (res.available) { setUsernameStatus("available"); setUsernameError(""); }
        else { setUsernameStatus("taken"); setUsernameError("Taken"); }
      } catch { setUsernameStatus("taken"); setUsernameError("Error"); }
    }, 400),
    []
  );

  useEffect(() => { checkUsername(username); }, [username, checkUsername]);

  const canSubmit = username.length > 0 && email.length > 0 && password.length >= 8 && passwordsMatch && agreed && usernameStatus === "available" && !loading;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      await authApi.register(email, password);
      await profileApi.create({ username });
      await refreshProfile();
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-5">
      <div className="w-full max-w-[380px]">
        <div className="mb-10 text-center">
          <Link to="/" className="inline-block">
            <span className="text-xl font-extrabold tracking-tight text-white">kio</span>
            <span className="text-xl font-medium text-[#3f3f46]">.lol</span>
          </Link>
        </div>

        <h1 className="text-2xl font-extrabold tracking-tight text-white text-center mb-1">Create your account</h1>
        <p className="text-sm text-[#52525b] text-center mb-8">Choose a username and you&apos;re set.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-2">Username</label>
            <div className="relative">
              <input
                type="text"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-[#3f3f46] outline-none transition-all focus:border-white/20 focus:bg-white/[0.05]"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2">
                {usernameStatus === "checking" && <Loader2 size={14} className="text-[#52525b] animate-spin" />}
                {usernameStatus === "available" && <Check size={14} className="text-emerald-400" />}
                {(usernameStatus === "taken" || usernameStatus === "invalid") && <X size={14} className="text-red-400" />}
              </span>
            </div>
            {username && (
              <p className="text-[11px] text-[#3f3f46] mt-1.5">
                kio.lol/<span className="text-[#71717a]">{username}</span>
              </p>
            )}
            {usernameError && <p className="text-[11px] text-red-400 mt-1.5">{usernameError}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-2">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-[#3f3f46] outline-none transition-all focus:border-white/20 focus:bg-white/[0.05]"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 pr-11 text-sm text-white placeholder:text-[#3f3f46] outline-none transition-all focus:border-white/20 focus:bg-white/[0.05]"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#3f3f46] hover:text-white transition-colors">
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {password.length > 0 && (
              <div className="mt-2.5 flex gap-1.5">
                {[1,2,3,4,5].map((i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength ? strengthColor[strength] : "bg-white/[0.06]"}`} />
                ))}
              </div>
            )}
            {password.length > 0 && <p className="text-[11px] text-[#3f3f46] mt-1.5">{strengthLabel[strength]}</p>}
          </div>

          {/* Confirm */}
          <div>
            <label className="block text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-2">Confirm Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Repeat your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                onBlur={() => setConfirmTouched(true)}
                required
                autoComplete="new-password"
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-[#3f3f46] outline-none transition-all focus:border-white/20 focus:bg-white/[0.05]"
              />
              {passwordsMatch && <span className="absolute right-3.5 top-1/2 -translate-y-1/2"><Check size={14} className="text-emerald-400" /></span>}
            </div>
            {confirmError && <p className="text-[11px] text-red-400 mt-1.5">Passwords do not match</p>}
          </div>

          {/* Terms */}
          <label className="flex items-start gap-2.5 cursor-pointer select-none pt-1">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-white/10 bg-white/[0.04] accent-violet-500"
            />
            <span className="text-[11px] text-[#52525b] leading-relaxed">
              I agree to the Terms and Privacy Policy.
            </span>
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-xl bg-white text-black py-3 text-sm font-bold hover:bg-white/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
          >
            {loading ? <><Loader2 size={15} className="animate-spin" /> Creating...</> : "Create account"}
          </button>
        </form>

        <p className="mt-8 text-center text-[13px] text-[#52525b]">
          Already have an account?{" "}
          <Link to="/login" className="text-white font-semibold hover:opacity-80 transition-opacity">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
