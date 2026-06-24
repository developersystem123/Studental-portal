"use client";

import { Button } from "@/components/ui";
import Icon from "@/components/icons";

/* ── Minimal ZIP writer (STORE / no compression) — no external library ── */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function buildZip(files: { name: string; text: string }[]): Blob {
  const enc = new TextEncoder();
  const out: number[] = [];
  const central: number[] = [];
  const u16 = (a: number[], v: number) => a.push(v & 0xff, (v >>> 8) & 0xff);
  const u32 = (a: number[], v: number) =>
    a.push(v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff);
  const bytes = (a: number[], b: Uint8Array) => {
    for (let i = 0; i < b.length; i++) a.push(b[i]);
  };

  for (const f of files) {
    const name = enc.encode(f.name);
    const data = enc.encode(f.text);
    const crc = crc32(data);
    const localStart = out.length;

    // Local file header
    u32(out, 0x04034b50);
    u16(out, 20); u16(out, 0); u16(out, 0); // version, flags, method (0 = store)
    u16(out, 0); u16(out, 0); // mod time, mod date
    u32(out, crc); u32(out, data.length); u32(out, data.length);
    u16(out, name.length); u16(out, 0);
    bytes(out, name);
    bytes(out, data);

    // Central directory record
    u32(central, 0x02014b50);
    u16(central, 20); u16(central, 20); u16(central, 0); u16(central, 0);
    u16(central, 0); u16(central, 0);
    u32(central, crc); u32(central, data.length); u32(central, data.length);
    u16(central, name.length); u16(central, 0); u16(central, 0);
    u16(central, 0); u16(central, 0); u32(central, 0);
    u32(central, localStart);
    bytes(central, name);
  }

  const centralStart = out.length;
  for (const b of central) out.push(b);

  // End of central directory record
  u32(out, 0x06054b50);
  u16(out, 0); u16(out, 0);
  u16(out, files.length); u16(out, files.length);
  u32(out, central.length); u32(out, centralStart);
  u16(out, 0);

  return new Blob([new Uint8Array(out)], { type: "application/zip" });
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ── Asset contents ── */
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="64" viewBox="0 0 240 64">
  <rect x="8" y="12" width="40" height="40" rx="10" fill="#16a34a"/>
  <path d="M18 22 L38 42 M38 22 L18 42" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
  <text x="60" y="34" font-family="system-ui, sans-serif" font-size="22" font-weight="700" fill="#16a34a">EduPortal</text>
  <text x="60" y="50" font-family="system-ui, sans-serif" font-size="9" letter-spacing="3" fill="#6b7280">LEARN · BUILD · GROW</text>
</svg>`;

const COLORS_TXT = `EduPortal — Brand Colors
========================
Primary   #16a34a
Accent    #4ade80
Light     #f0fdf4
Dark      #07180d

Brand gradient: linear-gradient(135deg, #16a34a, #4ade80)
`;

const GUIDELINES_TXT = `EduPortal — Brand Guidelines (v3.2.1)
=====================================

DO
- Use the full-color logo on white or light backgrounds.
- Use the white logo on dark or brand-green backgrounds.

DON'T
- Don't change the logo colors or proportions.
- Don't add drop shadows or effects to the logo.
- Don't recolor, distort, or place on low-contrast backgrounds.

Always write our name as one word: EduPortal.

Brand voice: Warm, direct, hopeful. Human, accessible, curious.
Never: corporate-speak or jargon.
`;

const README_TXT = `EduPortal Brand Kit
===================
Contents:
  - eduportal-logo.svg     Full wordmark logo (SVG, scalable)
  - brand-colors.txt       Color palette + gradient
  - brand-guidelines.txt   Usage rules (do / don't)

Questions? press@eduportal.app
`;

function screenshotSVG(title: string, accent: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="800" viewBox="0 0 1280 800">
  <rect width="1280" height="800" fill="#f0fdf4"/>
  <rect x="0" y="0" width="240" height="800" fill="#0f2d1b"/>
  <rect x="24" y="28" width="150" height="20" rx="6" fill="#16a34a"/>
  <rect x="280" y="40" width="600" height="40" rx="10" fill="#ffffff" stroke="#bbf7d0"/>
  <text x="300" y="66" font-family="system-ui, sans-serif" font-size="20" font-weight="700" fill="#374151">${title}</text>
  <rect x="280" y="120" width="440" height="220" rx="16" fill="#ffffff" stroke="#bbf7d0"/>
  <rect x="760" y="120" width="440" height="220" rx="16" fill="${accent}" opacity="0.15"/>
  <rect x="280" y="370" width="920" height="380" rx="16" fill="#ffffff" stroke="#bbf7d0"/>
  <text x="640" y="790" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" fill="#9ca3af">EduPortal — product preview</text>
</svg>`;
}

export function BrandKitButton() {
  function handleClick() {
    const zip = buildZip([
      { name: "eduportal-logo.svg", text: LOGO_SVG },
      { name: "brand-colors.txt", text: COLORS_TXT },
      { name: "brand-guidelines.txt", text: GUIDELINES_TXT },
      { name: "README.txt", text: README_TXT },
    ]);
    download(zip, "eduportal-brand-kit.zip");
  }
  return (
    <Button type="button" onClick={handleClick}>
      <Icon.Download size={15} /> Download brand kit (ZIP)
    </Button>
  );
}

export function ProductScreenshotsButton() {
  function handleClick() {
    const zip = buildZip([
      { name: "eduportal-dashboard.svg", text: screenshotSVG("Dashboard", "#16a34a") },
      { name: "eduportal-ai-tutor.svg", text: screenshotSVG("AI Tutor", "#4ade80") },
    ]);
    download(zip, "eduportal-screenshots.zip");
  }
  return (
    <Button variant="outline" type="button" onClick={handleClick}>
      <Icon.Camera size={15} /> Product screenshots
    </Button>
  );
}
