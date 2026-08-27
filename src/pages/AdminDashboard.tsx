import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Search,
  Users,
  Flag,
  Award,
  Ban,
  Check,
  ArrowLeft,
  ClipboardList,
  Megaphone,
  StickyNote,
  Server,
  Activity,
  Clock,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { profileApi, badgesApi, reportsApi, adminExtendedApi, premiumApi } from "@/lib/api";
import { cn, assetUrl } from "@/lib/utils";
import type { AuditLog, Announcement, StaffNote, Badge as BadgeType, PremiumPlan } from "@/types";

interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  email?: string;
  role?: string;
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

type AdminTab = "users" | "reports" | "badges" | "audit" | "announcements" | "notes" | "system" | "premium";

const inputClass =
  "w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-[#3f3f46] outline-none transition-all focus:border-white/[0.12] focus:bg-white/[0.05]";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [reports, setReports] = useState<Report[]>([]);
  const [allBadges, setAllBadges] = useState<BadgeType[]>([]);
  const [usersWithBadges, setUsersWithBadges] = useState<any[]>([]);
  const [badgeUserSearch, setBadgeUserSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState("");

  // Audit
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditFilter, setAuditFilter] = useState("");
  const [auditLoading, setAuditLoading] = useState(false);

  // Announcements
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [announcementType, setAnnouncementType] = useState("info");

  // Staff Notes
  const [noteSearch, setNoteSearch] = useState("");
  const [noteUserId, setNoteUserId] = useState<string | null>(null);
  const [noteUserName, setNoteUserName] = useState("");
  const [staffNotes, setStaffNotes] = useState<StaffNote[]>([]);
  const [newNote, setNewNote] = useState("");

  // System
  const [sysStats, setSysStats] = useState<any>(null);
  const [sysHealth, setSysHealth] = useState<any>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [featureSearch, setFeatureSearch] = useState("");
  const [featureProfileId, setFeatureProfileId] = useState("");

  // Premium
  const [premiumPlans, setPremiumPlans] = useState<PremiumPlan[]>([]);
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [newPlanName, setNewPlanName] = useState("");
  const [newPlanMonthly, setNewPlanMonthly] = useState("");
  const [newPlanYearly, setNewPlanYearly] = useState("");
  const [newPlanFeatures, setNewPlanFeatures] = useState("");
  const [premiumUserSearch, setPremiumUserSearch] = useState("");
  const [premiumSelectedUser, setPremiumSelectedUser] = useState<string | null>(null);
  const [premiumSelectedPlan, setPremiumSelectedPlan] = useState("");
  const [premiumExpiry, setPremiumExpiry] = useState("");

  useEffect(() => {
    checkAdmin();
  }, []);

  useEffect(() => {
    if (!loading) {
      if (activeTab === "users") loadUsers();
      if (activeTab === "reports") loadReports();
      if (activeTab === "badges") loadBadges();
      if (activeTab === "audit") loadAuditLogs();
      if (activeTab === "announcements") loadAnnouncements();
      if (activeTab === "notes") loadUsers();
      if (activeTab === "system") loadSystem();
      if (activeTab === "premium") { loadPremiumPlans(); loadUsers(); }
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
      const [badges, users] = await Promise.all([badgesApi.getAll(), badgesApi.getUsersWithBadges()]);
      setAllBadges(badges || []);
      setUsersWithBadges(users || []);
    } catch {
      toast.error("Failed to load badges");
    }
  };

  const loadAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const data = await adminExtendedApi.getAuditLogs(auditPage);
      setAuditLogs(data?.logs || data || []);
    } catch {
      toast.error("Failed to load audit logs");
    } finally {
      setAuditLoading(false);
    }
  };

  const loadAnnouncements = async () => {
    try {
      const data = await adminExtendedApi.getAnnouncements();
      setAnnouncements(data || []);
    } catch {
      // empty
    }
  };

  const loadSystem = async () => {
    try {
      const [stats, health] = await Promise.all([
        adminExtendedApi.getStats().catch(() => null),
        adminExtendedApi.getHealth().catch(() => null),
      ]);
      setSysStats(stats);
      setSysHealth(health);
    } catch {
      // empty
    }
  };

  const loadPremiumPlans = async () => {
    try {
      const data = await premiumApi.getPlans();
      setPremiumPlans(data || []);
    } catch {
      toast.error("Failed to load premium plans");
    }
  };

  const handleCreatePlan = async () => {
    if (!newPlanName.trim()) {
      toast.error("Plan name is required");
      return;
    }
    try {
      const plan = await premiumApi.createPlan({
        name: newPlanName,
        price_monthly: parseFloat(newPlanMonthly) || 0,
        price_yearly: parseFloat(newPlanYearly) || 0,
        features: newPlanFeatures.split(",").map((f) => f.trim()).filter(Boolean),
      });
      setPremiumPlans((prev) => [...prev, plan]);
      setNewPlanName("");
      setNewPlanMonthly("");
      setNewPlanYearly("");
      setNewPlanFeatures("");
      setShowCreatePlan(false);
      toast.success("Plan created");
    } catch {
      toast.error("Failed to create plan");
    }
  };

  const handleDeletePlan = async (planId: string) => {
    try {
      await premiumApi.deletePlan(planId);
      setPremiumPlans((prev) => prev.filter((p) => p.id !== planId));
      toast.success("Plan deleted");
    } catch {
      toast.error("Failed to delete plan");
    }
  };

  const handleAssignPremium = async () => {
    if (!premiumSelectedUser || !premiumSelectedPlan || !premiumExpiry) {
      toast.error("Fill in all fields");
      return;
    }
    try {
      await premiumApi.assignPremium(premiumSelectedUser, premiumSelectedPlan, premiumExpiry);
      setPremiumSelectedUser(null);
      setPremiumSelectedPlan("");
      setPremiumExpiry("");
      setPremiumUserSearch("");
      toast.success("Premium assigned");
    } catch {
      toast.error("Failed to assign premium");
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
            ? {
                ...u,
                badge_ids: (u.badge_ids || "")
                  .split(",")
                  .filter((id: string) => id !== badgeId)
                  .join(","),
              }
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
        prev.map((u) => (u.id === userId ? { ...u, is_banned: !currentBanned } : u))
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
        prev.map((u) => (u.id === userId ? { ...u, is_admin: !currentAdmin } : u))
      );
    } catch {
      toast.error("Action failed");
    }
  };

  const setRole = async (userId: string, role: string) => {
    try {
      await profileApi.update({ user_id: userId, role } as any);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
      toast.success(`Role set to ${role}`);
    } catch {
      toast.error("Failed to set role");
    }
  };

  const resolveReport = async (reportId: string) => {
    try {
      await reportsApi.resolve(reportId);
      toast.success("Report resolved");
      setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status: "resolved" } : r)));
    } catch {
      toast.error("Failed to resolve report");
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementContent.trim()) {
      toast.error("Fill in all fields");
      return;
    }
    try {
      await adminExtendedApi.createAnnouncement({
        title: announcementTitle,
        content: announcementContent,
        type: announcementType,
      });
      setAnnouncementTitle("");
      setAnnouncementContent("");
      setAnnouncementType("info");
      toast.success("Announcement created");
      loadAnnouncements();
    } catch {
      toast.error("Failed to create announcement");
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      await adminExtendedApi.deleteAnnouncement(id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      toast.success("Announcement deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleAddNote = async () => {
    if (!noteUserId || !newNote.trim()) return;
    try {
      await adminExtendedApi.addStaffNote(noteUserId, newNote);
      setNewNote("");
      toast.success("Note added");
      const notes = await adminExtendedApi.getStaffNotes(noteUserId);
      setStaffNotes(notes || []);
    } catch {
      toast.error("Failed to add note");
    }
  };

  const handleToggleMaintenance = async () => {
    try {
      await adminExtendedApi.toggleMaintenance(!maintenanceMode);
      setMaintenanceMode(!maintenanceMode);
      toast.success(`Maintenance mode ${!maintenanceMode ? "enabled" : "disabled"}`);
    } catch {
      toast.error("Failed to toggle maintenance");
    }
  };

  const handleFeatureProfile = async () => {
    if (!featureProfileId.trim()) return;
    try {
      await adminExtendedApi.featureProfile(featureProfileId);
      setFeatureProfileId("");
      toast.success("Profile featured");
    } catch {
      toast.error("Failed to feature profile");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.display_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredAudit = auditFilter
    ? auditLogs.filter((l) => l.action.toLowerCase().includes(auditFilter.toLowerCase()))
    : auditLogs;

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "users", label: "Users", icon: <Users size={16} /> },
    { id: "reports", label: "Reports", icon: <Flag size={16} />, count: reports.filter((r) => r.status === "pending").length || undefined },
    { id: "badges", label: "Badges", icon: <Award size={16} /> },
    { id: "audit", label: "Audit Logs", icon: <ClipboardList size={16} /> },
    { id: "announcements", label: "Announcements", icon: <Megaphone size={16} /> },
    { id: "notes", label: "Staff Notes", icon: <StickyNote size={16} /> },
    { id: "premium", label: "Premium", icon: <Award size={16} /> },
    { id: "system", label: "System", icon: <Server size={16} /> },
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
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
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

          {/* USERS TAB */}
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
                        <img src={assetUrl(user.avatar_url)} alt="" className="w-8 h-8 rounded-full object-cover" />
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
                          <span className="px-1.5 py-0.5 rounded-md bg-violet-400/[0.12] text-violet-400 text-[10px] font-semibold">
                            Admin
                          </span>
                        )}
                        {user.role && user.role !== "user" && !user.is_admin && (
                          <span className="px-1.5 py-0.5 rounded-md bg-blue-400/[0.12] text-blue-400 text-[10px] font-semibold capitalize">
                            {user.role}
                          </span>
                        )}
                        {user.is_banned && (
                          <span className="px-1.5 py-0.5 rounded-md bg-red-400/[0.12] text-red-400 text-[10px] font-semibold">
                            Banned
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-3 flex-wrap justify-end">
                      <select
                        value={user.role || "user"}
                        onChange={(e) => setRole(user.id, e.target.value)}
                        className="text-[10px] rounded-lg border border-white/[0.06] bg-white/[0.03] text-[#a1a1aa] px-2 py-1 outline-none cursor-pointer"
                      >
                        <option value="user">User</option>
                        <option value="moderator">Moderator</option>
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                      </select>
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
                        {user.is_banned ? (
                          <>
                            <Check size={11} /> Unban
                          </>
                        ) : (
                          <>
                            <Ban size={11} /> Ban
                          </>
                        )}
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

          {/* REPORTS TAB */}
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
                          <span
                            className={cn(
                              "px-1.5 py-0.5 rounded-md text-[10px] font-semibold",
                              report.status === "pending"
                                ? "bg-amber-400/[0.12] text-amber-400"
                                : "bg-emerald-400/[0.12] text-emerald-400"
                            )}
                          >
                            {report.status}
                          </span>
                          <span className="text-[11px] text-[#3f3f46]">
                            {new Date(report.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-[13px] text-[#71717a]">
                          <span className="text-white font-medium">@{report.reporter?.username || "?"}</span>{" "}
                          reported{" "}
                          <span className="text-white font-medium">@{report.reported_user?.username || "?"}</span>
                        </p>
                        <p className="text-[13px] font-medium text-white">{report.reason}</p>
                        {report.description && <p className="text-[12px] text-[#3f3f46]">{report.description}</p>}
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

          {/* BADGES TAB */}
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
                  onChange={(e) => {
                    setBadgeUserSearch(e.target.value);
                    setSelectedUserId(null);
                  }}
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
                          onClick={() => {
                            setSelectedUserId(user.id);
                            setSelectedUserName(user.display_name || user.username);
                          }}
                          className="w-full rounded-xl border border-white/[0.04] bg-[#0a0a0a] px-4 py-3 flex items-center gap-3 hover:border-white/[0.08] hover:bg-white/[0.01] transition-all cursor-pointer text-left"
                        >
                          {user.avatar_url ? (
                            <img src={assetUrl(user.avatar_url)} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-[11px] font-bold text-[#52525b]">
                              {(user.display_name || user.username || "?")[0].toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-medium text-white truncate">
                              {user.display_name || user.username}
                            </p>
                            <p className="text-[11px] text-[#3f3f46] truncate">@{user.username}</p>
                          </div>
                          {userBadgeIds.length > 0 && (
                            <div className="inline-flex p-[1.5px] rounded-[10px] shrink-0" style={{ background: "rgba(255,255,255,0.06)" }}>
                              <div
                                className="flex items-center gap-1 px-1 py-0.5 rounded-[8px] bg-black/40"
                                style={{ boxShadow: "inset 0 0 6px rgba(255,255,255,0.08)" }}
                              >
                                {allBadges
                                  .filter((b) => userBadgeIds.includes(b.id))
                                  .slice(0, 6)
                                  .map((b) => (
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
                                  <span className="text-[9px] text-[#52525b] ml-0.5">
                                    +{userBadgeIds.length - 6}
                                  </span>
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
                    <p className="text-[14px] font-semibold text-white">Badges for @{selectedUserName}</p>
                    <button
                      onClick={() => setSelectedUserId(null)}
                      className="text-[12px] text-[#52525b] hover:text-white transition-colors cursor-pointer"
                    >
                      Back to search
                    </button>
                  </div>
                  <div className="p-[2px] rounded-[16px]" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div
                      className="flex flex-wrap items-center gap-2 p-3 rounded-[14px] bg-[#0a0a0a]"
                      style={{ boxShadow: "inset 0 0 12px rgba(255,255,255,0.06)" }}
                    >
                      {allBadges.map((badge) => {
                        const user = usersWithBadges.find((u) => u.id === selectedUserId);
                        const userBadgeIds = user ? (user.badge_ids || "").split(",").filter(Boolean) : [];
                        const hasBadge = userBadgeIds.includes(badge.id);
                        const color = badge.color || "#8b5cf6";
                        return (
                          <div
                            key={badge.id}
                            className="relative group/badge cursor-pointer"
                            onClick={() =>
                              hasBadge
                                ? handleRemoveBadge(selectedUserId, badge.id)
                                : handleAssignBadge(selectedUserId, badge.id)
                            }
                          >
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
                            <span
                              className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-black/90 text-white text-[10px] font-medium whitespace-nowrap opacity-0 group-hover/badge:opacity-100 transition-opacity pointer-events-none z-50"
                              style={{ border: `1px solid ${color}30` }}
                            >
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

          {/* AUDIT LOGS TAB */}
          {activeTab === "audit" && (
            <>
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-white">Audit Logs</h2>
                <p className="text-[13px] text-[#52525b] mt-1">All administrative actions.</p>
              </div>
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#3f3f46]" />
                <input
                  type="text"
                  value={auditFilter}
                  onChange={(e) => setAuditFilter(e.target.value)}
                  placeholder="Filter by action..."
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] pl-10 pr-4 py-3 text-sm text-white placeholder:text-[#3f3f46] outline-none transition-all focus:border-white/[0.12] focus:bg-white/[0.05]"
                />
              </div>
              {auditLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 rounded-xl bg-[#0a0a0a] animate-shimmer" />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-white/[0.04] bg-[#0a0a0a]">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/[0.04]">
                        <th className="text-left text-[11px] font-semibold text-[#52525b] uppercase tracking-wider p-4">Time</th>
                        <th className="text-left text-[11px] font-semibold text-[#52525b] uppercase tracking-wider p-4">User</th>
                        <th className="text-left text-[11px] font-semibold text-[#52525b] uppercase tracking-wider p-4">Action</th>
                        <th className="text-left text-[11px] font-semibold text-[#52525b] uppercase tracking-wider p-4">Target</th>
                        <th className="text-left text-[11px] font-semibold text-[#52525b] uppercase tracking-wider p-4">Details</th>
                        <th className="text-left text-[11px] font-semibold text-[#52525b] uppercase tracking-wider p-4">IP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAudit.map((log) => (
                        <tr key={log.id} className="border-b border-white/[0.02]">
                          <td className="p-4 text-[12px] text-[#a1a1aa] whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td className="p-4 text-[12px] text-white">{log.user_id}</td>
                          <td className="p-4">
                            <span className="px-1.5 py-0.5 rounded-md bg-white/[0.04] text-[11px] text-[#a1a1aa] font-medium">
                              {log.action}
                            </span>
                          </td>
                          <td className="p-4 text-[12px] text-[#a1a1aa]">{log.target_type} · {log.target_id}</td>
                          <td className="p-4 text-[12px] text-[#52525b] max-w-[200px] truncate">{log.details}</td>
                          <td className="p-4 text-[12px] text-[#3f3f46] font-mono">{log.ip}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredAudit.length === 0 && (
                    <p className="text-[13px] text-[#3f3f46] text-center py-12">No audit logs found.</p>
                  )}
                </div>
              )}
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                  disabled={auditPage === 1}
                  className="px-3 py-1.5 rounded-lg text-[12px] text-[#52525b] hover:text-white bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-30 cursor-pointer"
                >
                  Prev
                </button>
                <span className="text-[12px] text-[#52525b] px-3 py-1.5">Page {auditPage}</span>
                <button
                  onClick={() => setAuditPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg text-[12px] text-[#52525b] hover:text-white bg-white/[0.04] hover:bg-white/[0.08] cursor-pointer"
                >
                  Next
                </button>
              </div>
            </>
          )}

          {/* ANNOUNCEMENTS TAB */}
          {activeTab === "announcements" && (
            <>
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-white">Announcements</h2>
                <p className="text-[13px] text-[#52525b] mt-1">Manage global announcements.</p>
              </div>
              <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-2 block">Title</label>
                    <input
                      value={announcementTitle}
                      onChange={(e) => setAnnouncementTitle(e.target.value)}
                      placeholder="Announcement title"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-2 block">Type</label>
                    <select
                      value={announcementType}
                      onChange={(e) => setAnnouncementType(e.target.value)}
                      className={cn(inputClass, "appearance-none cursor-pointer")}
                    >
                      <option value="info">Info</option>
                      <option value="warning">Warning</option>
                      <option value="danger">Danger</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-2 block">Content</label>
                  <textarea
                    value={announcementContent}
                    onChange={(e) => setAnnouncementContent(e.target.value)}
                    rows={3}
                    placeholder="Announcement content..."
                    className={`${inputClass} resize-none`}
                  />
                </div>
                <button
                  onClick={handleCreateAnnouncement}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black text-[13px] font-bold hover:bg-white/90 transition-all cursor-pointer"
                >
                  <Megaphone size={13} /> Create
                </button>
              </div>

              <div className="space-y-1.5">
                {announcements.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] px-4 py-4 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={cn(
                            "px-1.5 py-0.5 rounded-md text-[10px] font-semibold",
                            a.type === "danger"
                              ? "bg-red-400/[0.12] text-red-400"
                              : a.type === "warning"
                              ? "bg-amber-400/[0.12] text-amber-400"
                              : "bg-blue-400/[0.12] text-blue-400"
                          )}
                        >
                          {a.type}
                        </span>
                        <span className="text-[11px] text-[#3f3f46]">
                          {new Date(a.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-[13px] font-medium text-white">{a.title}</p>
                      <p className="text-[12px] text-[#52525b] mt-0.5">{a.content}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteAnnouncement(a.id)}
                      className="p-2 rounded-lg hover:bg-red-400/[0.08] text-[#52525b] hover:text-red-400 transition-all cursor-pointer shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {announcements.length === 0 && (
                  <p className="text-[13px] text-[#3f3f46] text-center py-8">No announcements yet.</p>
                )}
              </div>
            </>
          )}

          {/* STAFF NOTES TAB */}
          {activeTab === "notes" && (
            <>
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-white">Staff Notes</h2>
                <p className="text-[13px] text-[#52525b] mt-1">Add and view notes on user accounts.</p>
              </div>
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#3f3f46]" />
                <input
                  type="text"
                  value={noteSearch}
                  onChange={(e) => {
                    setNoteSearch(e.target.value);
                    setNoteUserId(null);
                  }}
                  placeholder="Search for a user..."
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] pl-10 pr-4 py-3 text-sm text-white placeholder:text-[#3f3f46] outline-none transition-all focus:border-white/[0.12] focus:bg-white/[0.05]"
                />
              </div>
              {noteSearch && !noteUserId && (
                <div className="space-y-1.5">
                  {users
                    .filter((u) => u.username?.toLowerCase().includes(noteSearch.toLowerCase()))
                    .slice(0, 10)
                    .map((user) => (
                      <button
                        key={user.id}
                        onClick={async () => {
                          setNoteUserId(user.id);
                          setNoteUserName(user.display_name || user.username);
                          const notes = await adminExtendedApi.getStaffNotes(user.id).catch(() => []);
                          setStaffNotes(notes || []);
                        }}
                        className="w-full rounded-xl border border-white/[0.04] bg-[#0a0a0a] px-4 py-3 flex items-center gap-3 hover:border-white/[0.08] transition-all cursor-pointer text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-[11px] font-bold text-[#52525b]">
                          {(user.display_name || user.username || "?")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-[13px] font-medium text-white">{user.display_name || user.username}</p>
                          <p className="text-[11px] text-[#3f3f46]">@{user.username}</p>
                        </div>
                      </button>
                    ))}
                </div>
              )}
              {noteUserId && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[14px] font-semibold text-white">Notes for @{noteUserName}</p>
                    <button
                      onClick={() => setNoteUserId(null)}
                      className="text-[12px] text-[#52525b] hover:text-white transition-colors cursor-pointer"
                    >
                      Back to search
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      rows={2}
                      placeholder="Add a note..."
                      className={`${inputClass} resize-none flex-1`}
                    />
                    <button
                      onClick={handleAddNote}
                      disabled={!newNote.trim()}
                      className="px-4 py-2 rounded-xl bg-white text-black text-[13px] font-bold hover:bg-white/90 transition-all disabled:opacity-40 cursor-pointer self-end shrink-0"
                    >
                      Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {staffNotes.map((note) => (
                      <div key={note.id} className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] px-4 py-3">
                        <p className="text-[13px] text-white">{note.note}</p>
                        <p className="text-[11px] text-[#3f3f46] mt-1">
                          By {note.author_id} · {new Date(note.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                    {staffNotes.length === 0 && (
                      <p className="text-[13px] text-[#3f3f46] text-center py-8">No notes yet.</p>
                    )}
                  </div>
                </div>
              )}
              {!noteSearch && (
                <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-8 text-center">
                  <StickyNote size={32} className="mx-auto text-[#1a1a1a] mb-3" />
                  <p className="text-[13px] text-[#3f3f46]">Search for a user to manage staff notes.</p>
                </div>
              )}
            </>
          )}

          {/* PREMIUM TAB */}
          {activeTab === "premium" && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight text-white">Premium</h2>
                  <p className="text-[13px] text-[#52525b] mt-1">Manage premium plans and subscriptions.</p>
                </div>
                <button
                  onClick={() => setShowCreatePlan(!showCreatePlan)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black text-[13px] font-bold hover:bg-white/90 transition-all cursor-pointer"
                >
                  {showCreatePlan ? "Cancel" : "+ New Plan"}
                </button>
              </div>

              {showCreatePlan && (
                <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6 space-y-4">
                  <h3 className="text-[14px] font-semibold text-white">Create Premium Plan</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-2 block">Plan Name</label>
                      <input
                        value={newPlanName}
                        onChange={(e) => setNewPlanName(e.target.value)}
                        placeholder="e.g. Pro"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-2 block">Monthly Price ($)</label>
                      <input
                        value={newPlanMonthly}
                        onChange={(e) => setNewPlanMonthly(e.target.value)}
                        placeholder="9.99"
                        type="number"
                        step="0.01"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-2 block">Yearly Price ($)</label>
                      <input
                        value={newPlanYearly}
                        onChange={(e) => setNewPlanYearly(e.target.value)}
                        placeholder="99.99"
                        type="number"
                        step="0.01"
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-2 block">Features (comma-separated)</label>
                    <input
                      value={newPlanFeatures}
                      onChange={(e) => setNewPlanFeatures(e.target.value)}
                      placeholder="Custom CSS, Custom HTML, Priority support"
                      className={inputClass}
                    />
                  </div>
                  <button
                    onClick={handleCreatePlan}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black text-[13px] font-bold hover:bg-white/90 transition-all cursor-pointer"
                  >
                    Create Plan
                  </button>
                </div>
              )}

              <div className="space-y-1.5">
                {premiumPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] px-4 py-4 flex items-center justify-between hover:border-white/[0.08] transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#eab308]/[0.12] flex items-center justify-center">
                        <Award size={18} className="text-[#eab308]" />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-white">{plan.name}</p>
                        <p className="text-[11px] text-[#3f3f46]">
                          ${plan.price_monthly}/mo · ${plan.price_yearly}/yr
                        </p>
                        {plan.features && plan.features.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {plan.features.map((f, i) => (
                              <span key={i} className="px-1.5 py-0.5 rounded-md bg-white/[0.04] text-[10px] text-[#71717a]">
                                {f}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeletePlan(plan.id)}
                      className="p-2 rounded-lg hover:bg-red-400/[0.08] text-[#52525b] hover:text-red-400 transition-all cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {premiumPlans.length === 0 && (
                  <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-8 text-center">
                    <Award size={32} className="mx-auto text-[#1a1a1a] mb-3" />
                    <p className="text-[13px] text-[#3f3f46]">No premium plans yet. Create one to get started.</p>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6 space-y-4">
                <h3 className="text-[14px] font-semibold text-white mb-1">Assign Premium to User</h3>
                <div className="relative">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#3f3f46]" />
                  <input
                    type="text"
                    value={premiumUserSearch}
                    onChange={(e) => {
                      setPremiumUserSearch(e.target.value);
                      setPremiumSelectedUser(null);
                    }}
                    placeholder="Search user by username..."
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] pl-10 pr-4 py-3 text-sm text-white placeholder:text-[#3f3f46] outline-none transition-all focus:border-white/[0.12] focus:bg-white/[0.05]"
                  />
                </div>
                {premiumUserSearch && !premiumSelectedUser && (
                  <div className="space-y-1.5">
                    {users
                      .filter((u) => u.username?.toLowerCase().includes(premiumUserSearch.toLowerCase()))
                      .slice(0, 10)
                      .map((user) => (
                        <button
                          key={user.id}
                          onClick={() => {
                            setPremiumSelectedUser(user.id);
                            setPremiumUserSearch(user.display_name || user.username);
                          }}
                          className="w-full rounded-xl border border-white/[0.04] bg-[#0a0a0a] px-4 py-3 flex items-center gap-3 hover:border-white/[0.08] transition-all cursor-pointer text-left"
                        >
                          {user.avatar_url ? (
                            <img src={assetUrl(user.avatar_url)} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-[11px] font-bold text-[#52525b]">
                              {(user.display_name || user.username || "?")[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="text-[13px] font-medium text-white">{user.display_name || user.username}</p>
                            <p className="text-[11px] text-[#3f3f46]">@{user.username}</p>
                          </div>
                        </button>
                      ))}
                  </div>
                )}
                {premiumSelectedUser && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] text-white font-medium">Selected user</p>
                      <button
                        onClick={() => setPremiumSelectedUser(null)}
                        className="text-[12px] text-[#52525b] hover:text-white transition-colors cursor-pointer"
                      >
                        Change
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-2 block">Plan</label>
                        <select
                          value={premiumSelectedPlan}
                          onChange={(e) => setPremiumSelectedPlan(e.target.value)}
                          className={cn(inputClass, "appearance-none cursor-pointer")}
                        >
                          <option value="">Select plan...</option>
                          {premiumPlans.map((plan) => (
                            <option key={plan.id} value={plan.id}>{plan.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-2 block">Expires At</label>
                        <input
                          type="date"
                          value={premiumExpiry}
                          onChange={(e) => setPremiumExpiry(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleAssignPremium}
                      disabled={!premiumSelectedPlan || !premiumExpiry}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black text-[13px] font-bold hover:bg-white/90 transition-all disabled:opacity-40 cursor-pointer"
                    >
                      Assign Premium
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* SYSTEM TAB */}
          {activeTab === "system" && (
            <>
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-white">System</h2>
                <p className="text-[13px] text-[#52525b] mt-1">Platform statistics and maintenance.</p>
              </div>

              {/* Stats */}
              {sysStats && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Total Users", value: sysStats.totalUsers || 0 },
                    { label: "Total Profiles", value: sysStats.totalProfiles || 0 },
                    { label: "Total Views", value: sysStats.totalViews || 0 },
                    { label: "Total Links", value: sysStats.totalLinks || 0 },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-5">
                      <p className="text-2xl font-bold text-white">{s.value.toLocaleString()}</p>
                      <p className="text-[11px] text-[#52525b]">{s.label}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Health */}
              {sysHealth && (
                <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity size={16} className="text-emerald-400" />
                    <h3 className="text-[14px] font-semibold text-white">Health Dashboard</h3>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <p className="text-[11px] text-[#52525b] mb-1">Database Size</p>
                      <p className="text-[14px] text-white font-medium">{sysHealth.dbSizeFormatted || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-[#52525b] mb-1">Uptime</p>
                      <p className="text-[14px] text-white font-medium">{typeof sysHealth.uptime === 'number' ? `${Math.floor(sysHealth.uptime / 3600)}h ${Math.floor((sysHealth.uptime % 3600) / 60)}m` : "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-[#52525b] mb-1">Memory (RSS)</p>
                      <p className="text-[14px] text-white font-medium">{sysHealth.memory?.rss || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-[#52525b] mb-1">Heap Used</p>
                      <p className="text-[14px] text-white font-medium">{sysHealth.memory?.heapUsed || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-[#52525b] mb-1">Node Version</p>
                      <p className="text-[14px] text-white font-medium">{sysHealth.nodeVersion || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-[#52525b] mb-1">Platform</p>
                      <p className="text-[14px] text-white font-medium">{sysHealth.platform || "N/A"}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Maintenance */}
              <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-[14px] font-semibold text-white mb-1">Maintenance Mode</h3>
                    <p className="text-[12px] text-[#3f3f46]">Temporarily disable public access to the site.</p>
                  </div>
                  <button
                    onClick={handleToggleMaintenance}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[13px] font-semibold transition-all cursor-pointer",
                      maintenanceMode
                        ? "bg-red-500 text-white hover:bg-red-600"
                        : "bg-white/[0.04] text-[#a1a1aa] hover:bg-white/[0.08]"
                    )}
                  >
                    {maintenanceMode ? "Disable" : "Enable"}
                  </button>
                </div>
              </div>

              {/* Feature Profile */}
              <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6">
                <h3 className="text-[14px] font-semibold text-white mb-1">Feature Profile</h3>
                <p className="text-[12px] text-[#3f3f46] mb-4">Feature a profile on the discovery page.</p>
                <div className="flex gap-2">
                  <input
                    value={featureProfileId}
                    onChange={(e) => setFeatureProfileId(e.target.value)}
                    placeholder="Profile ID"
                    className={cn(inputClass, "flex-1")}
                  />
                  <button
                    onClick={handleFeatureProfile}
                    disabled={!featureProfileId.trim()}
                    className="px-4 py-2.5 rounded-xl bg-white text-black text-[13px] font-bold hover:bg-white/90 transition-all disabled:opacity-40 cursor-pointer shrink-0"
                  >
                    Feature
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
