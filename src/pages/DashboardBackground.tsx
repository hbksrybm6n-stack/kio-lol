import { useState, useEffect } from "react";
import { configApi, uploadApi } from "@/lib/api";
import { Save, Upload, X, Image } from "lucide-react";
import toast from "react-hot-toast";

export default function DashboardBackground() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [bgUrl, setBgUrl] = useState("");
  const [bgType, setBgType] = useState<"image" | "video">("image");
  const [blur, setBlur] = useState(0);
  const [opacity, setOpacity] = useState(100);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await configApi.get();
      const url = data?.background_url || data?.background_video_url || "";
      setBgUrl(url);
      setBgType(data?.background_type === "Video" || data?.background_video_url ? "video" : "image");
      setBlur(data?.background_blur || 0);
      setOpacity(data?.background_opacity ?? 100);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 200 * 1024 * 1024) { toast.error("File size must be under 200 MB"); return; }
    const isVideo = file.type.startsWith("video/");
    setBgType(isVideo ? "video" : "image");
    try {
      const url = await uploadApi.upload(file, "link");
      setBgUrl(url);
      toast.success("Uploaded");
    } catch {
      toast.error("Upload failed");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await configApi.update({
        background_type: bgType === "video" ? "Video" : "Image",
        background_url: bgType === "image" ? bgUrl : "",
        background_video_url: bgType === "video" ? bgUrl : "",
        background_blur: blur,
        background_opacity: opacity,
      });
      toast.success("Background saved");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save");
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-white">Background</h1>
        <p className="text-[13px] text-[#52525b] mt-1">Upload a background for your profile.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6 space-y-6">
            {/* Upload Area */}
            <div>
              <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-3 block">Background</label>

              {bgUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-white/[0.06]">
                  {bgType === "video" ? (
                    <video src={bgUrl} className="w-full h-56 object-cover" controls muted />
                  ) : (
                    <img src={bgUrl} alt="" className="w-full h-56 object-cover" />
                  )}
                  <button
                    onClick={() => setBgUrl("")}
                    className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 text-white hover:bg-black/80 transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-56 rounded-xl border-2 border-dashed border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all cursor-pointer">
                  <Upload size={28} className="text-[#3f3f46] mb-3" />
                  <p className="text-[13px] text-[#52525b] font-medium">Click to upload</p>
                  <p className="text-[11px] text-[#3f3f46] mt-1">Image or Video · Max 200 MB</p>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm"
                    onChange={handleUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Adjustments */}
            <div className="space-y-4 pt-4 border-t border-white/[0.04]">
              <h3 className="text-[13px] font-semibold text-white">Adjustments</h3>

              <div>
                <div className="flex justify-between text-[12px] mb-2">
                  <span className="text-[#71717a]">Blur</span>
                  <span className="text-[#3f3f46]">{blur}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={blur}
                  onChange={(e) => setBlur(Number(e.target.value))}
                  className="w-full accent-white h-1"
                />
              </div>

              <div>
                <div className="flex justify-between text-[12px] mb-2">
                  <span className="text-[#71717a]">Opacity</span>
                  <span className="text-[#3f3f46]">{opacity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="w-full accent-white h-1"
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving || !bgUrl}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-black text-[13px] font-bold hover:bg-white/90 transition-all disabled:opacity-40 cursor-pointer"
            >
              <Save size={14} />
              {saving ? "Saving..." : "Save Background"}
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-4">
            <h3 className="text-[12px] font-semibold text-[#71717a] uppercase tracking-wider mb-3">Preview</h3>
            <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden bg-[#050505]">
              {bgUrl ? (
                bgType === "video" ? (
                  <video src={bgUrl} className="w-full h-full object-cover" style={{ filter: `blur(${blur}px)`, opacity: opacity / 100 }} autoPlay loop muted />
                ) : (
                  <img src={bgUrl} alt="" className="w-full h-full object-cover" style={{ filter: `blur(${blur}px)`, opacity: opacity / 100 }} />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Image size={24} className="text-[#1a1a1a]" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
