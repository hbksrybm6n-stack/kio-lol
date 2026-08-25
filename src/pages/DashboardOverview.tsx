import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, TrendingUp, Link2, LayoutGrid, ArrowUpRight } from "lucide-react";
import { analyticsApi, linksApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

interface Stats {
  profileViews: number;
  linkClicks: number;
  activeLinks: number;
  widgets: number;
}

export default function DashboardOverview() {
  const { profile } = useAuthStore();
  const [stats, setStats] = useState<Stats>({ profileViews: 0, linkClicks: 0, activeLinks: 0, widgets: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [analytics, links] = await Promise.all([
          analyticsApi.getOverview(),
          linksApi.list(),
        ]);
        setStats({
          profileViews: analytics.profileViews ?? 0,
          linkClicks: analytics.linkClicks ?? 0,
          activeLinks: links.filter((l: any) => l.active).length,
          widgets: analytics.widgets ?? 0,
        });
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const statCards = [
    { label: "Profile Views", value: stats.profileViews, icon: Eye, color: "text-violet-400", bg: "bg-violet-400/[0.08]" },
    { label: "Link Clicks", value: stats.linkClicks, icon: TrendingUp, color: "text-cyan-400", bg: "bg-cyan-400/[0.08]" },
    { label: "Active Links", value: stats.activeLinks, icon: Link2, color: "text-emerald-400", bg: "bg-emerald-400/[0.08]" },
    { label: "Widgets", value: stats.widgets, icon: LayoutGrid, color: "text-amber-400", bg: "bg-amber-400/[0.08]" },
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
              <p className="text-2xl font-extrabold text-white tracking-tight">{s.value.toLocaleString()}</p>
            )}
            <p className="text-[12px] text-[#52525b] mt-0.5">{s.label}</p>
          </div>
        ))}
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
