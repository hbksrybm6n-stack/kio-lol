import { useState, useMemo } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { Menu, ExternalLink } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import DashboardSidebar from "@/components/layout/DashboardSidebar";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/profile": "Profile",
  "/dashboard/appearance": "Appearance",
  "/dashboard/links": "Links",
  "/dashboard/socials": "Socials",
  "/dashboard/background": "Background",
  "/dashboard/music": "Music",
  "/dashboard/effects": "Effects",
  "/dashboard/badges": "Badges",
  "/dashboard/discord": "Discord",
  "/dashboard/widgets": "Widgets",
  "/dashboard/analytics": "Analytics",
  "/dashboard/templates": "Templates",
  "/dashboard/settings": "Settings",
  "/dashboard/account": "Account",
};

function getTitleFromPathname(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 2) {
    const sub = "/" + segments.slice(1).join("/");
    if (PAGE_TITLES[sub]) return PAGE_TITLES[sub];
  }
  return "Dashboard";
}

export default function DashboardLayout() {
  const { user, profile, loading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const pageTitle = useMemo(
    () => getTitleFromPathname(location.pathname),
    [location.pathname]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#050505]">
        <div className="w-5 h-5 border-2 border-white/10 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    navigate("/login", { replace: true });
    return null;
  }

  if (!profile) {
    navigate("/setup", { replace: true });
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#050505]">
      <DashboardSidebar
        username={profile.username}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex flex-col flex-1 min-w-0">
        <header className="flex items-center h-14 px-4 lg:px-6 border-b border-white/[0.04] shrink-0 bg-[#050505]/80 backdrop-blur-xl">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-[#52525b] hover:text-white hover:bg-white/[0.04] transition-all lg:hidden cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <h1 className="ml-3 lg:ml-0 text-[14px] font-semibold text-white tracking-tight">
            {pageTitle}
          </h1>

          <div className="flex items-center gap-3 ml-auto">
            <Link
              to={`/${profile.username}`}
              target="_blank"
              className="hidden sm:flex items-center gap-1.5 text-[12px] font-medium text-[#52525b] hover:text-white transition-colors"
            >
              View Profile
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1100px] mx-auto px-6 lg:px-8 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
