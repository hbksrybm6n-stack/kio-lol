import { useState, useEffect, useCallback, useRef, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, Check, X, Mail, ArrowLeft, RefreshCw } from "lucide-react";
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

  const [step, setStep] = useState<"form" | "verify">("form");
  const [pendingId, setPendingId] = useState("");
  const [verifyCode, setVerifyCode] = useState(["", "", "", "", "", ""]);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [devCode, setDevCode] = useState("");
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (step === "verify") {
      codeRefs.current[0]?.focus();
    }
  }, [step]);

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
      const data = await authApi.register(email, password, username);
      setPendingId(data.pendingId);
      setDevCode(data.code || "");
      setStep("verify");
      setResendCooldown(60);
      toast.success("Verification code sent to your email");
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function handleCodeChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...verifyCode];
    newCode[index] = value.slice(-1);
    setVerifyCode(newCode);

    if (value && index < 5) {
      codeRefs.current[index + 1]?.focus();
    }

    if (newCode.every((c) => c.length === 1)) {
      submitCode(newCode.join(""));
    }
  }

  function handleCodeKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !verifyCode[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      codeRefs.current[index + 1]?.focus();
    }
  }

  function handleCodePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 0) return;
    const newCode = pasted.split("").concat(Array(6).fill("")).slice(0, 6);
    setVerifyCode(newCode);
    if (pasted.length === 6) {
      submitCode(pasted);
    } else {
      codeRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  }

  async function submitCode(code: string) {
    setVerifyLoading(true);
    try {
      const data = await authApi.registerVerify(pendingId, code);
      await profileApi.create({ username: data.username || username });
      await refreshProfile();
      toast.success("Account created!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err?.message || "Invalid code");
      setVerifyCode(["", "", "", "", "", ""]);
      codeRefs.current[0]?.focus();
    } finally {
      setVerifyLoading(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    try {
      const data = await authApi.registerResend(pendingId);
      setResendCooldown(60);
      if (data.code) setDevCode(data.code);
      toast.success("New code sent!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to resend");
    }
  }

  function handleBackToForm() {
    setStep("form");
    setVerifyCode(["", "", "", "", "", ""]);
    setPendingId("");
    setDevCode("");
  }

  if (step === "verify") {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center px-5">
        <div className="w-full max-w-[380px]">
          <div className="mb-10 text-center">
            <Link to="/" className="inline-block">
              <span className="text-xl font-extrabold tracking-tight text-white">kio</span>
              <span className="text-xl font-medium text-[#3f3f46]">.lol</span>
            </Link>
          </div>

          <div className="flex items-center justify-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Mail size={24} className="text-violet-400" />
            </div>
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-white text-center mb-1">Check your email</h1>
          <p className="text-sm text-[#52525b] text-center mb-2">
            We sent a 6-digit code to
          </p>
          <p className="text-sm text-white text-center font-medium mb-8">{email}</p>

          {devCode && (
            <div className="mb-6 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-4 text-center">
              <p className="text-[11px] text-amber-400 font-semibold uppercase tracking-wider mb-2">Your verification code</p>
              <p className="text-3xl font-bold text-white tracking-[8px] font-mono select-all">{devCode}</p>
              <p className="text-[11px] text-[#52525b] mt-2">Copy this code — email sending is not configured</p>
            </div>
          )}

          <div className="flex justify-center gap-3 mb-6">
            {verifyCode.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { codeRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(i, e.target.value)}
                onKeyDown={(e) => handleCodeKeyDown(i, e)}
                onPaste={handleCodePaste}
                disabled={verifyLoading}
                className="w-12 h-14 text-center text-xl font-bold text-white rounded-xl border border-white/[0.08] bg-white/[0.03] outline-none transition-all focus:border-violet-500/50 focus:bg-white/[0.05] disabled:opacity-40"
              />
            ))}
          </div>

          {verifyLoading && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <Loader2 size={14} className="text-violet-400 animate-spin" />
              <span className="text-[13px] text-[#52525b]">Verifying...</span>
            </div>
          )}

          <div className="flex flex-col items-center gap-3">
            <button
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className="flex items-center gap-2 text-[13px] text-[#52525b] hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <RefreshCw size={13} className={resendCooldown > 0 ? "animate-spin" : ""} />
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
            </button>

            <button
              onClick={handleBackToForm}
              className="flex items-center gap-2 text-[13px] text-[#52525b] hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft size={13} />
              Back to registration
            </button>
          </div>
        </div>
      </div>
    );
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

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-xl bg-white text-black py-3 text-sm font-bold hover:bg-white/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
          >
            {loading ? <><Loader2 size={15} className="animate-spin" /> Sending code...</> : "Create account"}
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
