import { useEffect, useState } from "react";
import { Save, Upload, X, Check } from "lucide-react";
import { configApi, uploadApi, profileApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";

const FONT_OPTIONS = ["Inter", "Space Grotesk", "JetBrains Mono", "Poppins", "Montserrat"];
const LAYOUT_OPTIONS = ["centered", "left-aligned", "full-width"];

const TEXT_INPUT = "w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-[#3f3f46] outline-none transition-all focus:border-white/[0.12] focus:bg-white/[0.05]";
const LABEL = "text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-2 block";

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[13px] text-white">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${checked ? "bg-white" : "bg-white/[0.08]"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-black transition-transform ${checked ? "translate-x-4" : ""}`} />
      </button>
    </div>
  );
}

function SliderControl({ label, value, min, max, step, unit, onChange }: {
  label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between text-[12px] mb-2">
        <span className="text-[#71717a]">{label}</span>
        <span className="text-[#3f3f46]">{value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-white h-1"
      />
    </div>
  );
}

export default function DashboardAppearance() {
  const { profile, refreshProfile } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [fontFamily, setFontFamily] = useState("Inter");
  const [primaryColor, setPrimaryColor] = useState("#8b5cf6");
  const [secondaryColor, setSecondaryColor] = useState("#06b6d4");
  const [textColor, setTextColor] = useState("#ffffff");
  const [iconColor, setIconColor] = useState("#a1a1aa");
  const [profileOpacity, setProfileOpacity] = useState(100);
  const [profileBlur, setProfileBlur] = useState(0);
  const [profileBorder, setProfileBorder] = useState(false);
  const [profileBorderRadius, setProfileBorderRadius] = useState(16);
  const [profileLayout, setProfileLayout] = useState("centered");
  const [glowColor, setGlowColor] = useState("#8b5cf6");
  const [enableGlow, setEnableGlow] = useState(false);
  const [enableGradient, setEnableGradient] = useState(false);
  const [enableUsernameEffects, setEnableUsernameEffects] = useState(false);
  const [enableAnimatedTitle, setEnableAnimatedTitle] = useState(false);
  const [animatedTitleText, setAnimatedTitleText] = useState("");
  const [enableTypewriter, setEnableTypewriter] = useState(false);
  const [typewriterText, setTypewriterText] = useState("");
  const [showAvatar, setShowAvatar] = useState(true);
  const [showBadges, setShowBadges] = useState(true);
  const [showViews, setShowViews] = useState(true);
  const [showSocialLinks, setShowSocialLinks] = useState(true);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);

  useEffect(() => {
    if (!profile?.id) return;
    setLoading(true);
    configApi
      .getByProfileId(profile.id)
      .then((d: any) => {
        if (!d) return;
        setFontFamily(d.font_family || "Inter");
        setPrimaryColor(d.primary_color || "#8b5cf6");
        setSecondaryColor(d.secondary_color || "#06b6d4");
        setTextColor(d.text_color || "#ffffff");
        setIconColor(d.icon_color || "#a1a1aa");
        setProfileOpacity(d.profile_opacity ?? 100);
        setProfileBlur(d.profile_blur ?? 0);
        setProfileBorder(!!d.profile_border);
        setProfileBorderRadius(d.profile_border_radius ?? 16);
        setProfileLayout(d.profile_layout || "centered");
        setGlowColor(d.glow_color || "#8b5cf6");
        setEnableGlow(!!d.enable_glow);
        setEnableGradient(!!d.enable_gradient);
        setEnableUsernameEffects(!!d.enable_username_effects);
        setEnableAnimatedTitle(!!d.enable_animated_title);
        setAnimatedTitleText(d.animated_title_text || "");
        setEnableTypewriter(!!d.enable_typewriter);
        setTypewriterText(d.typewriter_text || "");
        setShowAvatar(d.show_avatar !== false);
        setShowBadges(d.show_badges !== false);
        setShowViews(d.show_views !== false);
        setShowSocialLinks(d.show_social_links !== false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [profile?.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await configApi.update({
        font_family: fontFamily,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        text_color: textColor,
        icon_color: iconColor,
        profile_opacity: profileOpacity,
        profile_blur: profileBlur,
        profile_border: profileBorder,
        profile_border_radius: profileBorderRadius,
        profile_layout: profileLayout,
        glow_color: glowColor,
        enable_glow: enableGlow,
        enable_gradient: enableGradient,
        enable_username_effects: enableUsernameEffects,
        enable_animated_title: enableAnimatedTitle,
        animated_title_text: animatedTitleText,
        enable_typewriter: enableTypewriter,
        typewriter_text: typewriterText,
        show_avatar: showAvatar,
        show_badges: showBadges,
        show_views: showViews,
        show_social_links: showSocialLinks,
      });
      toast.success("Appearance saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 200 * 1024 * 1024) { toast.error("Max 200 MB"); return; }
    setAvatarUploading(true);
    try {
      const url = await uploadApi.upload(file, "avatar");
      await profileApi.update({ avatar_url: url });
      await refreshProfile();
      toast.success("Avatar updated");
    } catch {
      toast.error("Upload failed");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleAvatarRemove = async () => {
    try {
      await profileApi.update({ avatar_url: "" });
      await refreshProfile();
      toast.success("Avatar removed");
    } catch {
      toast.error("Failed");
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 200 * 1024 * 1024) { toast.error("Max 200 MB"); return; }
    setBannerUploading(true);
    try {
      const url = await uploadApi.upload(file, "banner");
      await profileApi.update({ banner_url: url });
      await refreshProfile();
      toast.success("Banner updated");
    } catch {
      toast.error("Upload failed");
    } finally {
      setBannerUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-7 w-48 rounded-lg bg-[#0a0a0a] animate-shimmer" />
        <div className="h-96 rounded-xl bg-[#0a0a0a] animate-shimmer" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-white">Appearance</h1>
        <p className="text-[13px] text-[#52525b] mt-1">Customize how your profile looks.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">

          {/* Identity */}
          <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6 space-y-6">
            <h3 className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Identity</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-4">
                <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider w-full">Avatar</label>
                <div className="relative h-24 w-24 rounded-full bg-white/[0.06] overflow-hidden border-2 border-white/[0.06]">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-2xl font-bold text-[#3f3f46]">
                      {(profile?.display_name ?? profile?.username ?? "?")[0].toUpperCase()}
                    </div>
                  )}
                  {avatarUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <label className="cursor-pointer">
                    <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handleAvatarUpload} />
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-[12px] font-medium text-[#a1a1aa] hover:bg-white/[0.06] hover:text-white transition-all">
                      <Upload size={12} /> Upload
                    </span>
                  </label>
                  {profile?.avatar_url && (
                    <button onClick={handleAvatarRemove} className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-[12px] font-medium text-[#a1a1aa] hover:bg-red-400/[0.08] hover:text-red-400 transition-all cursor-pointer">
                      <X size={12} /> Remove
                    </button>
                  )}
                </div>
              </div>

              {/* Banner */}
              <div className="flex flex-col gap-4">
                <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Banner</label>
                <div className="h-28 rounded-xl bg-white/[0.04] overflow-hidden border border-white/[0.06] relative">
                  {profile?.banner_url ? (
                    <img src={profile.banner_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full flex items-center justify-center text-[12px] text-[#3f3f46]">No banner</div>
                  )}
                  {bannerUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <label className="cursor-pointer">
                  <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handleBannerUpload} />
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-[12px] font-medium text-[#a1a1aa] hover:bg-white/[0.06] hover:text-white transition-all w-full justify-center">
                    <Upload size={12} /> Upload Banner
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Typography */}
          <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6">
            <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-3 block">Font Family</label>
            <div className="flex flex-wrap gap-2">
              {FONT_OPTIONS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFontFamily(f)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all cursor-pointer ${
                    fontFamily === f
                      ? "bg-white text-black"
                      : "bg-white/[0.04] text-[#a1a1aa] hover:bg-white/[0.08] hover:text-white"
                  }`}
                  style={{ fontFamily: f }}
                >
                  {f}
                  {fontFamily === f && <Check size={10} className="inline ml-1" />}
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6 space-y-4">
            <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider block">Colors</label>
            {[
              { label: "Primary", value: primaryColor, set: setPrimaryColor },
              { label: "Secondary", value: secondaryColor, set: setSecondaryColor },
              { label: "Text", value: textColor, set: setTextColor },
              { label: "Icon", value: iconColor, set: setIconColor },
            ].map((c) => (
              <div key={c.label} className="flex items-center gap-3">
                <input
                  type="color"
                  value={c.value}
                  onChange={(e) => c.set(e.target.value)}
                  className="w-8 h-8 rounded-lg border border-white/[0.06] bg-transparent cursor-pointer appearance-none [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-lg [&::-webkit-color-swatch]:border-none"
                />
                <div className="flex-1">
                  <span className="text-[12px] text-[#71717a]">{c.label}</span>
                </div>
                <input
                  type="text"
                  value={c.value}
                  onChange={(e) => c.set(e.target.value)}
                  className="w-24 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-[12px] text-white font-mono text-center outline-none focus:border-white/[0.12]"
                />
              </div>
            ))}
          </div>

          {/* Profile Card */}
          <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6 space-y-5">
            <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider block">Profile Card</label>
            <SliderControl label="Opacity" value={profileOpacity} min={0} max={100} step={1} unit="%" onChange={setProfileOpacity} />
            <SliderControl label="Blur" value={profileBlur} min={0} max={20} step={1} unit="px" onChange={setProfileBlur} />
            <SliderControl label="Border Radius" value={profileBorderRadius} min={0} max={32} step={1} unit="px" onChange={setProfileBorderRadius} />
            <Toggle label="Border" checked={profileBorder} onChange={setProfileBorder} />
            <div>
              <label className={LABEL}>Layout</label>
              <div className="flex gap-2">
                {LAYOUT_OPTIONS.map((l) => (
                  <button
                    key={l}
                    onClick={() => setProfileLayout(l)}
                    className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all cursor-pointer ${
                      profileLayout === l
                        ? "bg-white text-black"
                        : "bg-white/[0.04] text-[#a1a1aa] hover:bg-white/[0.08]"
                    }`}
                  >
                    {l.charAt(0).toUpperCase() + l.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Effects */}
          <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6 space-y-4">
            <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider block">Effects</label>
            <Toggle label="Glow" checked={enableGlow} onChange={setEnableGlow} />
            {enableGlow && (
              <div className="flex items-center gap-3">
                <input type="color" value={glowColor} onChange={(e) => setGlowColor(e.target.value)} className="w-8 h-8 rounded-lg border border-white/[0.06] bg-transparent cursor-pointer appearance-none [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-lg [&::-webkit-color-swatch]:border-none" />
                <span className="text-[12px] text-[#71717a]">Glow Color</span>
              </div>
            )}
            <Toggle label="Gradient" checked={enableGradient} onChange={setEnableGradient} />
            <Toggle label="Username Effects" checked={enableUsernameEffects} onChange={setEnableUsernameEffects} />
            <Toggle label="Animated Title" checked={enableAnimatedTitle} onChange={setEnableAnimatedTitle} />
            {enableAnimatedTitle && (
              <input value={animatedTitleText} onChange={(e) => setAnimatedTitleText(e.target.value)} placeholder="Title text" className={TEXT_INPUT} />
            )}
            <Toggle label="Typewriter Effect" checked={enableTypewriter} onChange={setEnableTypewriter} />
            {enableTypewriter && (
              <input value={typewriterText} onChange={(e) => setTypewriterText(e.target.value)} placeholder="Text to type out" className={TEXT_INPUT} />
            )}
          </div>

          {/* Display Options */}
          <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6 space-y-4">
            <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider block">Display Options</label>
            <Toggle label="Show Avatar" checked={showAvatar} onChange={setShowAvatar} />
            <Toggle label="Show Badges" checked={showBadges} onChange={setShowBadges} />
            <Toggle label="Show Views" checked={showViews} onChange={setShowViews} />
            <Toggle label="Show Social Links" checked={showSocialLinks} onChange={setShowSocialLinks} />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-black text-[13px] font-bold hover:bg-white/90 transition-all disabled:opacity-40 cursor-pointer"
          >
            <Save size={14} />
            {saving ? "Saving..." : "Save Appearance"}
          </button>
        </div>

        {/* Live Preview */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-4">
            <h3 className="text-[12px] font-semibold text-[#71717a] uppercase tracking-wider mb-3">Preview</h3>
            <div
              className="rounded-xl overflow-hidden border border-white/[0.06]"
              style={{
                opacity: profileOpacity / 100,
                filter: profileBlur > 0 ? `blur(${profileBlur}px)` : undefined,
                borderRadius: `${profileBorderRadius}px`,
                borderStyle: profileBorder ? "solid" : "none",
                borderColor: `${primaryColor}40`,
              }}
            >
              <div
                className="p-6 text-center"
                style={{ fontFamily }}
              >
                {showAvatar && (
                  <div className="mx-auto mb-3 w-20 h-20 rounded-full overflow-hidden border-2" style={{ borderColor: `${primaryColor}60` }}>
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl font-bold bg-white/[0.06]" style={{ color: textColor }}>
                        {(profile?.display_name ?? profile?.username ?? "?")[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                )}
                <p className="text-lg font-bold" style={{ color: textColor }}>
                  {profile?.display_name || "Display Name"}
                </p>
                <p className="text-xs mt-0.5" style={{ color: iconColor }}>
                  @{profile?.username || "username"}
                </p>
                {profile?.bio && (
                  <p className="text-xs mt-2 opacity-60" style={{ color: textColor }}>
                    {profile.bio}
                  </p>
                )}
                <div className="mt-3 space-y-1.5">
                  {[1, 2].map((i) => (
                    <div key={i} className="w-full py-2 rounded-lg text-[11px] font-medium border border-white/[0.06] bg-white/[0.04]" style={{ color: textColor }}>
                      Link {i}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
