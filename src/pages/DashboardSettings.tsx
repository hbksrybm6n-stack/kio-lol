import { useState, useEffect } from "react";
import { profileApi } from "@/lib/api";
import { validateUsername } from "@/lib/utils";
import { Save, AlertTriangle, ExternalLink } from "lucide-react";

export default function DashboardSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [username, setUsername] = useState("");
  const [originalUsername, setOriginalUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [profileUrl, setProfileUrl] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (username && username !== originalUsername) {
      const error = validateUsername(username);
      setUsernameError(error.error || "");
    } else {
      setUsernameError("");
    }
  }, [username, originalUsername]);

  const loadProfile = async () => {
    try {
      const data = await profileApi.get();
      setUsername(data.username || "");
      setOriginalUsername(data.username || "");
      setProfileUrl(`https://kio.lol/@${data.username}`);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUsername = async () => {
    if (usernameError || username === originalUsername) return;
    setSaving(true);
    try {
      await profileApi.update({ username });
      setOriginalUsername(username);
      setProfileUrl(`https://kio.lol/@${username}`);
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) return;
    setDeleting(true);
    try {
      await profileApi.delete();
    } catch {
      // silent
    } finally {
      setDeleting(false);
    }
  };

  const inputClass = "w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-[#3f3f46] outline-none transition-all focus:border-white/[0.12] focus:bg-white/[0.05]";

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-7 w-40 rounded-lg bg-[#0a0a0a] animate-shimmer" />
        <div className="h-24 rounded-xl bg-[#0a0a0a] animate-shimmer" />
        <div className="h-20 rounded-xl bg-[#0a0a0a] animate-shimmer" />
        <div className="h-32 rounded-xl bg-[#0a0a0a] animate-shimmer" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-white">Settings</h1>
        <p className="text-[13px] text-[#52525b] mt-1">Manage your account.</p>
      </div>

      <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6 space-y-4">
        <h3 className="text-[14px] font-semibold text-white">Account</h3>
        <div>
          <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-2 block">Username</label>
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className={`${inputClass} ${usernameError ? "border-red-400/40" : ""}`}
              />
              {usernameError && (
                <p className="text-[11px] text-red-400 mt-1.5">{usernameError}</p>
              )}
            </div>
            <button
              onClick={handleUpdateUsername}
              disabled={saving || !!usernameError || username === originalUsername}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-black text-[13px] font-bold hover:bg-white/90 transition-all disabled:opacity-40 cursor-pointer"
            >
              <Save size={14} />
              {saving ? "Saving..." : "Update"}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6 space-y-4">
        <h3 className="text-[14px] font-semibold text-white">Profile Link</h3>
        <div className="flex items-center gap-2 rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3">
          <span className="text-[13px] text-[#71717a] truncate flex-1">{profileUrl}</span>
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#52525b] hover:text-white transition-colors shrink-0"
          >
            <ExternalLink size={14} />
          </a>
        </div>
      </div>

      <div className="rounded-xl border border-red-400/[0.12] bg-[#0a0a0a] p-6 space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-400" />
          <h3 className="text-[14px] font-semibold text-red-400">Danger Zone</h3>
        </div>
        <p className="text-[13px] text-[#52525b]">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <button
          onClick={handleDeleteAccount}
          disabled={deleting}
          className="px-4 py-2.5 rounded-xl bg-red-400/[0.12] text-red-400 text-[13px] font-bold hover:bg-red-400/[0.2] transition-all disabled:opacity-40 cursor-pointer"
        >
          {deleting ? "Deleting..." : "Delete Account"}
        </button>
      </div>
    </div>
  );
}
