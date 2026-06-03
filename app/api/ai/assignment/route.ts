import { NextRequest, NextResponse } from "next/server";
import {
  claudeChatJSON,
  fallbackDraft,
  fallbackOutline,
  fallbackReferences,
  hasClaudeKey,
} from "@/lib/claude";
import { requireUser } from "@/lib/auth-server";

export const runtime = "nodejs";

const outlineTool = {
  name: "create_outline",
  description: "Create a structured outline.",
  input_schema: {
    type: "object",
    properties: {
      title: { type: "string" },
      sections: {
        type: "array",
        items: {
          type: "object",
          properties: {
            heading: { type: "string" },
            bullets: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 6 },
          },
          required: ["heading", "bullets"],
        },
      },
    },
    required: ["title", "sections"],
  },
};

const referencesTool = {
  name: "suggest_references",
  description: "Suggest 5 plausible references.",
  input_schema: {
    type: "object",
    properties: { references: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 7 } },
    required: ["references"],
  },
};

export async function POST(req: NextRequest) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const action: "outline" | "draft" | "polish" | "rewrite" | "references" = body.action;
  if (!action) return NextResponse.json({ error: "action required" }, { status: 400 });

  try {
    if (action === "outline") {
      const { topic, type = "Essay" } = body;
      if (!hasClaudeKey()) return NextResponse.json(fallbackOutline(topic, type));
      const res = await claudeChatJSON({
        system: "You are a writing coach. Always call the `create_outline` tool.",
        messages: [
          {
            role: "user",
            content: `Create a structured outline for a ${type} on the topic "${topic}". Include 4-6 sections with 2-5 specific bullet points each.`,
          },
        ],
        tools: [outlineTool],
        tool_choice: { type: "tool", name: "create_outline" },
        max_tokens: 1024,
      });
      if (res.tool?.name === "create_outline") return NextResponse.json(res.tool.input);
      return NextResponse.json(fallbackOutline(topic, type));
    }

    if (action === "draft") {
      const { topic, heading } = body;
      if (!hasClaudeKey()) return NextResponse.json({ text: fallbackDraft(heading, topic) });
      const res = await claudeChatJSON({
        system: "You are a clear, engaging writer for student assignments. Write 2-3 well-formed paragraphs in Markdown.",
        messages: [
          {
            role: "user",
            content: `Topic: "${topic}". Write the "${heading}" section of an assignment in 2-3 paragraphs. Be specific and concrete.`,
          },
        ],
        max_tokens: 800,
      });
      return NextResponse.json({ text: res.text || fallbackDraft(heading, topic) });
    }

    if (action === "polish" || action === "rewrite") {
      const { text } = body;
      if (!text || typeof text !== "string" || text.length > 5000) {
        return NextResponse.json({ error: "Text must be between 1 and 5000 characters." }, { status: 400 });
      }
      const instruction =
        action === "polish"
          ? "Improve clarity, grammar, and flow. Keep the same meaning. Return the revised text only."
          : "Rewrite to be original (paraphrase) while preserving meaning. Return the rewritten text only.";
      if (!hasClaudeKey()) {
        const out = action === "polish"
          ? text.replace(/\s+/g, " ").replace(/\s+([.,])/g, "$1").trim()
          : `In other words, ${text}`;
        return NextResponse.json({ text: out });
      }
      const res = await claudeChatJSON({
        system: "You are a careful editor.",
        messages: [{ role: "user", content: `${instruction}\n\n---\n${text}` }],
        max_tokens: 1024,
      });
      return NextResponse.json({ text: res.text || text });
    }

    if (action === "references") {
      const { topic } = body;
      if (!hasClaudeKey()) return NextResponse.json({ references: fallbackReferences(topic) });
      const res = await claudeChatJSON({
        system: "You are a reference suggester. Always call `suggest_references`. References may be plausible but should look academic.",
        messages: [
          {
            role: "user",
            content: `Suggest 5 plausible academic references for an assignment on "${topic}". Each as a single line: Author, Title, Publisher (Year).`,
          },
        ],
        tools: [referencesTool],
        tool_choice: { type: "tool", name: "suggest_references" },
        max_tokens: 600,
      });
      if (res.tool?.name === "suggest_references") return NextResponse.json(res.tool.input);
      return NextResponse.json({ references: fallbackReferences(topic) });
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
