import { useEffect, useState } from "react";
import { Plus, Save, X, Trash2, Globe } from "lucide-react";
import { socialLinksApi } from "@/lib/api";
import { SOCIAL_PLATFORMS, type SocialPlatform } from "@/types";
import { SOCIAL_SVGS } from "@/lib/socialIcons";
import toast from "react-hot-toast";

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  username: string;
}

const emptySocial = { platform: Object.keys(SOCIAL_PLATFORMS)[0] as SocialPlatform, url: "", username: "" };

export default function DashboardSocials() {
  const [socials, setSocials] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<SocialLink | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSocials();
  }, []);

  const loadSocials = async () => {
    try {
      const data = await socialLinksApi.list();
      setSocials(data);
    } catch {
      toast.error("Failed to load socials");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditing({ id: "", ...emptySocial });
    setIsNew(true);
  };

  const handleEdit = (social: SocialLink) => {
    setEditing({ ...social });
    setIsNew(false);
  };

  const handleCancel = () => {
    setEditing(null);
    setIsNew(false);
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      if (isNew) {
        const created = await socialLinksApi.create(editing as unknown as Record<string, unknown>);
        setSocials((prev) => [...prev, created]);
        toast.success("Social link added");
      } else {
        const updated = await socialLinksApi.update(editing.id, editing as unknown as Record<string, unknown>);
        setSocials((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        toast.success("Social link updated");
      }
      setEditing(null);
      setIsNew(false);
    } catch {
      toast.error("Failed to save social link");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await socialLinksApi.delete(id);
      setSocials((prev) => prev.filter((s) => s.id !== id));
      toast.success("Social link removed");
    } catch {
      toast.error("Failed to delete social link");
    }
  };

  const updateField = <K extends keyof SocialLink>(key: K, value: SocialLink[K]) => {
    if (!editing) return;
    setEditing({ ...editing, [key]: value });
  };

  const getPlatformInfo = (id: string) => SOCIAL_PLATFORMS[id as SocialPlatform];
  const getPlatformSvg = (id: string) => SOCIAL_SVGS[id as SocialPlatform];
  const inputClass = "w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-[#3f3f46] outline-none transition-all focus:border-white/[0.12] focus:bg-white/[0.05]";

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-white">Socials</h1>
          <p className="text-[13px] text-[#52525b] mt-1">Connect your social media accounts.</p>
        </div>
        <button
          onClick={handleAdd}
          disabled={editing !== null}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-black text-[13px] font-bold hover:bg-white/90 transition-all disabled:opacity-40 cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" /> Add Social
        </button>
      </div>

      {editing && (
        <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6">
          <h3 className="text-[14px] font-semibold text-white mb-1">{isNew ? "Add Social" : "Edit Social"}</h3>
          <p className="text-[12px] text-[#3f3f46] mb-5">Connect a social media account.</p>
          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-2 block">Platform</label>
              <select
                value={editing.platform}
                onChange={(e) => updateField("platform", e.target.value)}
                className={`${inputClass} appearance-none`}
                style={{ colorScheme: "dark" }}
              >
                {Object.keys(SOCIAL_PLATFORMS).map((k) => (
                  <option key={k} value={k} style={{ backgroundColor: "#0a0a0a", color: "#fff" }}>
                    {SOCIAL_PLATFORMS[k as SocialPlatform].name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-2 block">URL</label>
              <input value={editing.url} onChange={(e) => updateField("url", e.target.value)} placeholder="https://..." className={inputClass} />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-2 block">Username</label>
              <input value={editing.username} onChange={(e) => updateField("username", e.target.value)} placeholder="@username" className={inputClass} />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={handleCancel} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-medium text-[#52525b] hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer">
                <X className="h-3.5 w-3.5" /> Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-black text-[13px] font-bold hover:bg-white/90 transition-all disabled:opacity-40 cursor-pointer">
                <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-[#0a0a0a] animate-shimmer" />
          ))}
        </div>
      ) : socials.length === 0 && !editing ? (
        <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] flex flex-col items-center justify-center py-16 text-center">
          <Globe className="h-8 w-8 text-[#3f3f46] mb-3" />
          <p className="text-[13px] text-[#52525b] mb-4">No social links yet. Connect your first account.</p>
          <button onClick={handleAdd} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-black text-[13px] font-bold hover:bg-white/90 transition-all cursor-pointer">
            <Plus className="h-3.5 w-3.5" /> Add Social
          </button>
        </div>
      ) : (
        <div className="space-y-1.5">
          {socials.map((social) => {
            const platform = getPlatformInfo(social.platform);
            const svgHtml = getPlatformSvg(social.platform);
            const color = platform?.color || "#8b5cf6";
            return (
              <div key={social.id} className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] px-4 py-3.5 flex items-center gap-4 hover:border-white/[0.08] transition-all">
                <div className="flex items-center justify-center h-9 w-9 rounded-lg shrink-0"
                  style={{ backgroundColor: `${color}18` }}>
                  {svgHtml ? (
                    <span className="w-4 h-4" style={{ color }} dangerouslySetInnerHTML={{ __html: svgHtml }} />
                  ) : (
                    <span className="text-lg">{platform?.icon ?? "🌐"}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-white">{platform?.name ?? social.platform}</p>
                  <p className="text-[11px] text-[#3f3f46] truncate">{social.username || social.url}</p>
                </div>
                <button onClick={() => handleEdit(social)} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-[#52525b] hover:text-white transition-all cursor-pointer">
                  <Save className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => handleDelete(social.id)} className="p-1.5 rounded-lg hover:bg-red-400/[0.08] text-[#52525b] hover:text-red-400 transition-all cursor-pointer">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
