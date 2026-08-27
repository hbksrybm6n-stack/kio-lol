import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Check, X as XIcon, Copy, Eye, ExternalLink, Edit3, Palette, Award, Music, Link2, Image as ImageIcon,
  Camera, CheckCircle2,
} from "lucide-react";
import { linksApi, socialLinksApi, badgesApi, configApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface CompletionItem {
  label: string;
  weight: number;
  done: boolean;
  icon: typeof Camera;
}

export default function DashboardMyProfile() {
  const { profile } = useAuthStore();
  const [linksCount, setLinksCount] = useState(0);
  const [socialsCount, setSocialsCount] = useState(0);
  const [badgeCount, setBadgeCount] = useState(0);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!profile?.id) return;
    loadData();
  }, [profile?.id]);

  const loadData = async () => {
    try {
      const [links, socials, badges, cfg] = await Promise.all([
        linksApi.list().catch(() => []),
        socialLinksApi.list().catch(() => []),
        badgesApi.getUserBadges(profile!.id).catch(() => []),
        configApi.get().catch(() => null),
      ]);
      const linkList = Array.isArray(links) ? links : links?.data || links?.links || [];
      const socialList = Array.isArray(socials) ? socials : socials?.data || socials?.socials || [];
      const badgeList = Array.isArray(badges) ? badges : badges?.badges || [];
      setLinksCount(linkList.filter((l: any) => l.is_active !== false).length);
      setSocialsCount(socialList.length);
      setBadgeCount(badgeList.length);
      setConfig(cfg);
    } catch {
      // empty
    } finally {
      setLoading(false);
    }
  };

  const items: CompletionItem[] = useMemo(() => [
    { label: "Profile picture", weight: 20, done: !!profile?.avatar_url, icon: Camera },
    { label: "Banner", weight: 15, done: !!profile?.banner_url, icon: ImageIcon },
    { label: "Bio", weight: 15, done: !!profile?.bio?.trim(), icon: Edit3 },
    { label: "Links", weight: 20, done: linksCount > 0, icon: Link2 },
    { label: "Background", weight: 15, done: !!(config?.background_url || config?.background_video_url), icon: Palette },
    { label: "Music", weight: 10, done: !!(config?.music_url), icon: Music },
    { label: "Socials", weight: 5, done: socialsCount > 0, icon: Eye },
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
        <h1 className="text-xl font-extrabold tracking-tight text-white">My Profile</h1>
        <p className="text-[13px] text-[#52525b] mt-1">Your profile completion and overview.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
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
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between px-4 py-2.5 rounded-lg border border-white/[0.04] bg-white/[0.01]"
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
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6">
            <h3 className="text-[14px] font-semibold text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Link
                to="/dashboard/profile"
                className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.01] px-4 py-3 hover:border-white/[0.08] hover:bg-white/[0.02] transition-all"
              >
                <div>
                  <p className="text-[13px] font-medium text-white">Edit Profile</p>
                  <p className="text-[11px] text-[#3f3f46]">Update your info</p>
                </div>
                <Edit3 size={14} className="text-[#3f3f46]" />
              </Link>
              <Link
                to="/dashboard/appearance"
                className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.01] px-4 py-3 hover:border-white/[0.08] hover:bg-white/[0.02] transition-all"
              >
                <div>
                  <p className="text-[13px] font-medium text-white">Edit Appearance</p>
                  <p className="text-[11px] text-[#3f3f46]">Style your page</p>
                </div>
                <Palette size={14} className="text-[#3f3f46]" />
              </Link>
              <Link
                to={`/${profile?.username}`}
                target="_blank"
                className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.01] px-4 py-3 hover:border-white/[0.08] hover:bg-white/[0.02] transition-all"
              >
                <div>
                  <p className="text-[13px] font-medium text-white">View Profile</p>
                  <p className="text-[11px] text-[#3f3f46]">See it live</p>
                </div>
                <ExternalLink size={14} className="text-[#3f3f46]" />
              </Link>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] overflow-hidden">
            <div className="h-20 bg-gradient-to-r from-violet-500/30 to-fuchsia-500/30 relative">
              {profile?.banner_url && <img src={profile.banner_url} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="px-5 pb-5 -mt-8 relative">
              <div className="w-16 h-16 rounded-full border-4 border-[#0a0a0a] overflow-hidden bg-white/[0.06] mx-auto">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
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
          </div>
        </div>
      </div>
    </div>
  );
}
