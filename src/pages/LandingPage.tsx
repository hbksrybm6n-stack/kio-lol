import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { leaderboardApi } from "@/lib/api";
import { Eye, Link2, Award } from "lucide-react";

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
    Array.from({ length: 60 }, () => ({
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

const RANK_GLOW: Record<number, string> = {
  0: "shadow-amber-500/30",
  1: "shadow-zinc-400/20",
  2: "shadow-orange-500/20",
};

export default function LandingPage() {
  const [leaders, setLeaders] = useState<Leader[]>([]);

  useEffect(() => {
    leaderboardApi.getTop().then(setLeaders).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden">
      <StarField />

      <section className="relative z-10 max-w-3xl mx-auto px-5 min-h-screen flex flex-col items-center justify-center text-center gap-8">
        <FadeIn>
          <h1 className="text-[2.5rem] sm:text-6xl md:text-[4.5rem] font-extrabold tracking-[-0.04em] leading-[1.0]">
            Your link
            <br />
            to{" "}
            <span className="bg-gradient-to-r from-[#8b5cf6] via-[#a78bfa] to-[#c084fc] bg-clip-text text-transparent">
              everything.
            </span>
          </h1>
        </FadeIn>

        <FadeIn delay={100}>
          <div className="flex items-center gap-3">
            <Link to="/login" className="px-6 py-3 rounded-full border border-white/10 text-sm font-medium text-white hover:bg-white/[0.05] transition-all">
              Sign in
            </Link>
            <Link to="/register" className="px-6 py-3 rounded-full bg-white text-black text-sm font-bold hover:bg-white/90 transition-all">
              Sign up
            </Link>
          </div>
        </FadeIn>
      </section>

      {leaders.length > 0 && (
        <section className="relative z-10 max-w-2xl mx-auto px-5 pb-24">
          <FadeIn>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-extrabold tracking-tight text-white">Leaderboard</h2>
              <p className="text-[13px] text-[#52525b] mt-1.5">Top profiles by views</p>
            </div>
          </FadeIn>

          <FadeIn delay={150}>
            <div className="space-y-2">
              {leaders.map((l, i) => (
                <Link
                  key={l.id}
                  to={`/${l.username}`}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 hover:scale-[1.01] hover:bg-white/[0.04] group ${
                    i < 3 ? `bg-white/[0.03] shadow-lg ${RANK_GLOW[i] || ""}` : "bg-white/[0.015]"
                  }`}
                >
                  <span className={`w-7 h-7 rounded-lg bg-gradient-to-br ${RANK_COLORS[i] || "bg-white/[0.06]"} flex items-center justify-center text-[11px] font-bold text-white shrink-0 shadow-md`}>
                    {i + 1}
                  </span>

                  {l.avatar_url ? (
                    <img src={l.avatar_url} alt="" className="w-9 h-9 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center shrink-0">
                      <span className="text-[13px] font-bold text-violet-400">{l.display_name?.[0]?.toUpperCase() || l.username[0]?.toUpperCase()}</span>
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
                    <span className="flex items-center gap-1 text-[11px] text-[#71717a] font-medium tabular-nums">
                      <Eye size={12} />
                      {l.view_count.toLocaleString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </FadeIn>
        </section>
      )}
    </div>
  );
}
