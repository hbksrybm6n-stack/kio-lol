import { useState, useEffect, useRef } from "react";
import { configApi, uploadApi } from "@/lib/api";
import { Save, Music, Play, Pause, Upload, X } from "lucide-react";
import toast from "react-hot-toast";

export default function DashboardMusic() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const [songTitle, setSongTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [musicUrl, setMusicUrl] = useState("");
  const [autoplay, setAutoplay] = useState(false);
  const [volume, setVolume] = useState(50);
  const [loop, setLoop] = useState(true);
  const [showPlayer, setShowPlayer] = useState(true);
  const [startTime, setStartTime] = useState(0);

  useEffect(() => {
    loadConfig();
    return () => { if (audioRef.current) audioRef.current.pause(); };
  }, []);

  const loadConfig = async () => {
    try {
      const data = await configApi.get();
      setSongTitle(data?.music_title || "");
      setArtist(data?.music_artist || "");
      setCoverUrl(data?.music_cover || "");
      setMusicUrl(data?.music_url || "");
      setAutoplay(data?.music_autoplay ?? false);
      setVolume(data?.music_volume ?? 50);
      setLoop(data?.music_loop ?? true);
      setShowPlayer(data?.music_show_player ?? true);
      setStartTime(data?.music_start_time ?? 0);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await configApi.update({
        music_title: songTitle,
        music_artist: artist,
        music_cover: coverUrl,
        music_url: musicUrl,
        music_autoplay: autoplay,
        music_volume: volume,
        music_loop: loop,
        music_show_player: showPlayer,
        music_start_time: startTime,
      });
      toast.success("Music saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 200 * 1024 * 1024) { toast.error("File size must be under 200 MB"); return; }
    try {
      const url = await uploadApi.upload(file, "link");
      setMusicUrl(url);
      toast.success("Audio uploaded");
    } catch {
      toast.error("Upload failed");
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 200 * 1024 * 1024) { toast.error("File size must be under 200 MB"); return; }
    try {
      const url = await uploadApi.upload(file, "link");
      setCoverUrl(url);
      toast.success("Cover uploaded");
    } catch {
      toast.error("Upload failed");
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.currentTime = startTime;
      audioRef.current.volume = volume / 100;
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-7 w-40 rounded-lg bg-[#0a0a0a] animate-shimmer" />
        <div className="h-96 rounded-xl bg-[#0a0a0a] animate-shimmer" />
      </div>
    );
  }

  const inputClass = "w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-[#3f3f46] outline-none transition-all focus:border-white/[0.12] focus:bg-white/[0.05]";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-white">Music</h1>
        <p className="text-[13px] text-[#52525b] mt-1">Add background music to your profile.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-6 space-y-6">
            {/* Song Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-2 block">Song Title</label>
                <input value={songTitle} onChange={(e) => setSongTitle(e.target.value)} placeholder="Enter song title" className={inputClass} />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-2 block">Artist</label>
                <input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Enter artist name" className={inputClass} />
              </div>
            </div>

            {/* Cover Upload */}
            <div>
              <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-2 block">Cover Art</label>
              <div className="flex gap-2">
                <input
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  placeholder="Cover URL or upload below"
                  className={`${inputClass} flex-1`}
                />
                <label className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-[13px] font-medium text-[#a1a1aa] hover:bg-white/[0.08] hover:text-white transition-all cursor-pointer shrink-0">
                  <Upload size={14} />
                  Upload
                  <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                </label>
              </div>
              {coverUrl && (
                <div className="mt-3 relative w-32 h-32 rounded-xl overflow-hidden border border-white/[0.06]">
                  <img src={coverUrl} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setCoverUrl("")}
                    className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>

            {/* Audio Upload */}
            <div>
              <label className="text-[11px] font-semibold text-[#71717a] uppercase tracking-wider mb-2 block">Audio File</label>
              <div className="flex gap-2">
                <input
                  value={musicUrl}
                  onChange={(e) => setMusicUrl(e.target.value)}
                  placeholder="Audio URL or upload below"
                  className={`${inputClass} flex-1`}
                />
                <label className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-[13px] font-medium text-[#a1a1aa] hover:bg-white/[0.08] hover:text-white transition-all cursor-pointer shrink-0">
                  <Upload size={14} />
                  Upload
                  <input type="file" accept="audio/mpeg,audio/wav,audio/ogg,audio/mp4" onChange={handleAudioUpload} className="hidden" />
                </label>
              </div>
              {musicUrl && (
                <div className="mt-3 flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3">
                  <Music size={16} className="text-[#52525b] shrink-0" />
                  <span className="text-[12px] text-[#71717a] truncate flex-1">{musicUrl.split("/").pop()}</span>
                  <button onClick={() => setMusicUrl("")} className="text-[#52525b] hover:text-red-400 transition-colors cursor-pointer">
                    <X size={14} />
                  </button>
                </div>
              )}
              <p className="text-[11px] text-[#3f3f46] mt-2">Max 200 MB · MP3, WAV, OGG, M4A</p>
            </div>

            {/* Settings */}
            <div className="space-y-4 pt-4 border-t border-white/[0.04]">
              {[
                { label: "Autoplay", desc: "Auto-play when profile loads", value: autoplay, set: setAutoplay },
                { label: "Loop", desc: "Repeat the track continuously", value: loop, set: setLoop },
                { label: "Show Player", desc: "Display the music player", value: showPlayer, set: setShowPlayer },
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

              <div>
                <div className="flex justify-between text-[12px] mb-2">
                  <span className="text-[#71717a]">Start Time</span>
                  <span className="text-[#3f3f46]">{startTime}s</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="300"
                  value={startTime}
                  onChange={(e) => setStartTime(Number(e.target.value))}
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
        </div>

        {/* Preview */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-xl border border-white/[0.04] bg-[#0a0a0a] p-4">
            <h3 className="text-[12px] font-semibold text-[#71717a] uppercase tracking-wider mb-3">Preview</h3>
            <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden bg-[#050505] flex flex-col items-center justify-center p-6">
              {coverUrl ? (
                <img src={coverUrl} alt="" className="w-32 h-32 rounded-xl object-cover mb-4" />
              ) : (
                <div className="w-32 h-32 rounded-xl bg-white/[0.04] flex items-center justify-center mb-4">
                  <Music size={32} className="text-[#3f3f46]" />
                </div>
              )}
              <p className="text-white font-medium text-center truncate w-full text-[13px]">{songTitle || "No song"}</p>
              <p className="text-[#52525b] text-[12px] text-center truncate w-full">{artist || "Unknown artist"}</p>

              {musicUrl && (
                <>
                  <audio ref={audioRef} src={musicUrl} loop={loop} onEnded={() => setIsPlaying(false)} />
                  <div className="flex items-center gap-4 mt-4">
                    <button
                      onClick={togglePlayback}
                      className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-white/90 transition-all cursor-pointer"
                    >
                      {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-3 w-full">
                    <div className="flex-1 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                      <div className="h-full bg-white/60 rounded-full" style={{ width: `${volume}%` }} />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
