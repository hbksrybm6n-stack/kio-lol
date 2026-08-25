import { useState } from "react";
import { Link } from "react-router-dom";

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

export default function LandingPage() {
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
    </div>
  );
}
