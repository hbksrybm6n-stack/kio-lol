import { useState, useEffect } from 'react';
import { configApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { cn } from '@/lib/utils';
import { Save } from 'lucide-react';

const OVERLAY_EFFECTS = ['None', 'Snow', 'Rain', 'Stars', 'Fireflies', 'Sakura', 'Sparkles'] as const;

export default function DashboardEffects() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [particles, setParticles] = useState(false);
  const [particleColor, setParticleColor] = useState('#ffffff');
  const [particleCount, setParticleCount] = useState(50);
  const [snow, setSnow] = useState(false);
  const [stars, setStars] = useState(false);
  const [glow, setGlow] = useState(false);
  const [glowColor, setGlowColor] = useState('#8b5cf6');
  const [neonBorder, setNeonBorder] = useState(false);
  const [animatedGradient, setAnimatedGradient] = useState(false);
  const [matrixRain, setMatrixRain] = useState(false);
  const [floatingShapes, setFloatingShapes] = useState(false);
  const [usernameEffects, setUsernameEffects] = useState(false);
  const [textEffects, setTextEffects] = useState(false);
  const [customCursor, setCustomCursor] = useState(false);
  const [cursorUrl, setCursorUrl] = useState('');
  const [cursorEffects, setCursorEffects] = useState(false);
  const [clickEffects, setClickEffects] = useState(false);
  const [overlayEffect, setOverlayEffect] = useState<string>('None');
  const [overlayOpacity, setOverlayOpacity] = useState(50);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await configApi.get();
      const fx = data?.effects || {};
      setParticles(fx.particles ?? false);
      setParticleColor(fx.particleColor ?? '#ffffff');
      setParticleCount(fx.particleCount ?? 50);
      setSnow(fx.snow ?? false);
      setStars(fx.stars ?? false);
      setGlow(fx.glow ?? false);
      setGlowColor(fx.glowColor ?? '#8b5cf6');
      setNeonBorder(fx.neonBorder ?? false);
      setAnimatedGradient(fx.animatedGradient ?? false);
      setMatrixRain(fx.matrixRain ?? false);
      setFloatingShapes(fx.floatingShapes ?? false);
      setUsernameEffects(fx.usernameEffects ?? false);
      setTextEffects(fx.textEffects ?? false);
      setCustomCursor(fx.customCursor ?? false);
      setCursorUrl(fx.cursorUrl ?? '');
      setCursorEffects(fx.cursorEffects ?? false);
      setClickEffects(fx.clickEffects ?? false);
      setOverlayEffect(fx.overlayEffect ?? 'None');
      setOverlayOpacity(fx.overlayOpacity ?? 50);
    } catch (err) {
      console.error('Failed to load config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await configApi.update({
        effects: {
          particles,
          particleColor,
          particleCount,
          snow,
          stars,
          glow,
          glowColor,
          neonBorder,
          animatedGradient,
          matrixRain,
          floatingShapes,
          usernameEffects,
          textEffects,
          customCursor,
          cursorUrl,
          cursorEffects,
          clickEffects,
          overlayEffect,
          overlayOpacity,
        },
      });
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 bg-neutral-800 rounded animate-pulse" />
        <div className="h-4 w-60 bg-neutral-800 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 bg-neutral-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Effects</h1>
        <p className="text-neutral-400 mt-1">Add visual effects to your profile.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white">Particles & Snow</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-300">Particles</span>
              <Switch checked={particles} onCheckedChange={setParticles} />
            </div>
            {particles && (
              <>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-neutral-400">Color</label>
                  <input
                    type="color"
                    value={particleColor}
                    onChange={(e) => setParticleColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer bg-transparent"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-neutral-400">Count</span>
                    <span className="text-neutral-500">{particleCount}</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    value={particleCount}
                    onChange={(e) => setParticleCount(Number(e.target.value))}
                    className="w-full accent-white"
                  />
                </div>
              </>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-300">Snow</span>
              <Switch checked={snow} onCheckedChange={setSnow} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-300">Stars</span>
              <Switch checked={stars} onCheckedChange={setStars} />
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white">Glow & Lighting</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-300">Glow</span>
              <Switch checked={glow} onCheckedChange={setGlow} />
            </div>
            {glow && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-neutral-400">Color</label>
                <input
                  type="color"
                  value={glowColor}
                  onChange={(e) => setGlowColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer bg-transparent"
                />
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-300">Neon Border</span>
              <Switch checked={neonBorder} onCheckedChange={setNeonBorder} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-300">Animated Gradient</span>
              <Switch checked={animatedGradient} onCheckedChange={setAnimatedGradient} />
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white">Motion</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-300">Matrix Rain</span>
              <Switch checked={matrixRain} onCheckedChange={setMatrixRain} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-300">Floating Shapes</span>
              <Switch checked={floatingShapes} onCheckedChange={setFloatingShapes} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-300">Username Effects</span>
              <Switch checked={usernameEffects} onCheckedChange={setUsernameEffects} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-300">Text Effects</span>
              <Switch checked={textEffects} onCheckedChange={setTextEffects} />
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white">Cursor</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-300">Custom Cursor</span>
              <Switch checked={customCursor} onCheckedChange={setCustomCursor} />
            </div>
            {customCursor && (
              <Input
                value={cursorUrl}
                onChange={(e) => setCursorUrl(e.target.value)}
                placeholder="Cursor image URL"
              />
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-300">Cursor Effects</span>
              <Switch checked={cursorEffects} onCheckedChange={setCursorEffects} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-300">Click Effects</span>
              <Switch checked={clickEffects} onCheckedChange={setClickEffects} />
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-semibold text-white">Overlay</h3>
        <div className="flex flex-wrap gap-2">
          {OVERLAY_EFFECTS.map((fx) => (
            <button
              key={fx}
              onClick={() => setOverlayEffect(fx)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                overlayEffect === fx
                  ? 'bg-white text-black'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              )}
            >
              {fx}
            </button>
          ))}
        </div>
        {overlayEffect !== 'None' && (
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-neutral-400">Opacity</span>
              <span className="text-neutral-500">{overlayOpacity}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={overlayOpacity}
              onChange={(e) => setOverlayOpacity(Number(e.target.value))}
              className="w-full accent-white"
            />
          </div>
        )}
      </Card>

      <Button onClick={handleSave} disabled={saving}>
        <Save size={16} className="mr-2" />
        {saving ? 'Saving...' : 'Save Effects'}
      </Button>
    </div>
  );
}