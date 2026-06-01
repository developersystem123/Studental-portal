// Thin Claude API helper. Uses fetch directly (no SDK install required).
// Falls back to a deterministic local response when ANTHROPIC_API_KEY is not set
// so the UI is fully functional without API keys.

const API_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-7";
const API_KEY = process.env.ANTHROPIC_API_KEY;

export type ClaudeMessage = { role: "user" | "assistant"; content: string };

export function hasClaudeKey() {
  return Boolean(API_KEY && API_KEY.startsWith("sk-ant"));
}

export async function claudeChatJSON(opts: {
  system?: string;
  messages: ClaudeMessage[];
  max_tokens?: number;
  tools?: unknown[];
  tool_choice?: unknown;
}): Promise<{ text: string; tool?: { name: string; input: unknown } }> {
  if (!hasClaudeKey()) {
    throw new Error("ANTHROPIC_API_KEY not set");
  }
  const body: Record<string, unknown> = {
    model: DEFAULT_MODEL,
    max_tokens: opts.max_tokens ?? 1024,
    messages: opts.messages,
  };
  if (opts.system) {
    body.system = [{ type: "text", text: opts.system, cache_control: { type: "ephemeral" } }];
  }
  if (opts.tools) body.tools = opts.tools;
  if (opts.tool_choice) body.tool_choice = opts.tool_choice;

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Claude API error ${res.status}: ${t}`);
  }
  const data = await res.json();
  type Block = { type: string; text?: string; name?: string; input?: unknown };
  const textBlock = data.content?.find((b: Block) => b.type === "text");
  const toolBlock = data.content?.find((b: Block) => b.type === "tool_use");
  return {
    text: textBlock?.text ?? "",
    tool: toolBlock ? { name: toolBlock.name, input: toolBlock.input } : undefined,
  };
}

export async function claudeStream(opts: {
  system?: string;
  messages: ClaudeMessage[];
  max_tokens?: number;
}): Promise<ReadableStream<Uint8Array>> {
  if (!hasClaudeKey()) {
    throw new Error("ANTHROPIC_API_KEY not set");
  }
  const body: Record<string, unknown> = {
    model: DEFAULT_MODEL,
    max_tokens: opts.max_tokens ?? 1024,
    messages: opts.messages,
    stream: true,
  };
  if (opts.system) {
    body.system = [{ type: "text", text: opts.system, cache_control: { type: "ephemeral" } }];
  }
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok || !res.body) {
    const t = await res.text();
    throw new Error(`Claude API error ${res.status}: ${t}`);
  }

  // Re-encode Claude SSE → plain text token stream
  const decoder = new TextDecoder();
  return new ReadableStream({
    async start(controller) {
      const reader = res.body!.getReader();
      const encoder = new TextEncoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const evt = JSON.parse(payload);
            if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
              controller.enqueue(encoder.encode(evt.delta.text));
            }
          } catch {}
        }
      }
      controller.close();
    },
  });
}

/* ---------- Fallback content (used when no API key) ---------- */

export function fallbackChatReply(history: ClaudeMessage[], courseContext?: string): string {
  const lastUser = [...history].reverse().find((m) => m.role === "user")?.content ?? "";
  const ctx = courseContext ? ` in the context of **${courseContext}**` : "";
  const intro = `Great question${ctx}! Here's a clear explanation:`;
  const body = lastUser
    .split(/[\.\?\n]/)
    .filter(Boolean)
    .slice(0, 1)
    .join(" ");
  return `${intro}\n\n${
    body
      ? `Let's break down what you asked: *${body.trim()}*\n\n`
      : ""
  }1. **Core concept**: Start with the simplest possible mental model.\n2. **Why it matters**: Connect it to a real problem you're solving.\n3. **Example**: Try a small concrete case and notice the pattern.\n4. **Practice**: Modify one variable at a time and observe.\n\nWant me to go deeper on any of these, or try a worked example?\n\n_(Demo mode — set ANTHROPIC_API_KEY in .env.local for full Claude responses.)_`;
}

export function fallbackQuiz(topic: string, difficulty: string, count: number) {
  const seed = (s: string) =>
    s.split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7);
  const r = seed(topic + difficulty);
  const questions = Array.from({ length: count }, (_, i) => {
    const n = (Math.abs(r + i * 17) % 4);
    return {
      q: `(${difficulty}) Q${i + 1}: Which of the following best describes "${topic}"?`,
      options: [
        `${topic} is a foundational concept used in problem solving.`,
        `${topic} is unrelated to learning at all.`,
        `${topic} can only be applied in advanced research settings.`,
        `${topic} has no real-world examples.`,
      ],
      answerIndex: n === 0 ? 0 : 0,
      explanation: `${topic} is widely used as a building block. The other options are intentional distractors.`,
    };
  });
  return { questions };
}

export function fallbackOutline(topic: string, type: string) {
  return {
    title: `${type} Outline: ${topic}`,
    sections: [
      {
        heading: "Introduction",
        bullets: [
          `Hook the reader with why ${topic} matters today.`,
          "State your thesis or main argument.",
          "Preview the structure of the piece.",
        ],
      },
      {
        heading: "Background & Context",
        bullets: [
          `Brief history of ${topic}.`,
          "Key terms readers should know.",
          "Why this audience should care.",
        ],
      },
      {
        heading: "Core Arguments",
        bullets: [
          "Argument 1 with supporting evidence.",
          "Argument 2 with examples.",
          "Argument 3 addressing counter-views.",
        ],
      },
      {
        heading: "Case Studies & Examples",
        bullets: [
          "Real-world example #1.",
          "Real-world example #2.",
          "Lessons drawn from each.",
        ],
      },
      {
        heading: "Conclusion",
        bullets: [
          "Restate the thesis in light of the evidence.",
          "Practical takeaways for the reader.",
          "Call to action or further reading.",
        ],
      },
    ],
  };
}

export function fallbackDraft(heading: string, topic: string) {
  return `**${heading}**\n\nWhen we think about ${topic}, it helps to start from the simplest possible framing. ${heading.toLowerCase()} sets the stage by establishing what we mean, why it matters, and where it sits within the broader landscape.\n\nOver the past decade, ${topic} has moved from a niche concern to a mainstream topic. Practitioners, researchers, and everyday learners now encounter it across disciplines — from technology and business to science and the humanities.\n\nIn this section, we'll explore three threads: the underlying mechanics, the practical applications, and the open questions worth investigating. By the end, you should walk away with a working mental model that helps you reason about new instances of ${topic} as you encounter them.`;
}

export function fallbackReferences(topic: string) {
  return [
    `${topic}: A Comprehensive Introduction. Springer (2022).`,
    `${topic} in Practice. O'Reilly Media (2021).`,
    `Modern Perspectives on ${topic}. Journal of Applied Studies, 14(2), 2023.`,
    `Hands-On ${topic}. Pearson Education (2020).`,
    `The Future of ${topic}. MIT Press (2024).`,
  ];
}
