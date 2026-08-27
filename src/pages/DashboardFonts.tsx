import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Upload, Trash2, Save, Type, Check, ChevronDown } from "lucide-react";
import { configApi, uploadApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface FontFile {
  id: string;
  name: string;
  url: string;
  date: string;
  fileType: string;
  category: string;
  family: string;
}

const CATEGORIES = ["Serif", "Sans-serif", "Monospace", "Display"];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function DashboardFonts() {
  const { profile } = useAuthStore();
  const [fonts, setFonts] = useState<FontFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [currentFont, setCurrentFont] = useState("Inter");
  const [selectedFont, setSelectedFont] = useState<string | null>(null);
  const [category, setCategory] = useState("All");

  useEffect(() => {
    if (!profile?.id) return;
    loadData();
  }, [profile?.id]);

  const loadData = async () => {
    try {
      const cfg = await configApi.get();
      if (cfg) {
        setCurrentFont(cfg.font_family || "Inter");
      }
    } catch {
      // empty
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!["ttf", "otf", "woff", "woff2"].includes(ext)) {
      toast.error("Only .ttf, .otf, .woff, or .woff2 font files are allowed");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadApi.upload(file, "link");
      const family = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
      setFonts((prev) => [
        {
          id: url,
          name: file.name,
          url,
          date: new Date().toISOString(),
          fileType: ext,
          category: category === "All" ? "Sans-serif" : category,
          family,
        },
        ...prev,
      ]);
      toast.success("Font uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSetActive = async (font: FontFile) => {
    try {
      await configApi.update({ font_family: font.family });
      setCurrentFont(font.family);
      setSelectedFont(font.id);
      toast.success("Font applied");
    } catch {
      toast.error("Failed to apply font");
    }
  };

  const handleDelete = async (font: FontFile) => {
    setFonts((prev) => prev.filter((f) => f.id !== font.id));
    if (selectedFont === font.id) setSelectedFont(null);
    toast.success("Font removed");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await configApi.update({ font_family: currentFont });
      toast.success("Font settings saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-7 w-48 rounded-lg bg-[#0a0a0a] animate-shimmer" />
        <div className="h-96 rounded-xl bg-[#0a0a0a] animate-shimmer" />
      </div>
    );
  }

  const filtered = fonts.filter((f) => category === "All" || f.category === category);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-white">Fonts</h1>
        <p className="text-[13px] text-[#52525b] mt-1">Upload and manage custom fonts for your profile.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <label className={cn(
            "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-10 cursor-pointer transition-all",
            uploading ? "border-white/[0.2] bg-white/[0.04]" : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.04]"
          )}>
            <input
              type="file"
              accept=".ttf,.otf,.woff,.woff2"
              className="hidden"
              onChange={handleUpload}
            />
            {uploading ? (
              <>
                <span className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span className="text-[13px] text-[#71717a]">Uploading...</span>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center">
                  <Upload size={20} className="text-[#a1a1aa]" />
                </div>
                <p className="text-[13px] text-white font-medium">Upload a font file</p>
                <p className="text-[11px] text-[#3f3f46]">Click to upload .ttf, .otf, .woff, or .woff2 (max 200 MB)</p>
              </>
            )}
          </label>

          <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-semibold text-white">Uploaded Fonts</h3>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-[12px] text-[#a1a1aa] outline-none cursor-pointer"
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {filtered.length === 0 ? (
              <p className="text-[12px] text-[#3f3f46] text-center py-8">No fonts in this category yet.</p>
            ) : (
              <div className="space-y-2">
                {filtered.map((f) => (
                  <div
                    key={f.id}
                    className={cn(
                      "flex items-center gap-4 px-4 py-3 rounded-xl border transition-colors",
                      selectedFont === f.id || currentFont === f.family
                        ? "border-white/[0.16] bg-white/[0.03]"
                        : "border-white/[0.04] bg-white/[0.01]"
                    )}
                  >
                    <div className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center shrink-0">
                      <Type size={16} className="text-[#3f3f46]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-white truncate flex items-center gap-2" style={{ fontFamily: `'${f.family}', sans-serif` }}>
                        AaBbCc — {f.name}
                        {(selectedFont === f.id || currentFont === f.family) && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-emerald-400/[0.12] text-emerald-400">Active</span>
                        )}
                      </p>
                      <p className="text-[11px] text-[#3f3f46]">.{f.fileType} · {f.category} · {formatDate(f.date)}</p>
                    </div>
                    <button
                      onClick={() => handleSetActive(f)}
                      disabled={currentFont === f.family}
                      className={cn(
                        "flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all cursor-pointer shrink-0",
                        currentFont === f.family
                          ? "bg-emerald-400/[0.12] text-emerald-400"
                          : "bg-white/[0.04] text-[#a1a1aa] hover:text-white hover:bg-white/[0.08]"
                      )}
                    >
                      <Check size={12} /> Set Active
                    </button>
                    <button
                      onClick={() => handleDelete(f)}
                      className="p-2 rounded-lg text-[#52525b] hover:text-red-400 hover:bg-red-400/[0.06] transition-all cursor-pointer shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-black text-[13px] font-bold hover:bg-white/90 transition-all disabled:opacity-40 cursor-pointer"
          >
            <Save size={14} />
            {saving ? "Saving..." : "Save Font Settings"}
          </button>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-5">
            <h3 className="text-[12px] font-semibold text-[#71717a] uppercase tracking-wider mb-3">Current Font</h3>
            <div className="rounded-lg bg-white/[0.02] border border-white/[0.05] p-4 text-center">
              <p className="text-white text-2xl font-bold mb-2" style={{ fontFamily: `'${currentFont}', sans-serif` }}>
                Aa
              </p>
              <p className="text-[12px] text-[#a1a1aa]" style={{ fontFamily: `'${currentFont}', sans-serif` }}>{currentFont}</p>
              <p className="text-[13px] text-[#52525b] mt-2" style={{ fontFamily: `'${currentFont}', sans-serif` }}>
                The quick brown fox jumps over the lazy dog
              </p>
            </div>
            <div className="mt-4">
              <h4 className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-3">Categories</h4>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <span key={c} className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.04] text-[12px] text-[#a1a1aa]">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-5">
            <h3 className="text-[12px] font-semibold text-[#71717a] uppercase tracking-wider mb-3">About</h3>
            <p className="text-[12px] text-[#52525b] leading-relaxed">
              Upload custom fonts to give your profile a unique look. Set a font active, then save to apply it to your entire profile.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
