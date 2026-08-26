import { useState, useEffect } from "react";
import {
  Shield,
  Key,
  Monitor,
  AlertTriangle,
  Mail,
  Lock,
  LogOut,
  Search,
  Copy,
  Check,
  QrCode,
  X,
} from "lucide-react";
import { accountApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { profileApi } from "@/lib/api";
import { Switch } from "@/components/ui/Switch";
import toast from "react-hot-toast";
import { cn, getTimeAgo } from "@/lib/utils";
import type { Session, LoginHistoryEntry } from "@/types";

const inputClass =
  "w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-[#3f3f46] outline-none transition-all focus:border-white/[0.12] focus:bg-white/[0.05]";
const LABEL = "text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-2 block";

export default function DashboardAccount() {
  const { user, refreshProfile } = useAuthStore();
  const [activeSection, setActiveSection] = useState<"profile" | "security" | "sessions" | "history" | "danger">("profile");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-white">Account</h1>
        <p className="text-[13px] text-[#52525b] mt-1">Manage your account settings and security.</p>
      </div>

      <div className="flex gap-1 border-b border-white/[0.04] pb-px overflow-x-auto">
        {(["profile", "security", "sessions", "history", "danger"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSection(tab)}
            className={cn(
              "px-4 py-2.5 text-[13px] font-medium transition-all cursor-pointer whitespace-nowrap",
              activeSection === tab
                ? "text-white border-b-2 border-white -mb-px"
                : "text-[#52525b] hover:text-[#a1a1aa]"
            )}
          >
            {tab === "profile" && "Profile"}
            {tab === "security" && "Security"}
            {tab === "sessions" && "Sessions"}
            {tab === "history" && "Login History"}
            {tab === "danger" && "Danger Zone"}
          </button>
        ))}
      </div>

      {activeSection === "profile" && <ProfileSection email={user?.email} />}
      {activeSection === "security" && <SecuritySection />}
      {activeSection === "sessions" && <SessionsSection />}
      {activeSection === "history" && <LoginHistorySection />}
      {activeSection === "danger" && <DangerZoneSection />}
    </div>
  );
}

function ProfileSection({ email }: { email?: string }) {
  const { user, refreshProfile } = useAuthStore();
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChangeEmail = async () => {
    if (!newEmail || !emailPassword) {
      toast.error("Fill in all fields");
      return;
    }
    setSaving(true);
    try {
      await accountApi.changeEmail(newEmail, emailPassword);
      await refreshProfile();
      setNewEmail("");
      setEmailPassword("");
      toast.success("Email updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to update email");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6">
        <h3 className="text-[14px] font-semibold text-white mb-1">Email</h3>
        <p className="text-[12px] text-[#3f3f46] mb-5">Your current email address.</p>
        <div className="space-y-4">
          <div>
            <label className={LABEL}>Current Email</label>
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <Mail size={14} className="text-[#3f3f46]" />
              <span className="text-sm text-[#a1a1aa]">{email || "N/A"}</span>
            </div>
          </div>
          <div>
            <label className={LABEL}>New Email</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="new@email.com"
              className={inputClass}
            />
          </div>
          <div>
            <label className={LABEL}>Current Password</label>
            <input
              type="password"
              value={emailPassword}
              onChange={(e) => setEmailPassword(e.target.value)}
              placeholder="Your current password"
              className={inputClass}
            />
          </div>
          <button
            onClick={handleChangeEmail}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black text-[13px] font-bold hover:bg-white/90 transition-all disabled:opacity-40 cursor-pointer"
          >
            <Mail className="h-3.5 w-3.5" />
            {saving ? "Updating..." : "Update Email"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SecuritySection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [twoFactorQR, setTwoFactorQR] = useState("");
  const [twoFactorSecret, setTwoFactorSecret] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorSetupMode, setTwoFactorSetupMode] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [disableCode, setDisableCode] = useState("");
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);

  useEffect(() => {
    accountApi.getSecurity().then((data: any) => {
      setTwoFactorEnabled(!!data?.two_factor_enabled);
    }).catch(() => {});
  }, []);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Fill in all fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setSaving(true);
    try {
      await accountApi.changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed");
    } catch (err: any) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  const handleEnable2FA = async () => {
    setTwoFactorLoading(true);
    try {
      const data = await accountApi.enable2FA();
      setTwoFactorQR(data.qr_code || data.qr);
      setTwoFactorSecret(data.secret || "");
      setTwoFactorSetupMode(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to enable 2FA");
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleConfirm2FA = async () => {
    if (!twoFactorCode.trim()) {
      toast.error("Enter the 6-digit code");
      return;
    }
    setTwoFactorLoading(true);
    try {
      const data = await accountApi.confirm2FA(twoFactorCode);
      setTwoFactorEnabled(true);
      setTwoFactorSetupMode(false);
      setTwoFactorQR("");
      setTwoFactorSecret("");
      setTwoFactorCode("");
      if (data.backup_codes) {
        setBackupCodes(data.backup_codes);
        setShowBackupCodes(true);
      }
      toast.success("2FA enabled successfully");
    } catch (err: any) {
      toast.error(err.message || "Invalid code");
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!disableCode.trim()) {
      toast.error("Enter your 2FA code to disable");
      return;
    }
    setTwoFactorLoading(true);
    try {
      await accountApi.disable2FA(disableCode);
      setTwoFactorEnabled(false);
      setDisableCode("");
      toast.success("2FA disabled");
    } catch (err: any) {
      toast.error(err.message || "Invalid code");
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleViewBackupCodes = async () => {
    try {
      const data = await accountApi.getBackupCodes();
      setBackupCodes(data.codes || data.backup_codes || []);
      setShowBackupCodes(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to get backup codes");
    }
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(twoFactorSecret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleCopyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopiedBackup(true);
    setTimeout(() => setCopiedBackup(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6">
        <h3 className="text-[14px] font-semibold text-white mb-1">Change Password</h3>
        <p className="text-[12px] text-[#3f3f46] mb-5">Update your account password.</p>
        <div className="space-y-4">
          <div>
            <label className={LABEL}>Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                className={inputClass}
              />
            </div>
            <div>
              <label className={LABEL}>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className={inputClass}
              />
            </div>
          </div>
          <button
            onClick={handleChangePassword}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black text-[13px] font-bold hover:bg-white/90 transition-all disabled:opacity-40 cursor-pointer"
          >
            <Key className="h-3.5 w-3.5" />
            {saving ? "Changing..." : "Change Password"}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[14px] font-semibold text-white mb-1">Two-Factor Authentication</h3>
            <p className="text-[12px] text-[#3f3f46]">Add an extra layer of security to your account.</p>
          </div>
          <div className="flex items-center gap-2">
            {twoFactorEnabled && (
              <span className="text-[11px] px-2 py-1 rounded-lg bg-emerald-400/[0.12] text-emerald-400 font-semibold">
                Enabled
              </span>
            )}
            <Switch checked={twoFactorEnabled || twoFactorSetupMode} onChange={() => {}} />
          </div>
        </div>

        {!twoFactorEnabled && !twoFactorSetupMode && (
          <button
            onClick={handleEnable2FA}
            disabled={twoFactorLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black text-[13px] font-bold hover:bg-white/90 transition-all disabled:opacity-40 cursor-pointer"
          >
            <Shield className="h-3.5 w-3.5" />
            {twoFactorLoading ? "Setting up..." : "Enable 2FA"}
          </button>
        )}

        {twoFactorSetupMode && (
          <div className="space-y-4">
            <p className="text-[12px] text-[#71717a]">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </p>
            {twoFactorQR && (
              <div className="flex justify-center">
                <div className="p-3 rounded-xl bg-white">
                  <img src={twoFactorQR} alt="2FA QR Code" className="w-48 h-48" />
                </div>
              </div>
            )}
            {twoFactorSecret && (
              <div>
                <label className={LABEL}>Manual Entry Key</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.03] font-mono text-[13px] text-white break-all">
                    {twoFactorSecret}
                  </div>
                  <button
                    onClick={handleCopySecret}
                    className="p-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] text-[#52525b] hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer shrink-0"
                  >
                    {copiedSecret ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            )}
            <div>
              <label className={LABEL}>Enter 6-digit Code</label>
              <div className="flex gap-2">
                <input
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyDown={(e) => e.key === "Enter" && handleConfirm2FA()}
                  placeholder="000000"
                  className={`${inputClass} flex-1 font-mono text-center text-lg tracking-[0.3em]`}
                  maxLength={6}
                />
                <button
                  onClick={handleConfirm2FA}
                  disabled={twoFactorLoading || twoFactorCode.length !== 6}
                  className="px-5 py-2.5 rounded-xl bg-white text-black text-[13px] font-bold hover:bg-white/90 transition-all disabled:opacity-40 cursor-pointer shrink-0"
                >
                  {twoFactorLoading ? "..." : "Confirm"}
                </button>
              </div>
            </div>
            <button
              onClick={() => {
                setTwoFactorSetupMode(false);
                setTwoFactorQR("");
                setTwoFactorSecret("");
                setTwoFactorCode("");
              }}
              className="text-[12px] text-[#52525b] hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}

        {twoFactorEnabled && !twoFactorSetupMode && (
          <div className="space-y-4">
            <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[13px] text-white font-medium">Disable 2FA</p>
              </div>
              <p className="text-[12px] text-[#3f3f46] mb-3">Enter your current 2FA code to disable two-factor authentication.</p>
              <div className="flex gap-2">
                <input
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyDown={(e) => e.key === "Enter" && handleDisable2FA()}
                  placeholder="000000"
                  className={`${inputClass} flex-1 font-mono text-center tracking-[0.2em]`}
                  maxLength={6}
                />
                <button
                  onClick={handleDisable2FA}
                  disabled={twoFactorLoading || disableCode.length !== 6}
                  className="px-4 py-2.5 rounded-xl bg-red-400/[0.12] text-red-400 text-[13px] font-bold hover:bg-red-400/[0.2] transition-all disabled:opacity-40 cursor-pointer shrink-0"
                >
                  {twoFactorLoading ? "..." : "Disable"}
                </button>
              </div>
            </div>

            <button
              onClick={handleViewBackupCodes}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] text-[13px] font-medium text-[#a1a1aa] hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer"
            >
              <Key size={14} />
              View Backup Codes
            </button>
          </div>
        )}
      </div>

      {showBackupCodes && (
        <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[14px] font-semibold text-white mb-1">Backup Codes</h3>
              <p className="text-[12px] text-[#3f3f46]">Save these codes in a safe place. Each code can only be used once.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyBackupCodes}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] text-[11px] font-medium text-[#a1a1aa] hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer"
              >
                {copiedBackup ? <Check size={11} /> : <Copy size={11} />}
                {copiedBackup ? "Copied" : "Copy All"}
              </button>
              <button
                onClick={() => setShowBackupCodes(false)}
                className="p-1.5 rounded-lg hover:bg-white/[0.06] text-[#52525b] hover:text-white transition-all cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {backupCodes.map((code, i) => (
              <div
                key={i}
                className="px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.03] font-mono text-[13px] text-white text-center"
              >
                {code}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SessionsSection() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await accountApi.getSessions();
      setSessions(data || []);
    } catch {
      // empty
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (sessionId: string) => {
    try {
      await accountApi.revokeSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      toast.success("Session revoked");
    } catch {
      toast.error("Failed to revoke session");
    }
  };

  const handleRevokeAll = async () => {
    try {
      await accountApi.revokeAllSessions();
      loadSessions();
      toast.success("All other sessions revoked");
    } catch {
      toast.error("Failed to revoke sessions");
    }
  };

  const parseUA = (ua: string) => {
    if (!ua) return { browser: "Unknown", os: "Unknown" };
    let browser = "Unknown Browser";
    let os = "Unknown OS";
    if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Edg")) browser = "Edge";
    else if (ua.includes("Chrome")) browser = "Chrome";
    else if (ua.includes("Safari")) browser = "Safari";

    if (ua.includes("Windows")) os = "Windows";
    else if (ua.includes("Mac OS")) os = "macOS";
    else if (ua.includes("Linux")) os = "Linux";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

    return { browser, os };
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-[#0a0a0a] animate-shimmer" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-[14px] font-semibold text-white mb-1">Active Sessions</h3>
            <p className="text-[12px] text-[#3f3f46]">Manage your active login sessions.</p>
          </div>
          {sessions.length > 1 && (
            <button
              onClick={handleRevokeAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.03] text-[12px] font-medium text-[#a1a1aa] hover:bg-red-400/[0.08] hover:text-red-400 transition-all cursor-pointer"
            >
              <LogOut size={12} />
              Revoke All Others
            </button>
          )}
        </div>

        <div className="space-y-2">
          {sessions.map((session) => {
            const { browser, os } = parseUA(session.user_agent);
            return (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 rounded-xl border border-white/[0.04] bg-white/[0.01]"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/[0.04]">
                    <Monitor size={16} className="text-[#52525b]" />
                  </div>
                  <div>
                    <p className="text-[13px] text-white font-medium">
                      {browser} on {os}
                    </p>
                    <p className="text-[11px] text-[#3f3f46]">
                      IP: {session.ip || "Unknown"} · {getTimeAgo(session.created_at)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRevoke(session.id)}
                  className="px-3 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] text-[11px] font-medium text-[#52525b] hover:bg-red-400/[0.08] hover:text-red-400 transition-all cursor-pointer"
                >
                  Revoke
                </button>
              </div>
            );
          })}

          {sessions.length === 0 && (
            <p className="text-[13px] text-[#3f3f46] text-center py-8">No active sessions.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function LoginHistorySection() {
  const [history, setHistory] = useState<LoginHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await accountApi.getLoginHistory();
      setHistory(data || []);
    } catch {
      // empty
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl bg-[#0a0a0a] h-48 animate-shimmer" />
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6">
      <h3 className="text-[14px] font-semibold text-white mb-1">Login History</h3>
      <p className="text-[12px] text-[#3f3f46] mb-5">Recent login attempts.</p>

      {history.length === 0 ? (
        <p className="text-[13px] text-[#3f3f46] text-center py-8">No login history.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.04]">
                <th className="text-left text-[11px] font-semibold text-[#52525b] uppercase tracking-wider pb-3 pr-4">Date</th>
                <th className="text-left text-[11px] font-semibold text-[#52525b] uppercase tracking-wider pb-3 pr-4">IP</th>
                <th className="text-left text-[11px] font-semibold text-[#52525b] uppercase tracking-wider pb-3 pr-4">Status</th>
                <th className="text-left text-[11px] font-semibold text-[#52525b] uppercase tracking-wider pb-3">User Agent</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry) => (
                <tr key={entry.id} className="border-b border-white/[0.02]">
                  <td className="py-3 pr-4 text-[13px] text-[#a1a1aa] whitespace-nowrap">
                    {new Date(entry.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="py-3 pr-4 text-[13px] text-[#a1a1aa] font-mono">{entry.ip || "N/A"}</td>
                  <td className="py-3 pr-4">
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded-md text-[10px] font-semibold",
                        entry.success
                          ? "bg-emerald-400/[0.12] text-emerald-400"
                          : "bg-red-400/[0.12] text-red-400"
                      )}
                    >
                      {entry.success ? "Success" : "Failed"}
                    </span>
                  </td>
                  <td className="py-3 text-[12px] text-[#3f3f46] max-w-[200px] truncate">
                    {entry.user_agent || "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DangerZoneSection() {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await profileApi.delete();
      localStorage.removeItem("kio_token");
      window.location.href = "/";
    } catch (err: any) {
      toast.error(err.message || "Failed to delete account");
      setDeleting(false);
    }
  };

  return (
    <div className="rounded-xl border border-red-400/[0.12] bg-[#0a0a0a] p-6">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle size={16} className="text-red-400" />
        <h3 className="text-[14px] font-semibold text-red-400">Danger Zone</h3>
      </div>
      <p className="text-[12px] text-[#3f3f46] mb-5">
        These actions are irreversible. Please be certain.
      </p>

      <div className="rounded-xl border border-red-400/[0.08] bg-white/[0.01] p-4">
        <h4 className="text-[13px] font-medium text-white mb-1">Delete Account</h4>
        <p className="text-[12px] text-[#3f3f46] mb-4">
          Permanently delete your account and all associated data. This cannot be undone.
        </p>
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-400/[0.2] bg-red-400/[0.06] text-[13px] font-semibold text-red-400 hover:bg-red-400/[0.12] transition-all cursor-pointer"
          >
            <AlertTriangle size={13} />
            Delete Account
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-500 text-white text-[13px] font-bold hover:bg-red-600 transition-all disabled:opacity-40 cursor-pointer"
            >
              {deleting ? "Deleting..." : "Yes, Delete Everything"}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-4 py-2.5 rounded-xl text-[13px] font-medium text-[#52525b] hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
