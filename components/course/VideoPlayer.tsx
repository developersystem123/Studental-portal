"use client";

import * as React from "react";
import Icon from "@/components/icons";
import { cn, formatDuration } from "@/lib/utils";

export function VideoPlayer({ title, durationSeconds = 600 }: { title: string; durationSeconds?: number }) {
  const [playing, setPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0); // seconds
  const [volume, setVolume] = React.useState(0.7);
  const [speed, setSpeed] = React.useState(1);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setProgress((p) => {
        if (p >= durationSeconds) {
          setPlaying(false);
          return durationSeconds;
        }
        return p + 0.5 * speed;
      });
    }, 500);
    return () => clearInterval(t);
  }, [playing, durationSeconds, speed]);

  React.useEffect(() => {
    setProgress(0);
    setPlaying(false);
  }, [title]);

  function fullscreen() {
    const el = wrapperRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  }

  return (
    <div
      ref={wrapperRef}
      className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black group select-none"
    >
      {/* Fake video background */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-900 via-emerald-900 to-teal-800">
        <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{
          backgroundImage: "radial-gradient(circle at 20% 20%, rgba(255,255,255,.4) 0px, transparent 40%), radial-gradient(circle at 80% 80%, rgba(255,255,255,.3) 0px, transparent 40%)",
        }} />
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center">
        <p className="text-xs uppercase tracking-widest text-white/60 mb-2">Now Playing</p>
        <h3 className="text-xl sm:text-2xl font-semibold max-w-md">{title}</h3>
        {!playing && (
          <button
            onClick={() => setPlaying(true)}
            className="mt-6 h-16 w-16 rounded-full bg-white/95 text-[var(--primary)] flex items-center justify-center shadow-lg hover:scale-105 transition"
          >
            <Icon.Play size={28} />
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 bg-gradient-to-t from-black/90 to-transparent text-white">
        <input
          type="range"
          min={0}
          max={durationSeconds}
          step={0.5}
          value={progress}
          onChange={(e) => setProgress(Number(e.target.value))}
          className="pretty w-full"
        />
        <div className="flex items-center gap-3 mt-1 text-sm">
          <button onClick={() => setPlaying((p) => !p)} className="h-9 w-9 flex items-center justify-center hover:bg-white/10 rounded-lg">
            {playing ? <Icon.Pause size={20} /> : <Icon.Play size={20} />}
          </button>
          <span className="text-xs font-mono">
            {formatDuration(progress)} / {formatDuration(durationSeconds)}
          </span>
          <div className="flex items-center gap-2 ml-2">
            <Icon.Volume size={18} />
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="pretty w-20"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <select
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="bg-white/10 backdrop-blur text-xs rounded-md h-7 px-2 border border-white/20"
            >
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                <option key={s} value={s} className="text-black">{s}x</option>
              ))}
            </select>
            <button onClick={fullscreen} className="h-9 w-9 flex items-center justify-center hover:bg-white/10 rounded-lg">
              <Icon.Fullscreen size={18} />
            </button>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "absolute top-3 right-3 h-2 w-2 rounded-full",
          playing ? "bg-red-500 pulse-dot" : "bg-white/40",
        )}
      />
    </div>
  );
}
