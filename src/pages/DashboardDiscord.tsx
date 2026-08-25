import { useState, useEffect } from "react";
import { MessageSquare, ExternalLink } from "lucide-react";
import { configApi } from "@/lib/api";
import toast from "react-hot-toast";

export default function DashboardDiscord() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [discordData, setDiscordData] = useState<any>(null);

  const [discordUserId, setDiscordUserId] = useState("");
  const [showStatus, setShowStatus] = useState(false);
  const [showRpc, setShowRpc] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  useEffect(() => {
    if (discordUserId && showStatus) fetchDiscord();
  }, [discordUserId, showStatus]);

  const loadConfig = async () => {
    try {
      const data = await configApi.get();
      setDiscordUserId(data?.discord_user_id || "");
      setShowStatus(!!data?.show_discord_status);
      setShowRpc(!!data?.show_discord_rpc);
    } catch {
      toast.error("Failed to load config");
    } finally {
      setLoading(false);
    }
  };

  const fetchDiscord = async () => {
    if (!discordUserId) return;
    setFetching(true);
    try {
      const res = await fetch(`/api/discord/${discordUserId}`);
      const json = await res.json();
      setDiscordData(json.data || null);
    } catch {
      setDiscordData(null);
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await configApi.update({
        discord_user_id: discordUserId,
        show_discord_status: showStatus ? 1 : 0,
        show_discord_rpc: showRpc ? 1 : 0,
      });
      toast.success("Discord settings saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "bg-green-500";
      case "idle": return "bg-yellow-500";
      case "dnd": return "bg-red-500";
      default: return "bg-[#52525b]";
    }
  };

  const inputClass = "w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-[#3f3f46] outline-none transition-all focus:border-white/[0.12] focus:bg-white/[0.05]";

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
        <h1 className="text-xl font-extrabold tracking-tight text-white">Discord</h1>
        <p className="text-[13px] text-[#52525b] mt-1">Show your Discord status on your profile.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings */}
        <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6 space-y-5">
          <div>
            <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-2 block">Discord User ID</label>
            <input
              value={discordUserId}
              onChange={(e) => setDiscordUserId(e.target.value)}
              placeholder="Enter your Discord user ID"
              className={inputClass}
            />
            <a href="https://support.discord.com/hc/en-us/articles/206029707" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-[#3f3f46] hover:text-[#a1a1aa] mt-2 transition-colors">
              How to find your ID <ExternalLink size={10} />
            </a>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-[13px] text-white font-medium">Show Status</p>
              <p className="text-[11px] text-[#3f3f46]">Display your online/idle/dnd status</p>
            </div>
            <button onClick={() => setShowStatus(!showStatus)}
              className="w-10 h-6 rounded-full transition-all cursor-pointer relative"
              style={{ backgroundColor: showStatus ? "#fff" : "rgba(255,255,255,0.1)" }}>
              <span className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
                style={{ left: showStatus ? "18px" : "2px", backgroundColor: showStatus ? "#000" : "#52525b" }} />
            </button>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-[13px] text-white font-medium">Show Activity</p>
              <p className="text-[11px] text-[#3f3f46]">Display what you're playing/listening to</p>
            </div>
            <button onClick={() => setShowRpc(!showRpc)}
              className="w-10 h-6 rounded-full transition-all cursor-pointer relative"
              style={{ backgroundColor: showRpc ? "#fff" : "rgba(255,255,255,0.1)" }}>
              <span className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
                style={{ left: showRpc ? "18px" : "2px", backgroundColor: showRpc ? "#000" : "#52525b" }} />
            </button>
          </div>

          <button onClick={handleSave} disabled={saving}
            className="w-full px-4 py-2.5 rounded-xl bg-white text-black text-[13px] font-bold hover:bg-white/90 transition-all disabled:opacity-40 cursor-pointer">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>

        {/* Preview */}
        <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6">
          <h3 className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-3">Preview</h3>
          <div className="w-full aspect-[3/4] rounded-lg bg-[#050505] p-4 flex flex-col items-center justify-center">
            {discordData ? (
              <div className="flex items-center gap-3 px-4 py-3 bg-white/[0.04] border border-white/[0.06] rounded-xl w-full max-w-xs">
                <div className="relative shrink-0">
                  {discordData.discord_user?.avatar ? (
                    <img
                      src={`https://cdn.discordapp.com/avatars/${discordData.discord_user.id}/${discordData.discord_user.avatar}.png?size=64`}
                      alt="" className="w-9 h-9 rounded-full"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#5865F2]/20 flex items-center justify-center">
                      <MessageSquare size={16} className="text-[#5865F2]" />
                    </div>
                  )}
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#050505] ${getStatusColor(discordData.discord_status)}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] text-white font-medium truncate">{discordData.discord_user?.username}</p>
                  <p className="text-[11px] text-[#52525b] capitalize">{discordData.discord_status}</p>
                </div>
                {showRpc && discordData.activities?.[0]?.name && (
                  <span className="ml-auto text-[11px] text-[#3f3f46] truncate shrink-0">{discordData.activities[0].name}</span>
                )}
              </div>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-white/[0.04] mx-auto mb-3" />
                <p className="text-[13px] text-[#3f3f46]">
                  {discordUserId ? (fetching ? "Loading..." : "User not found") : "Enter your Discord ID"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
