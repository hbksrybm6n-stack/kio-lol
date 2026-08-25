import { useEffect, useState } from "react";
import { Upload, X, Save } from "lucide-react";
import { profileApi, uploadApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";

export default function DashboardProfile() {
  const { profile, refreshProfile } = useAuthStore();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [location, setLocation] = useState(profile?.location ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDisplayName(profile?.display_name ?? "");
    setBio(profile?.bio ?? "");
    setLocation(profile?.location ?? "");
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await profileApi.update({ display_name: displayName, bio, location });
      await refreshProfile();
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 200 * 1024 * 1024) { toast.error("File size must be under 200 MB"); return; }
    try {
      const url = await uploadApi.upload(file, "avatar");
      await profileApi.update({ avatar_url: url });
      await refreshProfile();
      toast.success("Avatar updated");
    } catch {
      toast.error("Failed to upload avatar");
    }
  };

  const handleAvatarRemove = async () => {
    try {
      await profileApi.update({ avatar_url: "" });
      await refreshProfile();
      toast.success("Avatar removed");
    } catch {
      toast.error("Failed to remove avatar");
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 200 * 1024 * 1024) { toast.error("File size must be under 200 MB"); return; }
    try {
      const url = await uploadApi.upload(file, "banner");
      await profileApi.update({ banner_url: url });
      await refreshProfile();
      toast.success("Banner updated");
    } catch {
      toast.error("Failed to upload banner");
    }
  };

  const inputClass = "w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-[#3f3f46] outline-none transition-all focus:border-white/[0.12] focus:bg-white/[0.05]";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-white">Profile</h1>
        <p className="text-[13px] text-[#52525b] mt-1">Manage your public profile information.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6">
            <h3 className="text-[14px] font-semibold text-white mb-1">Basic Info</h3>
            <p className="text-[12px] text-[#3f3f46] mb-5">Your public details.</p>
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-2 block">Display Name</label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your display name"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-2 block">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell the world about yourself"
                  rows={3}
                  className={`${inputClass} resize-none`}
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-2 block">Location</label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Where are you based?"
                  className={inputClass}
                />
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black text-[13px] font-bold hover:bg-white/90 transition-all disabled:opacity-40 cursor-pointer"
              >
                <Save className="h-3.5 w-3.5" />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6">
            <h3 className="text-[14px] font-semibold text-white mb-1">Avatar</h3>
            <p className="text-[12px] text-[#3f3f46] mb-5">Your profile picture.</p>
            <div className="flex flex-col items-center gap-4">
              <div className="relative h-20 w-20 rounded-full bg-white/[0.06] overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xl font-bold text-[#3f3f46]">
                    {(profile?.display_name ?? profile?.username ?? "?")[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-[12px] font-medium text-[#a1a1aa] hover:bg-white/[0.06] hover:text-white transition-all">
                    <Upload className="h-3.5 w-3.5" /> Upload
                  </span>
                </label>
                {profile?.avatar_url && (
                  <button
                    onClick={handleAvatarRemove}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-[12px] font-medium text-[#a1a1aa] hover:bg-red-400/[0.08] hover:text-red-400 transition-all cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" /> Remove
                  </button>
                )}
              </div>
              <p className="text-[11px] text-[#3f3f46]">Max 200 MB</p>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6">
            <h3 className="text-[14px] font-semibold text-white mb-1">Banner</h3>
            <p className="text-[12px] text-[#3f3f46] mb-5">Cover image for your profile.</p>
            <div className="space-y-3">
              <div className="h-28 rounded-lg bg-white/[0.04] overflow-hidden">
                {profile?.banner_url ? (
                  <img src={profile.banner_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full flex items-center justify-center text-[12px] text-[#3f3f46]">No banner</div>
                )}
              </div>
              <label className="cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-[12px] font-medium text-[#a1a1aa] hover:bg-white/[0.06] hover:text-white transition-all w-full justify-center">
                  <Upload className="h-3.5 w-3.5" /> Upload Banner
                </span>
              </label>
              <p className="text-[11px] text-[#3f3f46]">Max 200 MB</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
