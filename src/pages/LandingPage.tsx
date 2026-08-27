import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Eye, Link2, Award, Sparkles, Palette, BarChart3, Shield, Globe, Zap, ChevronDown, Check, Crown, Infinity, Headphones, MousePointer2 } from "lucide-react";

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
  { icon: Palette, title: "Custom Themes", description: "Full control over colors, fonts, backgrounds, and layout.", color: "#8b5cf6" },
  { icon: Link2, title: "Smart Links", description: "Groups, scheduling, password protection, and click tracking.", color: "#3b82f6" },
  { icon: Sparkles, title: "Effects & Music", description: "Particles, snow, matrix rain, audio visualizers, and more.", color: "#ec4899" },
  { icon: BarChart3, title: "Analytics", description: "Real-time views, device stats, countries, and conversion rates.", color: "#22c55e" },
  { icon: Shield, title: "Admin Tools", description: "User management, audit logs, announcements, and moderation.", color: "#f59e0b" },
  { icon: Globe, title: "Discovery", description: "Trending profiles, featured sections, and public directory.", color: "#06b6d4" },
  { icon: Headphones, title: "Music Player", description: "Upload tracks, audio visualizer, playlist support, and autoplay.", color: "#f43f5e" },
  { icon: MousePointer2, title: "Custom Cursor", description: "Upload your own cursor with trails, glow, and particle effects.", color: "#a855f7" },
  { icon: Zap, title: "Premium Effects", description: "Animated gradients, scanlines, noise, vignette, and 3D tilt.", color: "#eab308" },
];

const TEMPLATES_PREVIEW = [
  { name: "Midnight", category: "dark", colors: ["#1a1a2e", "#16213e", "#0f3460"], uses: 1240 },
  { name: "Neon Pulse", category: "neon", colors: ["#0a0a0a", "#ff006e", "#8338ec"], uses: 890 },
  { name: "Clean Slate", category: "minimal", colors: ["#f8f9fa", "#e9ecef", "#dee2e6"], uses: 2100 },
  { name: "Ocean Deep", category: "nature", colors: ["#023e8a", "#0077b6", "#00b4d8"], uses: 560 },
];

const PRICING_PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Everything you need to get started.",
    features: [
      "Profile page",
      "Basic links & socials",
      "Basic backgrounds",
      "Music player",
      "Basic badges",
      "Basic analytics",
      "Community templates",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Premium",
    price: "$4.99",
    period: "/month",
    description: "Unlock the full power of your profile.",
    features: [
      "Everything in Free",
      "Video backgrounds",
      "Custom cursor",
      "Custom fonts (TTF/OTF/WOFF)",
      "Advanced effects",
      "Advanced analytics",
      "500 MB storage",
      "Premium templates",
      "Custom CSS",
      "Custom domain",
    ],
    cta: "Go Premium",
    highlighted: true,
  },
  {
    name: "Ultimate",
    price: "$9.99",
    period: "/month",
    description: "For creators who want it all.",
    features: [
      "Everything in Premium",
      "Multiple profiles",
      "Background rotation",
      "2 GB storage",
      "Priority support",
      "Early access features",
      "Template builder",
      "API access",
      "Verified badge",
      "Custom sections",
    ],
    cta: "Go Ultimate",
    highlighted: false,
  },
];

const FAQ_ITEMS = [
  {
    q: "What is kio.lol?",
    a: "kio.lol is a bio-profile platform where you can create a stunning profile page with custom links, backgrounds, music, effects, and more. Share your online presence with a single URL.",
  },
  {
    q: "Is it free to use?",
    a: "Yes! kio.lol is free forever. You get a profile, basic links, backgrounds, music, and analytics at no cost. Premium plans unlock advanced features like video backgrounds, custom cursors, and more.",
  },
  {
    q: "Can I use my own domain?",
    a: "Premium users can set up a custom domain for their profile page. Simply configure your DNS settings and we'll handle the rest.",
  },
  {
    q: "Can I upload my own music?",
    a: "Yes! Upload MP3, WAV, OGG, or M4A files. Your music plays automatically when visitors enter your profile. You can also add cover art.",
  },
  {
    q: "How do templates work?",
    a: "Browse our template gallery, preview any template, and apply it to your profile with one click. Template settings like colors, fonts, backgrounds, and effects are applied — your personal data stays intact.",
  },
  {
    q: "Can I create my own templates?",
    a: "Yes! Use our Template Builder to design custom templates. Save them, preview them, and publish them for others to use.",
  },
  {
    q: "What analytics are available?",
    a: "Track profile views, unique visitors, link clicks, social clicks, device types, browsers, countries, and referrers. Data is available in real-time with charts for daily, weekly, and monthly periods.",
  },
  {
    q: "Can I integrate Discord?",
    a: "Yes! Connect your Discord account to show your status, activity, and custom status on your profile. Our Discord bot tracks your presence in real-time.",
  },
];

function FAQItem({ item }: { item: { q: string; a: string } }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/[0.04] last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-5 text-left cursor-pointer"
      >
        <span className="text-[14px] font-medium text-white pr-4">{item.q}</span>
        <ChevronDown
          size={16}
          className={`text-[#52525b] shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: open ? "200px" : "0", opacity: open ? 1 : 0 }}
      >
        <p className="text-[13px] text-[#71717a] leading-relaxed pb-5">{item.a}</p>
      </div>
    </div>
  );
}

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
          <Link to="/discover" className="hidden sm:block px-4 py-2 rounded-full text-[13px] font-medium text-[#a1a1aa] hover:text-white transition-colors">
            Discover
          </Link>
          <Link to="/templates" className="hidden sm:block px-4 py-2 rounded-full text-[13px] font-medium text-[#a1a1aa] hover:text-white transition-colors">
            Templates
          </Link>
          <Link to="/login" className="px-4 py-2 rounded-full text-[13px] font-medium text-[#a1a1aa] hover:text-white transition-colors">
            Sign in
          </Link>
          <Link to="/register" className="px-4 py-2 rounded-full bg-white text-black text-[13px] font-bold hover:bg-white/90 transition-all">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
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

      {/* Features */}
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

      {/* Templates Preview */}
      <section className="relative z-10 max-w-5xl mx-auto px-5 pb-20">
        <FadeIn>
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">Templates</h2>
            <p className="text-[14px] text-[#52525b] mt-2">Choose from professionally designed templates</p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {TEMPLATES_PREVIEW.map((t, i) => (
            <FadeIn key={t.name} delay={i * 80}>
              <Link to="/templates" className="block rounded-xl border border-white/[0.04] bg-[#0a0a0a] overflow-hidden hover:border-white/[0.08] hover:bg-white/[0.02] transition-all group">
                <div className="h-28 relative overflow-hidden">
                  <div className="absolute inset-0 flex">
                    {t.colors.map((c, ci) => (
                      <div key={ci} className="flex-1" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
                <div className="p-3">
                  <p className="text-[13px] font-medium text-white">{t.name}</p>
                  <p className="text-[11px] text-[#52525b] capitalize">{t.category} · {t.uses.toLocaleString()} uses</p>
                </div>
              </Link>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={400}>
          <div className="text-center mt-6">
            <Link to="/templates" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 text-[13px] font-medium text-white hover:bg-white/[0.05] transition-all">
              Browse all templates
            </Link>
          </div>
        </FadeIn>
      </section>

      {/* Leaderboard */}
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
                    <p className="text-[13px] font-semibold text-white leading-tight truncate">{l.display_name || l.username}</p>
                    <p className="text-[11px] text-[#52525b] leading-tight truncate">@{l.username}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {l.badge_count > 0 && (
                      <span className="flex items-center gap-1 text-[10px] text-amber-400">
                        <Award size={11} />{l.badge_count}
                      </span>
                    )}
                    {l.link_count > 0 && (
                      <span className="flex items-center gap-1 text-[10px] text-[#52525b]">
                        <Link2 size={11} />{l.link_count}
                      </span>
                    )}
                    {l.view_count > 0 && (
                      <span className="flex items-center gap-1 text-[11px] text-[#71717a] font-medium tabular-nums">
                        <Eye size={12} />{l.view_count.toLocaleString()}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </FadeIn>
        </section>
      )}

      {/* Pricing */}
      <section className="relative z-10 max-w-5xl mx-auto px-5 pb-20">
        <FadeIn>
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">Simple pricing</h2>
            <p className="text-[14px] text-[#52525b] mt-2">Start free, upgrade when you need more</p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PRICING_PLANS.map((plan, i) => (
            <FadeIn key={plan.name} delay={i * 100}>
              <div className={`rounded-2xl border p-6 h-full flex flex-col ${plan.highlighted ? "border-violet-400/30 bg-violet-400/[0.04]" : "border-white/[0.04] bg-[#0a0a0a]"}`}>
                {plan.highlighted && (
                  <span className="inline-flex items-center gap-1 self-start px-2 py-0.5 rounded-full bg-violet-400/10 text-[10px] font-semibold text-violet-400 uppercase tracking-wider mb-4">
                    <Crown size={10} /> Popular
                  </span>
                )}
                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-2 mb-1">
                  <span className="text-3xl font-extrabold text-white">{plan.price}</span>
                  <span className="text-[13px] text-[#52525b]">{plan.period}</span>
                </div>
                <p className="text-[13px] text-[#71717a] mb-5">{plan.description}</p>
                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[12px] text-[#a1a1aa]">
                      <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className={`block text-center py-2.5 rounded-xl text-[13px] font-bold transition-all ${plan.highlighted ? "bg-white text-black hover:bg-white/90" : "bg-white/[0.06] text-white hover:bg-white/[0.1]"}`}
                >
                  {plan.cta}
                </Link>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="relative z-10 max-w-2xl mx-auto px-5 pb-20">
        <FadeIn>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold tracking-tight text-white">Frequently asked questions</h2>
            <p className="text-[14px] text-[#52525b] mt-2">Everything you need to know</p>
          </div>
        </FadeIn>

        <FadeIn delay={100}>
          <div className="rounded-2xl border border-white/[0.04] bg-[#0a0a0a] px-6">
            {FAQ_ITEMS.map((item) => (
              <FAQItem key={item.q} item={item} />
            ))}
          </div>
        </FadeIn>
      </section>

      {/* CTA */}
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

      {/* Footer */}
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
            <Link to="/templates" className="hover:text-white transition-colors">Templates</Link>
            <Link to="/discover" className="hover:text-white transition-colors">Discover</Link>
            <Link to="/legal/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link to="/legal/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link to="/legal/dmca" className="hover:text-white transition-colors">DMCA</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
