import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, TrendingUp, Link2, Users, ArrowUpRight, ExternalLink } from "lucide-react";
import { analyticsApi, linksApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { formatNumber } from "@/lib/utils";

interface Stats {
  totalViews: number;
  totalClicks: number;
  activeLinks: number;
  uniqueVisitors: number;
}

interface TopLink {
  name: string;
  url: string;
  clicks: number;
}

interface DailyView {
  date: string;
  views: number;
}

export default function DashboardOverview() {
  const { profile } = useAuthStore();
  const [stats, setStats] = useState<Stats>({ totalViews: 0, totalClicks: 0, activeLinks: 0, uniqueVisitors: 0 });
  const [topLinks, setTopLinks] = useState<TopLink[]>([]);
  const [recentViews, setRecentViews] = useState<DailyView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [overview] = await Promise.all([
          analyticsApi.getOverview(),
        ]);
        setStats({
          totalViews: overview.totalViews ?? 0,
          totalClicks: overview.totalClicks ?? 0,
          activeLinks: overview.activeLinks ?? 0,
          uniqueVisitors: overview.uniqueVisitors ?? 0,
        });
        setTopLinks(overview.topLinks ?? []);
        setRecentViews(overview.dailyViews ?? []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const conversionRate = stats.totalViews > 0
    ? ((stats.totalClicks / stats.totalViews) * 100).toFixed(1)
    : "0";

  const last7 = recentViews.slice(-7);
  const maxViews = Math.max(...last7.map(d => d.views), 1);

  const statCards = [
    { label: "Profile Views", value: stats.totalViews, icon: Eye, color: "text-violet-400", bg: "bg-violet-400/[0.08]" },
    { label: "Link Clicks", value: stats.totalClicks, icon: TrendingUp, color: "text-cyan-400", bg: "bg-cyan-400/[0.08]" },
    { label: "Active Links", value: stats.activeLinks, icon: Link2, color: "text-emerald-400", bg: "bg-emerald-400/[0.08]" },
    { label: "Unique Visitors", value: stats.uniqueVisitors, icon: Users, color: "text-amber-400", bg: "bg-amber-400/[0.08]" },
  ];

  const quickActions = [
    { label: "Edit Profile", desc: "Update your info", to: "/dashboard/profile" },
    { label: "Add Links", desc: "Share your content", to: "/dashboard/links" },
    { label: "Customize", desc: "Style your page", to: "/dashboard/appearance" },
    { label: "View Profile", desc: "See it live", to: `/${profile?.username}` },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-white">
          Welcome back, {profile?.username}
        </h1>
        <p className="text-[13px] text-[#52525b] mt-1">Here&apos;s your kio.lol overview.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-4">
            <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            {loading ? (
              <div className="h-7 w-14 rounded-md bg-white/[0.04] animate-shimmer mb-1" />
            ) : (
              <p className="text-2xl font-extrabold text-white tracking-tight">{s.value > 0 ? formatNumber(s.value) : "—"}</p>
            )}
            <p className="text-[12px] text-[#52525b] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[13px] font-semibold text-[#71717a] uppercase tracking-wider">7-Day Views</h2>
            {!loading && stats.totalViews > 0 && (
              <span className="text-[11px] text-[#52525b]">Conversion: <span className="text-emerald-400 font-medium">{conversionRate}%</span></span>
            )}
          </div>
          {loading ? (
            <div className="h-32 rounded-lg bg-white/[0.02] animate-shimmer" />
          ) : last7.length > 0 ? (
            <div className="flex items-end gap-1.5 h-32">
              {last7.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-sm bg-violet-500/30 hover:bg-violet-500/50 transition-colors"
                    style={{ height: `${Math.max((d.views / maxViews) * 100, 4)}%` }}
                    title={`${d.date}: ${d.views} views`}
                  />
                  <span className="text-[9px] text-[#3f3f46]">
                    {new Date(d.date).toLocaleDateString("en", { weekday: "short" })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-[13px] text-[#3f3f46]">
              No views yet
            </div>
          )}
        </div>

        <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-5">
          <h2 className="text-[13px] font-semibold text-[#71717a] uppercase tracking-wider mb-4">Top Links</h2>
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map(i => <div key={i} className="h-8 rounded-lg bg-white/[0.02] animate-shimmer" />)}
            </div>
          ) : topLinks.length > 0 ? (
            <div className="space-y-2">
              {topLinks.slice(0, 5).map((link, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/[0.03] last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[11px] text-[#3f3f46] w-4 text-right font-mono">{i + 1}</span>
                    <span className="text-[13px] text-white/70 truncate">{link.name || "Untitled"}</span>
                  </div>
                  <span className="text-[11px] text-[#52525b] font-mono ml-2">{formatNumber(link.clicks)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-[13px] text-[#3f3f46]">
              No links yet
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-[13px] font-semibold text-[#71717a] uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {quickActions.map((a) => (
            <Link
              key={a.label}
              to={a.to}
              className="group flex items-center justify-between rounded-xl border border-white/[0.04] bg-[#0a0a0a] px-4 py-3.5 hover:border-white/[0.08] hover:bg-white/[0.02] transition-all"
            >
              <div>
                <p className="text-[13px] font-medium text-white">{a.label}</p>
                <p className="text-[11px] text-[#3f3f46]">{a.desc}</p>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#3f3f46] group-hover:text-white/40 transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
