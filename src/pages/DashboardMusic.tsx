import { useState, useEffect, useRef } from "react";
import { configApi, uploadApi } from "@/lib/api";
import { Save, Music, Play, Pause, Upload, X, Plus, GripVertical, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/Switch";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

interface PlaylistSong {
  url: string;
  title: string;
  artist: string;
  cover: string;
  start_time: number;
  end_time: number;
}

const emptySong: PlaylistSong = {
  url: "",
  title: "",
  artist: "",
  cover: "",
  start_time: 0,
  end_time: 0,
};

export default function DashboardMusic() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const [playlist, setPlaylist] = useState<PlaylistSong[]>([]);
  const [editingSongIndex, setEditingSongIndex] = useState<number | null>(null);
  const [autoplay, setAutoplay] = useState(false);
  const [volume, setVolume] = useState(50);
  const [loop, setLoop] = useState(true);
  const [showPlayer, setShowPlayer] = useState(true);
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [visualizerColor, setVisualizerColor] = useState("#8b5cf6");
  const [showProgressBar, setShowProgressBar] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [songTransition, setSongTransition] = useState("instant");

  useEffect(() => {
    loadConfig();
    return () => { if (audioRef.current) audioRef.current.pause(); };
  }, []);

  const loadConfig = async () => {
    try {
      const data = await configApi.get();
      if (data?.music_playlist && Array.isArray(data.music_playlist)) {
        setPlaylist(data.music_playlist);
      } else if (data?.music_url) {
        setPlaylist([{
          url: data.music_url,
          title: data.music_title || "",
          artist: data.music_artist || "",
          cover: data.music_cover || "",
          start_time: data.music_start_time ?? 0,
          end_time: data.music_end_time ?? 0,
        }]);
      }
      setAutoplay(data?.music_autoplay ?? false);
      setVolume(data?.music_volume ?? 50);
      setLoop(data?.music_loop ?? true);
      setShowPlayer(data?.music_show_player ?? true);
      setShowVisualizer(data?.show_visualizer ?? false);
      setVisualizerColor(data?.visualizer_color ?? "#8b5cf6");
      setShowProgressBar(data?.show_progress_bar ?? true);
      setShowControls(data?.show_music_controls ?? true);
      setSongTransition(data?.song_transition ?? "instant");
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const firstSong = playlist[0];
      await configApi.update({
        music_url: firstSong?.url || "",
        music_title: firstSong?.title || "",
        music_artist: firstSong?.artist || "",
        music_cover: firstSong?.cover || "",
        music_autoplay: autoplay,
        music_volume: volume,
        music_loop: loop,
        music_show_player: showPlayer,
        music_start_time: firstSong?.start_time ?? 0,
        music_end_time: firstSong?.end_time ?? 0,
        music_playlist: playlist,
        show_visualizer: showVisualizer,
        visualizer_color: visualizerColor,
        show_progress_bar: showProgressBar,
        show_music_controls: showControls,
        song_transition: songTransition,
      });
      toast.success("Music saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>, songIndex?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 200 * 1024 * 1024) { toast.error("File size must be under 200 MB"); return; }
    try {
      const url = await uploadApi.upload(file, "link");
      if (songIndex !== undefined) {
        const updated = [...playlist];
        updated[songIndex] = { ...updated[songIndex], url };
        setPlaylist(updated);
      } else {
        setPlaylist([...playlist, { ...emptySong, url }]);
      }
      toast.success("Audio uploaded");
    } catch {
      toast.error("Upload failed");
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>, songIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 200 * 1024 * 1024) { toast.error("Max 200 MB"); return; }
    try {
      const url = await uploadApi.upload(file, "link");
      const updated = [...playlist];
      updated[songIndex] = { ...updated[songIndex], cover: url };
      setPlaylist(updated);
      toast.success("Cover uploaded");
    } catch {
      toast.error("Upload failed");
    }
  };

  const addSong = () => {
    setPlaylist([...playlist, { ...emptySong }]);
    setEditingSongIndex(playlist.length);
  };

  const removeSong = (index: number) => {
    const updated = playlist.filter((_, i) => i !== index);
    setPlaylist(updated);
    if (editingSongIndex === index) setEditingSongIndex(null);
  };

  const updateSong = (index: number, field: keyof PlaylistSong, value: string | number) => {
    const updated = [...playlist];
    updated[index] = { ...updated[index], [field]: value };
    setPlaylist(updated);
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      const song = playlist[editingSongIndex ?? 0];
      if (song?.start_time) audioRef.current.currentTime = song.start_time;
      audioRef.current.volume = volume / 100;
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const inputClass = "w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-[#3f3f46] outline-none transition-all focus:border-white/[0.12] focus:bg-white/[0.05]";
  const LABEL = "text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-2 block";

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-7 w-40 rounded-lg bg-[#0a0a0a] animate-shimmer" />
        <div className="h-96 rounded-xl bg-[#0a0a0a] animate-shimmer" />
      </div>
    );
  }

  const currentSong = playlist[editingSongIndex ?? 0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-white">Music</h1>
        <p className="text-[13px] text-[#52525b] mt-1">Add background music to your profile.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Playlist */}
          <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-semibold text-white">Playlist</h3>
              <button
                onClick={addSong}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black text-[12px] font-bold hover:bg-white/90 transition-all cursor-pointer"
              >
                <Plus size={12} /> Add Song
              </button>
            </div>

            <div className="space-y-1.5">
              {playlist.map((song, i) => (
                <div
                  key={i}
                  onClick={() => setEditingSongIndex(i)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all cursor-pointer",
                    editingSongIndex === i
                      ? "border-white/[0.12] bg-white/[0.04]"
                      : "border-white/[0.04] bg-white/[0.01] hover:border-white/[0.08]"
                  )}
                >
                  <GripVertical size={14} className="text-[#3f3f46] shrink-0" />
                  {song.cover ? (
                    <img src={song.cover} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
                      <Music size={14} className="text-[#3f3f46]" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-white truncate">{song.title || `Song ${i + 1}`}</p>
                    <p className="text-[11px] text-[#3f3f46] truncate">{song.artist || "Unknown artist"}</p>
                  </div>
                  {song.url && (
                    <span className="text-[10px] text-[#52525b] shrink-0">
                      {song.start_time > 0 && `@${song.start_time}s`}
                    </span>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); removeSong(i); }}
                    className="p-1.5 rounded-lg hover:bg-red-400/[0.08] text-[#52525b] hover:text-red-400 transition-all cursor-pointer shrink-0"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              {playlist.length === 0 && (
                <p className="text-[12px] text-[#3f3f46] text-center py-8">No songs. Add your first song.</p>
              )}
            </div>
          </div>

          {/* Song Editor */}
          {currentSong && editingSongIndex !== null && (
            <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6 space-y-4">
              <h3 className="text-[14px] font-semibold text-white">
                Editing: {currentSong.title || `Song ${editingSongIndex + 1}`}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Song Title</label>
                  <input
                    value={currentSong.title}
                    onChange={(e) => updateSong(editingSongIndex, "title", e.target.value)}
                    placeholder="Enter song title"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={LABEL}>Artist</label>
                  <input
                    value={currentSong.artist}
                    onChange={(e) => updateSong(editingSongIndex, "artist", e.target.value)}
                    placeholder="Enter artist name"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={LABEL}>Audio URL</label>
                <div className="flex gap-2">
                  <input
                    value={currentSong.url}
                    onChange={(e) => updateSong(editingSongIndex, "url", e.target.value)}
                    placeholder="Audio URL or upload"
                    className={`${inputClass} flex-1`}
                  />
                  <label className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-[13px] font-medium text-[#a1a1aa] hover:bg-white/[0.08] hover:text-white transition-all cursor-pointer shrink-0">
                    <Upload size={14} />
                    Upload
                    <input type="file" accept="audio/mpeg,audio/wav,audio/ogg,audio/mp4" onChange={(e) => handleAudioUpload(e, editingSongIndex)} className="hidden" />
                  </label>
                </div>
              </div>

              <div>
                <label className={LABEL}>Cover Art URL</label>
                <div className="flex gap-2">
                  <input
                    value={currentSong.cover}
                    onChange={(e) => updateSong(editingSongIndex, "cover", e.target.value)}
                    placeholder="Cover URL or upload"
                    className={`${inputClass} flex-1`}
                  />
                  <label className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-[13px] font-medium text-[#a1a1aa] hover:bg-white/[0.08] hover:text-white transition-all cursor-pointer shrink-0">
                    <Upload size={14} />
                    Upload
                    <input type="file" accept="image/*" onChange={(e) => handleCoverUpload(e, editingSongIndex)} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Start Time (seconds)</label>
                  <input
                    type="number"
                    min={0}
                    value={currentSong.start_time}
                    onChange={(e) => updateSong(editingSongIndex, "start_time", Number(e.target.value))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={LABEL}>End Time (seconds, 0 = end of track)</label>
                  <input
                    type="number"
                    min={0}
                    value={currentSong.end_time}
                    onChange={(e) => updateSong(editingSongIndex, "end_time", Number(e.target.value))}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Settings */}
          <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6 space-y-4">
            <h3 className="text-[14px] font-semibold text-white mb-2">Player Settings</h3>
            {[
              { label: "Autoplay", desc: "Auto-play when profile loads", value: autoplay, set: setAutoplay },
              { label: "Loop", desc: "Repeat the track continuously", value: loop, set: setLoop },
              { label: "Show Player", desc: "Display the music player", value: showPlayer, set: setShowPlayer },
              { label: "Show Visualizer", desc: "Display audio visualizer bars", value: showVisualizer, set: setShowVisualizer },
              { label: "Show Progress Bar", desc: "Display the progress bar", value: showProgressBar, set: setShowProgressBar },
              { label: "Show Controls", desc: "Show prev/next/shuffle buttons", value: showControls, set: setShowControls },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between py-1">
                <div>
                  <p className="text-[13px] text-white">{s.label}</p>
                  <p className="text-[11px] text-[#3f3f46]">{s.desc}</p>
                </div>
                <button
                  onClick={() => s.set(!s.value)}
                  className={`w-10 h-[22px] rounded-full transition-all cursor-pointer relative ${s.value ? "bg-white" : "bg-white/[0.12]"}`}
                >
                  <div className={`absolute top-[3px] w-4 h-4 rounded-full transition-all ${s.value ? "left-[22px] bg-black" : "left-[3px] bg-[#52525b]"}`} />
                </button>
              </div>
            ))}

            {showVisualizer && (
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={visualizerColor}
                  onChange={(e) => setVisualizerColor(e.target.value)}
                  className="w-8 h-8 rounded-lg border border-white/[0.06] bg-transparent cursor-pointer appearance-none [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-lg [&::-webkit-color-swatch]:border-none"
                />
                <span className="text-[12px] text-[#71717a]">Visualizer Color</span>
              </div>
            )}

            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-[13px] text-white">Song Transition</p>
                <p className="text-[11px] text-[#3f3f46]">How songs transition between each other</p>
              </div>
              <select
                value={songTransition}
                onChange={(e) => setSongTransition(e.target.value)}
                className="text-[12px] rounded-lg border border-white/[0.06] bg-white/[0.03] text-[#a1a1aa] px-3 py-1.5 outline-none cursor-pointer"
              >
                <option value="instant">Instant</option>
                <option value="fade">Fade</option>
                <option value="crossfade">Crossfade</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-[12px] mb-2">
                <span className="text-[#71717a]">Volume</span>
                <span className="text-[#3f3f46]">{volume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full accent-white h-1"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-black text-[13px] font-bold hover:bg-white/90 transition-all disabled:opacity-40 cursor-pointer"
          >
            <Save size={14} />
            {saving ? "Saving..." : "Save Music"}
          </button>
        </div>

        {/* Preview */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-4">
            <h3 className="text-[12px] font-semibold text-[#71717a] uppercase tracking-wider mb-3">Preview</h3>
            <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden bg-[#050505] flex flex-col items-center justify-center p-6">
              {currentSong?.cover ? (
                <img src={currentSong.cover} alt="" className="w-32 h-32 rounded-xl object-cover mb-4" />
              ) : (
                <div className="w-32 h-32 rounded-xl bg-white/[0.04] flex items-center justify-center mb-4">
                  <Music size={32} className="text-[#3f3f46]" />
                </div>
              )}
              <p className="text-white font-medium text-center truncate w-full text-[13px]">{currentSong?.title || "No song"}</p>
              <p className="text-[#52525b] text-[12px] text-center truncate w-full">{currentSong?.artist || "Unknown artist"}</p>

              {currentSong?.url && (
                <>
                  <audio ref={audioRef} src={currentSong.url} loop={loop} onEnded={() => setIsPlaying(false)} />
                  <div className="flex items-center gap-4 mt-4">
                    <button
                      onClick={togglePlayback}
                      className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-white/90 transition-all cursor-pointer"
                    >
                      {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                    </button>
                  </div>
                  {showProgressBar && (
                    <div className="flex items-center gap-2 mt-3 w-full">
                      <div className="flex-1 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                        <div className="h-full bg-white/60 rounded-full" style={{ width: `${volume}%` }} />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
