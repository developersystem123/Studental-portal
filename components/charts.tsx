"use client";

import * as React from "react";

export function LineChart({
  data,
  height = 220,
  yFormatter,
}: {
  data: { day: string; hours: number }[];
  height?: number;
  yFormatter?: (v: number) => string;
}) {
  const w = 600;
  const h = height;
  const pad = { top: 20, right: 20, bottom: 30, left: 36 };
  const maxY = Math.max(...data.map((d) => d.hours), 1);
  const stepX = (w - pad.left - pad.right) / Math.max(1, data.length - 1);
  const fmt = yFormatter ?? ((v: number) => `${v.toFixed(1)}h`);

  const points = data.map((d, i) => ({
    x: pad.left + i * stepX,
    y: pad.top + (1 - d.hours / maxY) * (h - pad.top - pad.bottom),
    ...d,
  }));

  const pathD = points
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = points[i - 1];
      const cx = (prev.x + p.x) / 2;
      return `Q ${cx} ${prev.y} ${cx} ${(prev.y + p.y) / 2} T ${p.x} ${p.y}`;
    })
    .join(" ");

  const areaD =
    pathD +
    ` L ${points[points.length - 1].x} ${h - pad.bottom} L ${points[0].x} ${h - pad.bottom} Z`;

  const yTicks = 4;
  const tickVals = Array.from({ length: yTicks + 1 }, (_, i) => (maxY * (yTicks - i)) / yTicks);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="lc-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="lc-stroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="var(--accent)" />
        </linearGradient>
      </defs>

      {tickVals.map((v, i) => {
        const y = pad.top + (i * (h - pad.top - pad.bottom)) / yTicks;
        return (
          <g key={i}>
            <line x1={pad.left} y1={y} x2={w - pad.right} y2={y} stroke="var(--border)" strokeDasharray="3 3" />
            <text x={6} y={y + 4} fontSize="10" fill="var(--muted-2)">
              {fmt(v)}
            </text>
          </g>
        );
      })}

      <path d={areaD} fill="url(#lc-area)" />
      <path d={pathD} fill="none" stroke="url(#lc-stroke)" strokeWidth="2.5" strokeLinecap="round" />

      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="var(--surface)" stroke="var(--primary)" strokeWidth="2" />
          <text x={p.x} y={h - 8} textAnchor="middle" fontSize="10" fill="var(--muted)">
            {p.day}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function BarChart({
  data,
  height = 220,
  valueLabel,
}: {
  data: { label: string; value: number }[];
  height?: number;
  valueLabel?: (v: number) => string;
}) {
  const w = 600;
  const h = height;
  const pad = { top: 20, right: 16, bottom: 36, left: 36 };
  const maxY = Math.max(...data.map((d) => d.value), 1);
  const innerW = w - pad.left - pad.right;
  const innerH = h - pad.top - pad.bottom;
  const slot = innerW / Math.max(1, data.length);
  const barW = Math.min(48, slot * 0.6);
  const yTicks = 4;
  const tickVals = Array.from({ length: yTicks + 1 }, (_, i) => (maxY * (yTicks - i)) / yTicks);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="bar-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="var(--accent)" />
        </linearGradient>
      </defs>

      {tickVals.map((v, i) => {
        const y = pad.top + (i * innerH) / yTicks;
        return (
          <g key={i}>
            <line x1={pad.left} y1={y} x2={w - pad.right} y2={y} stroke="var(--border)" strokeDasharray="3 3" />
            <text x={6} y={y + 4} fontSize="10" fill="var(--muted-2)">
              {Math.round(v)}
            </text>
          </g>
        );
      })}

      {data.map((d, i) => {
        const barH = (d.value / maxY) * innerH;
        const x = pad.left + i * slot + (slot - barW) / 2;
        const y = pad.top + innerH - barH;
        return (
          <g key={d.label}>
            <rect x={x} y={y} width={barW} height={barH} rx="6" fill="url(#bar-fill)" />
            {d.value > 0 && (
              <text x={x + barW / 2} y={y - 6} textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--foreground)">
                {valueLabel ? valueLabel(d.value) : d.value}
              </text>
            )}
            <text x={x + barW / 2} y={h - 12} textAnchor="middle" fontSize="10" fill="var(--muted)">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function Sparkline({
  data,
  width = 100,
  height = 32,
  color = "var(--primary)",
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  if (data.length < 2) {
    return <div style={{ width, height }} />;
  }
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const points = data.map((v, i) => ({
    x: i * step,
    y: height - ((v - min) / range) * (height - 4) - 2,
  }));
  const pathD = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(" ");
  const areaD = `${pathD} L ${width} ${height} L 0 ${height} Z`;
  const id = React.useId();
  return (
    <svg width={width} height={height} className="block">
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#spark-${id})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="2.5" fill={color} />
    </svg>
  );
}

export function ProgressBar({ value, label, hint }: { value: number; label: string; hint?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium truncate pr-3">{label}</span>
        <span className="text-[var(--muted)] tabular-nums shrink-0">{hint ?? `${Math.round(v)}%`}</span>
      </div>
      <div className="mt-1.5 h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]"
          style={{ width: `${v}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Activity heatmap — GitHub-style grid. Cells are 0..maxValue intensity.
 * Cells appear with a small staggered fade so it feels alive on mount.
 */
export function Heatmap({
  cells,
  weeks,
  maxValue = 4,
  cellSize = 14,
  gap = 3,
  weekdayLabels = ["Mon", "Wed", "Fri"],
}: {
  cells: { day: number; week: number; value: number }[];
  weeks: number;
  maxValue?: number;
  cellSize?: number;
  gap?: number;
  weekdayLabels?: string[];
}) {
  const labelW = 28;
  const w = labelW + weeks * (cellSize + gap);
  const h = 7 * (cellSize + gap) + 18;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full block" preserveAspectRatio="xMinYMin meet">
      <defs>
        <linearGradient id="hm-cell" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="var(--accent)" />
        </linearGradient>
      </defs>

      {/* Weekday labels (every other row) */}
      {[1, 3, 5].map((dayIdx, i) => (
        <text
          key={dayIdx}
          x={0}
          y={dayIdx * (cellSize + gap) + cellSize}
          fontSize="9"
          fill="var(--muted-2)"
        >
          {weekdayLabels[i]}
        </text>
      ))}

      {cells.map((c) => {
        const x = labelW + c.week * (cellSize + gap);
        const y = c.day * (cellSize + gap);
        const intensity = c.value / Math.max(1, maxValue);
        const fill = c.value === 0 ? "var(--surface-2)" : "url(#hm-cell)";
        const opacity = c.value === 0 ? 1 : 0.3 + intensity * 0.7;
        const delay = (c.week * 7 + c.day) * 6;
        return (
          <rect
            key={`${c.week}-${c.day}`}
            x={x}
            y={y}
            width={cellSize}
            height={cellSize}
            rx={3}
            fill={fill}
            opacity={opacity}
            style={{
              animation: `fadeIn 0.35s ease-out ${delay}ms both`,
              transformOrigin: `${x + cellSize / 2}px ${y + cellSize / 2}px`,
            }}
          >
            <title>{`${c.value} session${c.value === 1 ? "" : "s"}`}</title>
          </rect>
        );
      })}

      {/* Legend */}
      <g transform={`translate(${labelW} ${7 * (cellSize + gap) + 8})`}>
        <text x={0} y={9} fontSize="9" fill="var(--muted-2)">Less</text>
        {Array.from({ length: 5 }).map((_, i) => {
          const o = i === 0 ? 1 : 0.3 + (i / 4) * 0.7;
          return (
            <rect
              key={i}
              x={28 + i * (cellSize + gap)}
              y={1}
              width={cellSize}
              height={cellSize}
              rx={3}
              fill={i === 0 ? "var(--surface-2)" : "url(#hm-cell)"}
              opacity={o}
            />
          );
        })}
        <text x={28 + 5 * (cellSize + gap) + 4} y={9} fontSize="9" fill="var(--muted-2)">More</text>
      </g>
    </svg>
  );
}

/**
 * Multi-ring radial chart. Each entry is a concentric ring whose arc length
 * encodes the value. Animates the arcs on mount via stroke-dashoffset.
 */
export function RadialBars({
  data,
  size = 200,
  trackWidth = 9,
  gap = 4,
}: {
  data: { label: string; value: number; color: string }[];
  size?: number;
  trackWidth?: number;
  gap?: number;
}) {
  const c = size / 2;
  const ringStep = trackWidth + gap;
  const reactId = React.useId();
  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        {data.map((d, i) => {
          const r = c - trackWidth / 2 - i * ringStep;
          if (r <= 6) return null;
          const circ = 2 * Math.PI * r;
          const v = Math.max(0, Math.min(100, d.value));
          const dashLen = (circ * v) / 100;
          return (
            <g key={d.label}>
              <circle
                cx={c}
                cy={c}
                r={r}
                fill="none"
                stroke="var(--surface-2)"
                strokeWidth={trackWidth}
              />
              <circle
                cx={c}
                cy={c}
                r={r}
                fill="none"
                stroke={d.color}
                strokeWidth={trackWidth}
                strokeLinecap="round"
                strokeDasharray={`${dashLen} ${circ}`}
                strokeDashoffset={0}
                transform={`rotate(-90 ${c} ${c})`}
                style={{
                  animation: `radialDraw-${reactId.replace(/[^a-z0-9]/gi, "")}-${i} 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) both`,
                }}
              />
              <style>{`
                @keyframes radialDraw-${reactId.replace(/[^a-z0-9]/gi, "")}-${i} {
                  from { stroke-dasharray: 0 ${circ}; }
                  to   { stroke-dasharray: ${dashLen} ${circ}; }
                }
              `}</style>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function Donut({ value, size = 96, label }: { value: number; size?: number; label?: string }) {
  const r = (size - 10) / 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={c} cy={c} r={r} fill="none" stroke="var(--surface-2)" strokeWidth="8" />
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${(circ * v) / 100} ${circ}`}
          transform={`rotate(-90 ${c} ${c})`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold">{Math.round(v)}%</span>
        {label && <span className="text-[10px] text-[var(--muted)]">{label}</span>}
      </div>
    </div>
  );
}
