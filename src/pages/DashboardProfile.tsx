import { useEffect, useState } from "react";
import { Upload, X, Save, Eye, EyeOff, Lock, Code, Paintbrush } from "lucide-react";
import { motion } from "framer-motion";
import { profileApi, configApi, uploadApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Switch } from "@/components/ui/Switch";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const inputClass =
  "w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-[#3f3f46] outline-none transition-all focus:border-white/[0.12] focus:bg-white/[0.05]";
const LABEL = "text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-2 block";

function SliderControl({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between text-[12px] mb-2">
        <span className="text-[#71717a]">{label}</span>
        <span className="text-[#3f3f46]">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-white h-1"
      />
    </div>
  );
}

export default function DashboardProfile() {
  const { profile, refreshProfile } = useAuthStore();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [location, setLocation] = useState(profile?.location ?? "");
  const [saving, setSaving] = useState(false);

  // Config state
  const [configLoaded, setConfigLoaded] = useState(false);

  // Privacy
  const [isPrivate, setIsPrivate] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [showInDirectory, setShowInDirectory] = useState(true);

  // Custom Code (Premium)
  const [customCss, setCustomCss] = useState("");
  const [customHtml, setCustomHtml] = useState("");
  const [customPageTitle, setCustomPageTitle] = useState("");
  const [customFavicon, setCustomFavicon] = useState("");

  // Username Animations
  const [usernameAnimation, setUsernameAnimation] = useState("none");
  const [displayNameAnimation, setDisplayNameAnimation] = useState("none");
  const [bioAnimation, setBioAnimation] = useState("none");

  // Card Customization
  const [cardWidth, setCardWidth] = useState(420);
  const [cardHeight, setCardHeight] = useState("auto");
  const [cardShadow, setCardShadow] = useState(true);
  const [cardBorder, setCardBorder] = useState("1px solid rgba(255,255,255,0.06)");
  const [textAlignment, setTextAlignment] = useState("center");

  // Element Visibility
  const [hideUsername, setHideUsername] = useState(false);
  const [hideBadges, setHideBadges] = useState(false);
  const [hideSocialLinks, setHideSocialLinks] = useState(false);
  const [hideViews, setHideViews] = useState(true);
  const [showVerifiedBadge, setShowVerifiedBadge] = useState(true);

  useEffect(() => {
    setDisplayName(profile?.display_name ?? "");
    setBio(profile?.bio ?? "");
    setLocation(profile?.location ?? "");
  }, [profile]);

  useEffect(() => {
    if (!profile?.id) return;
    configApi
      .getByProfileId(profile.id)
      .then((d: any) => {
        if (!d) return;
        setIsPrivate(!!d.is_private);
        setPasscode(d.passcode || "");
        setShowInDirectory(d.show_in_directory !== false);
        setCustomCss(d.custom_css || "");
        setCustomHtml(d.custom_html || "");
        setCustomPageTitle(d.custom_page_title || "");
        setCustomFavicon(d.custom_favicon || "");
        setUsernameAnimation(d.username_animation || "none");
        setDisplayNameAnimation(d.display_name_animation || "none");
        setBioAnimation(d.bio_animation || "none");
        setCardWidth(d.card_width || 420);
        setCardHeight(d.card_height || "auto");
        setCardShadow(d.card_shadow !== false);
        setCardBorder(d.card_border || "1px solid rgba(255,255,255,0.06)");
        setTextAlignment(d.text_alignment || "center");
        setHideUsername(!!d.hide_username);
        setHideBadges(!!d.hide_badges);
        setHideSocialLinks(!!d.hide_social_links);
        setHideViews(d.hide_views !== false ? true : false);
        setShowVerifiedBadge(d.show_verified_badge !== 0);
      })
      .catch(() => {})
      .finally(() => setConfigLoaded(true));
  }, [profile?.id]);

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

  const handleConfigSave = async () => {
    setSaving(true);
    try {
      await configApi.update({
        is_private: isPrivate,
        passcode,
        show_in_directory: showInDirectory,
        custom_css: customCss,
        custom_html: customHtml,
        custom_page_title: customPageTitle,
        custom_favicon: customFavicon,
        username_animation: usernameAnimation,
        display_name_animation: displayNameAnimation,
        bio_animation: bioAnimation,
        card_width: cardWidth,
        card_height: cardHeight,
        card_shadow: cardShadow,
        card_border: cardBorder,
        text_alignment: textAlignment,
        hide_username: hideUsername,
        hide_badges: hideBadges,
        hide_social_links: hideSocialLinks,
        hide_views: hideViews,
        show_verified_badge: showVerifiedBadge ? 1 : 0,
      });
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 200 * 1024 * 1024) {
      toast.error("File size must be under 200 MB");
      return;
    }
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
    if (file.size > 200 * 1024 * 1024) {
      toast.error("File size must be under 200 MB");
      return;
    }
    try {
      const url = await uploadApi.upload(file, "banner");
      await profileApi.update({ banner_url: url });
      await refreshProfile();
      toast.success("Banner updated");
    } catch {
      toast.error("Failed to upload banner");
    }
  };

  const ANIMATION_OPTIONS = ["none", "bounce", "glow", "pulse", "float"];
  const HEIGHT_OPTIONS = ["auto", "400px", "500px", "600px", "700px"];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-white">Profile</h1>
        <p className="text-[13px] text-[#52525b] mt-1">Manage your public profile information.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Basic Info */}
          <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6">
            <h3 className="text-[14px] font-semibold text-white mb-1">Basic Info</h3>
            <p className="text-[12px] text-[#3f3f46] mb-5">Your public details.</p>
            <div className="space-y-4">
              <div>
                <label className={LABEL}>Display Name</label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your display name"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={LABEL}>Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell the world about yourself"
                  rows={3}
                  className={`${inputClass} resize-none`}
                />
              </div>
              <div>
                <label className={LABEL}>Location</label>
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

          {/* Privacy */}
          <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Lock size={14} className="text-[#52525b]" />
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
                <input
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Required passcode to view"
                  className={inputClass}
                />
              </div>
            )}
            <div className="flex items-center justify-between py-1">
              <div>
                <span className="text-[13px] text-white">Show in Directory</span>
                <p className="text-[11px] text-[#3f3f46]">Allow your profile to appear in the discovery page</p>
              </div>
              <Switch checked={showInDirectory} onChange={setShowInDirectory} />
            </div>
          </div>

          {/* Custom Code (Premium) */}
          <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6 space-y-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Code size={14} className="text-[#52525b]" />
                <h3 className="text-[14px] font-semibold text-white">Custom Code</h3>
              </div>
              <span className="text-[10px] px-2 py-1 rounded-lg bg-[#eab308]/[0.12] text-[#eab308] font-semibold">
                Premium
              </span>
            </div>
            <div>
              <label className={LABEL}>Custom CSS</label>
              <textarea
                value={customCss}
                onChange={(e) => setCustomCss(e.target.value)}
                rows={4}
                placeholder="/* Add your custom CSS here */"
                className={`${inputClass} resize-none font-mono text-[12px]`}
              />
            </div>
            <div>
              <label className={LABEL}>Custom HTML Embed</label>
              <textarea
                value={customHtml}
                onChange={(e) => setCustomHtml(e.target.value)}
                rows={4}
                placeholder="<!-- Custom HTML -->"
                className={`${inputClass} resize-none font-mono text-[12px]`}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Custom Page Title</label>
                <input
                  value={customPageTitle}
                  onChange={(e) => setCustomPageTitle(e.target.value)}
                  placeholder="My Awesome Page"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={LABEL}>Custom Favicon URL</label>
                <input
                  value={customFavicon}
                  onChange={(e) => setCustomFavicon(e.target.value)}
                  placeholder="https://example.com/favicon.ico"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Username Animations */}
          <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6 space-y-4">
            <h3 className="text-[14px] font-semibold text-white mb-1">Text Animations</h3>
            <div className="space-y-3">
              {[
                { label: "Username Animation", value: usernameAnimation, set: setUsernameAnimation },
                { label: "Display Name Animation", value: displayNameAnimation, set: setDisplayNameAnimation },
                { label: "Bio Animation", value: bioAnimation, set: setBioAnimation },
              ].map((item) => (
                <div key={item.label}>
                  <label className={LABEL}>{item.label}</label>
                  <div className="flex gap-2 flex-wrap">
                    {ANIMATION_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => item.set(opt)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all cursor-pointer capitalize",
                          item.value === opt
                            ? "bg-white text-black"
                            : "bg-white/[0.04] text-[#a1a1aa] hover:bg-white/[0.08]"
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card Customization */}
          <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <Paintbrush size={14} className="text-[#52525b]" />
              <h3 className="text-[14px] font-semibold text-white">Card Customization</h3>
            </div>
            <SliderControl
              label="Card Width"
              value={cardWidth}
              min={300}
              max={600}
              step={10}
              unit="px"
              onChange={setCardWidth}
            />
            <div>
              <label className={LABEL}>Card Height</label>
              <div className="flex gap-2 flex-wrap">
                {HEIGHT_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setCardHeight(opt)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all cursor-pointer capitalize",
                      cardHeight === opt
                        ? "bg-white text-black"
                        : "bg-white/[0.04] text-[#a1a1aa] hover:bg-white/[0.08]"
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-[13px] text-white">Card Shadow</span>
              <Switch checked={cardShadow} onChange={setCardShadow} />
            </div>
            <div>
              <label className={LABEL}>Card Border</label>
              <input
                value={cardBorder}
                onChange={(e) => setCardBorder(e.target.value)}
                placeholder="1px solid rgba(255,255,255,0.06)"
                className={inputClass}
              />
            </div>
            <div>
              <label className={LABEL}>Text Alignment</label>
              <div className="flex gap-2">
                {["left", "center", "right"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setTextAlignment(opt)}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-[12px] font-medium transition-all cursor-pointer capitalize",
                      textAlignment === opt
                        ? "bg-white text-black"
                        : "bg-white/[0.04] text-[#a1a1aa] hover:bg-white/[0.08]"
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Element Visibility */}
          <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6 space-y-4">
            <h3 className="text-[14px] font-semibold text-white mb-1">Element Visibility</h3>
            {[
              { label: "Hide Username", checked: hideUsername, set: setHideUsername },
              { label: "Hide Badges", checked: hideBadges, set: setHideBadges },
              { label: "Hide Social Links", checked: hideSocialLinks, set: setHideSocialLinks },
              { label: "Hide Views", checked: hideViews, set: setHideViews },
              { label: "Show Verified Badge", checked: showVerifiedBadge, set: setShowVerifiedBadge },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-1">
                <span className="text-[13px] text-white">{item.label}</span>
                <Switch checked={item.checked} onChange={item.set} />
              </div>
            ))}
          </div>

          <button
            onClick={handleConfigSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-black text-[13px] font-bold hover:bg-white/90 transition-all disabled:opacity-40 cursor-pointer"
          >
            <Save size={14} />
            {saving ? "Saving..." : "Save All Settings"}
          </button>
        </div>

        {/* Sidebar */}
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
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
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
                  <div className="h-full flex items-center justify-center text-[12px] text-[#3f3f46]">
                    No banner
                  </div>
                )}
              </div>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleBannerUpload}
                />
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
