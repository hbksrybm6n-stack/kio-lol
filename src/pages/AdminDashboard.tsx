import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Search, Users, Flag, Award, Ban, Check, ArrowLeft } from "lucide-react";
import { toast } from "react-hot-toast";
import { profileApi, badgesApi, reportsApi } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  email?: string;
  is_admin?: boolean;
  is_banned?: boolean;
}

interface Report {
  id: string;
  reporter_id: string;
  reported_profile_id: string;
  reason: string;
  description: string;
  status: string;
  created_at: string;
  reporter?: { username: string };
  reported_user?: { username: string };
}

interface BadgeData {
  id: string;
  name: string;
  icon: string;
  color?: string;
  description?: string;
}

type AdminTab = "users" | "reports" | "badges";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [reports, setReports] = useState<Report[]>([]);
  const [allBadges, setAllBadges] = useState<BadgeData[]>([]);
  const [usersWithBadges, setUsersWithBadges] = useState<any[]>([]);
  const [badgeUserSearch, setBadgeUserSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState("");

  useEffect(() => {
    checkAdmin();
  }, []);

  useEffect(() => {
    if (!loading) {
      if (activeTab === "users") loadUsers();
      if (activeTab === "reports") loadReports();
      if (activeTab === "badges") loadBadges();
    }
  }, [activeTab]);

  const checkAdmin = async () => {
    try {
      const profile = await profileApi.get();
      if (!profile?.is_admin) {
        toast.error("Unauthorized");
        navigate("/dashboard");
        return;
      }
      setLoading(false);
    } catch {
      navigate("/dashboard");
    }
  };

  const loadUsers = async () => {
    try {
      const data = await profileApi.adminGetAll();
      setUsers(data || []);
    } catch {
      toast.error("Failed to load users");
    }
  };

  const loadReports = async () => {
    try {
      const data = await reportsApi.getAll();
      setReports(data || []);
    } catch {
      toast.error("Failed to load reports");
    }
  };

  const loadBadges = async () => {
    try {
      const [badges, users] = await Promise.all([
        badgesApi.getAll(),
        badgesApi.getUsersWithBadges(),
      ]);
      setAllBadges(badges || []);
      setUsersWithBadges(users || []);
    } catch {
      toast.error("Failed to load badges");
    }
  };

  const handleAssignBadge = async (profileId: string, badgeId: string) => {
    try {
      await badgesApi.assignBadge(profileId, badgeId);
      toast.success("Badge assigned");
      setUsersWithBadges((prev) =>
        prev.map((u) =>
          u.id === profileId
            ? { ...u, badge_ids: u.badge_ids ? `${u.badge_ids},${badgeId}` : badgeId }
            : u
        )
      );
    } catch {
      toast.error("Failed to assign badge");
    }
  };

  const handleRemoveBadge = async (profileId: string, badgeId: string) => {
    try {
      await badgesApi.removeBadge(profileId, badgeId);
      toast.success("Badge removed");
      setUsersWithBadges((prev) =>
        prev.map((u) =>
          u.id === profileId
            ? { ...u, badge_ids: (u.badge_ids || "").split(",").filter((id: string) => id !== badgeId).join(",") }
            : u
        )
      );
    } catch {
      toast.error("Failed to remove badge");
    }
  };

  const toggleBan = async (userId: string, currentBanned: boolean) => {
    try {
      if (currentBanned) {
        await profileApi.adminUnban(userId);
        toast.success("User unbanned");
      } else {
        await profileApi.adminBan(userId);
        toast.success("User banned");
      }
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, is_banned: !currentBanned } : u
        )
      );
    } catch {
      toast.error("Action failed");
    }
  };

  const toggleAdmin = async (userId: string, currentAdmin: boolean) => {
    try {
      if (currentAdmin) {
        await profileApi.adminRemoveAdmin(userId);
        toast.success("Admin removed");
      } else {
        await profileApi.adminMakeAdmin(userId);
        toast.success("User promoted to admin");
      }
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, is_admin: !currentAdmin } : u
        )
      );
    } catch {
      toast.error("Action failed");
    }
  };

  const resolveReport = async (reportId: string) => {
    try {
      await reportsApi.resolve(reportId);
      toast.success("Report resolved");
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId ? { ...r, status: "resolved" } : r
        )
      );
    } catch {
      toast.error("Failed to resolve report");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.display_name?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const pendingReports = reports.filter((r) => r.status === "pending");

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "users", label: "Users", icon: <Users size={16} /> },
    { id: "reports", label: "Reports", icon: <Flag size={16} />, count: pendingReports.length || undefined },
    { id: "badges", label: "Badges", icon: <Award size={16} /> },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#050505]">
        <div className="w-5 h-5 border-2 border-white/10 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#050505]">
      <aside className="w-56 border-r border-white/[0.04] flex flex-col shrink-0 bg-[#050505]">
        <div className="flex items-center gap-2 px-5 h-14 shrink-0 border-b border-white/[0.04]">
          <Shield size={16} className="text-violet-400" />
          <span className="text-[14px] font-semibold text-white tracking-tight">Admin</span>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all cursor-pointer",
                activeTab === tab.id
                  ? "bg-white/[0.06] text-white font-medium"
                  : "text-[#52525b] hover:text-[#a1a1aa] hover:bg-white/[0.03]"
              )}
            >
              <span className="opacity-60">{tab.icon}</span>
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-auto px-1.5 py-0.5 rounded-md bg-red-400/[0.12] text-red-400 text-[10px] font-semibold">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-white/[0.04]">
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-[#52525b] hover:text-[#a1a1aa] hover:bg-white/[0.03] transition-all cursor-pointer"
          >
            <ArrowLeft size={14} className="opacity-60" />
            Dashboard
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[900px] mx-auto px-6 lg:px-8 py-6 space-y-6">

          {activeTab === "users" && (
            <>
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-white">Users</h2>
                <p className="text-[13px] text-[#52525b] mt-1">Manage all registered users.</p>
              </div>

              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#3f3f46]" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search users..."
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] pl-10 pr-4 py-3 text-sm text-white placeholder:text-[#3f3f46] outline-none transition-all focus:border-white/[0.12] focus:bg-white/[0.05]"
                />
              </div>

              <div className="space-y-1.5">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] px-4 py-3.5 flex items-center justify-between hover:border-white/[0.08] transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-[11px] font-bold text-[#52525b]">
                          {(user.display_name || user.username || "?")[0].toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-white truncate">
                          {user.display_name || user.username}
                        </p>
                        <p className="text-[11px] text-[#3f3f46] truncate">
                          @{user.username}
                          {user.email && <span> · {user.email}</span>}
                        </p>
                      </div>
                      <div className="flex gap-1.5 shrink-0 ml-2">
                        {user.is_admin && (
                          <span className="px-1.5 py-0.5 rounded-md bg-violet-400/[0.12] text-violet-400 text-[10px] font-semibold">Admin</span>
                        )}
                        {user.is_banned && (
                          <span className="px-1.5 py-0.5 rounded-md bg-red-400/[0.12] text-red-400 text-[10px] font-semibold">Banned</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-3">
                      <button
                        onClick={() => toggleAdmin(user.id, !!user.is_admin)}
                        className={cn(
                          "px-2.5 py-1.5 text-[11px] font-semibold rounded-lg transition-all cursor-pointer",
                          user.is_admin
                            ? "bg-white/[0.04] text-[#52525b] hover:bg-white/[0.08] hover:text-[#a1a1aa]"
                            : "bg-violet-400/[0.12] text-violet-400 hover:bg-violet-400/[0.2]"
                        )}
                      >
                        {user.is_admin ? "Demote" : "Promote"}
                      </button>
                      <button
                        onClick={() => toggleBan(user.id, !!user.is_banned)}
                        className={cn(
                          "px-2.5 py-1.5 text-[11px] font-semibold rounded-lg transition-all flex items-center gap-1 cursor-pointer",
                          user.is_banned
                            ? "bg-emerald-400/[0.12] text-emerald-400 hover:bg-emerald-400/[0.2]"
                            : "bg-red-400/[0.12] text-red-400 hover:bg-red-400/[0.2]"
                        )}
                      >
                        {user.is_banned ? <><Check size={11} /> Unban</> : <><Ban size={11} /> Ban</>}
                      </button>
                    </div>
                  </div>
                ))}

                {filteredUsers.length === 0 && (
                  <p className="text-[#3f3f46] text-[13px] text-center py-12">No users found.</p>
                )}
              </div>
            </>
          )}

          {activeTab === "reports" && (
            <>
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-white">Reports</h2>
                <p className="text-[13px] text-[#52525b] mt-1">Review user reports.</p>
              </div>

              <div className="space-y-1.5">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] px-4 py-4 hover:border-white/[0.08] transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "px-1.5 py-0.5 rounded-md text-[10px] font-semibold",
                            report.status === "pending"
                              ? "bg-amber-400/[0.12] text-amber-400"
                              : "bg-emerald-400/[0.12] text-emerald-400"
                          )}>
                            {report.status}
                          </span>
                          <span className="text-[11px] text-[#3f3f46]">
                            {new Date(report.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-[13px] text-[#71717a]">
                          <span className="text-white font-medium">@{report.reporter?.username || "?"}</span>
                          {" "}reported{" "}
                          <span className="text-white font-medium">@{report.reported_user?.username || "?"}</span>
                        </p>
                        <p className="text-[13px] font-medium text-white">{report.reason}</p>
                        {report.description && (
                          <p className="text-[12px] text-[#3f3f46]">{report.description}</p>
                        )}
                      </div>

                      {report.status === "pending" && (
                        <button
                          onClick={() => resolveReport(report.id)}
                          className="px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-emerald-400/[0.12] text-emerald-400 hover:bg-emerald-400/[0.2] transition-all shrink-0 cursor-pointer"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {reports.length === 0 && (
                  <p className="text-[#3f3f46] text-[13px] text-center py-12">No reports yet.</p>
                )}
              </div>
            </>
          )}

          {activeTab === "badges" && (
            <>
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-white">Badge Manager</h2>
                <p className="text-[13px] text-[#52525b] mt-1">Search a user and assign or remove badges.</p>
              </div>

              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#3f3f46]" />
                <input
                  type="text"
                  value={badgeUserSearch}
                  onChange={(e) => { setBadgeUserSearch(e.target.value); setSelectedUserId(null); }}
                  placeholder="Search user by username..."
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] pl-10 pr-4 py-3 text-sm text-white placeholder:text-[#3f3f46] outline-none transition-all focus:border-white/[0.12] focus:bg-white/[0.05]"
                />
              </div>

              {badgeUserSearch && !selectedUserId && (
                <div className="space-y-1.5">
                  {usersWithBadges
                    .filter((u) => u.username?.toLowerCase().includes(badgeUserSearch.toLowerCase()))
                    .slice(0, 10)
                    .map((user) => {
                      const userBadgeIds = (user.badge_ids || "").split(",").filter(Boolean);
                      return (
                        <button
                          key={user.id}
                          onClick={() => { setSelectedUserId(user.id); setSelectedUserName(user.display_name || user.username); }}
                          className="w-full rounded-xl border border-white/[0.04] bg-[#0a0a0a] px-4 py-3 flex items-center gap-3 hover:border-white/[0.08] hover:bg-white/[0.01] transition-all cursor-pointer text-left"
                        >
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-[11px] font-bold text-[#52525b]">
                              {(user.display_name || user.username || "?")[0].toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-medium text-white truncate">{user.display_name || user.username}</p>
                            <p className="text-[11px] text-[#3f3f46] truncate">@{user.username}</p>
                          </div>
                          {userBadgeIds.length > 0 && (
                            <div className="inline-flex p-[1.5px] rounded-[10px] shrink-0" style={{ background: "rgba(255,255,255,0.06)" }}>
                              <div className="flex items-center gap-1 px-1 py-0.5 rounded-[8px] bg-black/40" style={{ boxShadow: "inset 0 0 6px rgba(255,255,255,0.08)" }}>
                                {allBadges.filter((b) => userBadgeIds.includes(b.id)).slice(0, 6).map((b) => (
                                  <div
                                    key={b.id}
                                    className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px]"
                                    style={{
                                      background: `linear-gradient(135deg, ${b.color || "#8b5cf6"}40, ${b.color || "#8b5cf6"}15)`,
                                      border: `1px solid ${b.color || "#8b5cf6"}40`,
                                    }}
                                    title={b.name}
                                  >
                                    {b.icon}
                                  </div>
                                ))}
                                {userBadgeIds.length > 6 && (
                                  <span className="text-[9px] text-[#52525b] ml-0.5">+{userBadgeIds.length - 6}</span>
                                )}
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                </div>
              )}

              {selectedUserId && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[14px] font-semibold text-white">Badges for @{selectedUserName}</p>
                    </div>
                    <button onClick={() => setSelectedUserId(null)} className="text-[12px] text-[#52525b] hover:text-white transition-colors cursor-pointer">← Back to search</button>
                  </div>

                  <div className="p-[2px] rounded-[16px]" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div className="flex flex-wrap items-center gap-2 p-3 rounded-[14px] bg-[#0a0a0a]" style={{ boxShadow: "inset 0 0 12px rgba(255,255,255,0.06)" }}>
                      {allBadges.map((badge) => {
                        const user = usersWithBadges.find((u) => u.id === selectedUserId);
                        const userBadgeIds = user ? (user.badge_ids || "").split(",").filter(Boolean) : [];
                        const hasBadge = userBadgeIds.includes(badge.id);
                        const color = badge.color || "#8b5cf6";
                        return (
                          <div key={badge.id} className="relative group/badge cursor-pointer" onClick={() => hasBadge ? handleRemoveBadge(selectedUserId, badge.id) : handleAssignBadge(selectedUserId, badge.id)}>
                            <div
                              className={cn(
                                "w-[34px] h-[34px] rounded-full flex items-center justify-center text-[16px] leading-none transition-all duration-200",
                                hasBadge ? "hover:scale-125" : "opacity-40 hover:opacity-80 hover:scale-110"
                              )}
                              style={{
                                background: hasBadge
                                  ? `linear-gradient(135deg, ${color}50, ${color}20)`
                                  : `linear-gradient(135deg, ${color}20, ${color}08)`,
                                border: `1.5px solid ${hasBadge ? `${color}60` : `${color}20`}`,
                                boxShadow: hasBadge ? `0 0 12px ${color}30` : "none",
                              }}
                            >
                              {badge.icon}
                            </div>
                            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-black/90 text-white text-[10px] font-medium whitespace-nowrap opacity-0 group-hover/badge:opacity-100 transition-opacity pointer-events-none z-50" style={{ border: `1px solid ${color}30` }}>
                              {hasBadge ? "Remove" : "Assign"} {badge.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-[#3f3f46]">
                    <span className="inline-block w-2 h-2 rounded-full bg-white/20" /> Not assigned
                    <span className="inline-block w-2 h-2 rounded-full bg-white/50 ml-2" /> Assigned
                  </div>
                </div>
              )}

              {!badgeUserSearch && (
                <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-8 text-center">
                  <Award size={32} className="mx-auto text-[#1a1a1a] mb-3" />
                  <p className="text-[13px] text-[#3f3f46]">Search for a user to manage their badges.</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
