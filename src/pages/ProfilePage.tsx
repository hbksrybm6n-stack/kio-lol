import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, Flag, Ban, Lock, Share2, Copy, Check, SkipBack, SkipForward, Shuffle } from "lucide-react";
import {
  profileApi,
  configApi,
  linksApi,
  badgesApi,
  linkGroupsApi,
  moderationApi,
  reportsApi,
  linksApi as linksApiRef,
} from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { SOCIAL_PLATFORMS, type SocialPlatform } from "@/types";
import { SOCIAL_SVGS } from "@/lib/socialIcons";
import { SnowEffect } from "@/components/effects/SnowEffect";
import { ParticleEffect } from "@/components/effects/ParticleEffect";
import AudioVisualizer from "@/components/AudioVisualizer";
import ShareModal from "@/components/ShareModal";
import Captcha from "@/components/Captcha";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { LinkGroup } from "@/types";

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [widgets, setWidgets] = useState<any[]>([]);
  const [socials, setSocials] = useState<any[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [linkGroups, setLinkGroups] = useState<LinkGroup[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [entered, setEntered] = useState(false);
  const [entering, setEntering] = useState(false);
  const [muted, setMuted] = useState(true);
  const [isPrivateBlocked, setIsPrivateBlocked] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState("");
  const [passcodeError, setPasscodeError] = useState("");
  const [isBlocked, setIsBlocked] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reportCategory, setReportCategory] = useState<string>("other");
  const [reportCaptchaToken, setReportCaptchaToken] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [linkPasswords, setLinkPasswords] = useState<Record<string, string>>({});
  const [unlockingLinkId, setUnlockingLinkId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasMedia = !!(config?.music_url || config?.background_video_url);

  useEffect(() => {
    if (username) loadProfile();
    return () => {
      document.title = "kio.lol";
      const existingFavicon = document.querySelector("link[rel='icon']");
      if (existingFavicon) existingFavicon.setAttribute("href", "/favicon.ico");
    };
  }, [username]);

  const loadProfile = async () => {
    setLoading(true);
    setNotFound(false);
    setIsPrivateBlocked(false);
    setIsBlocked(false);
    try {
      const response = await profileApi.getByUsername(username!);
      if (!response || response.error) {
        setNotFound(true);
        return;
      }
      const profileData = response.profile || response;
      if (profileData.is_banned) {
        setNotFound(true);
        return;
      }
      setProfile(profileData);
      const configData = (response as any).config || {};
      const [socialsData, linksData, badgesData, groupsData] = await Promise.all([
        fetch(`/api/socials/profile/${profileData.id}`).then((r) => r.json()).catch(() => []),
        linksApi.getByProfileId(profileData.id).catch(() => []),
        badgesApi.getUserBadges(profileData.id).catch(() => []),
        linkGroupsApi.list().catch(() => []),
      ]);
      setConfig(configData);
      setWidgets(Array.isArray(configData?.widgets) ? configData.widgets : []);
      setSocials((socialsData || []).filter((s: any) => s.is_active !== false));
      setLinks((linksData || []).filter((l: any) => l.is_active !== false));
      setBadges(badgesData || []);
      setLinkGroups(groupsData || []);
      setTags(profileData.tags || []);

      if (configData?.custom_page_title) {
        document.title = configData.custom_page_title;
      } else {
        document.title = `${profileData.display_name || profileData.username} | kio.lol`;
      }

      if (configData?.custom_favicon) {
        let favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement;
        if (!favicon) {
          favicon = document.createElement("link");
          favicon.rel = "icon";
          document.head.appendChild(favicon);
        }
        favicon.href = configData.custom_favicon;
      }

      if (configData?.is_private && configData?.passcode) {
        setIsPrivateBlocked(true);
      }

      profileApi.incrementViews(profileData.id).catch(() => {});
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handlePasscode = async () => {
    if (!passcodeInput.trim()) return;
    if (passcodeInput === config?.passcode) {
      setIsPrivateBlocked(false);
      setPasscodeError("");
    } else {
      setPasscodeError("Incorrect passcode");
    }
  };

  const handleBlock = async () => {
    if (!profile) return;
    try {
      await moderationApi.blockUser(profile.user_id);
      setIsBlocked(true);
      toast.success("Profile blocked");
    } catch {
      toast.error("Failed to block");
    }
  };

  const handleReport = async () => {
    if (!profile || !reportReason.trim()) return;
    try {
      await reportsApi.create({
        reported_profile_id: profile.id,
        reason: reportReason,
        description: reportDescription,
        category: reportCategory,
        captcha_token: reportCaptchaToken,
      });
      setShowReportModal(false);
      setReportReason("");
      setReportDescription("");
      setReportCategory("other");
      setReportCaptchaToken(null);
      toast.success("Report submitted");
    } catch {
      toast.error("Failed to submit report");
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !audioRef.current.muted;
    setMuted(audioRef.current.muted);
  };

  const handleEnter = useCallback(() => {
    if (entering || entered) return;
    setEntering(true);
    if (audioRef.current) {
      audioRef.current.muted = false;
      audioRef.current.play().catch(() => {});
      setMuted(false);
    }
    setTimeout(() => setEntered(true), 700);
  }, [entering, entered]);

  useEffect(() => {
    if (loading || !profile) return;
    if (!hasMedia && !entered) setEntered(true);
  }, [loading, profile, hasMedia, entered]);

  const handleCopyUrl = async () => {
    const url = `${window.location.origin}/@${username}`;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopiedUrl(true);
      toast.success("Link copied!");
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleUnlockLink = async (linkId: string) => {
    const password = linkPasswords[linkId];
    if (!password?.trim()) return;
    setUnlockingLinkId(linkId);
    try {
      const result = await linksApi.unlock(linkId, password);
      if (result?.url) {
        window.open(result.url, "_blank");
      }
      setLinkPasswords((prev) => ({ ...prev, [linkId]: "" }));
      toast.success("Link unlocked");
    } catch {
      toast.error("Incorrect password");
    } finally {
      setUnlockingLinkId(null);
    }
  };

  const getBackgroundStyle = (): React.CSSProperties => {
    const t = (config?.background_type || "").toLowerCase();
    switch (t) {
      case "solid":
        return { backgroundColor: config.background_url || "#050505" };
      case "gradient":
        return {
          background: `linear-gradient(${config.background_blur || 135}deg, ${config.primary_color || "#050505"}, ${config.secondary_color || "#1a1a1a"})`,
        };
      case "image":
        return {
          backgroundImage: `url(${config.background_url})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        };
      case "video":
        return {};
      default:
        return { backgroundColor: "#050505" };
    }
  };

  const getLinkSize = () => {
    const size = config?.link_size || "normal";
    switch (size) {
      case "small":
        return "py-2.5 text-[13px]";
      case "large":
        return "py-4.5 text-[15px]";
      default:
        return "py-3.5 text-[14px]";
    }
  };

  const getLinkGap = () => {
    const gap = config?.link_gap || "normal";
    switch (gap) {
      case "compact":
        return "space-y-1.5";
      case "relaxed":
        return "space-y-4";
      default:
        return "space-y-2.5";
    }
  };

  const getAnimationClass = (animation?: string) => {
    switch (animation) {
      case "bounce":
        return "animate-bounce";
      case "glow":
        return "animate-glow-pulse";
      case "pulse":
        return "animate-pulse";
      case "float":
        return "animate-float";
      default:
        return "";
    }
  };

  const getVisibleLinks = () => {
    const now = new Date();
    return links.filter((l: any) => {
      if (l.scheduled_start && new Date(l.scheduled_start) > now) return false;
      if (l.scheduled_end && new Date(l.scheduled_end) < now) return false;
      return true;
    });
  };

  const getGroupedLinks = () => {
    const visibleLinks = getVisibleLinks();
    const groups = new Map<string, any[]>();
    const ungrouped: any[] = [];

    visibleLinks.forEach((l: any) => {
      if (l.group_id) {
        if (!groups.has(l.group_id)) groups.set(l.group_id, []);
        groups.get(l.group_id)!.push(l);
      } else {
        ungrouped.push(l);
      }
    });

    return { groups, ungrouped };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-white/[0.06]" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-violet-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white/20 to-white/[0.03]">404</h1>
          <div className="absolute inset-0 blur-3xl bg-violet-500/10" />
        </div>
        <p className="text-[#52525b] text-[13px]">Profile not found</p>
        <Link
          to="/"
          className="px-5 py-2.5 bg-white/[0.06] backdrop-blur-sm text-white rounded-xl text-[13px] font-medium hover:bg-white/[0.1] border border-white/[0.06] transition-all"
        >
          Go Home
        </Link>
      </div>
    );
  }

  if (isBlocked) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <Ban size={28} className="text-red-400/60" />
        </div>
        <h1 className="text-xl font-bold text-white">Profile Blocked</h1>
        <p className="text-[#52525b] text-[13px]">This profile is not available.</p>
        <Link
          to="/"
          className="px-5 py-2.5 bg-white/[0.06] backdrop-blur-sm text-white rounded-xl text-[13px] font-medium hover:bg-white/[0.1] border border-white/[0.06] transition-all"
        >
          Go Home
        </Link>
      </div>
    );
  }

  if (isPrivateBlocked) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-6 px-4">
        <div className="relative w-20 h-20 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center backdrop-blur-sm">
          <Lock size={28} className="text-[#52525b]" />
          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/[0.03] to-transparent" />
        </div>
        <div className="text-center">
          <h1 className="text-[18px] font-bold text-white mb-1">Private Profile</h1>
          <p className="text-[#52525b] text-[13px]">This profile requires a passcode to view.</p>
        </div>
        <div className="max-w-xs w-full space-y-3">
          <div className="relative">
            <input
              type="password"
              value={passcodeInput}
              onChange={(e) => setPasscodeInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handlePasscode()}
              placeholder="Enter passcode"
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm px-4 py-3 text-[13px] text-white text-center placeholder:text-[#3f3f46] outline-none transition-all focus:border-white/[0.15] focus:bg-white/[0.05]"
            />
          </div>
          {passcodeError && (
            <p className="text-[12px] text-red-400 text-center">{passcodeError}</p>
          )}
          <button
            onClick={handlePasscode}
            className="w-full px-4 py-3 rounded-xl bg-white text-black text-[13px] font-bold hover:bg-white/90 active:scale-[0.98] transition-all cursor-pointer"
          >
            Continue
          </button>
        </div>
        <Link
          to="/"
          className="text-[12px] text-[#52525b] hover:text-white transition-colors"
        >
          Go Home
        </Link>
      </div>
    );
  }

  const bgType = (config?.background_type || "").toLowerCase();
  const font = config?.font_family || "Inter";
  const cardWidth = config?.card_width || 420;
  const textAlign = config?.text_alignment || "center";
  const { groups, ungrouped } = getGroupedLinks();
  const primaryColor = config?.primary_color || "#8b5cf6";

  return (
    <div className="min-h-screen relative overflow-hidden" style={getBackgroundStyle()}>
      {config?.custom_css && <style dangerouslySetInnerHTML={{ __html: config.custom_css }} />}

      {config?.enable_custom_cursor && config?.cursor_url && (
        <style
          dangerouslySetInnerHTML={{
            __html: `* { cursor: url(${config.cursor_url}), auto !important; }`,
          }}
        />
      )}

      {bgType === "video" && config?.background_video_url && (
        <video
          src={config.background_video_url}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          style={{
            filter: config.background_blur ? `blur(${config.background_blur}px)` : undefined,
          }}
        />
      )}

      {bgType === "image" && config?.background_url && (
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            backgroundImage: `url(${config.background_url})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: config.background_blur ? `blur(${config.background_blur}px)` : undefined,
            opacity:
              config.background_opacity != null ? config.background_opacity / 100 : 1,
          }}
        />
      )}

      {entered && config?.enable_snow && <SnowEffect />}
      {entered && config?.enable_particles && (
        <ParticleEffect color={config.particle_color || "#8b5cf6"} />
      )}
      {entered && config?.enable_glow && (
        <>
          <div
            className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none opacity-40"
            style={{ backgroundColor: `${config.glow_color || primaryColor}` }}
          />
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] rounded-full blur-[100px] pointer-events-none opacity-20"
            style={{ backgroundColor: `${config.glow_color || primaryColor}` }}
          />
        </>
      )}

      {/* Music */}
      {config?.music_url && <audio ref={audioRef} src={config.music_url} loop />}
      {entered && config?.music_url && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 }}
          onClick={toggleMute}
          className="fixed top-5 right-5 z-50 p-2.5 bg-black/30 backdrop-blur-xl rounded-full border border-white/[0.08] text-[#a1a1aa] hover:text-white hover:border-white/[0.15] hover:bg-black/50 transition-all duration-300 cursor-pointer"
        >
          {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </motion.button>
      )}

      {/* Music Controls */}
      {entered && config?.show_music_controls && config?.music_url && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-1.5 p-1.5 bg-black/30 backdrop-blur-xl rounded-full border border-white/[0.08]"
        >
          {[
            { icon: SkipBack, label: "Previous" },
            { icon: SkipForward, label: "Next" },
            { icon: Shuffle, label: "Shuffle" },
          ].map(({ icon: Icon, label }) => (
            <button
              key={label}
              className="p-2 text-[#a1a1aa] hover:text-white transition-colors cursor-pointer rounded-full hover:bg-white/[0.06]"
              title={label}
            >
              <Icon size={14} />
            </button>
          ))}
        </motion.div>
      )}

      {/* Report / Block buttons */}
      {entered && user && user.id !== profile.user_id && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.2 }}
          className="fixed top-5 left-5 z-50 flex items-center gap-1.5 p-1 bg-black/30 backdrop-blur-xl rounded-full border border-white/[0.08]"
        >
          <button
            onClick={() => setShowReportModal(true)}
            className="p-2 text-[#52525b] hover:text-white rounded-full hover:bg-white/[0.06] transition-all cursor-pointer"
            title="Report"
          >
            <Flag size={13} />
          </button>
          <button
            onClick={handleBlock}
            className="p-2 text-[#52525b] hover:text-red-400 rounded-full hover:bg-red-400/[0.06] transition-all cursor-pointer"
            title="Block"
          >
            <Ban size={13} />
          </button>
        </motion.div>
      )}

      {/* Enter Screen */}
      <AnimatePresence>
        {!entered && hasMedia && (
          <motion.div
            key="enter"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-40 flex items-center justify-center cursor-pointer select-none"
            onClick={handleEnter}
          >
            <div className="absolute inset-0 bg-black/80" style={{ backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={entering ? { opacity: 0, scale: 1.05 } : { opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 flex flex-col items-center gap-6"
            >
              {profile.avatar_url && (
                <div className="relative w-24 h-24">
                  <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                  <div className="absolute inset-0 rounded-full" style={{ boxShadow: `0 0 60px ${primaryColor}40` }} />
                </div>
              )}
              <div className="text-center">
                <p className="text-[13px] tracking-[0.2em] text-white/30 uppercase" style={{ fontFamily: font }}>
                  {profile.display_name || profile.username}
                </p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                  className="text-[11px] tracking-[0.3em] text-white/20 mt-3"
                  style={{ fontFamily: font }}
                >
                  click to enter
                </motion.p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <AnimatePresence>
        {entered && (
          <motion.div
            key="main"
            initial={
              config?.page_transition === "slide"
                ? { opacity: 0, y: 30 }
                : config?.page_transition === "zoom"
                ? { opacity: 0, scale: 0.96 }
                : { opacity: 0, y: 15 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 flex flex-col items-center min-h-screen px-4 py-20"
          >
            <div
              className="flex flex-col items-center w-full"
              style={{
                maxWidth: `${cardWidth}px`,
                textAlign: textAlign as any,
              }}
            >
              {/* Avatar */}
              {config?.show_avatar !== false && profile.avatar_url && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="mb-6"
                >
                  <div className="relative">
                    <div
                      className="absolute -inset-1 rounded-full opacity-60 animate-[spin_6s_linear_infinite]"
                      style={{
                        background: `conic-gradient(from 0deg, ${primaryColor}, transparent 60%, ${primaryColor})`,
                      }}
                    />
                    <div className="absolute -inset-[3px] rounded-full bg-[#050505]" />
                    <img
                      src={profile.avatar_url}
                      alt=""
                      className="relative w-[100px] h-[100px] rounded-full object-cover ring-2 ring-white/[0.06]"
                    />
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        boxShadow: `0 0 50px ${primaryColor}25, 0 0 100px ${primaryColor}10`,
                      }}
                    />
                  </div>
                </motion.div>
              )}

              {/* Name + Badges + Verified */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.5 }}
                className={cn(
                  "items-center gap-2 flex flex-wrap justify-center",
                  getAnimationClass(config?.display_name_animation)
                )}
              >
                <h1
                  className="text-[28px] font-extrabold text-white leading-tight tracking-tight"
                  style={{
                    color: config?.text_color || "#fff",
                    fontFamily: font,
                    textShadow: `0 0 40px ${primaryColor}15`,
                  }}
                >
                  {profile.display_name || profile.username}
                </h1>
                {profile.verified === 1 && (
                  <span className="inline-flex items-center justify-center w-[20px] h-[20px] rounded-full shrink-0" style={{ background: `linear-gradient(135deg, #3b82f6, #6366f1)` }}>
                    <Check size={11} className="text-white" strokeWidth={3} />
                  </span>
                )}
                {badges.length > 0 && config?.show_badges !== false && !config?.hide_badges && (
                  <div className="inline-flex p-[2px] rounded-2xl shrink-0" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center gap-[5px] px-2 py-1 rounded-[14px] bg-black/40 backdrop-blur-sm">
                      {badges.map((b: any) => (
                        <div key={b.badge_id} className="relative group/badge cursor-pointer">
                          <div
                            className="w-[24px] h-[24px] rounded-full flex items-center justify-center text-[13px] leading-none transition-all duration-300 hover:scale-125 hover:rotate-6"
                            style={{
                              background: `linear-gradient(135deg, ${b.color || "#8b5cf6"}35, ${b.color || "#8b5cf6"}10)`,
                              border: `1px solid ${b.color || "#8b5cf6"}40`,
                              boxShadow: `0 0 12px ${b.color || "#8b5cf6"}20`,
                            }}
                          >
                            {b.icon}
                          </div>
                          <span
                            className="absolute -bottom-9 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-black/95 text-white text-[10px] font-medium whitespace-nowrap opacity-0 group-hover/badge:opacity-100 transition-all duration-200 pointer-events-none z-50 backdrop-blur-sm"
                            style={{ border: `1px solid ${b.color || "#8b5cf6"}30` }}
                          >
                            {b.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Username */}
              {!config?.hide_username && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className={cn(
                    "text-[13px] text-[#52525b] mt-1",
                    getAnimationClass(config?.username_animation)
                  )}
                  style={{ fontFamily: font }}
                >
                  @{profile.username}
                </motion.p>
              )}

              {/* Bio */}
              {profile.bio && profile.bio.trim() && !/^\d+$/.test(profile.bio.trim()) && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className={cn(
                    "text-[13px] text-[#71717a] mt-3 max-w-[320px] leading-relaxed",
                    textAlign === "center" ? "text-center" : textAlign === "right" ? "text-right" : "text-left",
                    getAnimationClass(config?.bio_animation)
                  )}
                  style={{ fontFamily: font }}
                >
                  {profile.bio}
                </motion.p>
              )}

              {/* Custom Status */}
              {profile.custom_status && profile.custom_status.trim() && !/^\d+$/.test(profile.custom_status.trim()) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.32 }}
                  className="mt-3"
                >
                  <span
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-semibold backdrop-blur-sm"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}12, ${primaryColor}06)`,
                      color: primaryColor,
                      border: `1px solid ${primaryColor}20`,
                      boxShadow: `0 0 20px ${primaryColor}08`,
                      fontFamily: font,
                    }}
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
                    </span>
                    {profile.custom_status}
                  </span>
                </motion.div>
              )}

              {/* Tags */}
              {tags.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.34 }}
                  className="flex flex-wrap items-center gap-1.5 mt-3 justify-center"
                >
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full text-[10px] font-semibold text-[#71717a] bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.1] transition-all cursor-default"
                    >
                      #{tag}
                    </span>
                  ))}
                </motion.div>
              )}

              {/* Social Icons */}
              {socials.length > 0 && !config?.hide_social_links && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.36 }}
                  className="flex items-center gap-2.5 mt-6"
                >
                  {socials.map((social: any) => {
                    const platform = SOCIAL_PLATFORMS[social.platform as SocialPlatform];
                    const color = social.color || platform?.color || "#6b7280";
                    const svgHtml = SOCIAL_SVGS[social.platform as SocialPlatform];
                    return (
                      <a
                        key={social.id || social.platform}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/social w-11 h-11 flex items-center justify-center rounded-full transition-all duration-300 hover:scale-110"
                        style={{
                          background: `linear-gradient(135deg, ${color}12, ${color}06)`,
                          color,
                          border: `1px solid ${color}18`,
                        }}
                        title={platform?.name || social.platform}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = `0 0 24px ${color}20, 0 0 48px ${color}08`;
                          e.currentTarget.style.borderColor = `${color}35`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = "none";
                          e.currentTarget.style.borderColor = `${color}18`;
                        }}
                      >
                        {svgHtml ? (
                          <span
                            className="w-[18px] h-[18px] transition-transform duration-300 group-hover/social:scale-110"
                            dangerouslySetInnerHTML={{ __html: svgHtml }}
                          />
                        ) : (
                          <span className="text-sm font-bold">
                            {(platform?.name || "?")[0]}
                          </span>
                        )}
                      </a>
                    );
                  })}
                </motion.div>
              )}

              {/* Links */}
              {getVisibleLinks().length > 0 && (
                <div className={cn("w-full mt-7", getLinkGap())}>
                  {ungrouped.map((link: any, i: number) => (
                    <LinkComponent
                      key={link.id}
                      link={link}
                      font={font}
                      config={config}
                      index={i}
                      linkSize={getLinkSize()}
                      linkPasswords={linkPasswords}
                      setLinkPasswords={setLinkPasswords}
                      onUnlock={handleUnlockLink}
                      unlockingLinkId={unlockingLinkId}
                      primaryColor={primaryColor}
                    />
                  ))}

                  {Array.from(groups.entries()).map(([groupId, groupLinks]) => {
                    const group = linkGroups.find((g) => g.id === groupId);
                    return (
                      <div key={groupId} className="mt-5 first:mt-0">
                        {group && (
                          <div className="flex items-center gap-4 mb-3">
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
                            <span
                              className="text-[10px] font-bold text-[#52525b] uppercase tracking-[0.15em] shrink-0"
                              style={{ fontFamily: font }}
                            >
                              {group.name}
                            </span>
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
                          </div>
                        )}
                        <div className={getLinkGap()}>
                          {groupLinks.map((link: any, i: number) => (
                            <LinkComponent
                              key={link.id}
                              link={link}
                              font={font}
                              config={config}
                              index={i}
                              linkSize={getLinkSize()}
                              linkPasswords={linkPasswords}
                              setLinkPasswords={setLinkPasswords}
                              onUnlock={handleUnlockLink}
                              unlockingLinkId={unlockingLinkId}
                              primaryColor={primaryColor}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Audio Visualizer */}
              {entered && config?.show_visualizer && config?.music_url && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-5 flex justify-center"
                >
                  <AudioVisualizer
                    audioRef={audioRef}
                    color={config?.visualizer_color || primaryColor}
                  />
                </motion.div>
              )}

              {/* Discord Status Card */}
              {config?.show_discord_status && config?.discord_user_id && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55, duration: 0.5 }}
                  className="w-full mt-5"
                >
                  <DiscordStatusCard
                    userId={config.discord_user_id}
                    showActivity={!!config?.show_discord_rpc}
                    fontFamily={font}
                    primaryColor={primaryColor}
                  />
                </motion.div>
              )}

              {/* Widgets */}
              {widgets.length > 0 && (
                <div className="w-full mt-4 space-y-3">
                  {widgets.map((widget: any, i: number) => (
                    <motion.div
                      key={widget.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + i * 0.06, duration: 0.5 }}
                    >
                      <WidgetCard widget={widget} fontFamily={font} />
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Custom HTML */}
              {config?.custom_html && (
                <div className="w-full mt-4">
                  <div dangerouslySetInnerHTML={{ __html: config.custom_html }} />
                </div>
              )}

              {/* Footer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-12 mb-4"
              >
                <p className="text-[10px] text-[#27272a] tracking-wide">
                  made with <span className="text-[#3f3f46]">kio.lol</span>
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report Modal */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
              onClick={() => setShowReportModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0a0a0a]/95 backdrop-blur-xl p-6 space-y-4 z-10"
            >
              <div>
                <h3 className="text-[16px] font-bold text-white">Report Profile</h3>
                <p className="text-[12px] text-[#3f3f46] mt-1">
                  Report @{profile.username} for a violation.
                </p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#52525b] uppercase tracking-[0.15em] mb-2 block">
                  Category
                </label>
                <select
                  value={reportCategory}
                  onChange={(e) => setReportCategory(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-[13px] text-white outline-none cursor-pointer appearance-none transition-all focus:border-white/[0.15]"
                >
                  <option value="spam">Spam</option>
                  <option value="inappropriate">Inappropriate Content</option>
                  <option value="harassment">Harassment</option>
                  <option value="impersonation">Impersonation</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#52525b] uppercase tracking-[0.15em] mb-2 block">
                  Reason
                </label>
                <input
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Brief reason..."
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-[13px] text-white placeholder:text-[#3f3f46] outline-none transition-all focus:border-white/[0.15]"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#52525b] uppercase tracking-[0.15em] mb-2 block">
                  Description (optional)
                </label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  rows={3}
                  placeholder="Additional details..."
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-[13px] text-white placeholder:text-[#3f3f46] outline-none transition-all focus:border-white/[0.15] resize-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#52525b] uppercase tracking-[0.15em] mb-2 block">
                  Verification
                </label>
                <Captcha
                  onVerified={(token) => setReportCaptchaToken(token)}
                  onError={() => setReportCaptchaToken(null)}
                />
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <button
                  onClick={() => {
                    setShowReportModal(false);
                    setReportCaptchaToken(null);
                  }}
                  className="px-4 py-2.5 rounded-xl text-[13px] font-medium text-[#52525b] hover:text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReport}
                  disabled={!reportReason.trim() || !reportCaptchaToken}
                  className="px-5 py-2.5 rounded-xl bg-red-500 text-white text-[13px] font-bold hover:bg-red-600 active:scale-[0.98] transition-all disabled:opacity-40 cursor-pointer"
                >
                  Submit Report
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <ShareModal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        username={username || ""}
        profileId={profile.id}
        displayName={profile.display_name}
      />
    </div>
  );
}

function LinkComponent({
  link,
  font,
  config,
  index,
  linkSize,
  linkPasswords,
  setLinkPasswords,
  onUnlock,
  unlockingLinkId,
  primaryColor,
}: {
  link: any;
  font: string;
  config: any;
  index: number;
  linkSize: string;
  linkPasswords: Record<string, string>;
  setLinkPasswords: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onUnlock: (linkId: string) => void;
  unlockingLinkId: string | null;
  primaryColor: string;
}) {
  const isPasswordProtected = link.requires_password || link.visibility === "password";
  const isExpired = link.scheduled_end && new Date(link.scheduled_end) < new Date();
  const [hovered, setHovered] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (isPasswordProtected) {
      e.preventDefault();
      if (!linkPasswords[link.id]?.trim()) return;
      onUnlock(link.id);
    } else {
      linksApi.trackClick(link.id).catch(() => {});
    }
  };

  const borderRadius = config?.link_border_radius ?? 16;
  const linkColor = link.color || primaryColor;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: 0.4 + index * 0.06,
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1],
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <a
        href={isPasswordProtected ? "#" : link.url}
        target={isPasswordProtected ? undefined : (link.target || "_blank")}
        rel={isPasswordProtected ? undefined : "noopener noreferrer"}
        onClick={handleClick}
        className={cn(
          "group w-full flex items-center gap-3.5 px-5 font-medium transition-all duration-300",
          linkSize,
          isExpired && "opacity-50",
        )}
        style={{
          fontFamily: font,
          background: hovered
            ? (link.background_color || (link.color ? `${link.color}18` : "rgba(255,255,255,0.06)"))
            : (link.background_color || (link.color ? `${link.color}0c` : "rgba(255,255,255,0.03)")),
          border: `1px solid ${
            hovered
              ? (link.color ? `${link.color}30` : "rgba(255,255,255,0.1)")
              : (link.color ? `${link.color}15` : "rgba(255,255,255,0.05)")
          }`,
          borderRadius: `${borderRadius}px`,
          transform: hovered ? "scale(1.02) translateY(-1px)" : "scale(1) translateY(0)",
          boxShadow: hovered
            ? (link.color ? `0 8px 32px ${link.color}10, 0 0 0 1px ${link.color}15` : "0 8px 32px rgba(0,0,0,0.2)")
            : "none",
        }}
      >
        <span className="flex items-center gap-3 min-w-0 flex-1">
          {isPasswordProtected && (
            <Lock size={13} className="text-[#52525b] shrink-0" />
          )}
          {link.thumbnail_url ? (
            <img
              src={link.thumbnail_url}
              alt=""
              className="w-7 h-7 rounded-lg object-cover shrink-0"
            />
          ) : link.icon ? (
            <span
              className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0 transition-transform duration-300 group-hover:scale-110"
              style={{
                backgroundColor: link.color ? `${link.color}18` : "rgba(255,255,255,0.06)",
              }}
            >
              {link.icon}
            </span>
          ) : link.color ? (
            <span
              className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-[11px] font-bold text-white/80"
              style={{ backgroundColor: `${link.color}20` }}
            >
              {link.title?.[0]?.toUpperCase()}
            </span>
          ) : null}
          <span className="truncate text-white/90 group-hover:text-white transition-colors">{link.title}</span>
          {link.description && (
            <span className="text-[12px] text-[#52525b] truncate hidden sm:inline">
              {link.description}
            </span>
          )}
          {isExpired && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-400/[0.1] text-red-400 shrink-0 font-medium">
              Expired
            </span>
          )}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-[#3f3f46] group-hover:text-[#71717a] shrink-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        >
          <path d="M7 17L17 7M17 7H7M17 7v10" />
        </svg>
      </a>
      {isPasswordProtected && (
        <div className="mt-2 flex gap-2 px-1">
          <input
            type="password"
            value={linkPasswords[link.id] || ""}
            onChange={(e) =>
              setLinkPasswords((prev) => ({ ...prev, [link.id]: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") onUnlock(link.id);
            }}
            placeholder="Enter password to unlock"
            className="flex-1 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[11px] text-white placeholder:text-[#3f3f46] outline-none transition-all focus:border-white/[0.12]"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUnlock(link.id);
            }}
            disabled={unlockingLinkId === link.id || !linkPasswords[link.id]?.trim()}
            className="px-3 py-2 rounded-lg bg-white text-black text-[11px] font-bold hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-40 cursor-pointer shrink-0"
          >
            {unlockingLinkId === link.id ? "..." : "Go"}
          </button>
        </div>
      )}
    </motion.div>
  );
}

function DiscordStatusCard({
  userId,
  showActivity,
  fontFamily,
  primaryColor,
}: {
  userId: string;
  showActivity: boolean;
  fontFamily: string;
  primaryColor: string;
}) {
  const [status, setStatus] = useState<any>(null);
  const [elapsed, setElapsed] = useState(0);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    const fetch_ = () => {
      fetch(`/api/discord/${userId}`)
        .then((r) => r.json())
        .then((d) => {
          if (alive && d?.data) setStatus(d.data);
        })
        .catch(() => {});
    };
    fetch_();
    const iv = setInterval(fetch_, 30000);
    return () => {
      alive = false;
      clearInterval(iv);
    };
  }, [userId]);

  useEffect(() => {
    if (!status || !showActivity) return;
    const spotify = status.activities?.find((a: any) => a.type === 2);
    if (!spotify?.timestamps?.start) return;
    const tick = () => setElapsed(Date.now() - spotify.timestamps.start);
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [status, showActivity]);

  if (!status) return null;

  const user = status.discord_user;
  const avatarUrl = user?.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
    : null;
  const statusColor =
    status.discord_status === "online"
      ? "#23a55a"
      : status.discord_status === "idle"
      ? "#f0b232"
      : status.discord_status === "dnd"
      ? "#f23f43"
      : "#80848e";
  const statusLabel =
    status.discord_status === "online"
      ? "Online"
      : status.discord_status === "idle"
      ? "Idle"
      : status.discord_status === "dnd"
      ? "Do Not Disturb"
      : "Offline";
  const spotify = showActivity ? status.activities?.find((a: any) => a.type === 2) : null;

  const getDiscordImage = (url?: string, appId?: string) => {
    if (!url) return null;
    if (url.startsWith("mp:external/")) {
      const external = url.replace("mp:external/", "");
      const httpsMatch = external.match(/https:\/\/(.+)/);
      if (httpsMatch) return `https://${httpsMatch[1]}`;
    }
    if (url.startsWith("https:") || url.startsWith("http:")) return url;
    if (appId) return `https://cdn.discordapp.com/app-assets/${appId}/${url}.png`;
    return null;
  };

  const albumArt = spotify
    ? getDiscordImage(spotify.assets?.large_image, spotify.application_id)
    : null;
  const song = spotify?.details || spotify?.name || "";
  const artist = spotify?.state || "";
  const total =
    spotify?.timestamps?.end && spotify?.timestamps?.start
      ? spotify.timestamps.end - spotify.timestamps.start
      : 0;

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  };

  const activity = !spotify
    ? status.activities?.find((a: any) => a.type !== 4 && a.type !== 2)
    : null;

  return (
    <div
      className="w-full rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: hovered
          ? "rgba(255,255,255,0.05)"
          : "rgba(255,255,255,0.03)",
        border: `1px solid rgba(255,255,255,${hovered ? "0.08" : "0.05"})`,
        boxShadow: hovered ? "0 8px 32px rgba(0,0,0,0.2)" : "none",
        fontFamily,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Main section */}
      <div className="flex items-center gap-3.5 p-4">
        {/* Avatar with status */}
        <div className="relative shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="w-12 h-12 rounded-xl object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-[#5865F2]/10 flex items-center justify-center border border-[#5865F2]/20">
              <span className="text-base font-bold text-[#5865F2]">
                {user?.username?.[0]?.toUpperCase() || "?"}
              </span>
            </div>
          )}
          {/* Status indicator */}
          <div
            className="absolute -bottom-[3px] -right-[3px] w-[15px] h-[15px] rounded-full border-[3px]"
            style={{
              backgroundColor: statusColor,
              borderColor: "#050505",
              boxShadow: `0 0 8px ${statusColor}40`,
            }}
          />
        </div>

        {/* User info */}
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-white/90 leading-tight truncate">
            {user?.global_name || user?.username || "Unknown"}
          </p>
          <p className="text-[11px] text-[#52525b] leading-tight truncate mt-0.5">
            {user?.username}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span
              className="w-[5px] h-[5px] rounded-full shrink-0"
              style={{ backgroundColor: statusColor }}
            />
            <span className="text-[11px] font-medium truncate" style={{ color: statusColor }}>
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Album art */}
        {spotify && albumArt && (
          <div className="relative shrink-0">
            <img
              src={albumArt}
              alt=""
              className="w-11 h-11 rounded-xl object-cover"
            />
            <div
              className="absolute inset-0 rounded-xl"
              style={{ boxShadow: `0 4px 16px rgba(0,0,0,0.4)` }}
            />
          </div>
        )}
      </div>

      {/* Spotify Now Playing */}
      {spotify && song && (
        <div className="px-4 pb-3.5 -mt-0.5">
          <div className="flex items-center gap-2 mb-2">
            <svg viewBox="0 0 24 24" fill="#1DB954" className="w-3.5 h-3.5 shrink-0">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-[#1DB954] truncate leading-tight">
                {song}
              </p>
              {artist && (
                <p className="text-[10px] text-[#52525b] truncate leading-tight mt-0.5">
                  {artist}
                </p>
              )}
            </div>
          </div>
          {total > 0 && (
            <div className="flex items-center gap-2.5">
              <span className="text-[9px] text-[#52525b] tabular-nums w-8 text-right">
                {formatTime(elapsed)}
              </span>
              <div className="flex-1 h-[3px] rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#1DB954]"
                  style={{
                    width: `${Math.min((elapsed / total) * 100, 100)}%`,
                    transition: "width 1s linear",
                  }}
                />
              </div>
              <span className="text-[9px] text-[#52525b] tabular-nums w-8">
                {formatTime(total)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Non-Spotify Activity */}
      {!spotify && activity && (
        <div className="px-4 pb-3.5 -mt-0.5">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-white/[0.06] flex items-center justify-center shrink-0">
              <span className="text-[9px] text-[#52525b] font-bold">
                {activity.name?.[0]?.toUpperCase() || "?"}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-white/70 truncate leading-tight">
                {activity.name}
              </p>
              {activity.state && (
                <p className="text-[10px] text-[#52525b] truncate leading-tight mt-0.5">
                  {activity.state}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WidgetCard({ widget, fontFamily }: { widget: any; fontFamily: string }) {
  const { type, config: wc } = widget;
  const [hovered, setHovered] = useState(false);

  const baseStyle: React.CSSProperties = {
    background: hovered ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.03)",
    border: `1px solid rgba(255,255,255,${hovered ? "0.08" : "0.05"})`,
    fontFamily,
    transition: "all 0.3s ease",
  };

  if (type === "youtube" && wc?.channelUrl) {
    return (
      <a
        href={wc.channelUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
        style={baseStyle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="w-9 h-9 rounded-xl bg-[#FF0000]/10 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" fill="#FF0000" className="w-4 h-4">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        </div>
        <span className="text-[13px] font-medium text-white/90">YouTube</span>
        <span className="ml-auto text-[11px] text-[#52525b]">Watch</span>
      </a>
    );
  }
  if (type === "spotify" && wc?.playlistUrl) {
    return (
      <a
        href={wc.playlistUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
        style={baseStyle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="w-9 h-9 rounded-xl bg-[#1DB954]/10 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" fill="#1DB954" className="w-4 h-4">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
        </div>
        <span className="text-[13px] font-medium text-white/90">Spotify</span>
        <span className="ml-auto text-[11px] text-[#52525b]">Listen</span>
      </a>
    );
  }
  if (type === "github" && wc?.username) {
    return (
      <a
        href={`https://github.com/${wc.username}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
        style={baseStyle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
        </div>
        <span className="text-[13px] font-medium text-white/90">GitHub</span>
        <span className="ml-auto text-[11px] text-[#52525b]">@{wc.username}</span>
      </a>
    );
  }
  if (type === "discord" && wc?.userId) {
    return (
      <DiscordStatusCard userId={wc.userId} showActivity={true} fontFamily={fontFamily} primaryColor="#8b5cf6" />
    );
  }
  if (type === "weather" && wc?.city) {
    return (
      <div
        className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl"
        style={baseStyle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="w-9 h-9 rounded-xl bg-[#60a5fa]/10 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" fill="#60a5fa" className="w-4 h-4">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
          </svg>
        </div>
        <span className="text-[13px] font-medium text-white/90">Weather</span>
        <span className="ml-auto text-[11px] text-[#52525b]">{wc.city}</span>
      </div>
    );
  }
  if (type === "custom_text" && (wc?.title || wc?.content)) {
    return (
      <div
        className="w-full px-4 py-3.5 rounded-2xl"
        style={baseStyle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {wc.title && <p className="text-[13px] font-semibold text-white/90 mb-1">{wc.title}</p>}
        {wc.content && (
          <p className="text-[12px] text-[#71717a] leading-relaxed">{wc.content}</p>
        )}
      </div>
    );
  }
  if (type === "projects" && wc?.title) {
    return (
      <a
        href={wc.url || "#"}
        target={wc.url ? "_blank" : undefined}
        rel="noopener noreferrer"
        className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
        style={baseStyle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="w-9 h-9 rounded-xl bg-[#f59e0b]/10 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" fill="#f59e0b" className="w-4 h-4">
            <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-white/90 truncate">{wc.title}</p>
          {wc.description && (
            <p className="text-[11px] text-[#52525b] truncate">{wc.description}</p>
          )}
        </div>
      </a>
    );
  }
  if (type === "about_me" && wc?.content) {
    return (
      <div
        className="w-full px-4 py-3.5 rounded-2xl"
        style={baseStyle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <p className="text-[12px] text-[#71717a] leading-relaxed">{wc.content}</p>
      </div>
    );
  }
  return null;
}
