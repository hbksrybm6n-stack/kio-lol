import { useState, useEffect, useRef } from "react";
import { templatesApi, configApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";
import { Pencil, Trash2, Copy, Layout, X, Image, Plus, Eye, ChevronDown } from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string;
  config: string;
  is_public: number;
  uses_count: number;
  creator_id: string;
  created_at: string;
}

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { profile } = useAuthStore();
  const [name, setName] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [thumbUrl, setThumbUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleThumbUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { toast.error("Max 20 MB"); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const token = localStorage.getItem("kio_token");
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setThumbUrl(data.url);
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, "");
    if (t && !tags.includes(t) && tags.length < 5) {
      setTags([...tags, t]);
      setTagInput("");
    }
  };

  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const config = await configApi.getByProfileId(profile?.id || "");
      const configWithThumb = { ...(config || {}), thumbnail_url: thumbUrl };
      await templatesApi.create({
        name: name.trim(),
        description: tags.join(", "),
        config: configWithThumb,
        is_public: visibility === "public" ? 1 : 0,
      });
      toast.success("Template created");
      onCreated();
      onClose();
    } catch {
      toast.error("Creation failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg mx-4 rounded-2xl bg-[#0f0f0f] border border-white/[0.06] shadow-2xl overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#52525b] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer z-10"
        >
          <X size={18} />
        </button>

        <div className="p-6 pb-0">
          <h2 className="text-lg font-bold text-white">Create Template</h2>
          <p className="text-[13px] text-[#52525b] mt-1 leading-relaxed">
            Fill in the details to create a new kio.lol template. This creates a template based on your current configuration.
          </p>
        </div>

        <div className="p-6 space-y-5">
          {/* Thumbnail Upload */}
          <div>
            <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-2 block">
              Template Preview Image
            </label>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleThumbUpload}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full h-32 rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.15] transition-all flex flex-col items-center justify-center gap-2 cursor-pointer overflow-hidden relative"
            >
              {thumbUrl ? (
                <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
              ) : uploading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Image size={20} className="text-[#3f3f46]" />
                  <span className="text-[12px] text-[#52525b]">Click to upload a file</span>
                </>
              )}
            </button>
          </div>

          {/* Template Name */}
          <div>
            <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-2 block">
              Template Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My new template"
              className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-[#3f3f46] outline-none transition-all focus:border-white/[0.15] focus:bg-white/[0.05]"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-2 block">
              Tags
            </label>
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 focus-within:border-white/[0.15] transition-all">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#8b5cf6]/15 text-[#8b5cf6] text-[12px] font-medium"
                >
                  #{t}
                  <button onClick={() => removeTag(t)} className="hover:text-white transition-colors cursor-pointer ml-0.5">
                    <X size={11} />
                  </button>
                </span>
              ))}
              <div className="flex items-center gap-1 flex-1 min-w-[100px]">
                <span className="text-[13px] text-[#3f3f46]">#</span>
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                  placeholder={tags.length === 0 ? "Add tag" : ""}
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-[#3f3f46] outline-none"
                />
                {tagInput.trim() && (
                  <button
                    onClick={addTag}
                    className="p-1 rounded-md bg-white/[0.06] text-[#71717a] hover:text-white hover:bg-white/[0.1] transition-colors cursor-pointer"
                  >
                    <Plus size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Visibility */}
          <div>
            <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-2 block">
              Template Visibility
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <Eye size={14} className="text-[#52525b]" />
              </div>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as "public" | "private")}
                className="w-full appearance-none rounded-xl border border-white/[0.06] bg-white/[0.03] pl-9 pr-10 py-3 text-sm text-white outline-none transition-all focus:border-white/[0.15] cursor-pointer"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronDown size={14} className="text-[#52525b]" />
              </div>
            </div>
          </div>

          {/* Create Button */}
          <button
            onClick={handleCreate}
            disabled={saving || !name.trim()}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-[13px] font-bold transition-all disabled:opacity-40 cursor-pointer"
          >
            <Plus size={16} />
            {saving ? "Creating..." : "Create Template"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardTemplates() {
  const { profile } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await templatesApi.getAll();
      setTemplates(data || []);
    } catch {
      // empty
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (t: Template) => {
    setEditingId(t.id);
    setEditName(t.name);
  };

  const handleUpdate = async () => {
    if (!editingId || !editName.trim()) return;
    setSaving(true);
    try {
      await templatesApi.update(editingId, { name: editName });
      await loadTemplates();
      setEditingId(null);
      toast.success("Updated");
    } catch {
      toast.error("Failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await templatesApi.delete(id);
      await loadTemplates();
      toast.success("Deleted");
    } catch {
      toast.error("Failed");
    }
  };

  const handleApply = async (id: string) => {
    try {
      await templatesApi.apply(id);
      toast.success("Template applied");
      await loadTemplates();
    } catch {
      toast.error("Failed");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-7 w-48 rounded-lg bg-[#0a0a0a] animate-shimmer" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-[#0a0a0a] animate-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-white">Templates</h1>
          <p className="text-[13px] text-[#52525b] mt-1">Save and reuse your profile configurations.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#8b5cf6] text-white text-[13px] font-bold hover:bg-[#7c3aed] transition-all cursor-pointer"
        >
          <Plus size={14} /> Create Template
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-16 text-center">
          <Layout size={40} className="mx-auto text-[#1a1a1a] mb-4" />
          <p className="text-[#3f3f46] mb-1">No templates yet.</p>
          <p className="text-[12px] text-[#27272a]">Create a template to save your current design.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {templates.map((t) => {
            let thumbUrl = "";
            try { thumbUrl = JSON.parse(t.config || "{}").thumbnail_url || ""; } catch {}
            return (
            <div key={t.id} className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] px-5 py-4 flex items-center justify-between gap-4 hover:bg-white/[0.01] transition-colors">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="w-16 h-16 rounded-lg bg-white/[0.04] border border-white/[0.06] overflow-hidden shrink-0 flex items-center justify-center">
                  {thumbUrl ? (
                    <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Layout size={18} className="text-[#1a1a1a]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  {editingId === t.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleUpdate(); if (e.key === "Escape") setEditingId(null); }}
                        className="flex-1 rounded-lg border border-white/[0.1] bg-white/[0.05] px-3 py-1.5 text-sm text-white outline-none"
                        autoFocus
                      />
                      <button onClick={handleUpdate} disabled={saving} className="text-[11px] text-[#8b5cf6] font-medium hover:text-[#a78bfa] cursor-pointer">
                        {saving ? "..." : "Save"}
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-[11px] text-[#52525b] hover:text-white cursor-pointer">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-white truncate">{t.name}</h3>
                        {t.is_public ? (
                           <span className="px-2 py-0.5 text-[10px] font-medium bg-[#8b5cf6]/10 text-[#8b5cf6] rounded-full">Public</span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-medium bg-white/[0.04] text-[#52525b] rounded-full">Private</span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#3f3f46] mt-1">
                        {t.uses_count || 0} uses · {new Date(t.created_at).toLocaleDateString("en-US")}
                      </p>
                    </>
                  )}
                </div>
              </div>
              {editingId !== t.id && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleApply(t.id)}
                    className="p-2 text-[#52525b] hover:text-[#8b5cf6] hover:bg-[#8b5cf6]/[0.06] rounded-lg transition-colors cursor-pointer"
                    title="Apply"
                  >
                    <Copy size={15} />
                  </button>
                  {t.creator_id === profile?.id && (
                    <>
                      <button
                        onClick={() => handleEdit(t)}
                        className="p-2 text-[#52525b] hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="p-2 text-[#52525b] hover:text-red-400 hover:bg-red-400/[0.06] rounded-lg transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
          })}
        </div>
      )}

      {showModal && <CreateModal onClose={() => setShowModal(false)} onCreated={loadTemplates} />}
    </div>
  );
}
