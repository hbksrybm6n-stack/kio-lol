import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Check, X as XIcon, Copy, Eye, ExternalLink, Edit3, Palette, Award, Music, Link2, Image as ImageIcon,
  Camera, CheckCircle2, MousePointer2, Type, FolderOpen, BarChart3, ShieldAlert, UserCog,
  Smartphone, Monitor, Sparkles, TrendingUp, MousePointerClick, Users, AlertCircle,
  Share2, Gamepad2, LayoutTemplate, Settings2,
} from "lucide-react";
import { linksApi, socialLinksApi, badgesApi, configApi, analyticsApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { cn, assetUrl } from "@/lib/utils";
import toast from "react-hot-toast";

interface CompletionItem {
  label: string;
  weight: number;
  done: boolean;
  icon: typeof Camera;
  href: string;
}

interface QuickAction {
  label: string;
  desc: string;
  icon: typeof Palette;
  to: string;
  color: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Profile", desc: "Photo, name, bio", icon: UserCog, to: "/dashboard/profile", color: "#8b5cf6" },
  { label: "Appearance", desc: "Theme & fonts", icon: Palette, to: "/dashboard/appearance", color: "#06b6d4" },
  { label: "Links", desc: "Manage links", icon: Link2, to: "/dashboard/links", color: "#22c55e" },
  { label: "Socials", desc: "Connect platforms", icon: Share2, to: "/dashboard/socials", color: "#3b82f6" },
  { label: "Background", desc: "Images & video", icon: ImageIcon, to: "/dashboard/background", color: "#f59e0b" },
  { label: "Music", desc: "Player & playlist", icon: Music, to: "/dashboard/music", color: "#ec4899" },
  { label: "Effects", desc: "Visual effects", icon: Sparkles, to: "/dashboard/effects", color: "#f43f5e" },
  { label: "Badges", desc: "Your badges", icon: Award, to: "/dashboard/badges", color: "#eab308" },
  { label: "Discord", desc: "Presence widget", icon: Gamepad2, to: "/dashboard/discord", color: "#5865F2" },
  { label: "Widgets", desc: "Custom widgets", icon: FolderOpen, to: "/dashboard/widgets", color: "#14b8a6" },
  { label: "Assets", desc: "Files & uploads", icon: FolderOpen, to: "/dashboard/assets", color: "#6366f1" },
  { label: "Cursors", desc: "Custom cursor", icon: MousePointer2, to: "/dashboard/cursors", color: "#a855f7" },
  { label: "Fonts", desc: "Custom fonts", icon: Type, to: "/dashboard/fonts", color: "#10b981" },
  { label: "Templates", desc: "Save & load", icon: LayoutTemplate, to: "/dashboard/templates", color: "#f97316" },
  { label: "Analytics", desc: "Traffic stats", icon: BarChart3, to: "/dashboard/analytics", color: "#0ea5e9" },
  { label: "Settings", desc: "Slug & privacy", icon: Settings2, to: "/dashboard/settings", color: "#71717a" },
  { label: "Account", desc: "Security & email", icon: ShieldAlert, to: "/dashboard/account", color: "#ef4444" },
  { label: "Overview", desc: "Dashboard home", icon: TrendingUp, to: "/dashboard", color: "#22d3ee" },
];

export default function DashboardMyProfile() {
  const { profile } = useAuthStore();
  const [linksCount, setLinksCount] = useState(0);
  const [socialsCount, setSocialsCount] = useState(0);
  const [badgeCount, setBadgeCount] = useState(0);
  const [config, setConfig] = useState<any>(null);
  const [overview, setOverview] = useState<any>(null);
  const [recentLinks, setRecentLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");

  useEffect(() => {
    if (!profile?.id) return;
    loadData();
  }, [profile?.id]);

  const loadData = async () => {
    try {
      const [links, socials, badges, cfg, ov] = await Promise.all([
        linksApi.list().catch(() => []),
        socialLinksApi.list().catch(() => []),
        badgesApi.getUserBadges(profile!.id).catch(() => []),
        configApi.get().catch(() => null),
        analyticsApi.getOverview().catch(() => null),
      ]);
      const linkList = Array.isArray(links) ? links : links?.data || links?.links || [];
      const socialList = Array.isArray(socials) ? socials : socials?.data || socials?.socials || [];
      const badgeList = Array.isArray(badges) ? badges : badges?.badges || [];
      const activeLinks = linkList.filter((l: any) => l.is_active !== false);
      setLinksCount(activeLinks.length);
      setSocialsCount(socialList.length);
      setBadgeCount(badgeList.length);
      setRecentLinks(activeLinks.slice(0, 5));
      setConfig(cfg);
      setOverview(ov);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const items: CompletionItem[] = useMemo(() => [
    { label: "Profile picture", weight: 20, done: !!profile?.avatar_url, icon: Camera, href: "/dashboard/profile" },
    { label: "Banner", weight: 10, done: !!profile?.banner_url, icon: ImageIcon, href: "/dashboard/profile" },
    { label: "Bio", weight: 10, done: !!profile?.bio?.trim(), icon: Edit3, href: "/dashboard/profile" },
    { label: "Links", weight: 20, done: linksCount > 0, icon: Link2, href: "/dashboard/links" },
    { label: "Background", weight: 15, done: !!(config?.background_url || config?.background_video_url), icon: Palette, href: "/dashboard/background" },
    { label: "Music", weight: 10, done: !!(config?.music_url), icon: Music, href: "/dashboard/music" },
    { label: "Socials", weight: 5, done: socialsCount > 0, icon: Eye, href: "/dashboard/socials" },
    { label: "Custom cursor", weight: 5, done: !!(config?.enable_custom_cursor && config?.cursor_url), icon: MousePointer2, href: "/dashboard/cursors" },
    { label: "Custom fonts", weight: 5, done: false, icon: Type, href: "/dashboard/fonts" },
  ], [profile, linksCount, socialsCount, config]);

  const completion = useMemo(
    () => Math.round(items.reduce((sum, item) => sum + (item.done ? item.weight : 0), 0)),
    [items]
  );

  const profileUrl = profile?.username ? `${window.location.origin}/${profile.username}` : "";

  const handleCopy = async () => {
    if (!profileUrl) return;
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      toast.success("Profile URL copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const stats = [
    { label: "Views", value: overview?.totalViews ?? profile?.view_count ?? 0, icon: Eye, color: "#8b5cf6" },
    { label: "Link Clicks", value: overview?.totalClicks ?? 0, icon: MousePointerClick, color: "#22c55e" },
    { label: "Unique Visitors", value: overview?.uniqueVisitors ?? 0, icon: Users, color: "#06b6d4" },
    { label: "Links", value: linksCount, icon: Link2, color: "#f59e0b" },
    { label: "Socials", value: socialsCount, icon: Share2, color: "#3b82f6" },
    { label: "Badges", value: badgeCount, icon: Award, color: "#eab308" },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-7 w-48 rounded-lg bg-[#0a0a0a] animate-shimmer" />
        <div className="h-96 rounded-xl bg-[#0a0a0a] animate-shimmer" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-white">My Profile</h1>
          <p className="text-[13px] text-[#52525b] mt-1">Everything about your profile in one place.</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] p-1">
          <button onClick={() => setDevice("mobile")} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all cursor-pointer", device === "mobile" ? "bg-white/[0.08] text-white" : "text-[#52525b] hover:text-white")}>
            <Smartphone size={13} /> Mobile
          </button>
          <button onClick={() => setDevice("desktop")} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all cursor-pointer", device === "desktop" ? "bg-white/[0.08] text-white" : "text-[#52525b] hover:text-white")}>
            <Monitor size={13} /> Desktop
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-4">
            <div className="flex items-center justify-between mb-2">
              <s.icon size={14} style={{ color: s.color }} />
              <span className="flex items-center gap-0.5 text-[10px] text-[#3f3f46]"><TrendingUp size={10} /></span>
            </div>
            <p className="text-lg font-extrabold text-white leading-none">{s.value}</p>
            <p className="text-[11px] text-[#71717a] mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Live preview */}
          <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-semibold text-white">Profile Preview</h3>
              <Link to={`/${profile?.username}`} target="_blank" className="flex items-center gap-1 text-[11px] text-[#71717a] hover:text-white transition-colors">
                Open live <ExternalLink size={11} />
              </Link>
            </div>
            <div className="flex justify-center">
              <div className={cn("rounded-2xl overflow-hidden border border-white/[0.08] bg-[#050505] relative", device === "mobile" ? "w-[260px] aspect-[9/16]" : "w-full max-w-md aspect-[4/5]")}>
                {config?.background_url && (
                  <img src={assetUrl(config.background_url)} alt="" className="absolute inset-0 w-full h-full object-cover" />
                )}
                {config?.background_video_url && !config?.background_url && (
                  <video src={assetUrl(config.background_video_url)} className="absolute inset-0 w-full h-full object-cover" autoPlay loop muted />
                )}
                <div className="absolute inset-0 bg-black/30" />
                <div className={cn("absolute inset-0 flex flex-col items-center", device === "mobile" ? "px-5 py-8" : "px-8 py-12")}>
                  {config?.show_avatar !== false && (
                    <div className={cn("rounded-full overflow-hidden bg-white/[0.08] border-2 border-white/20", device === "mobile" ? "w-16 h-16" : "w-20 h-20")}>
                      {profile?.avatar_url ? (
                        <img src={assetUrl(profile.avatar_url)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl font-bold text-[#52525b]">
                          {(profile?.display_name ?? profile?.username ?? "?")[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                  )}
                  <p className={cn("text-white font-extrabold mt-3 text-center truncate w-full", device === "mobile" ? "text-[14px]" : "text-lg")}>
                    {profile?.display_name || profile?.username || "Your name"}
                  </p>
                  {config?.show_views !== false && (
                    <p className="text-[10px] text-white/40 mb-3">{profile?.view_count ?? 0} views</p>
                  )}
                  {profile?.bio && (
                    <p className="text-[12px] text-white/70 text-center line-clamp-2 mb-3">{profile.bio}</p>
                  )}
                  <div className="flex flex-col gap-2 w-full mt-1">
                    {recentLinks.map((l: any) => (
                      <div key={l.id} className={cn("rounded-xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-[12px] font-semibold text-white/90", device === "mobile" ? "px-3 py-2" : "px-4 py-2.5")}>
                        {l.title}
                      </div>
                    ))}
                    {recentLinks.length === 0 && (
                      <div className="rounded-xl border border-dashed border-white/10 py-3 text-center text-[11px] text-white/30">
                        No links yet
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-3">
                    {Array.from({ length: Math.min(4, Math.max(socialsCount, 0)) }).map((_, i) => (
                      <span key={i} className="w-6 h-6 rounded-full bg-white/10 border border-white/10" />
                    ))}
                    {socialsCount > 4 && <span className="w-6 h-6 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-[9px] text-white/50">+{socialsCount - 4}</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Completion */}
          <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-semibold text-white">Profile Completion</h3>
              <span className="text-2xl font-extrabold text-white">{completion}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden mb-6">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                initial={{ width: 0 }}
                animate={{ width: `${completion}%` }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {items.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className="flex items-center justify-between px-4 py-2.5 rounded-lg border border-white/[0.04] bg-white/[0.01] hover:border-white/[0.08] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center",
                      item.done ? "bg-emerald-400/[0.12] text-emerald-400" : "bg-white/[0.04] text-[#3f3f46]"
                    )}>
                      {item.done ? <CheckCircle2 size={14} /> : <item.icon size={13} />}
                    </div>
                    <span className="text-[13px] text-white">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-[#3f3f46]">{item.weight}%</span>
                    {item.done ? (
                      <Check size={14} className="text-emerald-400" />
                    ) : (
                      <XIcon size={14} className="text-[#3f3f46]" />
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] overflow-hidden">
            <div className="h-20 bg-gradient-to-r from-violet-500/30 to-fuchsia-500/30 relative">
              {profile?.banner_url && <img src={assetUrl(profile.banner_url)} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="px-5 pb-5 -mt-8 relative">
              <div className="w-16 h-16 rounded-full border-4 border-[#0a0a0a] overflow-hidden bg-white/[0.06] mx-auto">
                {profile?.avatar_url ? (
                  <img src={assetUrl(profile.avatar_url)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg font-bold text-[#52525b]">
                    {(profile?.display_name ?? profile?.username ?? "?")[0].toUpperCase()}
                  </div>
                )}
              </div>
              <p className="text-center text-[14px] font-bold text-white mt-2 truncate">{profile?.display_name || profile?.username}</p>
              <p className="text-center text-[11px] text-[#3f3f46]">@{profile?.username}</p>
              {profile?.bio && (
                <p className="text-center text-[12px] text-[#52525b] mt-2 line-clamp-2">{profile.bio}</p>
              )}
              <div className="flex items-center justify-center gap-4 mt-3 text-[11px] text-[#52525b]">
                <span className="flex items-center gap-1"><Eye size={11} className="opacity-50" /> {profile?.view_count ?? 0} views</span>
                <span className="flex items-center gap-1"><Award size={11} className="opacity-50" /> {badgeCount} badges</span>
              </div>
              {badgeCount > 0 && (
                <div className="flex items-center justify-center gap-1.5 mt-2">
                  {Array.from({ length: Math.min(badgeCount, 5) }).map((_, i) => (
                    <span key={i} className="w-5 h-5 rounded-full bg-white/[0.06] border border-white/[0.06] flex items-center justify-center">
                      <Award size={10} className="text-[#a1a1aa]" />
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-5">
            <h3 className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-3">Profile URL</h3>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[12px] text-[#a1a1aa] truncate">
                {profileUrl || "Set a username"}
              </div>
              <button
                onClick={handleCopy}
                disabled={!profileUrl}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white text-black text-[12px] font-bold hover:bg-white/90 transition-all disabled:opacity-40 cursor-pointer shrink-0"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            {!profile?.username && (
              <p className="flex items-center gap-1 text-[11px] text-amber-400/80 mt-2">
                <AlertCircle size={11} /> Set a username to get a shareable URL
              </p>
            )}
          </div>

          {completion < 100 && (
            <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-5">
              <h3 className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-3">Suggested to complete</h3>
              <div className="space-y-2">
                {items.filter((i) => !i.done).slice(0, 4).map((i) => (
                  <Link key={i.label} to={i.href} className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-white/[0.04] bg-white/[0.01] hover:border-white/[0.08] transition-all">
                    <div className="w-6 h-6 rounded-md bg-white/[0.04] text-[#3f3f46] flex items-center justify-center">
                      <i.icon size={12} />
                    </div>
                    <span className="text-[12px] text-[#a1a1aa]">{i.label}</span>
                    <span className="ml-auto text-[10px] text-[#3f3f46]">+{i.weight}%</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick actions hub */}
      <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[14px] font-semibold text-white">Everything</h3>
          <span className="text-[11px] text-[#3f3f46]">{QUICK_ACTIONS.length} sections</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.to + a.label}
              to={a.to}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-white/[0.04] bg-white/[0.01] hover:border-white/[0.1] hover:bg-white/[0.03] transition-all"
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: a.color + "22", color: a.color }}>
                <a.icon size={14} />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-medium text-white truncate">{a.label}</p>
                <p className="text-[10px] text-[#3f3f46] truncate">{a.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {recentLinks.length > 0 && (
        <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-semibold text-white">Recent Links</h3>
            <Link to="/dashboard/links" className="text-[11px] text-[#71717a] hover:text-white transition-colors">View all</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {recentLinks.map((l: any) => (
              <Link key={l.id} to="/dashboard/links" className="p-3 rounded-xl border border-white/[0.04] bg-white/[0.01] hover:border-white/[0.08] transition-all">
                <p className="text-[12px] font-semibold text-white truncate">{l.title || l.url}</p>
                <p className="text-[10px] text-[#3f3f46] truncate mt-0.5">{l.url}</p>
                <p className="text-[10px] text-[#71717a] mt-1.5 flex items-center gap-1"><MousePointerClick size={9} /> {l.click_count ?? 0} clicks</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
