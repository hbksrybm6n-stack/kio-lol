import { useState, useEffect } from "react";
import {
  Grid,
  MessageSquare,
  Youtube,
  Music,
  Github,
  Cloud,
  Type,
  FolderOpen,
  User,
  GripVertical,
  Trash2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { configApi } from "@/lib/api";

interface Widget {
  id: string;
  type: WidgetType;
  config: Record<string, string>;
}

type WidgetType =
  | "discord"
  | "youtube"
  | "spotify"
  | "github"
  | "weather"
  | "custom_text"
  | "projects"
  | "about_me";

const WIDGET_TYPES: {
  type: WidgetType;
  name: string;
  description: string;
  icon: React.ReactNode;
  fields: { key: string; label: string; type: "input" | "textarea" }[];
}[] = [
  {
    type: "discord",
    name: "Discord",
    description: "Show your Discord status.",
    icon: <MessageSquare size={18} />,
    fields: [{ key: "userId", label: "Discord User ID", type: "input" }],
  },
  {
    type: "youtube",
    name: "YouTube",
    description: "Display your YouTube channel.",
    icon: <Youtube size={18} />,
    fields: [{ key: "channelUrl", label: "Channel URL", type: "input" }],
  },
  {
    type: "spotify",
    name: "Spotify",
    description: "Show what you're listening to.",
    icon: <Music size={18} />,
    fields: [{ key: "playlistUrl", label: "Playlist URL", type: "input" }],
  },
  {
    type: "github",
    name: "GitHub",
    description: "Display your GitHub projects.",
    icon: <Github size={18} />,
    fields: [{ key: "username", label: "GitHub Username", type: "input" }],
  },
  {
    type: "weather",
    name: "Weather",
    description: "Show current weather.",
    icon: <Cloud size={18} />,
    fields: [{ key: "city", label: "City Name", type: "input" }],
  },
  {
    type: "custom_text",
    name: "Custom Text",
    description: "Add custom text content.",
    icon: <Type size={18} />,
    fields: [
      { key: "title", label: "Title", type: "input" },
      { key: "content", label: "Content", type: "textarea" },
    ],
  },
  {
    type: "projects",
    name: "Projects",
    description: "Showcase your projects.",
    icon: <FolderOpen size={18} />,
    fields: [
      { key: "title", label: "Title", type: "input" },
      { key: "description", label: "Description", type: "input" },
      { key: "url", label: "URL", type: "input" },
    ],
  },
  {
    type: "about_me",
    name: "About Me",
    description: "Tell visitors about yourself.",
    icon: <User size={18} />,
    fields: [{ key: "content", label: "About Me", type: "textarea" }],
  },
];

const inputClass =
  "w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-[#3f3f46] outline-none transition-all focus:border-white/[0.12] focus:bg-white/[0.05]";

export default function DashboardWidgets() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWidgets();
  }, []);

  const loadWidgets = async () => {
    try {
      const config = await configApi.get();
      setWidgets(config?.widgets || []);
    } catch {
      toast.error("Failed to load widgets");
    } finally {
      setLoading(false);
    }
  };

  const saveWidgets = async (updated: Widget[]) => {
    try {
      await configApi.update({ widgets: updated });
      setWidgets(updated);
      toast.success("Widgets saved");
    } catch {
      toast.error("Failed to save widgets");
    }
  };

  const addWidget = (type: WidgetType) => {
    const widgetType = WIDGET_TYPES.find((w) => w.type === type);
    if (!widgetType) return;

    const defaultConfig: Record<string, string> = {};
    widgetType.fields.forEach((f) => {
      defaultConfig[f.key] = "";
    });

    const updated = [...widgets, { id: crypto.randomUUID(), type, config: defaultConfig }];
    saveWidgets(updated);
  };

  const removeWidget = (id: string) => {
    saveWidgets(widgets.filter((w) => w.id !== id));
  };

  const updateWidgetConfig = (id: string, key: string, value: string) => {
    setWidgets(widgets.map((w) =>
      w.id === id ? { ...w, config: { ...w.config, [key]: value } } : w
    ));
  };

  const moveWidget = (id: string, direction: "up" | "down") => {
    const idx = widgets.findIndex((w) => w.id === id);
    if (idx === -1) return;
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= widgets.length) return;
    const updated = [...widgets];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    saveWidgets(updated);
  };

  const getWidgetType = (type: WidgetType) => WIDGET_TYPES.find((w) => w.type === type);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-white">Widgets</h1>
        <p className="text-[13px] text-[#52525b] mt-1">Add interactive widgets to your profile.</p>
      </div>

      <div>
        <h2 className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-3">Available</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {WIDGET_TYPES.map((wt) => (
            <div
              key={wt.type}
              className="bg-[#0a0a0a] border border-white/[0.04] rounded-xl p-5 flex flex-col items-start gap-3 hover:border-white/[0.08] transition-all"
            >
              <div className="text-[#52525b]">{wt.icon}</div>
              <div>
                <h3 className="text-[13px] font-medium text-white">{wt.name}</h3>
                <p className="text-[12px] text-[#3f3f46] mt-0.5">{wt.description}</p>
              </div>
              <button
                onClick={() => addWidget(wt.type)}
                className="mt-auto px-4 py-1.5 text-[13px] font-medium rounded-lg bg-white text-black hover:bg-white/90 transition-colors cursor-pointer"
              >
                Add
              </button>
            </div>
          ))}
        </div>
      </div>

      {widgets.length > 0 && (
        <div>
          <h2 className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-3">Active</h2>
          <div className="space-y-3">
            {widgets.map((widget, index) => {
              const widgetType = getWidgetType(widget.type);
              if (!widgetType) return null;
              return (
                <div key={widget.id} className="bg-[#0a0a0a] border border-white/[0.04] rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <GripVertical size={14} className="text-[#3f3f46]" />
                      <div className="text-[#52525b]">{widgetType.icon}</div>
                      <h3 className="text-[13px] font-medium text-white">{widgetType.name}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveWidget(widget.id, "up")}
                        disabled={index === 0}
                        className="p-1.5 rounded-lg transition-colors text-[#52525b] hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        onClick={() => moveWidget(widget.id, "down")}
                        disabled={index === widgets.length - 1}
                        className="p-1.5 rounded-lg transition-colors text-[#52525b] hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <ChevronDown size={14} />
                      </button>
                      <button
                        onClick={() => removeWidget(widget.id)}
                        className="p-1.5 rounded-lg transition-colors text-[#52525b] hover:text-red-400 hover:bg-red-400/[0.06] cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {widgetType.fields.map((field) => (
                      <div key={field.key}>
                        <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-1.5 block">
                          {field.label}
                        </label>
                        {field.type === "textarea" ? (
                          <textarea
                            value={widget.config[field.key] || ""}
                            onChange={(e) => updateWidgetConfig(widget.id, field.key, e.target.value)}
                            rows={3}
                            className={`${inputClass} resize-none`}
                            placeholder={`Enter ${field.label.toLowerCase()}...`}
                          />
                        ) : (
                          <input
                            type="text"
                            value={widget.config[field.key] || ""}
                            onChange={(e) => updateWidgetConfig(widget.id, field.key, e.target.value)}
                            className={inputClass}
                            placeholder={`Enter ${field.label.toLowerCase()}...`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => saveWidgets(widgets)}
                    className="mt-4 px-4 py-1.5 text-[13px] font-medium rounded-lg bg-white text-black hover:bg-white/90 transition-colors cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {widgets.length === 0 && !loading && (
        <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] flex flex-col items-center justify-center py-16 text-center">
          <Grid className="h-8 w-8 text-[#3f3f46] mb-3" />
          <p className="text-[13px] text-[#52525b]">No widgets added yet. Pick one above to get started.</p>
        </div>
      )}
    </div>
  );
}
