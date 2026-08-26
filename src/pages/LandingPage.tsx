import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Eye, Link2, Award, Sparkles, Palette, BarChart3, Shield, Globe, Zap } from "lucide-react";

interface Leader {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  view_count: number;
  link_count: number;
  badge_count: number;
}

function StarField() {
  const [stars] = useState(() =>
    Array.from({ length: 80 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.4 + 0.1,
      duration: Math.random() * 4 + 3,
      delay: Math.random() * 5,
    }))
  );
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {stars.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
            animation: `glow-pulse ${s.duration}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function FadeIn({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <div className={className} style={{ opacity: 1, animation: `fadeIn 0.5s cubic-bezier(0.16,1,0.3,1) ${delay}ms both` }}>
      {children}
    </div>
  );
}

const RANK_COLORS: Record<number, string> = {
  0: "from-amber-400 to-amber-600",
  1: "from-zinc-300 to-zinc-400",
  2: "from-orange-400 to-orange-600",
};

const FEATURES = [
  {
    icon: Palette,
    title: "Custom Themes",
    description: "Full control over colors, fonts, backgrounds, and layout.",
    color: "#8b5cf6",
  },
  {
    icon: Link2,
    title: "Smart Links",
    description: "Groups, scheduling, password protection, and click tracking.",
    color: "#3b82f6",
  },
  {
    icon: Sparkles,
    title: "Effects & Music",
    description: "Particles, snow, matrix rain, audio visualizers, and more.",
    color: "#ec4899",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Real-time views, device stats, countries, and conversion rates.",
    color: "#22c55e",
  },
  {
    icon: Shield,
    title: "Admin Tools",
    description: "User management, audit logs, announcements, and moderation.",
    color: "#f59e0b",
  },
  {
    icon: Globe,
    title: "Discovery",
    description: "Trending profiles, featured sections, and public directory.",
    color: "#06b6d4",
  },
];

export default function LandingPage() {
  const [leaders, setLeaders] = useState<Leader[]>([]);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((d) => { if (d?.data) setLeaders(d.data); })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden">
      <StarField />

      <nav className="relative z-10 flex items-center justify-between max-w-5xl mx-auto px-5 py-5">
        <span className="text-[18px] tracking-tight">
          <span className="font-extrabold text-white">kio</span>
          <span className="font-medium text-[#3f3f46]">.lol</span>
        </span>
        <div className="flex items-center gap-2">
          <Link to="/login" className="px-4 py-2 rounded-full text-[13px] font-medium text-[#a1a1aa] hover:text-white transition-colors">
            Sign in
          </Link>
          <Link to="/register" className="px-4 py-2 rounded-full bg-white text-black text-[13px] font-bold hover:bg-white/90 transition-all">
            Get started
          </Link>
        </div>
      </nav>

      <section className="relative z-10 max-w-3xl mx-auto px-5 pt-16 pb-20 sm:pt-24 sm:pb-28 flex flex-col items-center text-center gap-8">
        <FadeIn>
          <div className="mb-2">
            <span className="inline-block px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-[11px] font-medium text-[#71717a] mb-5">Now in beta</span>
          </div>
          <h1 className="text-[2.2rem] sm:text-6xl md:text-[4.5rem] font-extrabold tracking-[-0.04em] leading-[1.05]">
            Your link
            <br />
            to{" "}
            <span className="bg-gradient-to-r from-[#8b5cf6] via-[#a78bfa] to-[#c084fc] bg-clip-text text-transparent">
              everything.
            </span>
          </h1>
          <p className="text-[15px] text-[#52525b] mt-4 max-w-md mx-auto leading-relaxed">
            Build a clean, minimal profile page. Share all your links, socials, and content in one place.
          </p>
        </FadeIn>

        <FadeIn delay={100}>
          <div className="flex items-center gap-3">
            <Link to="/login" className="px-6 py-3 rounded-full border border-white/10 text-sm font-medium text-white hover:bg-white/[0.05] transition-all">
              Sign in
            </Link>
            <Link to="/register" className="px-6 py-3 rounded-full bg-white text-black text-sm font-bold hover:bg-white/90 transition-all">
              Get started
            </Link>
          </div>
        </FadeIn>

        <FadeIn delay={200} className="mt-4">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-[12px] text-[#3f3f46]">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" /> Free forever</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-violet-400/60" /> Custom themes</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400/60" /> Discord integration</span>
          </div>
        </FadeIn>
      </section>

      <section className="relative z-10 max-w-5xl mx-auto px-5 pb-20">
        <FadeIn>
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">Everything you need</h2>
            <p className="text-[14px] text-[#52525b] mt-2">Powerful features to build your perfect profile</p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FEATURES.map((f, i) => (
            <FadeIn key={f.title} delay={i * 60}>
              <div className="p-5 rounded-2xl border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-300 group">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: `${f.color}15` }}
                >
                  <f.icon size={18} style={{ color: f.color }} />
                </div>
                <h3 className="text-[14px] font-semibold text-white mb-1">{f.title}</h3>
                <p className="text-[12px] text-[#52525b] leading-relaxed">{f.description}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {leaders.length > 0 && (
        <section className="relative z-10 max-w-2xl mx-auto px-5 pb-24">
          <FadeIn>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-extrabold tracking-tight text-white">Leaderboard</h2>
              <p className="text-[13px] text-[#52525b] mt-1.5">Most popular profiles on kio.lol</p>
            </div>
          </FadeIn>

          <FadeIn delay={150}>
            <div className="space-y-2">
              {leaders.map((l, i) => (
                <Link
                  key={l.id}
                  to={`/${l.username}`}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 hover:scale-[1.01] hover:bg-white/[0.04] group bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08]"
                >
                  <span
                    className={`w-8 h-8 rounded-xl bg-gradient-to-br ${RANK_COLORS[i] || "bg-white/[0.06]"} flex items-center justify-center text-[12px] font-bold text-white shrink-0 shadow-lg`}
                  >
                    {i + 1}
                  </span>

                  {l.avatar_url ? (
                    <img src={l.avatar_url} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center shrink-0 border border-white/[0.04]">
                      <span className="text-[14px] font-bold text-violet-400">{(l.display_name || l.username)[0]?.toUpperCase()}</span>
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-white leading-tight truncate">
                      {l.display_name || l.username}
                    </p>
                    <p className="text-[11px] text-[#52525b] leading-tight truncate">@{l.username}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {l.badge_count > 0 && (
                      <span className="flex items-center gap-1 text-[10px] text-amber-400">
                        <Award size={11} />
                        {l.badge_count}
                      </span>
                    )}
                    {l.link_count > 0 && (
                      <span className="flex items-center gap-1 text-[10px] text-[#52525b]">
                        <Link2 size={11} />
                        {l.link_count}
                      </span>
                    )}
                    {l.view_count > 0 && (
                      <span className="flex items-center gap-1 text-[11px] text-[#71717a] font-medium tabular-nums">
                        <Eye size={12} />
                        {l.view_count.toLocaleString()}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </FadeIn>
        </section>
      )}

      <section className="relative z-10 max-w-3xl mx-auto px-5 pb-20 text-center">
        <FadeIn>
          <div className="p-8 sm:p-12 rounded-3xl border border-white/[0.06] bg-white/[0.02]">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-3">Ready to build your profile?</h2>
            <p className="text-[14px] text-[#52525b] mb-6 max-w-md mx-auto">Join kio.lol and create your link-in-bio page in minutes.</p>
            <Link to="/register" className="inline-flex px-8 py-3.5 rounded-full bg-white text-black text-[14px] font-bold hover:bg-white/90 transition-all">
              Get started for free
            </Link>
          </div>
        </FadeIn>
      </section>

      <footer className="relative z-10 border-t border-white/[0.04] py-8">
        <div className="max-w-5xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-[14px] tracking-tight">
              <span className="font-extrabold text-white">kio</span>
              <span className="font-medium text-[#3f3f46]">.lol</span>
            </span>
            <span className="text-[11px] text-[#3f3f46]">&copy; {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-4 text-[12px] text-[#52525b]">
            <Link to="/legal/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link to="/legal/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link to="/legal/dmca" className="hover:text-white transition-colors">DMCA</Link>
            <Link to="/discover" className="hover:text-white transition-colors">Discover</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
