"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "@/components/icons";
import { Button } from "@/components/ui";
import { useAuth } from "@/lib/store";

export default function NotFound() {
  const router = useRouter();
  const { user } = useAuth();

  const portalHref =
    user?.role === "Admin" ? "/admin" : user?.role === "Instructor" ? "/teacher" : "/dashboard";
  const portalLabel =
    user?.role === "Admin"
      ? "Admin console"
      : user?.role === "Instructor"
        ? "Teacher portal"
        : "Student dashboard";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-[var(--background)] text-[var(--foreground)]">
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[var(--primary)]/15 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-[var(--accent)]/15 blur-3xl" />
      </div>

      <div className="w-full max-w-3xl">
        <div className="relative rounded-3xl border border-[var(--border)] bg-[var(--surface)] card-shadow overflow-hidden">
          <div className="relative bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white p-8 sm:p-12">
            <div className="absolute inset-0 opacity-25 mix-blend-overlay pointer-events-none">
              <svg viewBox="0 0 600 300" className="w-full h-full">
                <defs>
                  <pattern id="nf-dots" width="22" height="22" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="1.4" fill="white" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#nf-dots)" />
              </svg>
            </div>
            <div className="relative">
              <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-white/15 backdrop-blur border border-white/20 uppercase tracking-wider font-semibold">
                <Icon.Compass size={11} /> Lost?
              </span>
              <p className="mt-4 text-[88px] sm:text-[120px] leading-none font-black tracking-tighter">
                404
              </p>
              <h1 className="mt-2 text-2xl sm:text-3xl font-bold">This page got lost in the lecture hall</h1>
              <p className="mt-2 text-white/85 max-w-lg">
                The link you followed might be broken, or the page may have been moved. Let&apos;s get you back on track.
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/" className="flex-1">
                <Button className="w-full h-12">
                  <Icon.Home size={16} /> Go to home
                </Button>
              </Link>
              <Button variant="outline" className="h-12" onClick={() => router.back()}>
                <Icon.ArrowLeft size={16} /> Go back
              </Button>
              {user && (
                <Link href={portalHref}>
                  <Button variant="outline" className="h-12 w-full">
                    {user.role === "Admin" ? (
                      <Icon.Settings size={16} />
                    ) : user.role === "Instructor" ? (
                      <Icon.Sparkles size={16} />
                    ) : (
                      <Icon.Book size={16} />
                    )}
                    {portalLabel}
                  </Button>
                </Link>
              )}
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-[var(--muted-2)] font-semibold mb-3">
                Or jump to
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <SuggestionLink href="/courses" icon={<Icon.Book size={16} />} title="Browse courses" description="Explore the catalog" />
                <SuggestionLink href="/about" icon={<Icon.Sparkles size={16} />} title="About EduPortal" description="What we're building" />
                <SuggestionLink href="/contact" icon={<Icon.Mail size={16} />} title="Contact support" description="We're here to help" />
                {user ? (
                  <SuggestionLink
                    href={user.role === "Admin" ? "/admin/profile" : user.role === "Instructor" ? "/teacher/profile" : "/profile"}
                    icon={<Icon.User size={16} />}
                    title="Your profile"
                    description="Account settings"
                  />
                ) : (
                  <SuggestionLink href="/login" icon={<Icon.User size={16} />} title="Sign in" description="Resume your learning" />
                )}
              </ul>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-[var(--muted-2)]">
          If you think this is a mistake,{" "}
          <Link href="/contact" className="text-[var(--primary)] hover:underline font-medium">
            let us know
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

function SuggestionLink({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] hover:border-[var(--primary)]/30 hover:bg-[var(--primary-soft)]/30 transition group"
      >
        <div className="h-9 w-9 rounded-lg bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-[var(--muted)]">{description}</p>
        </div>
        <Icon.ChevronRight size={16} className="text-[var(--muted-2)] group-hover:text-[var(--primary)] group-hover:translate-x-0.5 transition" />
      </Link>
    </li>
  );
}
