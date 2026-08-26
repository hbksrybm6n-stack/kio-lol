import { useEffect, useRef, useState } from "react";

interface AudioVisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  color?: string;
  barCount?: number;
  barWidth?: number;
  height?: number;
}

export default function AudioVisualizer({
  audioRef,
  color = "#8b5cf6",
  barCount = 32,
  barWidth = 3,
  height = 48,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const fallbackRef = useRef<number[]>(new Array(barCount).fill(0));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const totalWidth = barCount * (barWidth + 2);
    canvas.width = totalWidth * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${totalWidth}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const tryConnectAudio = () => {
      if (!audioRef.current || analyserRef.current) return;
      try {
        const actx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = actx.createMediaElementSource(audioRef.current);
        const analyser = actx.createAnalyser();
        analyser.fftSize = 128;
        source.connect(analyser);
        analyser.connect(actx.destination);
        ctxRef.current = actx;
        sourceRef.current = source;
        analyserRef.current = analyser;
      } catch {}
    };

    const drawFallback = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const bars = fallbackRef.current;
      for (let i = 0; i < bars.length; i++) {
        const isPlaying = audioRef.current && !audioRef.current.paused && !audioRef.current.muted;
        if (isPlaying) {
          bars[i] = Math.random() * 0.8 + 0.1;
        } else {
          bars[i] *= 0.92;
        }
      }
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < bars.length; i++) {
        const barH = bars[i] * h;
        const x = i * (barWidth + 2);
        const y = (h - barH) / 2;
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.3 + bars[i] * 0.7;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barH, 1.5);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const drawAnalyser = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const analyser = analyserRef.current!;
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);
      ctx.clearRect(0, 0, w, h);
      const step = Math.floor(data.length / barCount);
      for (let i = 0; i < barCount; i++) {
        const val = data[i * step] / 255;
        const barH = Math.max(val * h, 1);
        const x = i * (barWidth + 2);
        const y = (h - barH) / 2;
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.3 + val * 0.7;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barH, 1.5);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const animate = () => {
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);
      if (analyserRef.current) {
        drawAnalyser(ctx, w, h);
      } else {
        drawFallback(ctx, w, h);
      }
      animFrameRef.current = requestAnimationFrame(animate);
    };

    const handlePlay = () => {
      tryConnectAudio();
    };

    const audio = audioRef.current;
    audio?.addEventListener("play", handlePlay);
    tryConnectAudio();
    animate();

    return () => {
      audio?.removeEventListener("play", handlePlay);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [audioRef, color, barCount, barWidth, height]);

  const totalWidth = barCount * (barWidth + 2);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: `${totalWidth}px`, height: `${height}px` }}
      className="block"
    />
  );
}
