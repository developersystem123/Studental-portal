"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Topbar } from "@/components/layout/Topbar";
import { useAuth } from "@/lib/store";
import Icon from "@/components/icons";
import { cn } from "@/lib/utils";

const LS_SIDEBAR = "eduportal:admin-sidebar-open";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    try {
      const raw = localStorage.getItem(LS_SIDEBAR);
      if (raw !== null) setDesktopOpen(raw === "1");
    } catch {}
  }, []);

  useEffect(() => {
    if (!hydrated || loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "Admin") {
      router.replace("/dashboard");
    }
  }, [hydrated, loading, user, router]);

  useEffect(() => {
    if (hydrated) {
      try {
        localStorage.setItem(LS_SIDEBAR, desktopOpen ? "1" : "0");
      } catch {}
    }
  }, [desktopOpen, hydrated]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  if (!hydrated || loading || !user || user.role !== "Admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center gap-6">
          {/* Animated logo mark */}
          <div className="relative h-20 w-20">
            <div className="absolute inset-0 rounded-2xl btn-primary opacity-20 animate-ping" />
            <div className="relative h-20 w-20 rounded-2xl btn-primary flex items-center justify-center shadow-xl shadow-violet-500/30">
              <Icon.Settings size={36} className="text-white animate-spin" style={{ animationDuration: "3s" }} />
            </div>
          </div>

          {/* Brand */}
          <div className="text-center space-y-1">
            <p className="text-xl font-bold gradient-text tracking-tight">EduPortal</p>
            <p className="text-xs font-semibold tracking-widest text-[var(--muted-2)] uppercase">Admin Console</p>
          </div>

          {/* Progress bar */}
          <div className="w-48 h-1 rounded-full bg-[var(--surface-2)] overflow-hidden">
            <div className="h-full rounded-full btn-primary animate-[loading-bar_1.4s_ease-in-out_infinite]" />
          </div>

          <p className="text-xs text-[var(--muted)] animate-pulse">Loading admin console…</p>
        </div>

        <style>{`
          @keyframes loading-bar {
            0%   { width: 0%;   margin-left: 0%; }
            50%  { width: 60%;  margin-left: 20%; }
            100% { width: 0%;   margin-left: 100%; }
          }
        `}</style>
      </div>
    );
  }

  function handleToggle() {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      setDesktopOpen((o) => !o);
    } else {
      setMobileOpen((o) => !o);
    }
  }

  return (
    <div className="admin-theme flex h-screen overflow-hidden">
      <div
        className={cn(
          "hidden lg:block shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out",
          desktopOpen ? "w-72" : "w-20",
        )}
      >
        <AdminSidebar collapsed={!desktopOpen} />
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] fade-in">
            <AdminSidebar onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex flex-col flex-1 min-w-0">
        <Topbar onToggleSidebar={handleToggle} sidebarOpen={desktopOpen} />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
