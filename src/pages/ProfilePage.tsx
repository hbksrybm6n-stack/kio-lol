import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import {
  profileApi,
  configApi,
  linksApi,
  badgesApi,
} from "@/lib/api";
import { SOCIAL_PLATFORMS, type SocialPlatform } from "@/types";
import { SOCIAL_SVGS } from "@/lib/socialIcons";
import { SnowEffect } from "@/components/effects/SnowEffect";
import { ParticleEffect } from "@/components/effects/ParticleEffect";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [widgets, setWidgets] = useState<any[]>([]);
  const [socials, setSocials] = useState<any[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [entered, setEntered] = useState(false);
  const [entering, setEntering] = useState(false);
  const [muted, setMuted] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasMedia = !!(config?.music_url || config?.background_video_url);

  useEffect(() => { if (username) loadProfile(); }, [username]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profileData = await profileApi.getByUsername(username!);
      if (!profileData || profileData.is_banned) { setNotFound(true); return; }
      setProfile(profileData);
      const [configData, socialsData, linksData, badgesData] = await Promise.all([
        configApi.getByProfileId(profileData.id),
        fetch(`/api/socials/profile/${profileData.id}`).then(r => r.json()),
        linksApi.getByProfileId(profileData.id),
        badgesApi.getUserBadges(profileData.id).catch(() => []),
      ]);
      setConfig(configData);
      setWidgets(Array.isArray(configData?.widgets) ? configData.widgets : []);
      setSocials((socialsData || []).filter((s: any) => s.is_active !== false));
      setLinks((linksData || []).filter((l: any) => l.is_active !== false));
      setBadges(badgesData || []);
      profileApi.incrementViews(profileData.id).catch(() => {});
    } catch { setNotFound(true); } finally { setLoading(false); }
  };

  const toggleMute = () => { if (!audioRef.current) return; audioRef.current.muted = !audioRef.current.muted; setMuted(audioRef.current.muted); };

  const handleEnter = useCallback(() => {
    if (entering || entered) return;
    setEntering(true);
    if (audioRef.current) { audioRef.current.muted = false; audioRef.current.play().catch(() => {}); setMuted(false); }
    setTimeout(() => setEntered(true), 700);
  }, [entering, entered]);

  useEffect(() => { if (loading || !profile) return; if (!hasMedia && !entered) setEntered(true); }, [loading, profile, hasMedia, entered]);

  const getBackgroundStyle = (): React.CSSProperties => {
    const t = (config?.background_type || "").toLowerCase();
    switch (t) {
      case "solid": return { backgroundColor: config.background_url || "#050505" };
      case "gradient": return { background: `linear-gradient(${config.background_blur || 135}deg, ${config.primary_color || "#050505"}, ${config.secondary_color || "#1a1a1a"})` };
      case "image": return { backgroundImage: `url(${config.background_url})`, backgroundSize: "cover", backgroundPosition: "center" };
      case "video": return {};
      default: return { backgroundColor: "#050505" };
    }
  };

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><div className="w-7 h-7 border-2 border-white/10 border-t-white rounded-full animate-spin" /></div>;
  if (notFound || !profile) return <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-4"><h1 className="text-5xl font-bold text-white">404</h1><p className="text-[#52525b] text-sm">Profile not found</p><Link to="/" className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm font-medium hover:bg-white/15 transition-colors">Go Home</Link></div>;

  const bgType = (config?.background_type || "").toLowerCase();
  const font = config?.font_family || "Inter";

  return (
    <div className="min-h-screen relative overflow-hidden" style={getBackgroundStyle()}>
      {bgType === "video" && config?.background_video_url && (
        <video src={config.background_video_url} className="absolute inset-0 w-full h-full object-cover" autoPlay loop muted playsInline style={{ filter: config.background_blur ? `blur(${config.background_blur}px)` : undefined }} />
      )}
      {bgType === "image" && config?.background_url && (
        <div className="absolute inset-0 w-full h-full" style={{ backgroundImage: `url(${config.background_url})`, backgroundSize: "cover", backgroundPosition: "center", filter: config.background_blur ? `blur(${config.background_blur}px)` : undefined, opacity: config.background_opacity != null ? config.background_opacity / 100 : 1 }} />
      )}
      {entered && config?.enable_snow && <SnowEffect />}
      {entered && config?.enable_particles && <ParticleEffect color={config.particle_color || "#8b5cf6"} />}
      {entered && config?.enable_glow && <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: `${config.glow_color || "#8b5cf6"}20` }} />}
      {config?.music_url && <audio ref={audioRef} src={config.music_url} loop />}
      {entered && config?.music_url && (
        <button onClick={toggleMute} className="fixed top-4 right-4 z-50 p-2 bg-black/40 backdrop-blur-md rounded-full border border-white/[0.06] text-[#a1a1aa] hover:text-white transition-colors cursor-pointer">
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      )}

      {/* ENTER SCREEN */}
      <AnimatePresence>
        {!entered && hasMedia && (
          <motion.div key="enter" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8, ease: "easeInOut" }} className="fixed inset-0 z-40 flex items-center justify-center cursor-pointer select-none" onClick={handleEnter}>
            <div className="absolute inset-0 bg-black/70" style={{ backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }} />
            <motion.p initial={{ opacity: 0 }} animate={entering ? { opacity: 0 } : { opacity: 1 }} transition={{ duration: 0.5, delay: entering ? 0 : 0.3 }} className="relative z-10 text-sm tracking-[0.15em] text-white/50 hover:text-white/80 transition-colors duration-500" style={{ fontFamily: font }}>click to enter...</motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT */}
      <AnimatePresence>
        {entered && (
          <motion.div key="main" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-16">
            <div className="flex flex-col items-center w-full" style={{ maxWidth: "420px" }}>

              {/* Avatar */}
              {config?.show_avatar !== false && profile.avatar_url && (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="mb-5">
                  <div className="relative">
                    <img src={profile.avatar_url} alt="" className="w-[100px] h-[100px] rounded-full object-cover" style={{ boxShadow: "0 0 60px rgba(0,0,0,0.5)" }} />
                    <div className="absolute inset-0 rounded-full" style={{ boxShadow: `0 0 40px ${config?.primary_color || "#8b5cf6"}30` }} />
                  </div>
                </motion.div>
              )}

              {/* Name + Badges (guns.lol layout) */}
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5 }} className="flex items-center gap-2.5 mt-1">
                <h1 className="text-[26px] font-bold text-white text-center leading-tight" style={{ color: config?.text_color || "#fff", fontFamily: font }}>
                  {profile.display_name || profile.username}
                </h1>
                {badges.length > 0 && config?.show_badges !== false && (
                  <div className="inline-flex p-[2px] rounded-[14px] shrink-0" style={{ background: "rgba(255,255,255,0.12)" }}>
                    <div className="flex items-center gap-[6px] px-1.5 py-1 rounded-[12px] bg-black/50" style={{ boxShadow: "inset 0 0 10px rgba(255,255,255,0.15)" }}>
                      {badges.map((b: any) => (
                        <div key={b.badge_id} className="relative group/badge cursor-pointer">
                          <div
                            className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[12px] leading-none transition-transform duration-200 hover:scale-125"
                            style={{
                              background: `linear-gradient(135deg, ${b.color || "#8b5cf6"}40, ${b.color || "#8b5cf6"}15)`,
                              border: `1px solid ${b.color || "#8b5cf6"}50`,
                              boxShadow: `0 0 8px ${b.color || "#8b5cf6"}25`,
                            }}
                          >
                            {b.icon}
                          </div>
                          <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-black/90 text-white text-[10px] font-medium whitespace-nowrap opacity-0 group-hover/badge:opacity-100 transition-opacity pointer-events-none z-50" style={{ border: `1px solid ${b.color || "#8b5cf6"}30` }}>
                            {b.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Username */}
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-[13px] text-[#52525b] mt-0.5" style={{ fontFamily: font }}>
                @{profile.username}
              </motion.p>

              {/* Bio */}
              {profile.bio && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="text-[13px] text-[#71717a] text-center mt-3 max-w-xs leading-relaxed" style={{ fontFamily: font }}>
                  {profile.bio}
                </motion.p>
              )}

              {/* Social Icons Row */}
              {socials.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex items-center gap-2 mt-5">
                  {socials.map((social: any) => {
                    const platform = SOCIAL_PLATFORMS[social.platform as SocialPlatform];
                    const color = social.color || platform?.color || "#6b7280";
                    const svgHtml = SOCIAL_SVGS[social.platform as SocialPlatform];
                    return (
                      <a key={social.id || social.platform} href={social.url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 hover:scale-110 hover:shadow-lg" style={{ backgroundColor: `${color}15`, color, boxShadow: `0 0 0 1px ${color}20` }} title={platform?.name || social.platform}>
                        {svgHtml ? <span className="w-[18px] h-[18px]" dangerouslySetInnerHTML={{ __html: svgHtml }} /> : <span className="text-sm font-bold">{(platform?.name || "?")[0]}</span>}
                      </a>
                    );
                  })}
                </motion.div>
              )}

              {/* Links */}
              {links.length > 0 && (
                <div className="w-full mt-6 space-y-2.5">
                  {links.map((link: any, i: number) => (
                    <motion.a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      className="group w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-[14px] font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                      style={{ fontFamily: font, background: link.color ? `${link.color}12` : "rgba(255,255,255,0.04)", border: `1px solid ${link.color ? `${link.color}20` : "rgba(255,255,255,0.06)"}` }}>
                      <span className="flex items-center gap-3 min-w-0 flex-1">
                        {link.icon ? (
                          <span className="w-6 h-6 rounded-lg flex items-center justify-center text-sm shrink-0" style={{ backgroundColor: link.color ? `${link.color}25` : "rgba(255,255,255,0.08)" }}>{link.icon}</span>
                        ) : link.color ? (
                          <span className="w-6 h-6 rounded-lg shrink-0 flex items-center justify-center text-[11px] font-bold text-white" style={{ backgroundColor: `${link.color}30` }}>{link.title?.[0]?.toUpperCase()}</span>
                        ) : null}
                        <span className="truncate text-white">{link.title}</span>
                        {link.description && <span className="text-[12px] text-[#52525b] truncate hidden sm:inline">{link.description}</span>}
                      </span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#3f3f46] group-hover:text-[#71717a] shrink-0 transition-colors"><path d="M7 17L17 7M17 7H7M17 7v10" /></svg>
                    </motion.a>
                  ))}
                </div>
              )}

              {/* Discord Status Card */}
              {config?.show_discord_status && config?.discord_user_id && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.4 }} className="w-full mt-4">
                  <DiscordStatusCard userId={config.discord_user_id} showActivity={!!config?.show_discord_rpc} fontFamily={font} />
                </motion.div>
              )}

              {/* Widgets */}
              {widgets.length > 0 && (
                <div className="w-full mt-3 space-y-2.5">
                  {widgets.map((widget: any, i: number) => (
                    <motion.div key={widget.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 + i * 0.06, duration: 0.4 }}>
                      <WidgetCard widget={widget} fontFamily={font} />
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Views */}
              {config?.show_views && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="flex items-center gap-1.5 mt-8 text-[11px] text-[#3f3f46]" style={{ fontFamily: font }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  <span>{(profile.view_count || 0).toLocaleString()} views</span>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DiscordStatusCard({ userId, showActivity, fontFamily }: { userId: string; showActivity: boolean; fontFamily: string }) {
  const [status, setStatus] = useState<any>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    const fetch_ = () => { fetch(`/api/discord/${userId}`).then(r => r.json()).then(d => { if (alive && d?.data) setStatus(d.data); }).catch(() => {}); };
    fetch_();
    const iv = setInterval(fetch_, 30000);
    return () => { alive = false; clearInterval(iv); };
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
  const avatarUrl = user?.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128` : null;
  const statusColor = status.discord_status === "online" ? "#23a55a" : status.discord_status === "idle" ? "#f0b232" : status.discord_status === "dnd" ? "#f23f43" : "#80848e";
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

  const albumArt = spotify ? getDiscordImage(spotify.assets?.large_image, spotify.application_id) : null;
  const song = spotify?.details || spotify?.name || "";
  const artist = spotify?.state || "";
  const total = spotify?.timestamps?.end && spotify?.timestamps?.start
    ? spotify.timestamps.end - spotify.timestamps.start
    : 0;

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", fontFamily }}>
      <div className="flex items-center gap-3 p-3">
        <div className="relative shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-12 h-12 rounded-xl object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-[#5865F2]/15 flex items-center justify-center">
              <span className="text-base font-semibold text-[#5865F2]">{user?.username?.[0]?.toUpperCase() || "?"}</span>
            </div>
          )}
          <span className="absolute -bottom-[2px] -right-[2px] w-[13px] h-[13px] rounded-full border-[2.5px] border-[#050505]" style={{ backgroundColor: statusColor }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-white leading-tight truncate">{user?.global_name || user?.username || "Unknown"}</p>
          <p className="text-[11px] text-[#52525b] leading-tight truncate">{user?.username}</p>
          <div className="flex items-center gap-1 mt-[2px]">
            <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ backgroundColor: statusColor }} />
            <span className="text-[11px] capitalize truncate" style={{ color: statusColor }}>
              {status.discord_status === "dnd" ? "Do Not Disturb" : status.discord_status || "Offline"}
            </span>
          </div>
        </div>
      </div>

      {spotify && (
        <div className="px-3 pb-3 -mt-1">
          <div className="flex items-center gap-2.5 rounded-lg bg-white/[0.03] p-2.5">
            {albumArt ? (
              <img src={albumArt} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-[#1DB954]/10 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" fill="#1DB954" className="w-5 h-5"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" /></svg>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-medium text-white leading-tight truncate">{song}</p>
              {artist && <p className="text-[11px] text-[#71717a] leading-tight truncate">{artist}</p>}
              {total > 0 && (
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 h-[2px] rounded-full bg-white/[0.06] overflow-hidden">
                    <div className="h-full rounded-full bg-[#1DB954]" style={{ width: `${Math.min((elapsed / total) * 100, 100)}%`, transition: "width 1s linear" }} />
                  </div>
                  <span className="text-[9px] text-[#52525b] tabular-nums shrink-0">{formatTime(elapsed)}</span>
                </div>
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

  const baseStyle = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", fontFamily };

  if (type === "youtube" && wc?.channelUrl) {
    return (
      <a href={wc.channelUrl} target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" style={baseStyle}>
        <div className="w-9 h-9 rounded-xl bg-[#FF0000]/10 flex items-center justify-center shrink-0"><svg viewBox="0 0 24 24" fill="#FF0000" className="w-4 h-4"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg></div>
        <span className="text-[13px] font-medium text-white">YouTube</span>
        <span className="ml-auto text-[11px] text-[#52525b]">Watch</span>
      </a>
    );
  }
  if (type === "spotify" && wc?.playlistUrl) {
    return (
      <a href={wc.playlistUrl} target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" style={baseStyle}>
        <div className="w-9 h-9 rounded-xl bg-[#1DB954]/10 flex items-center justify-center shrink-0"><svg viewBox="0 0 24 24" fill="#1DB954" className="w-4 h-4"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" /></svg></div>
        <span className="text-[13px] font-medium text-white">Spotify</span>
        <span className="ml-auto text-[11px] text-[#52525b]">Listen</span>
      </a>
    );
  }
  if (type === "github" && wc?.username) {
    return (
      <a href={`https://github.com/${wc.username}`} target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" style={baseStyle}>
        <div className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0"><svg viewBox="0 0 24 24" fill="white" className="w-4 h-4"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg></div>
        <span className="text-[13px] font-medium text-white">GitHub</span>
        <span className="ml-auto text-[11px] text-[#52525b]">@{wc.username}</span>
      </a>
    );
  }
  if (type === "discord" && wc?.userId) {
    return <DiscordStatusCard userId={wc.userId} showActivity={true} fontFamily={fontFamily} />;
  }
  if (type === "weather" && wc?.city) {
    return (
      <div className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl" style={baseStyle}>
        <div className="w-9 h-9 rounded-xl bg-[#60a5fa]/10 flex items-center justify-center shrink-0"><svg viewBox="0 0 24 24" fill="#60a5fa" className="w-4 h-4"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg></div>
        <span className="text-[13px] font-medium text-white">Weather</span>
        <span className="ml-auto text-[11px] text-[#52525b]">{wc.city}</span>
      </div>
    );
  }
  if (type === "custom_text" && (wc?.title || wc?.content)) {
    return (
      <div className="w-full px-4 py-3.5 rounded-2xl" style={baseStyle}>
        {wc.title && <p className="text-[13px] font-medium text-white mb-1">{wc.title}</p>}
        {wc.content && <p className="text-[12px] text-[#71717a] leading-relaxed">{wc.content}</p>}
      </div>
    );
  }
  if (type === "projects" && wc?.title) {
    return (
      <a href={wc.url || "#"} target={wc.url ? "_blank" : undefined} rel="noopener noreferrer" className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" style={baseStyle}>
        <div className="w-9 h-9 rounded-xl bg-[#f59e0b]/10 flex items-center justify-center shrink-0"><svg viewBox="0 0 24 24" fill="#f59e0b" className="w-4 h-4"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" /></svg></div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-white truncate">{wc.title}</p>
          {wc.description && <p className="text-[11px] text-[#52525b] truncate">{wc.description}</p>}
        </div>
      </a>
    );
  }
  if (type === "about_me" && wc?.content) {
    return (
      <div className="w-full px-4 py-3.5 rounded-2xl" style={baseStyle}>
        <p className="text-[12px] text-[#71717a] leading-relaxed">{wc.content}</p>
      </div>
    );
  }
  return null;
}
