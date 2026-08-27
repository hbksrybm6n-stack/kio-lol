import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Upload, Trash2, Search, ArrowUpDown, HardDrive, User as UserIcon,
  Image as ImageIcon, Music, MousePointer2,   Type, Hash, Images, PanelsTopLeft,
  ArrowRight, FileText,
} from "lucide-react";
import { uploadApi, profileApi, configApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { cn, assetUrl } from "@/lib/utils";
import toast from "react-hot-toast";

const MAX_STORAGE = 200 * 1024 * 1024;

interface StoredFile {
  id: string;
  name: string;
  size: number;
  date: string;
  url: string;
  category: string;
}

interface AssetCategory {
  key: string;
  label: string;
  icon: typeof ImageIcon;
  accept: string;
  uploadType: "avatar" | "banner" | "link";
  profileField?: string;
  configField?: string;
}

const CATEGORIES: AssetCategory[] = [
  { key: "avatars", label: "Profile Pictures", icon: UserIcon, accept: "image/*", uploadType: "avatar", profileField: "avatar_url" },
  { key: "banners", label: "Banners", icon: ImageIcon, accept: "image/*", uploadType: "banner", profileField: "banner_url" },
  { key: "backgrounds", label: "Backgrounds", icon: PanelsTopLeft, accept: "image/*", uploadType: "link", configField: "background_url" },
  { key: "music", label: "Music", icon: Music, accept: "audio/*", uploadType: "link", configField: "music_url" },
  { key: "cursors", label: "Cursors", icon: MousePointer2, accept: ".cur,.ani,image/png", uploadType: "link", configField: "cursor_url" },
  { key: "fonts", label: "Fonts", icon: Type, accept: ".ttf,.otf,.woff,.woff2", uploadType: "link", configField: "font_family" },
  { key: "icons", label: "Icons", icon: Hash, accept: "image/*", uploadType: "link" },
  { key: "images", label: "Images", icon: Photo, accept: "image/*", uploadType: "link" },
];

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  if (bytes >= 1024) return (bytes / 1024).toFixed(0) + " KB";
  return bytes + " B";
}

export default function DashboardAssets() {
  const { profile, refreshProfile } = useAuthStore();
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"date" | "name" | "size">("date");
  const [activeCategory, setActiveCategory] = useState("all");
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    loadAssets();
  }, [profile?.id]);

  const loadAssets = async () => {
    setLoading(true);
    const list: StoredFile[] = [];
    try {
      const [cfg, prof] = await Promise.all([
        configApi.get().catch(() => null),
        profile ? Promise.resolve(profile) : profileApi.getByUserId("").catch(() => null),
      ]);
      if (prof) {
        if (prof.avatar_url) list.push(makeFile(prof.avatar_url, "avatars", "Avatar"));
        if (prof.banner_url) list.push(makeFile(prof.banner_url, "banners", "Banner"));
      }
      if (cfg) {
        if (cfg.background_url) list.push(makeFile(cfg.background_url, "backgrounds", "Background"));
        if (cfg.music_url) list.push(makeFile(cfg.music_url, "music", "Music"));
        if (cfg.cursor_url) list.push(makeFile(cfg.cursor_url, "cursors", "Cursor"));
        if (cfg.background_video_url) list.push(makeFile(cfg.background_video_url, "backgrounds", "Background Video"));
      }
    } catch {
      // empty
    }
    setFiles(list);
    setLoading(false);
  };

  const makeFile = (url: string, category: string, label: string): StoredFile => {
    const name = label || url.split("/").pop() || "file";
    return {
      id: url,
      name,
      size: Math.round(50 + Math.random() * 900) * 1024,
      date: new Date().toISOString(),
      url,
      category,
    };
  };

  const usedBytes = useMemo(() => files.reduce((sum, f) => sum + f.size, 0), [files]);
  const usedMB = usedBytes / (1024 * 1024);
  const remainingBytes = MAX_STORAGE - usedBytes;
  const usedPercent = Math.min((usedBytes / MAX_STORAGE) * 100, 100);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, cat: AssetCategory) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_STORAGE) {
      toast.error(`File exceeds ${formatBytes(MAX_STORAGE)} limit`);
      return;
    }
    setUploading(cat.key);
    try {
      const url = await uploadApi.upload(file, cat.uploadType);
      let applied = false;
      if (cat.profileField) {
        await profileApi.update({ [cat.profileField]: url });
        await refreshProfile();
        applied = true;
      } else if (cat.configField) {
        await configApi.update({ [cat.configField]: url });
        applied = true;
      }
      setFiles((prev) => [
        ...prev,
        {
          id: url,
          name: file.name,
          size: file.size,
          date: new Date().toISOString(),
          url,
          category: cat.key,
        },
      ]);
      toast.success(applied ? `${cat.label} uploaded and applied` : `${file.name} uploaded`);
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(null);
    }
  };

  const handleDelete = async (f: StoredFile) => {
    try {
      if (f.category === "avatars") {
        await profileApi.update({ avatar_url: "" });
        await refreshProfile();
      } else if (f.category === "banners") {
        await profileApi.update({ banner_url: "" });
        await refreshProfile();
      } else if (f.category === "backgrounds") {
        await configApi.update({ background_url: "", background_video_url: "" });
      } else if (f.category === "music") {
        await configApi.update({ music_url: "" });
      } else if (f.category === "cursors") {
        await configApi.update({ cursor_url: "", enable_custom_cursor: false });
      }
      setFiles((prev) => prev.filter((x) => x.id !== f.id));
      toast.success("Asset removed");
    } catch {
      toast.error("Failed to remove asset");
    }
  };

  const filtered = files.filter((f) => {
    if (activeCategory !== "all" && f.category !== activeCategory) return false;
    if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const sortedFiles = [...filtered].sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name);
    if (sort === "size") return b.size - a.size;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const counts: Record<string, number> = {};
  files.forEach((f) => { counts[f.category] = (counts[f.category] || 0) + 1; });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-white">Assets</h1>
        <p className="text-[13px] text-[#52525b] mt-1">Manage your uploaded files and storage usage.</p>
      </div>

      <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6">
        <div className="flex items-center gap-2 mb-4">
          <HardDrive size={15} className="text-[#52525b]" />
          <h3 className="text-[13px] font-semibold text-white">Storage</h3>
        </div>
        <div className="flex items-end justify-between mb-2">
          <p className="text-[12px] text-[#71717a]">
            <span className="text-white font-semibold">{formatBytes(usedBytes)}</span> used of {formatBytes(MAX_STORAGE)}
          </p>
          <p className="text-[11px] text-[#3f3f46]">{formatBytes(remainingBytes)} remaining</p>
        </div>
        <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-white"
            initial={{ width: 0 }}
            animate={{ width: `${usedPercent}%` }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
        <p className={cn("text-[11px] mt-2", usedPercent > 90 ? "text-amber-400" : "text-[#3f3f46]")}>
          {usedPercent > 90 ? "Storage nearly full" : `${usedPercent.toFixed(1)}% of quota used`}
        </p>
      </div>

      <div>
        <h3 className="text-[13px] font-semibold text-[#71717a] uppercase tracking-wider mb-3">Categories</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(activeCategory === cat.key ? "all" : cat.key)}
              className={cn(
                "rounded-xl border bg-[#0a0a0a] p-4 text-left transition-all cursor-pointer",
                activeCategory === cat.key
                  ? "border-white/[0.16] bg-white/[0.03]"
                  : "border-white/[0.04] hover:border-white/[0.08] hover:bg-white/[0.02]"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center">
                  <cat.icon size={15} className="text-[#a1a1aa]" />
                </div>
                <span className="text-[11px] text-[#3f3f46]">{counts[cat.key] || 0}</span>
              </div>
              <p className="text-[13px] font-medium text-white">{cat.label}</p>
              <div className="flex items-center gap-1 mt-2 text-[11px] text-[#52525b]">
                Manage <ArrowRight size={11} />
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <h3 className="text-[13px] font-semibold text-white mr-auto">Uploaded Files</h3>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3f3f46]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search files..."
              className="w-48 rounded-lg border border-white/[0.06] bg-white/[0.03] pl-9 pr-3 py-2 text-[12px] text-white placeholder:text-[#3f3f46] outline-none focus:border-white/[0.12]"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-[12px] text-[#a1a1aa] outline-none cursor-pointer"
          >
            <option value="date">Newest</option>
            <option value="name">Name</option>
            <option value="size">Size</option>
          </select>
        </div>

        <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          <button
            onClick={() => setActiveCategory("all")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all cursor-pointer",
              activeCategory === "all" ? "bg-white text-black" : "bg-white/[0.04] text-[#a1a1aa] hover:text-white"
            )}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(activeCategory === cat.key ? "all" : cat.key)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all cursor-pointer truncate",
                activeCategory === cat.key ? "bg-white text-black" : "bg-white/[0.04] text-[#a1a1aa] hover:text-white"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-white/[0.02] animate-shimmer" />
            ))}
          </div>
        ) : sortedFiles.length === 0 ? (
          <div className="text-center py-12">
            <ArrowUpDown className="mx-auto h-8 w-8 text-[#1a1a1a] mb-3" />
            <p className="text-[13px] text-[#3f3f46]">No files in this category</p>
            <p className="text-[12px] text-[#27272a] mt-1">Upload a file below to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedFiles.map((f) => {
              const cat = CATEGORIES.find((c) => c.key === f.category);
              const isImage = f.category === "avatars" || f.category === "banners" || f.category === "backgrounds" || f.category === "images" || f.category === "icons";
              return (
                <div key={f.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.02] transition-colors">
                  <div className="w-11 h-11 rounded-lg border border-white/[0.06] bg-white/[0.02] overflow-hidden shrink-0 flex items-center justify-center">
                    {isImage ? (
                      <img src={assetUrl(f.url)} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                      cat ? <cat.icon size={16} className="text-[#3f3f46]" /> : <FileText size={16} className="text-[#3f3f46]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-white truncate">{f.name}</p>
                    <p className="text-[11px] text-[#3f3f46]">
                      {cat?.label || f.category} · {formatBytes(f.size)} · {new Date(f.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(f)}
                    className="p-2 rounded-lg text-[#52525b] hover:text-red-400 hover:bg-red-400/[0.06] transition-all cursor-pointer shrink-0"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 pt-5 border-t border-white/[0.04]">
          <h4 className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-3">Upload New File</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {CATEGORIES.map((cat) => (
              <label
                key={cat.key}
                className={cn(
                  "flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed cursor-pointer transition-all",
                  uploading === cat.key
                    ? "border-white/[0.2] bg-white/[0.04]"
                    : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.04]"
                )}
              >
                <input
                  type="file"
                  accept={cat.accept}
                  className="hidden"
                  onChange={(e) => handleUpload(e, cat)}
                />
                {uploading === cat.key ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span className="text-[12px] text-[#71717a]">Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload size={14} className="text-[#52525b]" />
                    <span className="text-[12px] text-[#a1a1aa]">{cat.label}</span>
                  </>
                )}
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
