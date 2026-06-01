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
import { relativeTime } from "@/lib/utils";

type Reply = {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; name: string; avatar: string | null; role: string };
};

type Post = {
  id: string;
  title: string;
  body: string;
  category: string;
  pinned: boolean;
  views: number;
  createdAt: string;
  author: { id: string; name: string; avatar: string | null; role: string };
  course: { id: string; title: string } | null;
  replies: Reply[];
};

export default function ForumDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const { push } = useToast();

  async function load() {
    try {
      const r = await fetch(`/api/forum/${id}`);
      const data = r.ok ? await r.json() : {};
      setPost(data.post ?? null);
    } catch {
      push({ title: "Couldn't load post", tone: "danger" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/forum/${id}`);
        const data = r.ok ? await r.json() : {};
        if (!cancelled) setPost(data.post ?? null);
      } catch {
        if (!cancelled) push({ title: "Couldn't load post", tone: "danger" });
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
    const r = await fetch(`/api/forum/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: reply }),
    });
    setSending(false);
    if (!r.ok) {
      push({ title: "Couldn't post reply", tone: "danger" });
      return;
    }
    setReply("");
    load();
  }

  if (loading) return <p className="text-sm text-[var(--muted)]">Loading…</p>;
  if (!post) return (
    <div>
      <p className="text-sm">Post not found.</p>
      <Link href="/forum" className="text-sm text-[var(--primary)]">← Back</Link>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/forum" className="text-xs text-[var(--muted)] hover:text-[var(--primary)]">
        ← All posts
      </Link>

      <Card>
        <CardHeader className="flex items-start gap-3">
          <Avatar name={post.author.name} src={post.author.avatar} size={44} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {post.pinned && <Icon.Pin size={14} className="text-amber-500" />}
              <h1 className="text-xl font-bold">{post.title}</h1>
              <Badge variant="primary">{post.category}</Badge>
              {post.course && <Badge variant="default">{post.course.title}</Badge>}
            </div>
            <p className="text-xs text-[var(--muted-2)] mt-1">
              by <span className="font-semibold text-[var(--foreground)]">{post.author.name}</span>
              {" · "}{relativeTime(post.createdAt)}{" · "}{post.views} views
            </p>
          </div>
        </CardHeader>
        <CardBody>
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{post.body}</p>
        </CardBody>
      </Card>

      <h2 className="text-sm font-semibold text-[var(--muted)]">
        {post.replies.length} {post.replies.length === 1 ? "Reply" : "Replies"}
      </h2>

      <div className="space-y-3">
        {post.replies.map((r) => (
          <Card key={r.id}>
            <CardBody className="flex gap-3">
              <Avatar name={r.author.name} src={r.author.avatar} size={36} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold">{r.author.name}</p>
                  {r.author.role !== "Student" && (
                    <Badge variant={r.author.role === "Admin" ? "danger" : "info"}>{r.author.role}</Badge>
                  )}
                  <p className="text-xs text-[var(--muted-2)]">{relativeTime(r.createdAt)}</p>
                </div>
                <p className="text-sm whitespace-pre-wrap mt-1">{r.body}</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardBody className="space-y-3">
          <p className="text-sm font-semibold">Your reply</p>
          <Textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={4} placeholder="Share your thoughts…" />
          <div className="flex justify-end">
            <Button onClick={send} loading={sending} disabled={!reply.trim()}>
              <Icon.Send size={14} /> Post reply
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
