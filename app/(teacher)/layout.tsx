"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TeacherSidebar } from "@/components/layout/TeacherSidebar";
import { Topbar } from "@/components/layout/Topbar";
import { useAuth } from "@/lib/store";
import Icon from "@/components/icons";
import { cn } from "@/lib/utils";

const LS_SIDEBAR = "eduportal:teacher-sidebar-open";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
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
    if (user.role === "Admin") router.replace("/admin");
    else if (user.role === "Student") router.replace("/dashboard");
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

  if (!hydrated || loading || !user || user.role !== "Instructor") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-[var(--muted)]">
          <Icon.Loader size={20} /> Loading teacher portal…
        </div>
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
    <div className="teacher-theme flex h-screen overflow-hidden">
      <div
        className={cn(
          "hidden lg:block shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out",
          desktopOpen ? "w-72" : "w-20",
        )}
      >
        <TeacherSidebar collapsed={!desktopOpen} />
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] fade-in">
            <TeacherSidebar onClose={() => setMobileOpen(false)} />
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
