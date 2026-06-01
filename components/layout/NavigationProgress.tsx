"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  const [width, setWidth] = useState(0);
  const [opacity, setOpacity] = useState(0);
  const prevPathname = useRef(pathname);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Start bar when a link inside the app is clicked.
  useEffect(() => {
    function onLinkClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href") ?? "";
      // Only intercept internal same-origin links.
      if (!href || href.startsWith("#") || href.startsWith("http") || href.startsWith("//")) return;
      if (animRef.current) clearInterval(animRef.current);
      if (hideRef.current) clearTimeout(hideRef.current);
      setOpacity(1);
      setWidth(8);
      animRef.current = setInterval(() => {
        setWidth((w) => {
          const next = w + (82 - w) * 0.12;
          if (next >= 82) { clearInterval(animRef.current!); return 82; }
          return next;
        });
      }, 80);
    }
    document.addEventListener("click", onLinkClick);
    return () => document.removeEventListener("click", onLinkClick);
  }, []);

  // Complete + hide when the route actually changes.
  useEffect(() => {
    if (pathname === prevPathname.current) return;
    prevPathname.current = pathname;
    if (animRef.current) clearInterval(animRef.current);
    setWidth(100);
    hideRef.current = setTimeout(() => {
      setOpacity(0);
      setTimeout(() => setWidth(0), 300);
    }, 250);
    return () => { if (hideRef.current) clearTimeout(hideRef.current); };
  }, [pathname]);

  if (width === 0) return null;
  return (
    <div
      style={{
        width: `${width}%`,
        opacity,
        transition:
          width === 100
            ? "width 0.2s ease, opacity 0.3s ease"
            : "width 0.4s ease-out, opacity 0.15s ease",
      }}
      className="fixed top-0 left-0 z-[200] h-[3px] bg-[var(--primary)] shadow-[0_0_10px_var(--primary)] pointer-events-none"
    />
  );
}
