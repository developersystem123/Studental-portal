"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge, Button, Input, Label, Modal, useToast } from "@/components/ui";
import Icon from "@/components/icons";
import { useAuth, useData } from "@/lib/store";
import {
  ChangePasswordCard,
  CollapsibleCard,
  PersonalInfoCard,
  ProfileCompletionCard,
  ProfileHero,
} from "@/components/profile/sections";
import { cn, relativeTime } from "@/lib/utils";

export default function StudentProfilePage() {
  const { user, deleteAccount, updateUser } = useAuth();
  const { enrollments, certificates, getCourse } = useData();
  const router = useRouter();
  const toast = useToast();
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [deleteInput, setDeleteInput] = React.useState("");
  const [googleModal, setGoogleModal] = React.useState<"connect" | "disconnect" | null>(null);
  const [googleLoading, setGoogleLoading] = React.useState(false);

  async function handleGoogleConnect() {
    setGoogleLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1200));
      await updateUser({ googleConnected: true });
      toast.push({ title: "Google account connected", description: "You can now sign in with Google.", tone: "success" });
      setGoogleModal(null);
    } catch {
      toast.push({ title: "Couldn't connect Google", description: "Please try again.", tone: "danger" });
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleGoogleDisconnect() {
    setGoogleLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      await updateUser({ googleConnected: false });
      toast.push({ title: "Google account disconnected", tone: "info" });
      setGoogleModal(null);
    } catch {
      toast.push({ title: "Couldn't disconnect Google", tone: "danger" });
    } finally {
      setGoogleLoading(false);
    }
  }

  if (!user) return null;

  const inProgress = enrollments.filter((e) => !e.completed && e.progress > 0).length;
  const completed = enrollments.filter((e) => e.completed).length;
  const notStarted = enrollments.filter((e) => e.progress === 0).length;

  const recentEnrollments = [...enrollments]
    .sort((a, b) => new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime())
    .slice(0, 3);

  const STATS = [
    {
      label: "Enrolled",
      value: enrollments.length,
      icon: <Icon.Book size={18} />,
      color: "text-sky-500",
      bg: "bg-sky-500/10",
      border: "border-sky-500/15",
    },
    {
      label: "In progress",
      value: inProgress,
      icon: <Icon.TrendingUp size={18} />,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/15",
    },
    {
      label: "Completed",
      value: completed,
      icon: <Icon.CheckCircle size={18} />,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/15",
    },
    {
      label: "Certificates",
      value: certificates.length,
      icon: <Icon.Award size={18} />,
      color: "text-[var(--primary)]",
      bg: "bg-[var(--primary-soft)]",
      border: "border-[var(--primary)]/15",
    },
  ] as const;

  return (
    <div className="space-y-6 fade-in">
      {/* ── Hero ── */}
      <ProfileHero
        extra={
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="default"><Icon.Book size={11} /> {enrollments.length} enrolled</Badge>
            <Badge variant="info">{inProgress} in progress</Badge>
            <Badge variant="success">{completed} completed</Badge>
            <Badge variant="primary"><Icon.Award size={11} /> {certificates.length} certificates</Badge>
          </div>
        }
      />

      {/* ── Learning stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STATS.map(({ label, value, icon, color, bg, border }) => (
          <div
            key={label}
            className={cn(
              "rounded-2xl border p-4 card-shadow hover:-translate-y-0.5 transition-all",
              bg,
              border,
            )}
          >
            <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center", bg, color)}>
              {icon}
            </div>
            <p className="mt-3 text-xs font-medium text-[var(--muted)]">{label}</p>
            <p className="mt-0.5 text-2xl font-bold tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      {/* ── Profile completion ── */}
      <ProfileCompletionCard />

      <PersonalInfoCard />
      <ChangePasswordCard />

      {/* ── Connected accounts ── */}
      <CollapsibleCard
        icon={<Icon.Google size={18} />}
        title="Connected accounts"
        description="Link external accounts for faster sign-in."
      >
        <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)]">
              <Icon.Google size={20} />
            </div>
            <div>
              <p className="text-sm font-medium">Google</p>
              <p className="text-xs text-[var(--muted)]">
                {user.googleConnected ? `Connected · ${user.email}` : "Not connected"}
              </p>
            </div>
            {user.googleConnected && (
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                Active
              </span>
            )}
          </div>
          <Button
            variant={user.googleConnected ? "ghost" : "outline"}
            size="sm"
            onClick={() => setGoogleModal(user.googleConnected ? "disconnect" : "connect")}
          >
            {user.googleConnected ? "Disconnect" : "Connect"}
          </Button>
        </div>
      </CollapsibleCard>

      {/* ── Your learning ── */}
      <CollapsibleCard
        icon={<Icon.Compass size={18} />}
        title="Your learning"
        description="Pick up where you left off."
      >
        {/* Recent enrollments */}
        {recentEnrollments.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-2)]">
              Recent courses
            </p>
            <ul className="space-y-2">
              {recentEnrollments.map((e) => {
                const course = getCourse(e.courseId);
                if (!course) return null;
                return (
                  <li key={e.courseId}>
                    <Link
                      href={`/my-courses/${e.courseId}`}
                      className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-3 transition hover:border-[var(--primary)]/30 hover:bg-[var(--primary-soft)]/20 group"
                    >
                      <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg border border-[var(--border)]">
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{course.title}</p>
                        <p className="text-xs text-[var(--muted)]">
                          {e.completed ? "Completed" : `${e.progress}% complete`}
                          {" · "}
                          {relativeTime(e.enrolledAt)}
                        </p>
                        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[var(--surface-2)]">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              e.completed ? "bg-emerald-500" : "bg-[var(--primary)]",
                            )}
                            style={{ width: `${e.progress}%` }}
                          />
                        </div>
                      </div>
                      <div className="shrink-0">
                        {e.completed ? (
                          <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <Icon.CheckCircle size={11} /> Done
                          </span>
                        ) : (
                          <Icon.ChevronRight
                            size={16}
                            className="text-[var(--muted-2)] transition group-hover:translate-x-0.5 group-hover:text-[var(--primary)]"
                          />
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <QuickLink
            href="/my-courses"
            icon={<Icon.Book size={16} />}
            title="My courses"
            description={`${enrollments.length} enrolled`}
          />
          <QuickLink
            href="/certificates"
            icon={<Icon.Award size={16} />}
            title="Certificates"
            description={`${certificates.length} earned`}
          />
          <QuickLink
            href="/explore"
            icon={<Icon.Compass size={16} />}
            title="Explore"
            description="Browse the catalog"
          />
        </div>

        {/* Progress summary */}
        {enrollments.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Not started", value: notStarted, color: "bg-[var(--surface-2)]" },
              { label: "In progress", value: inProgress, color: "bg-amber-500" },
              { label: "Completed", value: completed, color: "bg-emerald-500" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl border border-border p-2 text-center">
                <div className={cn("mx-auto mb-1.5 h-1.5 w-6 rounded-full", color)} />
                <p className="text-xl font-bold tabular-nums">{value}</p>
                <p className="text-[10px] leading-tight text-muted">{label}</p>
              </div>
            ))}
          </div>
        )}
      </CollapsibleCard>

      {/* ── Danger zone ── */}
      <CollapsibleCard
        icon={<Icon.Trash size={18} />}
        title="Danger zone"
        description="Permanent actions. Cannot be undone."
        tone="danger"
        defaultOpen={false}
      >
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--danger)]/20 p-4">
          <div className="min-w-0">
            <p className="text-sm font-medium">Delete account</p>
            <p className="mt-0.5 text-xs text-[var(--muted)]">
              Permanently removes your account, enrollments, certificates, and all progress.
            </p>
          </div>
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>
            <Icon.Trash size={16} /> Delete account
          </Button>
        </div>
      </CollapsibleCard>

      {/* ── Google connect modal ── */}
      <Modal
        open={googleModal === "connect"}
        onClose={() => !googleLoading && setGoogleModal(null)}
        title="Connect Google account"
      >
        <div className="space-y-4 p-5">
          <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white">
              <Icon.Google size={22} />
            </div>
            <div>
              <p className="text-sm font-medium">Sign in with Google</p>
              <p className="text-xs text-[var(--muted)]">{user.email}</p>
            </div>
          </div>
          <p className="text-sm text-[var(--muted)]">
            Linking your Google account lets you sign in faster without a password. Your account email will remain{" "}
            <span className="font-medium text-[var(--foreground)]">{user.email}</span>.
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => setGoogleModal(null)} disabled={googleLoading}>
              Cancel
            </Button>
            <Button loading={googleLoading} onClick={handleGoogleConnect}>
              <Icon.Google size={15} /> Connect Google
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Google disconnect modal ── */}
      <Modal
        open={googleModal === "disconnect"}
        onClose={() => !googleLoading && setGoogleModal(null)}
        title="Disconnect Google account?"
      >
        <div className="space-y-4 p-5">
          <p className="text-sm text-[var(--muted)]">
            You&apos;ll no longer be able to sign in with Google. Make sure you have a password set so
            you can still access your account.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setGoogleModal(null)} disabled={googleLoading}>
              Cancel
            </Button>
            <Button variant="danger" loading={googleLoading} onClick={handleGoogleDisconnect}>
              Disconnect
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Delete account modal ── */}
      <Modal
        open={confirmDelete}
        onClose={() => {
          setConfirmDelete(false);
          setDeleteInput("");
        }}
        title="Delete account?"
      >
        <div className="space-y-4 p-5">
          <p className="text-sm text-[var(--muted)]">
            Are you sure? This action cannot be undone. All your enrollments, certificates, and progress
            will be lost permanently.
          </p>
          <div>
            <Label htmlFor="profile-delete-confirm">
              Type <span className="font-mono font-bold">DELETE</span> to confirm
            </Label>
            <Input
              id="profile-delete-confirm"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value.toUpperCase())}
              placeholder="DELETE"
              autoComplete="off"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setConfirmDelete(false);
                setDeleteInput("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={deleteInput !== "DELETE"}
              onClick={async () => {
                try {
                  await deleteAccount();
                  toast.push({ title: "Account deleted", tone: "success" });
                  router.replace("/login");
                } catch {
                  toast.push({ title: "Couldn't delete account", tone: "danger" });
                }
              }}
            >
              <Icon.Trash size={16} /> Yes, delete my account
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function QuickLink({
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
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-[var(--border)] p-3 transition hover:border-[var(--primary)]/30 hover:bg-[var(--primary-soft)]/30"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-[var(--muted)]">{description}</p>
      </div>
      <Icon.ChevronRight
        size={16}
        className="text-[var(--muted-2)] transition group-hover:translate-x-0.5 group-hover:text-[var(--primary)]"
      />
    </Link>
  );
}
