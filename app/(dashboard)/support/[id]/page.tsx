"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Textarea,
  useToast,
} from "@/components/ui";
import Icon from "@/components/icons";
import { cn, relativeTime } from "@/lib/utils";

type Reply = {
  id: string;
  body: string;
  createdAt: string;
  isStaff: boolean;
  author: { id: string; name: string; avatar: string | null; role: string };
};

type Ticket = {
  id: string;
  subject: string;
  body: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  replies: Reply[];
};

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const { push } = useToast();

  async function load() {
    try {
      const r = await fetch(`/api/support/${id}`);
      const data = r.ok ? await r.json() : {};
      setTicket(data.ticket ?? null);
    } catch {
      push({ title: "Couldn't load ticket", tone: "danger" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/support/${id}`);
        const data = r.ok ? await r.json() : {};
        if (!cancelled) setTicket(data.ticket ?? null);
      } catch {
        if (!cancelled) push({ title: "Couldn't load ticket", tone: "danger" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function send() {
    if (!reply.trim()) return;
    setSending(true);
    const r = await fetch(`/api/support/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: reply }),
    });
    setSending(false);
    if (!r.ok) {
      push({ title: "Couldn't reply", tone: "danger" });
      return;
    }
    setReply("");
    load();
  }

  if (loading) return <p className="text-sm text-[var(--muted)]">Loading…</p>;
  if (!ticket) return (
    <div>
      <p>Ticket not found.</p>
      <Link href="/support" className="text-sm text-[var(--primary)]">← Back</Link>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/support" className="text-xs text-[var(--muted)] hover:text-[var(--primary)]">
        ← All tickets
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-xl font-bold">{ticket.subject}</h1>
            <div className="flex items-center gap-2">
              <Badge variant="default">{ticket.category}</Badge>
              <Badge variant={ticket.priority === "urgent" ? "danger" : ticket.priority === "high" ? "warning" : "info"}>
                {ticket.priority}
              </Badge>
              <Badge variant={ticket.status === "resolved" ? "success" : "primary"}>
                {ticket.status.replace("_", " ")}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <p className="text-sm whitespace-pre-wrap">{ticket.body}</p>
          <p className="text-xs text-[var(--muted-2)] mt-3">Opened {relativeTime(ticket.createdAt)}</p>
        </CardBody>
      </Card>

      <div className="space-y-3">
        {ticket.replies.map((r) => (
          <Card key={r.id} className={cn(r.isStaff && "ring-1 ring-emerald-500/30")}>
            <CardBody className="flex gap-3">
              <Avatar name={r.author.name} src={r.author.avatar} size={36} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold">{r.author.name}</p>
                  {r.isStaff && <Badge variant="success">Staff</Badge>}
                  <p className="text-xs text-[var(--muted-2)]">{relativeTime(r.createdAt)}</p>
                </div>
                <p className="text-sm whitespace-pre-wrap mt-1">{r.body}</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {ticket.status !== "closed" && (
        <Card>
          <CardBody className="space-y-3">
            <p className="text-sm font-semibold">Add reply</p>
            <Textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={4} placeholder="Type your reply…" />
            <div className="flex justify-end">
              <Button onClick={send} loading={sending} disabled={!reply.trim()}>
                <Icon.Send size={14} /> Send reply
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
