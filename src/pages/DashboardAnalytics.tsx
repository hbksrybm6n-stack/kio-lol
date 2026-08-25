import { useState, useEffect } from "react";
import { analyticsApi } from "@/lib/api";
import { Eye, Users, MousePointer, Link2 } from "lucide-react";

interface AnalyticsData {
  totalViews: number;
  uniqueVisitors: number;
  totalClicks: number;
  activeLinks: number;
  dailyViews: Array<{ date: string; views: number }>;
  topLinks: Array<{ name: string; url: string; clicks: number }>;
}

export default function DashboardAnalytics() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const data = await analyticsApi.get();
      setAnalytics(data);
    } catch {
      // empty
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-7 w-48 rounded-lg bg-[#0a0a0a] animate-shimmer" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-[#0a0a0a] animate-shimmer" />
          ))}
        </div>
        <div className="h-64 rounded-xl bg-[#0a0a0a] animate-shimmer" />
        <div className="h-48 rounded-xl bg-[#0a0a0a] animate-shimmer" />
      </div>
    );
  }

  if (!analytics) return null;

  const maxViews = Math.max(...analytics.dailyViews.map((d) => d.views), 1);

  const statCards = [
    { label: "Total Views", value: analytics.totalViews, icon: Eye, bg: "bg-blue-500/10", color: "text-blue-400" },
    { label: "Unique Visitors", value: analytics.uniqueVisitors, icon: Users, bg: "bg-green-500/10", color: "text-green-400" },
    { label: "Total Clicks", value: analytics.totalClicks, icon: MousePointer, bg: "bg-purple-500/10", color: "text-purple-400" },
    { label: "Active Links", value: analytics.activeLinks, icon: Link2, bg: "bg-orange-500/10", color: "text-orange-400" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-white">Analytics</h1>
        <p className="text-[13px] text-[#52525b] mt-1">Track your profile's performance.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-5">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                <stat.icon size={18} className={stat.color} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stat.value.toLocaleString()}</p>
                <p className="text-[11px] text-[#52525b]">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6">
        <h3 className="text-[13px] font-semibold text-white mb-4">Daily Views (30 Days)</h3>
        {analytics.dailyViews.length === 0 ? (
          <p className="text-sm text-[#3f3f46]">No views yet. Share your profile to get started!</p>
        ) : (
          <div className="flex items-end gap-[2px] h-40">
            {analytics.dailyViews.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div
                  className="w-full rounded-t bg-white/[0.12] hover:bg-white/[0.25] transition-colors"
                  style={{ height: `${(day.views / maxViews) * 100}%`, minHeight: day.views > 0 ? 3 : 0 }}
                />
                <span className="text-[10px] text-[#3f3f46] hidden lg:block">
                  {new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#111] text-white text-[11px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 border border-white/[0.06]">
                  {day.views.toLocaleString()} views
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Links */}
      <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6">
        <h3 className="text-[13px] font-semibold text-white mb-4">Top Links</h3>
        {analytics.topLinks.length === 0 ? (
          <p className="text-sm text-[#3f3f46]">No link data yet.</p>
        ) : (
          <div className="space-y-1">
            {analytics.topLinks.map((link, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-white/[0.02] transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white truncate">{link.name}</p>
                  <p className="text-[11px] text-[#3f3f46] truncate">{link.url}</p>
                </div>
                <span className="text-sm font-medium text-[#a1a1aa] ml-4">{link.clicks.toLocaleString()} clicks</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
