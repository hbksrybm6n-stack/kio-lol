import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ChevronDown } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

export default function Header() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => {
    if (!userMenuOpen) return;
    const close = () => setUserMenuOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [userMenuOpen]);

  return (
    <>
      <header className={`fixed top-0 z-50 w-full transition-all duration-300 ${scrolled ? "bg-[#050505]/80 backdrop-blur-xl border-b border-white/[0.04]" : "bg-transparent"}`}>
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 lg:px-8">
          <Link to="/" className="flex items-center gap-0.5 shrink-0">
            <span className="text-[15px] font-extrabold tracking-tight text-white">kio</span>
            <span className="text-[15px] font-medium text-[#3f3f46]">.lol</span>
          </Link>

          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <div className="relative">
                <button onClick={(e) => { e.stopPropagation(); setUserMenuOpen(!userMenuOpen); }} className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/[0.04] transition-all cursor-pointer">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-[10px] font-bold text-white">
                    {user.username?.[0]?.toUpperCase() || "U"}
                  </div>
                  <span className="text-[12px] text-white font-medium">{user.username}</span>
                  <ChevronDown size={11} className={`text-[#52525b] transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-44 rounded-2xl border border-white/[0.06] bg-[#0a0a0a] shadow-2xl overflow-hidden z-50">
                    <Link to="/dashboard" className="block px-4 py-2.5 text-[12px] text-[#a1a1aa] hover:text-white hover:bg-white/[0.04] transition-colors" onClick={() => setUserMenuOpen(false)}>Dashboard</Link>
                    <Link to={`/${user.username}`} className="block px-4 py-2.5 text-[12px] text-[#a1a1aa] hover:text-white hover:bg-white/[0.04] transition-colors" onClick={() => setUserMenuOpen(false)}>My Profile</Link>
                    <div className="border-t border-white/[0.04]" />
                    <button onClick={() => { signOut(); setUserMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-[12px] text-red-400 hover:bg-white/[0.04] transition-colors cursor-pointer">Logout</button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="px-3 py-1.5 text-[12px] font-medium text-[#52525b] hover:text-white transition-colors">Sign in</Link>
                <Link to="/register" className="px-4 py-1.5 text-[12px] font-bold text-black bg-white rounded-full hover:bg-white/90 transition-colors">Sign up</Link>
              </>
            )}
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-1.5 text-[#52525b] hover:text-white transition-colors">
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-14 inset-x-0 bg-[#050505] border-b border-white/[0.04] animate-slide-in">
            <nav className="flex flex-col p-5 gap-1">
              <div className="my-2 border-t border-white/[0.04]" />
              {user ? (
                <>
                  <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="px-4 py-2.5 text-[13px] text-white font-medium rounded-xl">Dashboard</Link>
                  <button onClick={() => { signOut(); setMobileOpen(false); }} className="px-4 py-2.5 text-[13px] text-red-400 text-left rounded-xl">Logout</button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="px-4 py-2.5 text-[13px] text-[#52525b] rounded-xl">Sign in</Link>
                  <Link to="/register" onClick={() => setMobileOpen(false)} className="px-4 py-2.5 text-[13px] text-white font-bold bg-white/10 rounded-xl text-center">Sign up</Link>
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
