import { useEffect, useState } from "react";
import { Plus, GripVertical, Edit, Trash2, Save, X, Link2 } from "lucide-react";
import { ColorPicker } from "@/components/ui/ColorPicker";
import { Switch } from "@/components/ui/Switch";
import { linksApi } from "@/lib/api";
import toast from "react-hot-toast";

interface Link {
  id: string;
  title: string;
  url: string;
  icon: string;
  color: string;
  description: string;
  is_active: number;
  sort_order: number;
}

const emptyLink = { title: "", url: "", icon: "", color: "#8b5cf6", description: "", is_active: 1 };

export default function DashboardLinks() {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Link | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    try {
      const data = await linksApi.list();
      setLinks(data);
    } catch {
      toast.error("Failed to load links");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditing({ id: "", ...emptyLink, sort_order: links.length });
    setIsNew(true);
  };

  const handleEdit = (link: Link) => {
    setEditing({ ...link });
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
        const created = await linksApi.create(editing as any);
        setLinks((prev) => [...prev, created]);
        toast.success("Link created");
      } else {
        const updated = await linksApi.update(editing.id, editing as any);
        setLinks((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
        toast.success("Link updated");
      }
      setEditing(null);
      setIsNew(false);
    } catch {
      toast.error("Failed to save link");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await linksApi.delete(id);
      setLinks((prev) => prev.filter((l) => l.id !== id));
      toast.success("Link deleted");
    } catch {
      toast.error("Failed to delete link");
    }
  };

  const updateField = <K extends keyof Link>(key: K, value: Link[K]) => {
    if (!editing) return;
    setEditing({ ...editing, [key]: value });
  };

  const inputClass = "w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-[#3f3f46] outline-none transition-all focus:border-white/[0.12] focus:bg-white/[0.05]";

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-white">Links</h1>
          <p className="text-[13px] text-[#52525b] mt-1">Manage the links on your profile.</p>
        </div>
        <button
          onClick={handleAdd}
          disabled={editing !== null}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-black text-[13px] font-bold hover:bg-white/90 transition-all disabled:opacity-40 cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" /> Add Link
        </button>
      </div>

      {editing && (
        <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6">
          <h3 className="text-[14px] font-semibold text-white mb-1">{isNew ? "New Link" : "Edit Link"}</h3>
          <p className="text-[12px] text-[#3f3f46] mb-5">Fill in the details for your link.</p>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-2 block">Title</label>
                <input value={editing.title} onChange={(e) => updateField("title", e.target.value)} placeholder="My awesome link" className={inputClass} />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-2 block">URL</label>
                <input value={editing.url} onChange={(e) => updateField("url", e.target.value)} placeholder="https://example.com" className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-2 block">Icon (emoji)</label>
                <input value={editing.icon} onChange={(e) => updateField("icon", e.target.value)} placeholder="🔗" className={inputClass} />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-2 block">Color</label>
                <ColorPicker value={editing.color} onChange={(v) => updateField("color", v)} />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-2 block">Description</label>
              <textarea value={editing.description} onChange={(e) => updateField("description", e.target.value)} rows={2} placeholder="Optional description" className={`${inputClass} resize-none`} />
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-[13px] text-white">Active</span>
              <Switch checked={!!editing.is_active} onChange={(v) => updateField("is_active", v ? 1 : 0)} />
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
      ) : links.length === 0 && !editing ? (
        <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] flex flex-col items-center justify-center py-16 text-center">
          <Link2 className="h-8 w-8 text-[#3f3f46] mb-3" />
          <p className="text-[13px] text-[#52525b] mb-4">No links yet. Add your first link to get started.</p>
          <button onClick={handleAdd} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-black text-[13px] font-bold hover:bg-white/90 transition-all cursor-pointer">
            <Plus className="h-3.5 w-3.5" /> Add Link
          </button>
        </div>
      ) : (
        <div className="space-y-1.5">
          {links.map((link) => (
            <div key={link.id} className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] px-4 py-3.5 flex items-center gap-4 hover:border-white/[0.08] transition-all">
              <GripVertical className="h-4 w-4 text-[#3f3f46] shrink-0 cursor-grab" />
              <div
                className="flex items-center justify-center h-9 w-9 rounded-lg text-lg shrink-0"
                style={{ backgroundColor: link.color + "20", color: link.color }}
              >
                {link.icon || "🔗"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-white truncate">{link.title}</p>
                <p className="text-[11px] text-[#3f3f46] truncate">{link.url}</p>
              </div>
              {!link.is_active && (
                <span className="text-[10px] font-semibold text-[#3f3f46] border border-white/[0.06] rounded-md px-1.5 py-0.5 uppercase tracking-wider">Off</span>
              )}
              <button onClick={() => handleEdit(link)} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-[#52525b] hover:text-white transition-all cursor-pointer">
                <Edit className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => handleDelete(link.id)} className="p-1.5 rounded-lg hover:bg-red-400/[0.08] text-[#52525b] hover:text-red-400 transition-all cursor-pointer">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
