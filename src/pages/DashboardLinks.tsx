import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  GripVertical,
  Edit,
  Trash2,
  Save,
  X,
  Link2,
  FolderOpen,
  FolderPlus,
  Eye,
  EyeOff,
  ChevronDown,
  Clock,
  MousePointerClick,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ColorPicker } from "@/components/ui/ColorPicker";
import { Switch } from "@/components/ui/Switch";
import { linksApi, linkGroupsApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { LinkGroup } from "@/types";

interface LinkItem {
  id: string;
  title: string;
  url: string;
  icon: string;
  color: string;
  description: string;
  is_active: number;
  sort_order: number;
  click_count?: number;
  group_id?: string;
  thumbnail_url?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  visibility?: string;
  target?: string;
  open_animation?: string;
  background_color?: string;
}

const emptyLink: Partial<LinkItem> = {
  title: "",
  url: "",
  icon: "",
  color: "#8b5cf6",
  description: "",
  is_active: 1,
  visibility: "public",
  target: "_blank",
  open_animation: "none",
  background_color: "",
  thumbnail_url: "",
  group_id: "",
};

const inputClass =
  "w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-[#3f3f46] outline-none transition-all focus:border-white/[0.12] focus:bg-white/[0.05]";
const LABEL = "text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-2 block";

export default function DashboardLinks() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [groups, setGroups] = useState<LinkGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<LinkItem> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState("");

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [linksData, groupsData] = await Promise.all([
        linksApi.list(),
        linkGroupsApi.list().catch(() => []),
      ]);
      setLinks(linksData || []);
      setGroups(groupsData || []);
    } catch {
      toast.error("Failed to load links");
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async () => {
    try {
      const data = await linkGroupsApi.list();
      setGroups(data || []);
    } catch {
      // empty
    }
  };

  const handleAdd = () => {
    setEditing({ ...emptyLink, sort_order: links.length });
    setIsNew(true);
  };

  const handleEdit = (link: LinkItem) => {
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
      const payload = {
        ...editing,
        group_id: editing.group_id || undefined,
        thumbnail_url: editing.thumbnail_url || undefined,
        scheduled_start: editing.scheduled_start || undefined,
        scheduled_end: editing.scheduled_end || undefined,
        visibility: editing.visibility || "public",
        target: editing.target || "_blank",
        open_animation: editing.open_animation || "none",
        background_color: editing.background_color || undefined,
      };
      if (isNew) {
        const created = await linksApi.create(payload as any);
        setLinks((prev) => [...prev, created]);
        toast.success("Link created");
      } else {
        const updated = await linksApi.update(editing.id!, payload as any);
        setLinks((prev) => prev.map((l) => (l.id === updated.id ? { ...l, ...updated } : l)));
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

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      const created = await linkGroupsApi.create({ name: newGroupName.trim() });
      setGroups((prev) => [...prev, created]);
      setNewGroupName("");
      toast.success("Group created");
    } catch {
      toast.error("Failed to create group");
    }
  };

  const handleRenameGroup = async (id: string) => {
    if (!editingGroupName.trim()) return;
    try {
      await linkGroupsApi.update(id, { name: editingGroupName.trim() });
      setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, name: editingGroupName.trim() } : g)));
      setEditingGroup(null);
      toast.success("Group renamed");
    } catch {
      toast.error("Failed to rename group");
    }
  };

  const handleDeleteGroup = async (id: string) => {
    try {
      await linkGroupsApi.delete(id);
      setGroups((prev) => prev.filter((g) => g.id !== id));
      setLinks((prev) => prev.map((l) => (l.group_id === id ? { ...l, group_id: "" } : l)));
      toast.success("Group deleted");
    } catch {
      toast.error("Failed to delete group");
    }
  };

  const updateField = <K extends keyof LinkItem>(key: K, value: LinkItem[K]) => {
    if (!editing) return;
    setEditing({ ...editing, [key]: value });
  };

  const filteredLinks = filterGroup === "all"
    ? links
    : links.filter((l) => l.group_id === filterGroup);

  const getGroupName = (groupId?: string) => {
    if (!groupId) return "Ungrouped";
    return groups.find((g) => g.id === groupId)?.name || "Unknown";
  };

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

      {/* Link Groups Manager */}
      <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FolderOpen size={16} className="text-[#52525b]" />
            <h3 className="text-[14px] font-semibold text-white">Link Groups</h3>
          </div>
          <button
            onClick={() => setShowGroupManager(!showGroupManager)}
            className="text-[12px] text-[#52525b] hover:text-white transition-colors cursor-pointer"
          >
            {showGroupManager ? "Hide" : "Manage"}
          </button>
        </div>

        {showGroupManager && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateGroup()}
                placeholder="New group name..."
                className={cn(inputClass, "flex-1")}
              />
              <button
                onClick={handleCreateGroup}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-black text-[13px] font-bold hover:bg-white/90 transition-all cursor-pointer shrink-0"
              >
                <FolderPlus size={13} /> Add
              </button>
            </div>
            <div className="space-y-1.5">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="flex items-center justify-between px-4 py-2.5 rounded-lg border border-white/[0.04] bg-white/[0.01]"
                >
                  <div className="flex items-center gap-2">
                    <GripVertical size={12} className="text-[#3f3f46]" />
                    {editingGroup === group.id ? (
                      <input
                        value={editingGroupName}
                        onChange={(e) => setEditingGroupName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleRenameGroup(group.id)}
                        className="bg-transparent border-b border-white/[0.12] text-[13px] text-white outline-none px-1 py-0.5"
                        autoFocus
                      />
                    ) : (
                      <span className="text-[13px] text-white">{group.name}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {editingGroup === group.id ? (
                      <button
                        onClick={() => handleRenameGroup(group.id)}
                        className="p-1 rounded-md hover:bg-white/[0.06] text-emerald-400 transition-all cursor-pointer"
                      >
                        <Save size={12} />
                      </button>
                    ) : (
                      <button
                        onClick={() => { setEditingGroup(group.id); setEditingGroupName(group.name); }}
                        className="p-1 rounded-md hover:bg-white/[0.06] text-[#52525b] hover:text-white transition-all cursor-pointer"
                      >
                        <Edit size={12} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteGroup(group.id)}
                      className="p-1 rounded-md hover:bg-red-400/[0.08] text-[#52525b] hover:text-red-400 transition-all cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
              {groups.length === 0 && (
                <p className="text-[12px] text-[#3f3f46] py-2">No groups yet.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Link Editor */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6 overflow-hidden"
          >
            <h3 className="text-[14px] font-semibold text-white mb-1">
              {isNew ? "New Link" : "Edit Link"}
            </h3>
            <p className="text-[12px] text-[#3f3f46] mb-5">Fill in the details for your link.</p>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Title</label>
                  <input
                    value={editing.title || ""}
                    onChange={(e) => updateField("title", e.target.value)}
                    placeholder="My awesome link"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={LABEL}>URL</label>
                  <input
                    value={editing.url || ""}
                    onChange={(e) => updateField("url", e.target.value)}
                    placeholder="https://example.com"
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Icon (emoji)</label>
                  <input
                    value={editing.icon || ""}
                    onChange={(e) => updateField("icon", e.target.value)}
                    placeholder="🔗"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={LABEL}>Color</label>
                  <ColorPicker value={editing.color || "#8b5cf6"} onChange={(v) => updateField("color", v)} />
                </div>
              </div>
              <div>
                <label className={LABEL}>Description</label>
                <textarea
                  value={editing.description || ""}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={2}
                  placeholder="Optional description"
                  className={`${inputClass} resize-none`}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Thumbnail URL</label>
                  <input
                    value={editing.thumbnail_url || ""}
                    onChange={(e) => updateField("thumbnail_url", e.target.value)}
                    placeholder="https://example.com/image.png"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={LABEL}>Group</label>
                  <select
                    value={editing.group_id || ""}
                    onChange={(e) => updateField("group_id", e.target.value || "")}
                    className={cn(inputClass, "appearance-none cursor-pointer")}
                  >
                    <option value="">No group</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={LABEL}>Visibility</label>
                  <select
                    value={editing.visibility || "public"}
                    onChange={(e) => updateField("visibility", e.target.value)}
                    className={cn(inputClass, "appearance-none cursor-pointer")}
                  >
                    <option value="public">Public</option>
                    <option value="unlisted">Unlisted</option>
                    <option value="password">Password</option>
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Target</label>
                  <select
                    value={editing.target || "_blank"}
                    onChange={(e) => updateField("target", e.target.value)}
                    className={cn(inputClass, "appearance-none cursor-pointer")}
                  >
                    <option value="_blank">New Tab (_blank)</option>
                    <option value="_self">Same Tab (_self)</option>
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Open Animation</label>
                  <select
                    value={editing.open_animation || "none"}
                    onChange={(e) => updateField("open_animation", e.target.value)}
                    className={cn(inputClass, "appearance-none cursor-pointer")}
                  >
                    <option value="none">None</option>
                    <option value="bounce">Bounce</option>
                    <option value="slide">Slide</option>
                    <option value="glow">Glow</option>
                    <option value="pulse">Pulse</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Scheduled Start (optional)</label>
                  <input
                    type="datetime-local"
                    value={editing.scheduled_start || ""}
                    onChange={(e) => updateField("scheduled_start", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={LABEL}>Scheduled End (optional)</label>
                  <input
                    type="datetime-local"
                    value={editing.scheduled_end || ""}
                    onChange={(e) => updateField("scheduled_end", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-[13px] text-white">Active</span>
                <Switch
                  checked={!!editing.is_active}
                  onChange={(v) => updateField("is_active", v ? 1 : 0)}
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-medium text-[#52525b] hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" /> Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-black text-[13px] font-bold hover:bg-white/90 transition-all disabled:opacity-40 cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Group Filter */}
      {groups.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setFilterGroup("all")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all cursor-pointer whitespace-nowrap",
              filterGroup === "all"
                ? "bg-white text-black"
                : "bg-white/[0.04] text-[#a1a1aa] hover:bg-white/[0.08]"
            )}
          >
            All
          </button>
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => setFilterGroup(g.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all cursor-pointer whitespace-nowrap",
                filterGroup === g.id
                  ? "bg-white text-black"
                  : "bg-white/[0.04] text-[#a1a1aa] hover:bg-white/[0.08]"
              )}
            >
              {g.name}
            </button>
          ))}
        </div>
      )}

      {/* Link List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-[#0a0a0a] animate-shimmer" />
          ))}
        </div>
      ) : filteredLinks.length === 0 && !editing ? (
        <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] flex flex-col items-center justify-center py-16 text-center">
          <Link2 className="h-8 w-8 text-[#3f3f46] mb-3" />
          <p className="text-[13px] text-[#52525b] mb-4">No links yet. Add your first link to get started.</p>
          <button
            onClick={handleAdd}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-black text-[13px] font-bold hover:bg-white/90 transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> Add Link
          </button>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filteredLinks.map((link) => {
            const now = new Date();
            const isScheduledOut =
              (link.scheduled_start && new Date(link.scheduled_start) > now) ||
              (link.scheduled_end && new Date(link.scheduled_end) < now);

            return (
              <div
                key={link.id}
                className={cn(
                  "rounded-xl border bg-[#0a0a0a] px-4 py-3.5 flex items-center gap-4 transition-all",
                  link.is_active && !isScheduledOut
                    ? "border-white/[0.04] hover:border-white/[0.08]"
                    : "border-white/[0.03] opacity-50"
                )}
              >
                <GripVertical className="h-4 w-4 text-[#3f3f46] shrink-0 cursor-grab" />
                <div
                  className="flex items-center justify-center h-9 w-9 rounded-lg text-lg shrink-0"
                  style={{
                    backgroundColor: (link.color || "#8b5cf6") + "20",
                    color: link.color || "#8b5cf6",
                  }}
                >
                  {link.thumbnail_url ? (
                    <img src={link.thumbnail_url} alt="" className="w-9 h-9 rounded-lg object-cover" />
                  ) : (
                    link.icon || "🔗"
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-medium text-white truncate">{link.title}</p>
                    {link.group_id && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/[0.04] text-[#52525b] shrink-0">
                        {getGroupName(link.group_id)}
                      </span>
                    )}
                    {link.visibility && link.visibility !== "public" && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#eab308]/[0.12] text-[#eab308] shrink-0 capitalize">
                        {link.visibility}
                      </span>
                    )}
                    {isScheduledOut && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#52525b]/[0.12] text-[#52525b] shrink-0 flex items-center gap-0.5">
                        <Clock size={8} /> Scheduled
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#3f3f46] truncate">{link.url}</p>
                </div>
                {link.click_count !== undefined && link.click_count > 0 && (
                  <span className="flex items-center gap-1 text-[11px] text-[#52525b] shrink-0">
                    <MousePointerClick size={11} className="opacity-50" />
                    {link.click_count.toLocaleString()}
                  </span>
                )}
                {!link.is_active && (
                  <span className="text-[10px] font-semibold text-[#3f3f46] border border-white/[0.06] rounded-md px-1.5 py-0.5 uppercase tracking-wider shrink-0">
                    Off
                  </span>
                )}
                <button
                  onClick={() => handleEdit(link)}
                  className="p-1.5 rounded-lg hover:bg-white/[0.06] text-[#52525b] hover:text-white transition-all cursor-pointer shrink-0"
                >
                  <Edit className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(link.id)}
                  className="p-1.5 rounded-lg hover:bg-red-400/[0.08] text-[#52525b] hover:text-red-400 transition-all cursor-pointer shrink-0"
                >
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
