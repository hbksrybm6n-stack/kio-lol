import { useState, useEffect, useMemo } from "react";
import {
  Eye,
  Users,
  MousePointer,
  Link2,
  Download,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  ExternalLink,
} from "lucide-react";
import { motion } from "framer-motion";
import { analyticsApi } from "@/lib/api";
import { cn, formatNumber } from "@/lib/utils";

type TimePeriod = "7d" | "30d" | "90d" | "all";

interface AnalyticsData {
  totalViews: number;
  uniqueVisitors: number;
  totalClicks: number;
  activeLinks: number;
  dailyViews: Array<{ date: string; views: number }>;
  topLinks: Array<{ name: string; url: string; clicks: number }>;
  referrers?: Array<{ url: string; count: number }>;
  devices?: { desktop: number; mobile: number; tablet: number };
  browsers?: Array<{ name: string; count: number }>;
  os?: Array<{ name: string; count: number }>;
}

const PERIODS: { value: TimePeriod; label: string; days?: number }[] = [
  { value: "7d", label: "7d", days: 7 },
  { value: "30d", label: "30d", days: 30 },
  { value: "90d", label: "90d", days: 90 },
  { value: "all", label: "All" },
];

export default function DashboardAnalytics() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [period, setPeriod] = useState<TimePeriod>("30d");
  const [profileId, setProfileId] = useState<string>("");

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const data = await analyticsApi.get();
      setAnalytics(data);
      if (data?.profileId) setProfileId(data.profileId);
    } catch {
      // empty
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!profileId) {
      toast_export();
      return;
    }
    try {
      await analyticsApi.exportCSV(profileId);
    } catch {
      // empty
    }
  };

  const toast_export = () => {};

  const statCards = analytics
    ? [
        { label: "Total Views", value: analytics.totalViews, icon: Eye, bg: "bg-blue-500/10", color: "text-blue-400" },
        { label: "Unique Visitors", value: analytics.uniqueVisitors, icon: Users, bg: "bg-green-500/10", color: "text-green-400" },
        { label: "Total Clicks", value: analytics.totalClicks, icon: MousePointer, bg: "bg-purple-500/10", color: "text-purple-400" },
        { label: "Active Links", value: analytics.activeLinks, icon: Link2, bg: "bg-orange-500/10", color: "text-orange-400" },
      ]
    : [];

  const maxViews = useMemo(
    () => Math.max(...(analytics?.dailyViews || []).map((d) => d.views), 1),
    [analytics]
  );

  const totalDeviceCount = useMemo(() => {
    if (!analytics?.devices) return 0;
    return analytics.devices.desktop + analytics.devices.mobile + analytics.devices.tablet;
  }, [analytics]);

  if (loading && !analytics) {
    return (
      <div className="space-y-6">
        <div className="h-7 w-48 rounded-lg bg-[#0a0a0a] animate-shimmer" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-[#0a0a0a] animate-shimmer" />
          ))}
        </div>
        <div className="h-64 rounded-xl bg-[#0a0a0a] animate-shimmer" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-white">Analytics</h1>
          <p className="text-[13px] text-[#52525b] mt-1">Track your profile's performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-[#0a0a0a] rounded-xl border border-white/[0.04] p-1">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all cursor-pointer",
                  period === p.value
                    ? "bg-white text-black"
                    : "text-[#52525b] hover:text-[#a1a1aa]"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/[0.06] bg-white/[0.03] text-[12px] font-medium text-[#a1a1aa] hover:bg-white/[0.06] hover:text-white transition-all cursor-pointer"
          >
            <Download size={13} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-5"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                <stat.icon size={18} className={stat.color} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stat.value.toLocaleString()}</p>
                <p className="text-[11px] text-[#52525b]">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Views Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6"
      >
        <h3 className="text-[13px] font-semibold text-white mb-4">
          Views ({period === "all" ? "All Time" : period})
        </h3>
        {(analytics?.dailyViews || []).length === 0 ? (
          <p className="text-sm text-[#3f3f46]">No views yet. Share your profile to get started!</p>
        ) : (
          <div className="flex items-end gap-[2px] h-40">
            {analytics?.dailyViews.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div
                  className="w-full rounded-t bg-white/[0.12] hover:bg-white/[0.25] transition-colors"
                  style={{
                    height: `${(day.views / maxViews) * 100}%`,
                    minHeight: day.views > 0 ? 3 : 0,
                  }}
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
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Browser Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6"
        >
          <h3 className="text-[13px] font-semibold text-white mb-4">Browsers</h3>
          {(analytics?.browsers || []).length === 0 ? (
            <p className="text-[13px] text-[#3f3f46]">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {analytics?.browsers?.slice(0, 8).map((browser) => {
                const max = analytics.browsers![0]?.count || 1;
                const pct = (browser.count / max) * 100;
                return (
                  <div key={browser.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] text-[#a1a1aa]">{browser.name}</span>
                      <span className="text-[11px] text-[#52525b]">{formatNumber(browser.count)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-white/[0.15]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Device Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6"
        >
          <h3 className="text-[13px] font-semibold text-white mb-4">Devices</h3>
          {!analytics?.devices ? (
            <p className="text-[13px] text-[#3f3f46]">No data yet.</p>
          ) : (
            <div className="space-y-4">
              {[
                { label: "Desktop", count: analytics.devices.desktop, icon: Monitor },
                { label: "Mobile", count: analytics.devices.mobile, icon: Smartphone },
                { label: "Tablet", count: analytics.devices.tablet, icon: Tablet },
              ].map((d) => (
                <div key={d.label} className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/[0.04]">
                    <d.icon size={16} className="text-[#52525b]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] text-[#a1a1aa]">{d.label}</span>
                      <span className="text-[11px] text-[#52525b]">
                        {formatNumber(d.count)} ({totalDeviceCount > 0 ? Math.round((d.count / totalDeviceCount) * 100) : 0}%)
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-white/[0.15]"
                        style={{ width: totalDeviceCount > 0 ? `${(d.count / totalDeviceCount) * 100}%` : "0%" }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* OS Breakdown */}
      {(analytics?.os || []).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6"
        >
          <h3 className="text-[13px] font-semibold text-white mb-4">Operating Systems</h3>
          <div className="flex flex-wrap gap-3">
            {analytics?.os?.slice(0, 10).map((os) => (
              <div
                key={os.name}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.04] bg-white/[0.01]"
              >
                <span className="text-[12px] text-[#a1a1aa]">{os.name}</span>
                <span className="text-[11px] text-[#3f3f46]">{formatNumber(os.count)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Referrers */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6"
        >
          <h3 className="text-[13px] font-semibold text-white mb-4">Top Referrers</h3>
          {(analytics?.referrers || []).length === 0 ? (
            <p className="text-[13px] text-[#3f3f46]">No referrer data yet.</p>
          ) : (
            <div className="space-y-1">
              {analytics?.referrers?.slice(0, 10).map((ref, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Globe size={12} className="text-[#3f3f46] shrink-0" />
                    <span className="text-[12px] text-[#a1a1aa] truncate">{ref.url || "Direct"}</span>
                  </div>
                  <span className="text-[11px] text-[#52525b] ml-3 shrink-0">{formatNumber(ref.count)}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Top Links */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6"
        >
          <h3 className="text-[13px] font-semibold text-white mb-4">Top Links</h3>
          {(analytics?.topLinks || []).length === 0 ? (
            <p className="text-[13px] text-[#3f3f46]">No link data yet.</p>
          ) : (
            <div className="space-y-1">
              {analytics?.topLinks.map((link, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-white/[0.02] transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-white truncate">{link.name}</p>
                    <p className="text-[11px] text-[#3f3f46] truncate">{link.url}</p>
                  </div>
                  <span className="text-[13px] font-medium text-[#a1a1aa] ml-4 shrink-0">
                    {link.clicks.toLocaleString()} clicks
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
