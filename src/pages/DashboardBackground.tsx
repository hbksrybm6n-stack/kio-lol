import { useState, useEffect } from "react";
import { configApi, uploadApi } from "@/lib/api";
import { Save, Upload, X, Image, Plus, Trash2, Star, StarOff, RotateCw } from "lucide-react";
import toast from "react-hot-toast";

interface BgItem {
  id: string;
  url: string;
  type: "image" | "video";
  name: string;
  is_favorite: boolean;
  is_active: boolean;
}

export default function DashboardBackground() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [backgrounds, setBackgrounds] = useState<BgItem[]>([]);
  const [activeBg, setActiveBg] = useState<string>("");

  const [blur, setBlur] = useState(0);
  const [opacity, setOpacity] = useState(100);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [overlay, setOverlay] = useState("#00000000");
  const [overlayOpacity, setOverlayOpacity] = useState(0);
  const [enableRotation, setEnableRotation] = useState(false);
  const [rotationInterval, setRotationInterval] = useState(30);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await configApi.get();
      const storedBgs = data?.backgrounds;
      if (Array.isArray(storedBgs) && storedBgs.length > 0) {
        setBackgrounds(storedBgs);
        const active = storedBgs.find((b: BgItem) => b.is_active);
        if (active) setActiveBg(active.url);
      } else {
        const url = data?.background_url || data?.background_video_url || "";
        if (url) {
          const type = (data?.background_type || "").toLowerCase().includes("video") || data?.background_video_url ? "video" : "image";
          const bg: BgItem = { id: "default", url, type, name: "Background", is_favorite: false, is_active: true };
          setBackgrounds([bg]);
          setActiveBg(url);
        }
      }
      setBlur(data?.background_blur || 0);
      setOpacity(data?.background_opacity ?? 100);
      setBrightness(data?.background_brightness ?? 100);
      setContrast(data?.background_contrast ?? 100);
      setSaturation(data?.background_saturation ?? 100);
      setOverlayOpacity(data?.background_overlay_opacity ?? 0);
      setEnableRotation(!!data?.enable_background_rotation);
      setRotationInterval(data?.background_rotation_interval ?? 30);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 200 * 1024 * 1024) { toast.error("Max 200 MB"); return; }
    const isVideo = file.type.startsWith("video/");
    setUploading(true);
    try {
      const url = await uploadApi.upload(file, "link");
      const newBg: BgItem = {
        id: Date.now().toString(),
        url,
        type: isVideo ? "video" : "image",
        name: file.name.replace(/\.[^.]+$/, ""),
        is_favorite: false,
        is_active: backgrounds.length === 0,
      };
      setBackgrounds((prev) => [...prev, newBg]);
      if (backgrounds.length === 0) setActiveBg(url);
      toast.success("Background uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
    e.target.value = "";
  };

  const handleSetActive = (bg: BgItem) => {
    setActiveBg(bg.url);
    setBackgrounds((prev) => prev.map((b) => ({ ...b, is_active: b.id === bg.id })));
  };

  const handleToggleFavorite = (id: string) => {
    setBackgrounds((prev) => prev.map((b) => b.id === id ? { ...b, is_favorite: !b.is_favorite } : b));
  };

  const handleDelete = (id: string) => {
    setBackgrounds((prev) => {
      const filtered = prev.filter((b) => b.id !== id);
      if (filtered.length > 0 && !filtered.some((b) => b.is_active)) {
        filtered[0].is_active = true;
        setActiveBg(filtered[0].url);
      }
      return filtered;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const activeItem = backgrounds.find((b) => b.is_active);
      await configApi.update({
        backgrounds: JSON.stringify(backgrounds),
        background_type: activeItem?.type === "video" ? "Video" : "Image",
        background_url: activeItem?.type === "image" ? activeBg : "",
        background_video_url: activeItem?.type === "video" ? activeBg : "",
        background_blur: blur,
        background_opacity: opacity,
        background_brightness: brightness,
        background_contrast: contrast,
        background_saturation: saturation,
        background_overlay_opacity: overlayOpacity,
        enable_background_rotation: enableRotation,
        background_rotation_interval: rotationInterval,
      });
      toast.success("Background saved");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const activeItem = backgrounds.find((b) => b.is_active);
  const isVideo = activeItem?.type === "video";

  const Slider = ({ label, value, min, max, unit, onChange }: { label: string; value: number; min: number; max: number; unit: string; onChange: (v: number) => void }) => (
    <div>
      <div className="flex justify-between text-[12px] mb-2">
        <span className="text-[#71717a]">{label}</span>
        <span className="text-[#3f3f46]">{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-white h-1" />
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-7 w-48 rounded-lg bg-[#0a0a0a] animate-shimmer" />
        <div className="h-96 rounded-xl bg-[#0a0a0a] animate-shimmer" />
      </div>
    );
  }

  const filterStyle = `blur(${blur}px) brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) opacity(${opacity / 100})`;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-white">Background</h1>
          <p className="text-[13px] text-[#52525b] mt-1">Manage your profile backgrounds.</p>
        </div>
        <label className="cursor-pointer">
          <input type="file" accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm" onChange={handleUpload} className="hidden" />
          <span className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-black text-[13px] font-bold hover:bg-white/90 transition-all cursor-pointer">
            {uploading ? <RotateCw size={14} className="animate-spin" /> : <Plus size={14} />}
            {uploading ? "Uploading..." : "Add Background"}
          </span>
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Backgrounds Grid */}
          {backgrounds.length > 0 && (
            <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">Your Backgrounds ({backgrounds.length})</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {backgrounds.map((bg) => (
                  <div key={bg.id} className={`relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${bg.is_active ? "border-violet-400/60" : "border-white/[0.06] hover:border-white/[0.12]"}`} onClick={() => handleSetActive(bg)}>
                    {bg.type === "video" ? (
                      <video src={bg.url} className="w-full h-28 object-cover" muted />
                    ) : (
                      <img src={bg.url} alt="" className="w-full h-28 object-cover" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                      <span className="text-[10px] text-white/80 truncate">{bg.name}</span>
                      <div className="flex gap-1">
                        <button onClick={(e) => { e.stopPropagation(); handleToggleFavorite(bg.id); }} className="p-1 rounded bg-black/40 hover:bg-black/60 transition-colors cursor-pointer">
                          {bg.is_favorite ? <Star size={10} className="text-amber-400 fill-amber-400" /> : <StarOff size={10} className="text-white/40" />}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(bg.id); }} className="p-1 rounded bg-black/40 hover:bg-red-400/60 transition-colors cursor-pointer">
                          <Trash2 size={10} className="text-white/40 hover:text-red-400" />
                        </button>
                      </div>
                    </div>
                    {bg.is_active && (
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-violet-400/80 text-[9px] font-bold text-white">ACTIVE</div>
                    )}
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/40 text-[9px] text-white/60 uppercase">{bg.type}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Area */}
          {backgrounds.length === 0 && (
            <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6">
              <label className="flex flex-col items-center justify-center h-56 rounded-xl border-2 border-dashed border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all cursor-pointer">
                <Upload size={28} className="text-[#3f3f46] mb-3" />
                <p className="text-[13px] text-[#52525b] font-medium">Click to upload</p>
                <p className="text-[11px] text-[#3f3f46] mt-1">Image or Video · Max 200 MB</p>
                <input type="file" accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm" onChange={handleUpload} className="hidden" />
              </label>
            </div>
          )}

          {/* Adjustments */}
          <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6 space-y-5">
            <h3 className="text-[13px] font-semibold text-white">Adjustments</h3>
            <Slider label="Blur" value={blur} min={0} max={20} unit="px" onChange={setBlur} />
            <Slider label="Opacity" value={opacity} min={0} max={100} unit="%" onChange={setOpacity} />
            <Slider label="Brightness" value={brightness} min={0} max={200} unit="%" onChange={setBrightness} />
            <Slider label="Contrast" value={contrast} min={0} max={200} unit="%" onChange={setContrast} />
            <Slider label="Saturation" value={saturation} min={0} max={200} unit="%" onChange={setSaturation} />

            <div className="pt-3 border-t border-white/[0.04]">
              <div className="flex justify-between text-[12px] mb-2">
                <span className="text-[#71717a]">Overlay Opacity</span>
                <span className="text-[#3f3f46]">{overlayOpacity}%</span>
              </div>
              <input type="range" min={0} max={100} value={overlayOpacity} onChange={(e) => setOverlayOpacity(Number(e.target.value))} className="w-full accent-white h-1" />
            </div>
          </div>

          {/* Rotation */}
          <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[13px] font-semibold text-white">Background Rotation</h3>
                <p className="text-[11px] text-[#3f3f46] mt-0.5">Automatically cycle through backgrounds</p>
              </div>
              <button onClick={() => setEnableRotation(!enableRotation)} className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${enableRotation ? "bg-white" : "bg-white/[0.08]"}`}>
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-black transition-transform ${enableRotation ? "translate-x-4" : ""}`} />
              </button>
            </div>
            {enableRotation && backgrounds.length > 1 && (
              <div>
                <div className="flex justify-between text-[12px] mb-2">
                  <span className="text-[#71717a]">Interval</span>
                  <span className="text-[#3f3f46]">{rotationInterval}s</span>
                </div>
                <input type="range" min={10} max={120} step={5} value={rotationInterval} onChange={(e) => setRotationInterval(Number(e.target.value))} className="w-full accent-white h-1" />
              </div>
            )}
          </div>

          <button onClick={handleSave} disabled={saving} className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-black text-[13px] font-bold hover:bg-white/90 transition-all disabled:opacity-40 cursor-pointer">
            <Save size={14} />
            {saving ? "Saving..." : "Save Background"}
          </button>
        </div>

        {/* Preview */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-4">
            <h3 className="text-[12px] font-semibold text-[#71717a] uppercase tracking-wider mb-3">Preview</h3>
            <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden bg-[#050505]">
              {activeBg ? (
                isVideo ? (
                  <video src={activeBg} className="w-full h-full object-cover" style={{ filter: filterStyle }} autoPlay loop muted />
                ) : (
                  <img src={activeBg} alt="" className="w-full h-full object-cover" style={{ filter: filterStyle }} />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Image size={24} className="text-[#1a1a1a]" />
                </div>
              )}
              {overlayOpacity > 0 && (
                <div className="absolute inset-0 bg-black" style={{ opacity: overlayOpacity / 100 }} />
              )}
              <div className="absolute bottom-3 left-3 right-3 flex flex-col gap-1.5">
                <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/10" />
                <div className="h-3 w-24 rounded bg-white/10 backdrop-blur-md" />
                <div className="h-2 w-16 rounded bg-white/5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
