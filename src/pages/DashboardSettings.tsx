import { useState, useEffect } from "react";
import { profileApi, configApi, uploadApi } from "@/lib/api";
import { validateUsername } from "@/lib/utils";
import { Save, AlertTriangle, ExternalLink, Upload, X, Shield, Tag } from "lucide-react";
import { Switch } from "@/components/ui/Switch";
import toast from "react-hot-toast";

const inputClass = "w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-[#3f3f46] outline-none transition-all focus:border-white/[0.12] focus:bg-white/[0.05]";
const LABEL = "text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-2 block";

export default function DashboardSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [username, setUsername] = useState("");
  const [originalUsername, setOriginalUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [profileUrl, setProfileUrl] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [customStatus, setCustomStatus] = useState("");
  const [slug, setSlug] = useState("");
  const [slugError, setSlugError] = useState("");
  const [originalSlug, setOriginalSlug] = useState("");
  const [shareEnabled, setShareEnabled] = useState(true);

  const [isPrivate, setIsPrivate] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [showInDirectory, setShowInDirectory] = useState(true);

  const [tags, setTags] = useState<string[]>([]);
  const [tagsInput, setTagsInput] = useState("");
  const [loadingTags, setLoadingTags] = useState(false);

  const [deactivating, setDeactivating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (slug && slug !== originalSlug) {
      checkSlug(slug);
    } else {
      setSlugError("");
    }
  }, [slug, originalSlug]);

  const loadProfile = async () => {
    try {
      const data = await profileApi.get();
      setUsername(data.username || "");
      setOriginalUsername(data.username || "");
      setProfileUrl(`https://kio.lol/@${data.username}`);
      setDisplayName(data.display_name || "");
      setBio(data.bio || "");
      setAvatarUrl(data.avatar_url || "");
      setBannerUrl(data.banner_url || "");
      setCustomStatus(data.custom_status || "");
      setSlug(data.slug || "");
      setOriginalSlug(data.slug || "");
      setShareEnabled(data.share_enabled !== false);

      const configData = await configApi.getByProfileId(data.id).catch(() => null);
      if (configData) {
        setIsPrivate(!!configData.is_private);
        setPasscode(configData.passcode || "");
        setShowInDirectory(configData.show_in_directory !== false);
      }

      const tagsData = await profileApi.getTags().catch(() => ({ tags: [] }));
      setTags(tagsData?.tags || []);
      setTagsInput((tagsData?.tags || []).join(", "));
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const checkSlug = async (s: string) => {
    try {
      const result = await profileApi.checkSlug(s);
      if (!result?.available) {
        setSlugError("Slug is already taken");
      } else {
        setSlugError("");
      }
    } catch {
      setSlugError("");
    }
  };

  const handleUpdateUsername = async () => {
    if (usernameError || username === originalUsername) return;
    setSaving(true);
    try {
      await profileApi.update({ username });
      setOriginalUsername(username);
      setProfileUrl(`https://kio.lol/@${username}`);
      toast.success("Username updated");
    } catch {
      toast.error("Failed to update username");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await profileApi.update({
        display_name: displayName,
        bio,
        avatar_url: avatarUrl,
        banner_url: bannerUrl,
        custom_status: customStatus,
        slug: slug || undefined,
        share_enabled: shareEnabled,
      });
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePrivacy = async () => {
    setSaving(true);
    try {
      await configApi.update({
        is_private: isPrivate,
        passcode,
        show_in_directory: showInDirectory,
      });
      toast.success("Privacy settings saved");
    } catch {
      toast.error("Failed to save privacy settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTags = async () => {
    const parsed = tagsInput
      .split(",")
      .map((t) => t.trim().replace(/^#/, ""))
      .filter(Boolean)
      .slice(0, 10);
    setSaving(true);
    try {
      await profileApi.setTags(parsed);
      setTags(parsed);
      toast.success("Tags saved");
    } catch {
      toast.error("Failed to save tags");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadApi.upload(file, "avatar");
      setAvatarUrl(url);
      await profileApi.update({ avatar_url: url });
      toast.success("Avatar updated");
    } catch {
      toast.error("Failed to upload");
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadApi.upload(file, "banner");
      setBannerUrl(url);
      await profileApi.update({ banner_url: url });
      toast.success("Banner updated");
    } catch {
      toast.error("Failed to upload");
    }
  };

  const handleDeactivate = async () => {
    if (!window.confirm("This will hide your profile. You can reactivate later.")) return;
    setDeactivating(true);
    try {
      await profileApi.deactivate();
      toast.success("Profile deactivated");
    } catch {
      toast.error("Failed to deactivate");
    } finally {
      setDeactivating(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    setDeleting(true);
    try {
      await profileApi.delete();
      localStorage.removeItem("kio_token");
      window.location.href = "/";
    } catch {
      toast.error("Failed to delete account");
      setDeleting(false);
    }
  };

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
        <p className="text-[13px] text-[#52525b] mt-1">Manage your profile and account settings.</p>
      </div>

      {/* Profile Section */}
      <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6 space-y-4">
        <h3 className="text-[14px] font-semibold text-white">Profile</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Display Name</label>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your display name" className={inputClass} />
          </div>
          <div>
            <label className={LABEL}>Custom Status</label>
            <input value={customStatus} onChange={(e) => setCustomStatus(e.target.value)} placeholder="What's on your mind?" className={inputClass} />
          </div>
        </div>
        <div>
          <label className={LABEL}>Bio</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell the world about yourself" rows={3} className={`${inputClass} resize-none`} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Avatar URL</label>
            <div className="flex gap-2">
              <input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="Avatar URL" className={`${inputClass} flex-1`} />
              <label className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-[12px] font-medium text-[#a1a1aa] hover:bg-white/[0.08] hover:text-white transition-all cursor-pointer shrink-0">
                <Upload size={12} /> Upload
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </label>
            </div>
          </div>
          <div>
            <label className={LABEL}>Banner URL</label>
            <div className="flex gap-2">
              <input value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} placeholder="Banner URL" className={`${inputClass} flex-1`} />
              <label className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-[12px] font-medium text-[#a1a1aa] hover:bg-white/[0.08] hover:text-white transition-all cursor-pointer shrink-0">
                <Upload size={12} /> Upload
                <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
              </label>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Username</label>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className={`${inputClass} ${usernameError ? "border-red-400/40" : ""}`}
                />
                {usernameError && <p className="text-[11px] text-red-400 mt-1.5">{usernameError}</p>}
              </div>
              <button
                onClick={handleUpdateUsername}
                disabled={saving || !!usernameError || username === originalUsername}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-black text-[13px] font-bold hover:bg-white/90 transition-all disabled:opacity-40 cursor-pointer shrink-0"
              >
                <Save size={14} />
              </button>
            </div>
          </div>
          <div>
            <label className={LABEL}>Slug (alternative URL)</label>
            <div className="flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm">
              <span className="text-[#3f3f46] shrink-0">kio.lol/@</span>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="your-slug"
                className="bg-transparent outline-none text-white flex-1 min-w-0"
              />
            </div>
            {slugError && <p className="text-[11px] text-red-400 mt-1.5">{slugError}</p>}
          </div>
        </div>
        <div className="flex items-center justify-between py-1">
          <div>
            <span className="text-[13px] text-white">Enable Sharing</span>
            <p className="text-[11px] text-[#3f3f46]">Allow others to share your profile</p>
          </div>
          <Switch checked={shareEnabled} onChange={setShareEnabled} />
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3">
          <span className="text-[13px] text-[#71717a] truncate flex-1">{profileUrl}</span>
          <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="text-[#52525b] hover:text-white transition-colors shrink-0">
            <ExternalLink size={14} />
          </a>
        </div>
        <button
          onClick={handleSaveProfile}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-black text-[13px] font-bold hover:bg-white/90 transition-all disabled:opacity-40 cursor-pointer"
        >
          <Save size={14} />
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </div>

      {/* Privacy */}
      <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Shield size={14} className="text-[#52525b]" />
          <h3 className="text-[14px] font-semibold text-white">Privacy</h3>
        </div>
        <div className="flex items-center justify-between py-1">
          <div>
            <span className="text-[13px] text-white">Private Profile</span>
            <p className="text-[11px] text-[#3f3f46]">Hide your profile from public view</p>
          </div>
          <Switch checked={isPrivate} onChange={setIsPrivate} />
        </div>
        {isPrivate && (
          <div>
            <label className={LABEL}>Passcode</label>
            <input value={passcode} onChange={(e) => setPasscode(e.target.value)} placeholder="Required passcode to view" className={inputClass} />
          </div>
        )}
        <div className="flex items-center justify-between py-1">
          <div>
            <span className="text-[13px] text-white">Show in Directory</span>
            <p className="text-[11px] text-[#3f3f46]">Allow your profile to appear in discovery</p>
          </div>
          <Switch checked={showInDirectory} onChange={setShowInDirectory} />
        </div>
        <button
          onClick={handleSavePrivacy}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black text-[13px] font-bold hover:bg-white/90 transition-all disabled:opacity-40 cursor-pointer"
        >
          <Save size={14} />
          Save Privacy
        </button>
      </div>

      {/* Tags */}
      <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Tag size={14} className="text-[#52525b]" />
          <h3 className="text-[14px] font-semibold text-white">Profile Tags</h3>
        </div>
        <p className="text-[12px] text-[#3f3f46]">Add tags to help people discover your profile (comma-separated, max 10).</p>
        <input
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="gaming, music, photography"
          className={inputClass}
        />
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span key={tag} className="px-2.5 py-0.5 rounded-full text-[11px] font-medium text-[#71717a] bg-white/[0.04] border border-white/[0.06]">
              #{tag}
            </span>
          ))}
        </div>
        <button
          onClick={handleSaveTags}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black text-[13px] font-bold hover:bg-white/90 transition-all disabled:opacity-40 cursor-pointer"
        >
          <Save size={14} />
          Save Tags
        </button>
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border border-red-400/[0.12] bg-[#0a0a0a] p-6 space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-400" />
          <h3 className="text-[14px] font-semibold text-red-400">Danger Zone</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-[13px] text-white">Deactivate Account</p>
              <p className="text-[11px] text-[#3f3f46]">Hide your profile. You can reactivate later.</p>
            </div>
            <button
              onClick={handleDeactivate}
              disabled={deactivating}
              className="px-4 py-2 rounded-xl border border-white/[0.06] bg-white/[0.03] text-[12px] font-medium text-[#a1a1aa] hover:bg-white/[0.06] hover:text-white transition-all cursor-pointer"
            >
              {deactivating ? "Deactivating..." : "Deactivate"}
            </button>
          </div>
          <div className="h-px bg-white/[0.04]" />
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-[13px] text-white">Delete Account</p>
              <p className="text-[11px] text-[#3f3f46]">Permanently delete your account and all data.</p>
            </div>
            {!deleteConfirm ? (
              <button
                onClick={() => setDeleteConfirm(true)}
                className="px-4 py-2 rounded-xl bg-red-400/[0.12] text-red-400 text-[12px] font-semibold hover:bg-red-400/[0.2] transition-all cursor-pointer"
              >
                Delete Account
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="px-4 py-2 rounded-xl bg-red-500 text-white text-[12px] font-bold hover:bg-red-600 transition-all disabled:opacity-40 cursor-pointer"
                >
                  {deleting ? "Deleting..." : "Yes, Delete"}
                </button>
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="px-4 py-2 rounded-xl text-[12px] font-medium text-[#52525b] hover:text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
