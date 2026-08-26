import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Eye, Link2, Ghost, ChevronLeft, ChevronRight } from "lucide-react";
import { discoveryApi } from "@/lib/api";
import { formatNumber } from "@/lib/utils";

interface DiscoveryProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  view_count: number;
  link_count: number;
}

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
};

function ShimmerCard() {
  return (
    <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-5 animate-shimmer">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-white/[0.04]" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-24 rounded bg-white/[0.04]" />
          <div className="h-2.5 w-16 rounded bg-white/[0.04]" />
        </div>
      </div>
      <div className="flex gap-4 mt-4">
        <div className="h-2.5 w-12 rounded bg-white/[0.04]" />
        <div className="h-2.5 w-12 rounded bg-white/[0.04]" />
      </div>
    </div>
  );
}

function ProfileCard({ profile, delay }: { profile: DiscoveryProfile; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        to={`/${profile.username}`}
        className="block rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-5 hover:border-white/[0.08] hover:bg-white/[0.02] transition-all duration-300 group"
      >
        <div className="flex items-center gap-3">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="w-11 h-11 rounded-full object-cover"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-white/[0.06] flex items-center justify-center text-sm font-bold text-[#52525b]">
              {(profile.display_name || profile.username || "?")[0].toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-white truncate group-hover:text-white transition-colors">
              {profile.display_name || profile.username}
            </p>
            <p className="text-[11px] text-[#3f3f46] truncate">@{profile.username}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-4 text-[11px] text-[#52525b]">
          <span className="flex items-center gap-1">
            <Eye size={12} className="opacity-50" />
            {formatNumber(profile.view_count || 0)}
          </span>
          <span className="flex items-center gap-1">
            <Link2 size={12} className="opacity-50" />
            {formatNumber(profile.link_count || 0)}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Ghost className="h-8 w-8 text-[#1a1a1a] mb-3" />
      <p className="text-[13px] text-[#3f3f46]">{text}</p>
    </div>
  );
}

export default function DiscoveryPage() {
  const [trending, setTrending] = useState<DiscoveryProfile[]>([]);
  const [featured, setFeatured] = useState<DiscoveryProfile[]>([]);
  const [recent, setRecent] = useState<DiscoveryProfile[]>([]);
  const [directory, setDirectory] = useState<DiscoveryProfile[]>([]);
  const [directoryPage, setDirectoryPage] = useState(1);
  const [directoryTotal, setDirectoryTotal] = useState(0);
  const [directorySearch, setDirectorySearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [directoryLoading, setDirectoryLoading] = useState(true);

  useEffect(() => {
    loadSections();
  }, []);

  useEffect(() => {
    loadDirectory();
  }, [directoryPage, directorySearch]);

  const loadSections = async () => {
    setLoading(true);
    try {
      const [t, f, r] = await Promise.all([
        discoveryApi.getTrending().catch(() => []),
        discoveryApi.getFeatured().catch(() => []),
        discoveryApi.getRecent().catch(() => []),
      ]);
      setTrending(t || []);
      setFeatured(f || []);
      setRecent(r || []);
    } catch {
      // empty
    } finally {
      setLoading(false);
    }
  };

  const loadDirectory = async () => {
    setDirectoryLoading(true);
    try {
      const data = await discoveryApi.getDirectory(directoryPage, directorySearch);
      setDirectory(data.profiles || []);
      setDirectoryTotal(data.total || 0);
    } catch {
      // empty
    } finally {
      setDirectoryLoading(false);
    }
  };

  const handleSearch = useCallback(() => {
    setDirectorySearch(searchQuery);
    setDirectoryPage(1);
  }, [searchQuery]);

  const totalPages = Math.ceil(directoryTotal / 24);

  return (
    <div className="min-h-screen bg-[#050505]">
      <div className="max-w-[1100px] mx-auto px-6 py-12">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-3">
            Discover
          </h1>
          <p className="text-[15px] text-[#52525b] mb-8">
            Explore profiles on kio.lol
          </p>
          <div className="max-w-md mx-auto relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3f3f46]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search profiles..."
              className="w-full rounded-2xl border border-white/[0.06] bg-[#0a0a0a] pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-[#3f3f46] outline-none transition-all focus:border-white/[0.12] focus:bg-[#111111]"
            />
          </div>
        </motion.div>

        {/* Trending */}
        <Section title="Trending Profiles" loading={loading} empty={trending.length === 0} emptyText="No trending profiles yet">
          {trending.map((p, i) => (
            <ProfileCard key={p.id} profile={p} delay={i * 0.05} />
          ))}
        </Section>

        {/* Featured */}
        <Section title="Featured Profiles" loading={loading} empty={featured.length === 0} emptyText="No featured profiles yet">
          {featured.map((p, i) => (
            <ProfileCard key={p.id} profile={p} delay={i * 0.05} />
          ))}
        </Section>

        {/* Recently Created */}
        <Section title="Recently Created" loading={loading} empty={recent.length === 0} emptyText="No profiles yet">
          {recent.map((p, i) => (
            <ProfileCard key={p.id} profile={p} delay={i * 0.05} />
          ))}
        </Section>

        {/* Directory */}
        <div className="mt-16">
          <h2 className="text-lg font-extrabold tracking-tight text-white mb-1">Directory</h2>
          <p className="text-[13px] text-[#52525b] mb-5">Browse all public profiles.</p>

          <div className="relative max-w-sm mb-6">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#3f3f46]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search directory..."
              className="w-full rounded-xl border border-white/[0.06] bg-[#0a0a0a] pl-10 pr-4 py-3 text-sm text-white placeholder:text-[#3f3f46] outline-none transition-all focus:border-white/[0.12]"
            />
          </div>

          {directoryLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <ShimmerCard key={i} />
              ))}
            </div>
          ) : directory.length === 0 ? (
            <EmptyState text="No profiles found" />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {directory.map((p, i) => (
                  <ProfileCard key={p.id} profile={p} delay={i * 0.03} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-8">
                  <button
                    onClick={() => setDirectoryPage((p) => Math.max(1, p - 1))}
                    disabled={directoryPage === 1}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg border border-white/[0.06] bg-[#0a0a0a] text-[13px] text-[#52525b] hover:text-white hover:bg-white/[0.04] transition-all disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <span className="text-[13px] text-[#52525b]">
                    {directoryPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setDirectoryPage((p) => Math.min(totalPages, p + 1))}
                    disabled={directoryPage === totalPages}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg border border-white/[0.06] bg-[#0a0a0a] text-[13px] text-[#52525b] hover:text-white hover:bg-white/[0.04] transition-all disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  loading,
  empty,
  emptyText,
  children,
}: {
  title: string;
  loading: boolean;
  empty: boolean;
  emptyText: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-12">
      <h2 className="text-lg font-extrabold tracking-tight text-white mb-1">{title}</h2>
      <div className="h-px bg-white/[0.04] mb-5" />
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <ShimmerCard key={i} />
          ))}
        </div>
      ) : empty ? (
        <EmptyState text={emptyText} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {children}
        </div>
      )}
    </div>
  );
}
