"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, CardBody, Modal, useToast } from "@/components/ui";
import Icon from "@/components/icons";
import { useAuth, useData } from "@/lib/store";
import {
  ChangePasswordCard,
  PersonalInfoCard,
  ProfileHero,
  SectionHeader,
} from "@/components/profile/sections";

export default function StudentProfilePage() {
  const { user, deleteAccount } = useAuth();
  const { enrollments, certificates } = useData();
  const router = useRouter();
  const toast = useToast();
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  if (!user) return null;

  const inProgress = enrollments.filter((e) => !e.completed && e.progress > 0).length;
  const completed = enrollments.filter((e) => e.completed).length;

  return (
    <div className="space-y-6 fade-in">
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

      <PersonalInfoCard />
      <ChangePasswordCard />

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

      {/* Learning quick links */}
      <Card>
        <CardBody className="space-y-4">
          <SectionHeader
            icon={<Icon.Compass size={18} />}
            title="Your learning"
            description="Pick up where you left off."
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <QuickLink href="/my-courses" icon={<Icon.Book size={16} />} title="My courses" description={`${enrollments.length} enrolled`} />
            <QuickLink href="/certificates" icon={<Icon.Award size={16} />} title="Certificates" description={`${certificates.length} earned`} />
            <QuickLink href="/explore" icon={<Icon.Compass size={16} />} title="Explore" description="Browse the catalog" />
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
                This permanently removes your account, enrollments, certificates, and progress.
              </p>
            </div>
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
              <Icon.Trash size={16} /> Delete account
            </Button>
          </div>
        </CardBody>
      </Card>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete account?">
        <div className="p-5 space-y-4">
          <p className="text-sm text-[var(--muted)]">
            Are you sure? This action cannot be undone. All your enrollments, certificates, and progress will be lost.
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
