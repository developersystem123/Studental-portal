"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/icons";
import { cn } from "@/lib/utils";

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      title="Back to top"
      className={cn(
        "fixed bottom-6 right-6 z-50 h-11 w-11 rounded-full flex items-center justify-center",
        "bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white",
        "shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/40",
        "hover:-translate-y-0.5 active:translate-y-0",
        "transition-all duration-300",
        visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-90 pointer-events-none",
      )}
    >
      <Icon.ArrowUp size={18} />
    </button>
  );
}
