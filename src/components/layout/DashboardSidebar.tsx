import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Palette,
  Link2,
  Share2,
  Image,
  Music,
  Sparkles,
  Award,
  MessageSquare,
  LayoutTemplate,
  BarChart3,
  LayoutGrid,
  Settings,
  LogOut,
  Shield,
  UserCog,
  X,
  CircleUserRound,
  FolderOpen,
  Type,
  MousePointer2,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

interface DashboardSidebarProps {
  username?: string;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const NAV_SECTIONS = [
  {
    label: "PROFILE",
    items: [
      { to: "/dashboard", icon: LayoutDashboard, label: "Overview", end: true },
      { to: "/dashboard/myprofile", icon: CircleUserRound, label: "My Profile" },
      { to: "/dashboard/profile", icon: UserCog, label: "Edit Profile" },
      { to: "/dashboard/appearance", icon: Palette, label: "Appearance" },
      { to: "/dashboard/assets", icon: FolderOpen, label: "Assets" },
      { to: "/dashboard/fonts", icon: Type, label: "Fonts" },
      { to: "/dashboard/cursors", icon: MousePointer2, label: "Cursors" },
      { to: "/dashboard/links", icon: Link2, label: "Links" },
      { to: "/dashboard/socials", icon: Share2, label: "Socials" },
      { to: "/dashboard/background", icon: Image, label: "Background" },
      { to: "/dashboard/music", icon: Music, label: "Music" },
      { to: "/dashboard/effects", icon: Sparkles, label: "Effects" },
      { to: "/dashboard/badges", icon: Award, label: "Badges" },
      { to: "/dashboard/discord", icon: MessageSquare, label: "Discord" },
      { to: "/dashboard/widgets", icon: LayoutTemplate, label: "Widgets" },
    ],
  },
  {
    label: "INSIGHTS",
    items: [
      { to: "/dashboard/analytics", icon: BarChart3, label: "Analytics" },
    ],
  },
  {
    label: "DISCOVER",
    items: [
      { to: "/dashboard/templates", icon: LayoutGrid, label: "Templates" },
    ],
  },
  {
    label: "ACCOUNT",
    items: [
      { to: "/dashboard/settings", icon: Settings, label: "Settings" },
      { to: "/dashboard/account", icon: UserCog, label: "Account" },
    ],
  },
];

export default function DashboardSidebar({
  username,
  mobileOpen,
  onMobileClose,
}: DashboardSidebarProps) {
  const signOut = useAuthStore((s) => s.signOut);
  const profile = useAuthStore((s) => (s as any).profile);

  const sidebar = (
    <nav className="flex flex-col h-full">
      <div className="flex items-center px-5 h-14 shrink-0">
        <span className="text-[15px] tracking-tight">
          <span className="font-extrabold text-white">kio</span>
          <span className="font-medium text-[#3f3f46]">.lol</span>
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4 pt-1">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mt-6 first:mt-2">
            <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#3f3f46]">
              {section.label}
            </div>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={onMobileClose}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all",
                        isActive
                          ? "bg-white/[0.06] text-white font-medium"
                          : "text-[#52525b] hover:text-[#a1a1aa] hover:bg-white/[0.03]"
                      )
                    }
                  >
                    <item.icon className="w-4 h-4 shrink-0 opacity-60" />
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {profile?.is_admin && (
          <div className="mt-6">
            <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#3f3f46]">
              ADMIN
            </div>
            <ul className="space-y-0.5">
              <li>
                <NavLink
                  to="/admin"
                  onClick={onMobileClose}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all",
                      isActive
                        ? "bg-violet-400/[0.12] text-violet-400 font-medium"
                        : "text-[#52525b] hover:text-[#a1a1aa] hover:bg-white/[0.03]"
                    )
                  }
                >
                  <Shield className="w-4 h-4 shrink-0 opacity-60" />
                  Admin Panel
                </NavLink>
              </li>
            </ul>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-white/[0.04] px-3 py-3 space-y-0.5">
        {username && (
          <NavLink
            to={`/${username}`}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-[#52525b] hover:text-[#a1a1aa] hover:bg-white/[0.03] transition-all"
          >
            View Profile
          </NavLink>
        )}
        <button
          onClick={() => signOut()}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[13px] text-[#52525b] hover:text-red-400 hover:bg-red-400/[0.06] transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0 opacity-60" />
          Sign Out
        </button>
      </div>
    </nav>
  );

  return (
    <>
      <aside className="hidden lg:flex flex-col w-[220px] shrink-0 h-screen sticky top-0 bg-[#050505] border-r border-white/[0.04]">
        {sidebar}
      </aside>

      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={onMobileClose}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-[260px] bg-[#050505] border-r border-white/[0.04] lg:hidden">
            <button
              onClick={onMobileClose}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-lg text-[#52525b] hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer z-50"
            >
              <X size={16} />
            </button>
            {sidebar}
          </aside>
        </>
      )}
    </>
  );
}
