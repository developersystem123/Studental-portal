"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, Badge, Button, Card, CardBody, Modal, useToast } from "@/components/ui";
import Icon from "@/components/icons";
import { useAuth, useTeacher } from "@/lib/store";
import {
  ChangePasswordCard,
  PersonalInfoCard,
  ProfileCompletionCard,
  ProfileHero,
  SectionHeader,
} from "@/components/profile/sections";
import { cn } from "@/lib/utils";

export default function TeacherProfilePage() {
  const { user, deleteAccount, updateUser } = useAuth();
  const teacher = useTeacher();
  const router = useRouter();
  const toast = useToast();
  const [confirmDelete, setConfirmDelete] = React.useState(false);
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

  const stats = teacher.stats();
  const myCourses = teacher.myCourses();

  const STAT_CARDS = [
    {
      label: "Courses",
      value: stats.courses,
      icon: <Icon.Book size={18} />,
      color: "text-[var(--primary)]",
      bg: "bg-[var(--primary-soft)]",
      border: "border-[var(--primary)]/15",
    },
    {
      label: "Students",
      value: stats.students,
      icon: <Icon.Users size={18} />,
      color: "text-sky-500",
      bg: "bg-sky-500/10",
      border: "border-sky-500/15",
    },
    {
      label: "Completions",
      value: stats.completions,
      icon: <Icon.Award size={18} />,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/15",
    },
  ] as const;

  return (
    <div className="space-y-6 fade-in">
      {/* ── Hero ── */}
      <ProfileHero
        extra={
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="primary"><Icon.Sparkles size={11} /> Instructor</Badge>
            <Badge variant="default">{stats.courses} courses</Badge>
            <Badge variant="info">{stats.students} students</Badge>
            <Badge variant="success">{stats.completions} completions</Badge>
          </div>
        }
      />

      {/* ── Teaching stats ── */}
      <div className="grid grid-cols-3 gap-3">
        {STAT_CARDS.map(({ label, value, icon, color, bg, border }) => (
          <div
            key={label}
            className={cn(
              "rounded-2xl border p-4 card-shadow hover:-translate-y-0.5 transition-all",
              bg,
              border,
            )}
          >
            <div className={cn("h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center", bg, color)}>
              {icon}
            </div>
            <p className="mt-2 sm:mt-3 text-[10px] sm:text-xs font-medium text-[var(--muted)]">{label}</p>
            <p className="mt-0.5 text-xl sm:text-2xl font-bold tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      {/* ── Profile completion ── */}
      <ProfileCompletionCard />

      <PersonalInfoCard
        description="Your bio is shown to students alongside the courses you teach — write something engaging."
        bioPlaceholder="e.g. Senior engineer turned educator. Loves teaching React, TypeScript, and clean code."
      />

      <ChangePasswordCard />

      {/* ── Public profile preview ── */}
      <Card>
        <CardBody className="space-y-5">
          <SectionHeader
            icon={<Icon.Eye size={18} />}
            title="Public profile preview"
            description="This is how students see your instructor card on course pages."
          />
          <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--primary-soft)] to-[var(--surface-2)] p-5">
            <div className="flex items-start gap-4">
              <Avatar name={user.name} src={user.avatar ?? null} size={64} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{user.name}</p>
                <p className="text-xs text-[var(--muted)]">Instructor · {stats.courses} courses</p>
                {user.bio ? (
                  <p className="mt-2 text-sm text-[var(--foreground)]/85">{user.bio}</p>
                ) : (
                  <p className="mt-2 text-sm italic text-[var(--muted-2)]">
                    No bio yet — add one above to introduce yourself to students.
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="flex items-center gap-1 rounded-full bg-[var(--surface)] border border-[var(--border)] px-2.5 py-1 text-xs text-[var(--muted)]">
                    <Icon.Users size={11} /> {stats.students} students
                  </span>
                  <span className="flex items-center gap-1 rounded-full bg-[var(--surface)] border border-[var(--border)] px-2.5 py-1 text-xs text-[var(--muted)]">
                    <Icon.Award size={11} /> {stats.completions} completions
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* ── My courses ── */}
      {myCourses.length > 0 && (
        <Card>
          <CardBody className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <SectionHeader
                icon={<Icon.Book size={18} />}
                title="My courses"
                description="Courses you currently teach on the platform."
              />
              <Link
                href="/teacher/courses"
                className="text-xs text-[var(--primary)] hover:underline underline-offset-2 shrink-0"
              >
                Manage all
              </Link>
            </div>
            <ul className="space-y-2">
              {myCourses.slice(0, 5).map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/teacher/courses`}
                    className="group flex items-center gap-3 rounded-xl border border-[var(--border)] p-3 transition hover:border-[var(--primary)]/30 hover:bg-[var(--primary-soft)]/20"
                  >
                    <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg border border-[var(--border)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.thumbnail} alt={c.title} className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.title}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {c.category} · {c.chapters.length} chapters
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="default">{c.level}</Badge>
                      <Icon.ChevronRight
                        size={15}
                        className="text-[var(--muted-2)] transition group-hover:translate-x-0.5 group-hover:text-[var(--primary)]"
                      />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <QuickLink
                href="/teacher/courses"
                icon={<Icon.Book size={16} />}
                title="Manage courses"
                description="Edit content & chapters"
              />
              <QuickLink
                href="/teacher/students"
                icon={<Icon.Users size={16} />}
                title="My students"
                description="Track progress & completions"
              />
            </div>
          </CardBody>
        </Card>
      )}

      {/* ── Connected accounts ── */}
      <Card>
        <CardBody className="space-y-5">
          <SectionHeader
            icon={<Icon.Google size={18} />}
            title="Connected accounts"
            description="Link external accounts for faster sign-in."
          />
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
        </CardBody>
      </Card>

      {/* ── Danger zone ── */}
      <Card className="border-[var(--danger)]/30">
        <CardBody className="space-y-5">
          <SectionHeader
            icon={<Icon.Trash size={18} />}
            title="Danger zone"
            description="Permanent actions. Cannot be undone."
            tone="danger"
          />
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--danger)]/20 p-4">
            <div className="min-w-0">
              <p className="text-sm font-medium">Delete account</p>
              <p className="mt-0.5 text-xs text-[var(--muted)]">
                This removes your instructor account. Your courses stay in the catalog but lose their instructor link.
              </p>
            </div>
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
              <Icon.Trash size={16} /> Delete account
            </Button>
          </div>
        </CardBody>
      </Card>

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
      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete teacher account?">
        <div className="space-y-4 p-5">
          <p className="text-sm text-[var(--muted)]">
            Are you sure? Your account is permanently removed. The courses you teach remain in the catalog,
            but will need to be reassigned by an admin.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                deleteAccount();
                toast.push({ title: "Account deleted", tone: "success" });
                router.replace("/login");
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
