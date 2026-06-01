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
  ProfileHero,
  SectionHeader,
} from "@/components/profile/sections";

export default function TeacherProfilePage() {
  const { user, deleteAccount } = useAuth();
  const teacher = useTeacher();
  const router = useRouter();
  const toast = useToast();
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  if (!user) return null;

  const stats = teacher.stats();
  const myCourses = teacher.myCourses();

  return (
    <div className="space-y-6 fade-in">
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

      <PersonalInfoCard
        description="Your bio is shown to students alongside the courses you teach — write something engaging."
        bioPlaceholder="e.g. Senior engineer turned educator. Loves teaching React, TypeScript, and clean code."
      />

      <ChangePasswordCard />

      {/* Public profile preview — how students see you */}
      <Card>
        <CardBody className="space-y-5">
          <SectionHeader
            icon={<Icon.Eye size={18} />}
            title="Public profile preview"
            description="This is how students see your instructor card on course pages."
          />
          <div className="rounded-2xl bg-gradient-to-br from-[var(--primary-soft)] to-[var(--surface-2)] p-5 border border-[var(--border)]">
            <div className="flex items-start gap-4">
              <Avatar name={user.name} src={user.avatar ?? null} size={64} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{user.name}</p>
                <p className="text-xs text-[var(--muted)]">Instructor · {stats.courses} courses</p>
                {user.bio ? (
                  <p className="text-sm mt-2 text-[var(--foreground)]/85">{user.bio}</p>
                ) : (
                  <p className="text-sm mt-2 text-[var(--muted-2)] italic">
                    No bio yet — add one above to introduce yourself to students.
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Teaching at a glance */}
      <Card>
        <CardBody className="space-y-5">
          <SectionHeader
            icon={<Icon.Book size={18} />}
            title="Teaching at a glance"
            description="Quick summary of your impact."
          />
          <div className="grid grid-cols-3 gap-3">
            <StatMini label="Courses" value={stats.courses} />
            <StatMini label="Students" value={stats.students} />
            <StatMini label="Completions" value={stats.completions} />
          </div>

          {myCourses.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-[var(--muted-2)] font-semibold mb-3">
                Your courses
              </p>
              <ul className="space-y-2">
                {myCourses.slice(0, 4).map((c) => (
                  <li key={c.id} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)]">
                    <div className="h-10 w-14 rounded-lg overflow-hidden border border-[var(--border)] shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.thumbnail} alt={c.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.title}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {c.category} · {c.chapters.length} chapters
                      </p>
                    </div>
                    <Badge variant="default">{c.level}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <QuickLink href="/teacher/courses" icon={<Icon.Book size={16} />} title="My courses" description="Edit content & chapters" />
            <QuickLink href="/teacher/students" icon={<Icon.User size={16} />} title="My students" description="Track progress & completions" />
          </div>
        </CardBody>
      </Card>

      {/* Connected accounts */}
      <Card>
        <CardBody className="space-y-5">
          <SectionHeader
            icon={<Icon.Google size={18} />}
            title="Connected accounts"
            description="Link external accounts for faster sign-in."
          />
          <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center">
                <Icon.Google size={20} />
              </div>
              <div>
                <p className="text-sm font-medium">Google</p>
                <p className="text-xs text-[var(--muted)]">
                  {user.googleConnected ? "Connected" : "Not connected"}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              {user.googleConnected ? "Disconnect" : "Connect"}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Danger zone */}
      <Card className="border-[var(--danger)]/30">
        <CardBody className="space-y-5">
          <SectionHeader
            icon={<Icon.Trash size={18} />}
            title="Danger zone"
            description="Permanent actions. Cannot be undone."
            tone="danger"
          />
          <div className="flex items-center justify-between gap-4 flex-wrap border border-[var(--danger)]/20 rounded-xl p-4">
            <div className="min-w-0">
              <p className="text-sm font-medium">Delete account</p>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                This removes your instructor account. Your courses stay in the catalog but lose their instructor link.
              </p>
            </div>
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
              <Icon.Trash size={16} /> Delete account
            </Button>
          </div>
        </CardBody>
      </Card>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete teacher account?">
        <div className="p-5 space-y-4">
          <p className="text-sm text-[var(--muted)]">
            Are you sure? Your account is permanently removed. The courses you teach remain in the catalog, but will
            need to be reassigned by an admin.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>Cancel</Button>
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

function StatMini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/50 p-3">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-[11px] text-[var(--muted)]">{label}</p>
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
  );
}
