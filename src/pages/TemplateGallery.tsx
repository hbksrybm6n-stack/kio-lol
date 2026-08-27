import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Eye, Heart, Users, LayoutGrid, Star, Download } from "lucide-react";
import { templatesApi } from "@/lib/api";
import { cn, formatNumber } from "@/lib/utils";
import toast from "react-hot-toast";

const CATEGORIES = ["All", "Free", "Premium", "Popular", "New", "Anime", "Gaming", "Minimal", "Dark", "Neon", "Clean"];

interface TemplateItem {
  id: string;
  name: string;
  description: string;
  thumbnail_url: string;
  creator_id: string | null;
  is_public: boolean;
  uses_count: number;
  likes_count: number;
  created_at: string;
  config?: {
    primary_color?: string;
    secondary_color?: string;
    background_color?: string;
    accent_color?: string;
  };
  category?: string;
  is_premium?: boolean;
  creator_name?: string;
}

function extractColorConfig(config: any): { primary: string; secondary: string; background: string; accent: string } {
  let primary = "#8b5cf6";
  let secondary = "#06b6d4";
  let background = "#000000";
  let accent = "#a855f7";
  if (!config) return { primary, secondary, background, accent };
  primary = config.primary_color || config.primary || "#8b5cf6";
  secondary = config.secondary_color || config.secondary || "#06b6d4";
  background = config.background_color || config.background || "#000000";
  accent = config.accent_color || config.accent || "#a855f7";
  return { primary, secondary, background, accent };
}

function ShimmerCard() {
  return (
    <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] overflow-hidden animate-shimmer">
      <div className="h-36 bg-white/[0.03]" />
      <div className="p-4 space-y-2.5">
        <div className="h-3.5 w-28 rounded bg-white/[0.04]" />
        <div className="h-2.5 w-20 rounded bg-white/[0.04]" />
        <div className="flex gap-2 pt-1">
          <div className="h-7 flex-1 rounded-lg bg-white/[0.04]" />
          <div className="h-7 flex-1 rounded-lg bg-white/[0.04]" />
        </div>
      </div>
    </div>
  );
}

function TemplateCard({ template, delay, onApply }: { template: TemplateItem; delay: number; onApply: (id: string) => void }) {
  const colors = extractColorConfig(template.config);
  const isPremium = template.is_premium || false;
  const isNew = Date.now() - new Date(template.created_at).getTime() < 7 * 24 * 60 * 60 * 1000;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] overflow-hidden hover:border-white/[0.08] hover:bg-white/[0.02] transition-all duration-300 group flex flex-col"
    >
      <button
        onClick={() => onApply(template.id)}
        className="relative h-36 w-full cursor-pointer overflow-hidden text-left"
        title="Preview"
      >
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 50%, ${colors.background} 100%)`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute top-3 left-3 flex gap-1.5">
          {(isPremium || isNew) && (
            <span
              className={cn(
                "px-2 py-0.5 text-[10px] font-bold rounded-full backdrop-blur-sm",
                isPremium ? "bg-amber-400/[0.15] text-amber-300" : "bg-emerald-400/[0.15] text-emerald-300"
              )}
            >
              {isPremium ? "Premium" : "New"}
            </span>
          )}
          {template.is_public === false && (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-white/[0.12] text-white/70 backdrop-blur-sm">
              Free
            </span>
          )}
          {(template.category || "Minimal") && (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-black/40 text-white/80 backdrop-blur-sm">
              {template.category || "Minimal"}
            </span>
          )}
        </div>
        <div className="absolute inset-x-0 bottom-3 flex items-end justify-between px-3">
          <div className="flex gap-1.5">
            {[colors.primary, colors.secondary, colors.accent].map((c, i) => (
              <span key={i} className="w-5 h-5 rounded-full border border-white/20" style={{ background: c }} />
            ))}
          </div>
          <span className="flex items-center gap-1 text-[11px] text-white/80">
            <Eye size={12} /> Preview
          </span>
        </div>
      </button>

      <div className="flex flex-col flex-1 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-[13px] font-semibold text-white truncate">{template.name}</h3>
            <p className="text-[11px] text-[#3f3f46] truncate mt-0.5">
              by {template.creator_name || (template.creator_id ? `@${template.creator_id.slice(0, 8)}` : "kio.lol")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-2.5 text-[11px] text-[#52525b]">
          <span className="flex items-center gap-1">
            <Star size={11} className="opacity-50" /> {formatNumber(template.uses_count || 0)}
          </span>
          <span className="flex items-center gap-1">
            <Heart size={11} className="opacity-50" /> {formatNumber(template.likes_count || 0)}
          </span>
          <span className="flex items-center gap-1">
            <Users size={11} className="opacity-50" /> {formatNumber(template.uses_count || 0)}
          </span>
        </div>

        <div className="flex gap-2 mt-4 pt-3 border-t border-white/[0.04]">
          <button
            onClick={() => onApply(template.id)}
            className="flex items-center justify-center gap-1.5 flex-1 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[12px] font-medium text-[#a1a1aa] hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer"
          >
            <Eye size={12} /> Preview
          </button>
          <button
            onClick={() => onApply(template.id)}
            disabled={isPremium}
            className={cn(
              "flex items-center justify-center gap-1.5 flex-1 px-3 py-2 rounded-lg text-[12px] font-bold transition-all cursor-pointer",
              isPremium
                ? "bg-amber-400/[0.12] text-amber-300 hover:bg-amber-400/[0.2]"
                : "bg-white text-black hover:bg-white/90"
            )}
          >
            <Download size={12} /> Use Template
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function TemplateGallery() {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [applying, setApplying] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await templatesApi.list();
      const list = Array.isArray(data) ? data : data?.data || data?.templates || [];
      setTemplates(list);
    } catch {
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (id: string) => {
    setApplying(id);
    try {
      await templatesApi.apply(id);
      toast.success("Template applied to your profile");
    } catch {
      toast.error("Failed to apply template");
    } finally {
      setApplying(null);
    }
  };

  const filtered = templates.filter((t) => {
    const q = search.trim().toLowerCase();
    if (q && !t.name.toLowerCase().includes(q) && !(t.description || "").toLowerCase().includes(q)) return false;
    if (category === "All") return true;
    if (category === "Free") return !t.is_premium;
    if (category === "Premium") return !!t.is_premium;
    if (category === "Popular") return (t.uses_count || 0) >= 100;
    if (category === "New") {
      return Date.now() - new Date(t.created_at).getTime() < 7 * 24 * 60 * 60 * 1000;
    }
    const haystack = `${t.name} ${t.description || ""} ${t.category || ""} ${t.creator_name || ""}`.toLowerCase();
    return haystack.includes(category.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-[#050505]">
      <div className="max-w-[1100px] mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-8 h-8 rounded-lg bg-[#0a0a0a] border border-white/[0.04] flex items-center justify-center">
              <LayoutGrid size={16} className="text-[#8b5cf6]" />
            </span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-3">Template Gallery</h1>
          <p className="text-[15px] text-[#52525b] mb-8">
            Browse and apply beautiful templates to your kio.lol profile
          </p>
          <div className="max-w-md mx-auto relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3f3f46]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="w-full rounded-2xl border border-white/[0.06] bg-[#0a0a0a] pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-[#3f3f46] outline-none transition-all focus:border-white/[0.12] focus:bg-[#111111]"
            />
          </div>
        </motion.div>

        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all cursor-pointer",
                category === c
                  ? "bg-white text-black"
                  : "bg-white/[0.03] text-[#a1a1aa] hover:text-white hover:bg-white/[0.06] border border-white/[0.04]"
              )}
            >
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ShimmerCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <LayoutGrid className="h-8 w-8 text-[#1a1a1a] mb-3" />
            <p className="text-[13px] text-[#3f3f46]">No templates found</p>
            <p className="text-[12px] text-[#27272a] mt-1">
              Try a different search or category
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((t, i) => (
              <TemplateCard key={t.id} template={t} delay={Math.min(i * 0.03, 0.3)} onApply={handleApply} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
