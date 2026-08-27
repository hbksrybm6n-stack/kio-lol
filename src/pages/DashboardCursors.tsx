import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Upload, Trash2, Save, MousePointer2, Check, X } from "lucide-react";
import { configApi, uploadApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface CursorFile {
  id: string;
  name: string;
  url: string;
  date: string;
  type: string;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function DashboardCursors() {
  const { profile } = useAuthStore();
  const [cursors, setCursors] = useState<CursorFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [size, setSize] = useState(24);
  const [trail, setTrail] = useState(false);
  const [glow, setGlow] = useState(false);

  useEffect(() => {
    if (!profile?.id) return;
    loadData();
  }, [profile?.id]);

  const loadData = async () => {
    try {
      const cfg = await configApi.get();
      if (cfg) {
        setActiveUrl(cfg.cursor_url || null);
        setEnabled(!!cfg.enable_custom_cursor);
        setSize(cfg.cursor_size ?? 24);
        setTrail(!!cfg.cursor_trail);
        setGlow(!!cfg.enable_glow);
        if (cfg.cursor_url) {
          setCursors((prev) => {
            if (prev.some((c) => c.url === cfg.cursor_url)) return prev;
            return [{ id: cfg.cursor_url, name: "Active cursor", url: cfg.cursor_url, date: new Date().toISOString(), type: "cursor" }, ...prev];
          });
        }
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
    if (!["cur", "ani", "png"].includes(ext) && !file.type.includes("image")) {
      toast.error("Only .cur, .ani, or .png cursor files are allowed");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadApi.upload(file, "link");
      setCursors((prev) => [
        { id: url, name: file.name, url, date: new Date().toISOString(), type: ext },
        ...prev,
      ]);
      toast.success("Cursor uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSetActive = (url: string) => {
    setActiveUrl(url);
    setEnabled(true);
    toast.success("Cursor selected");
  };

  const handleDelete = async (f: CursorFile) => {
    setCursors((prev) => prev.filter((c) => c.id !== f.id));
    if (activeUrl === f.url) {
      setActiveUrl(null);
      setEnabled(false);
    }
    toast.success("Cursor removed");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await configApi.update({
        enable_custom_cursor: enabled && !!activeUrl,
        cursor_url: enabled ? activeUrl || "" : "",
        cursor_size: size,
        cursor_trail: trail,
        enable_glow: glow,
      });
      toast.success("Cursor settings saved");
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

  const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between py-1">
      <span className="text-[13px] text-white">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${checked ? "bg-white" : "bg-white/[0.08]"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-black transition-transform ${checked ? "translate-x-4" : ""}`}
        />
      </button>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-white">Cursors</h1>
        <p className="text-[13px] text-[#52525b] mt-1">Upload and manage custom cursors for your profile.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <label className={cn(
            "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-10 cursor-pointer transition-all",
            uploading ? "border-white/[0.2] bg-white/[0.04]" : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.04]"
          )}>
            <input
              type="file"
              accept=".cur,.ani,image/png"
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
                <p className="text-[13px] text-white font-medium">Upload a cursor file</p>
                <p className="text-[11px] text-[#3f3f46]">Click to upload .cur, .ani, or .png files (max 200 MB)</p>
              </>
            )}
          </label>

          <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6">
            <h3 className="text-[14px] font-semibold text-white mb-4">Uploaded Cursors</h3>
            {cursors.length === 0 ? (
              <p className="text-[12px] text-[#3f3f46] text-center py-8">No cursors yet. Upload your first cursor above.</p>
            ) : (
              <div className="space-y-2">
                {cursors.map((c) => (
                  <div
                    key={c.id}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors",
                      activeUrl === c.url ? "border-white/[0.16] bg-white/[0.03]" : "border-white/[0.04] bg-white/[0.01]"
                    )}
                  >
                    <div className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center shrink-0">
                      {c.url && c.type === "png" ? (
                        <img src={c.url} alt="" className="w-6 h-6 object-contain" />
                      ) : (
                        <MousePointer2 size={16} className="text-[#3f3f46]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-white truncate flex items-center gap-2">
                        {c.name}
                        {activeUrl === c.url && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-emerald-400/[0.12] text-emerald-400">Active</span>
                        )}
                      </p>
                      <p className="text-[11px] text-[#3f3f46]">.{c.type} · {formatDate(c.date)}</p>
                    </div>
                    <button
                      onClick={() => handleSetActive(c.url)}
                      disabled={activeUrl === c.url}
                      className={cn(
                        "flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all cursor-pointer shrink-0",
                        activeUrl === c.url
                          ? "bg-emerald-400/[0.12] text-emerald-400"
                          : "bg-white/[0.04] text-[#a1a1aa] hover:text-white hover:bg-white/[0.08]"
                      )}
                    >
                      <Check size={12} /> Set Active
                    </button>
                    <button
                      onClick={() => handleDelete(c)}
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
            {saving ? "Saving..." : "Save Cursor Settings"}
          </button>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-5">
            <h3 className="text-[12px] font-semibold text-[#71717a] uppercase tracking-wider mb-4">Preview</h3>
            <div className="rounded-lg bg-white/[0.02] border border-white/[0.05] h-40 flex items-center justify-center relative">
              <div
                className={cn(
                  "relative rounded-full flex items-center justify-center",
                  enabled ? "bg-white/[0.08] border border-white/[0.1]" : "bg-white/[0.03]"
                )}
                style={{ width: size, height: size }}
              >
                {activeUrl && enabled ? (
                  <img src={activeUrl} alt="" className="w-full h-full object-contain" />
                ) : (
                  <MousePointer2 size={Math.max(size * 0.5, 12)} className="text-[#a1a1aa]" />
                )}
                {glow && enabled && (
                  <div
                    className="absolute inset-0 rounded-full bg-violet-500/40 blur-md -z-10"
                    style={{ width: size + 8, height: size + 8, left: -4, top: -4 }}
                  />
                )}
              </div>
              {enabled && trail && (
                <div className="absolute w-2 h-2 rounded-full bg-violet-400/40 -ml-6 -mt-6" />
              )}
              <div className="absolute inset-x-0 bottom-2 text-[10px] text-[#3f3f46] text-center">
                {enabled ? "Custom cursor active" : "Custom cursor off"}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-5 space-y-4">
            <h3 className="text-[12px] font-semibold text-[#71717a] uppercase tracking-wider">Cursor Settings</h3>
            <div>
              <div className="flex justify-between text-[12px] mb-2">
                <span className="text-[#71717a]">Size</span>
                <span className="text-[#3f3f46]">{size}px</span>
              </div>
              <input
                type="range"
                min={8}
                max={64}
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="w-full accent-white h-1"
              />
            </div>
            <div className="border-t border-white/[0.04] pt-1">
              <Toggle label="Enable Cursor" checked={enabled} onChange={setEnabled} />
              <Toggle label="Trail Effect" checked={trail} onChange={setTrail} />
              <Toggle label="Glow Effect" checked={glow} onChange={setGlow} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
