"use client";

import * as React from "react";
import Icon from "@/components/icons";
import { cn, formatDuration } from "@/lib/utils";

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function VideoPlayer({
  title,
  durationSeconds = 600,
}: {
  title: string;
  durationSeconds?: number;
}) {
  const [playing, setPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [volume, setVolume] = React.useState(0.7);
  const [muted, setMuted] = React.useState(false);
  const [speed, setSpeed] = React.useState(1);
  const [showSpeed, setShowSpeed] = React.useState(false);
  const [showControls, setShowControls] = React.useState(true);
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const hideTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Simulate playback
  React.useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setProgress((p) => {
        if (p >= durationSeconds) { setPlaying(false); return durationSeconds; }
        return p + 0.5 * speed;
      });
    }, 500);
    return () => clearInterval(t);
  }, [playing, durationSeconds, speed]);

  // Reset on chapter change
  React.useEffect(() => {
    setProgress(0);
    setPlaying(false);
  }, [title]);

  // Auto-hide controls after 3s of inactivity while playing
  React.useEffect(() => {
    if (!playing) { setShowControls(true); return; }
    function bump() {
      setShowControls(true);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setShowControls(false), 3000);
    }
    const el = wrapperRef.current;
    el?.addEventListener("mousemove", bump);
    bump();
    return () => {
      el?.removeEventListener("mousemove", bump);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [playing]);

  // Close speed dropdown on outside click
  React.useEffect(() => {
    if (!showSpeed) return;
    function onDown(e: MouseEvent) {
      if (!(e.target as HTMLElement).closest("[data-speed]")) setShowSpeed(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [showSpeed]);

  function skip(s: number) {
    setProgress((p) => Math.max(0, Math.min(durationSeconds, p + s)));
  }

  function fullscreen() {
    const el = wrapperRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  }

  const effectiveVol = muted ? 0 : volume;
  const pct = durationSeconds > 0 ? (progress / durationSeconds) * 100 : 0;

  return (
    <div
      ref={wrapperRef}
      className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black select-none cursor-pointer"
      onClick={() => { if (!showSpeed) setPlaying((v) => !v); }}
    >
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-900 via-emerald-900 to-teal-800">
        <div
          className="absolute inset-0 opacity-20 mix-blend-overlay"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(255,255,255,.4) 0px, transparent 40%), radial-gradient(circle at 80% 80%, rgba(255,255,255,.3) 0px, transparent 40%)",
          }}
        />
      </div>

      {/* Center title + play button */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white pointer-events-none">
        <p className="text-[11px] uppercase tracking-widest text-white/50 mb-2">Now Playing</p>
        <h3 className="text-lg sm:text-2xl font-semibold max-w-md text-center px-6 leading-snug">
          {title}
        </h3>
        {!playing && (
          <div className="pointer-events-auto mt-6">
            <button
              onClick={(e) => { e.stopPropagation(); setPlaying(true); }}
              className="h-16 w-16 rounded-full bg-white/95 text-[var(--primary)] flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-transform duration-150"
            >
              <Icon.Play size={28} />
            </button>
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 px-4 pt-8 pb-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent text-white transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bar */}
        <div className="relative mb-3 group/prog">
          {/* Track */}
          <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden group-hover/prog:h-1.5 transition-all">
            <div
              className="h-full bg-[var(--primary)] rounded-full"
              style={{ width: `${pct}%` }}
            />
          </div>
          {/* Invisible wide hit target */}
          <input
            type="range"
            min={0}
            max={durationSeconds}
            step={0.5}
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer h-5 -top-2"
          />
        </div>

        {/* Control row */}
        <div className="flex items-center gap-1">
          {/* Play/Pause */}
          <CtrlBtn onClick={() => setPlaying((v) => !v)} title={playing ? "Pause" : "Play"}>
            {playing ? <Icon.Pause size={17} /> : <Icon.Play size={17} />}
          </CtrlBtn>

          {/* Skip -10s */}
          <CtrlBtn onClick={() => skip(-10)} title="Back 10s">
            <Icon.SkipBack size={15} />
          </CtrlBtn>

          {/* Skip +10s */}
          <CtrlBtn onClick={() => skip(10)} title="Forward 10s">
            <Icon.SkipForward size={15} />
          </CtrlBtn>

          {/* Time */}
          <span className="text-[11px] font-mono text-white/70 ml-1 tabular-nums shrink-0">
            {formatDuration(progress)} / {formatDuration(durationSeconds)}
          </span>

          <div className="flex-1" />

          {/* Mute + Volume */}
          <CtrlBtn onClick={() => setMuted((m) => !m)} title={muted ? "Unmute" : "Mute"}>
            {effectiveVol === 0 ? <Icon.VolumeX size={16} /> : <Icon.Volume size={16} />}
          </CtrlBtn>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={effectiveVol}
            onChange={(e) => { setVolume(Number(e.target.value)); setMuted(false); }}
            className="w-16 sm:w-20 accent-[var(--primary)] cursor-pointer"
          />

          {/* Speed picker */}
          <div className="relative" data-speed>
            <button
              data-speed
              onClick={() => setShowSpeed((v) => !v)}
              className={cn(
                "h-7 px-2.5 rounded-lg text-xs font-bold border transition-all",
                showSpeed
                  ? "bg-[var(--primary)] border-[var(--primary)] text-white"
                  : "bg-white/10 border-white/20 text-white hover:bg-white/20",
              )}
            >
              {speed}x
            </button>

            {showSpeed && (
              <div
                data-speed
                className="absolute bottom-full right-0 mb-2 w-24 rounded-xl overflow-hidden shadow-2xl z-50 border border-white/10"
                style={{ background: "rgba(15,15,15,0.95)", backdropFilter: "blur(12px)" }}
              >
                <p className="text-[9px] font-bold uppercase tracking-widest text-white/40 px-3 pt-2.5 pb-1">
                  Speed
                </p>
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    data-speed
                    onClick={() => { setSpeed(s); setShowSpeed(false); }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 text-sm transition-colors",
                      speed === s
                        ? "bg-[var(--primary)] text-white font-semibold"
                        : "text-white/75 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    <span>{s}x</span>
                    {speed === s && <Icon.Check size={12} />}
                  </button>
                ))}
                <div className="h-1" />
              </div>
            )}
          </div>

          {/* Fullscreen */}
          <CtrlBtn onClick={fullscreen} title="Fullscreen">
            <Icon.Fullscreen size={16} />
          </CtrlBtn>
        </div>
      </div>

      {/* Live / playing dot */}
      <div
        className={cn(
          "absolute top-3 right-3 h-2 w-2 rounded-full transition-colors",
          playing ? "bg-red-500 pulse-dot" : "bg-white/30",
        )}
      />
    </div>
  );
}

function CtrlBtn({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/15 active:bg-white/25 transition-colors shrink-0"
    >
      {children}
    </button>
  );
}
