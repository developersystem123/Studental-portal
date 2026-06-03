import { NextRequest } from "next/server";
import { claudeStream, fallbackChatReply, hasClaudeKey, type ClaudeMessage } from "@/lib/claude";
import { requireUser } from "@/lib/auth-server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    await requireUser();
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const messages = (body.messages ?? []) as ClaudeMessage[];
  const courseTitle: string | undefined = body.courseTitle;

  const system = [
    "You are EduPortal's study assistant — a friendly, patient tutor.",
    "Explain concepts step-by-step. Use simple language and concrete examples.",
    "Use Markdown for formatting: short headings, bullet lists, and fenced code blocks when relevant.",
    "If the user is enrolled in a course, ground your answers in that course's domain.",
    courseTitle ? `The student is currently studying: "${courseTitle}". Tailor explanations to that course.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (!hasClaudeKey()) {
    // Stream the fallback reply token by token
    const reply = fallbackChatReply(messages, courseTitle);
    const enc = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const tokens = reply.split(/(\s+)/);
        for (const t of tokens) {
          controller.enqueue(enc.encode(t));
          await new Promise((r) => setTimeout(r, 18));
        }
        controller.close();
      },
    });
    return new Response(stream, {
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
    });
  }

  try {
    const stream = await claudeStream({ system, messages });
    return new Response(stream, {
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return new Response(`Error: ${msg}`, { status: 500 });
  }
}
