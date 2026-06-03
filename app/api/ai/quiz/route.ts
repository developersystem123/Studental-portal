import { NextRequest, NextResponse } from "next/server";
import { claudeChatJSON, fallbackQuiz, hasClaudeKey } from "@/lib/claude";
import { requireUser } from "@/lib/auth-server";

export const runtime = "nodejs";

const generateQuizTool = {
  name: "generate_quiz",
  description: "Generate a multiple-choice quiz on a topic.",
  input_schema: {
    type: "object",
    properties: {
      questions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            q: { type: "string", description: "The question text." },
            options: {
              type: "array",
              items: { type: "string" },
              minItems: 4,
              maxItems: 4,
              description: "Exactly 4 answer choices.",
            },
            answerIndex: {
              type: "integer",
              minimum: 0,
              maximum: 3,
              description: "Index of the correct option (0-3).",
            },
            explanation: {
              type: "string",
              description: "Short explanation of why the correct option is right.",
            },
          },
          required: ["q", "options", "answerIndex", "explanation"],
        },
      },
    },
    required: ["questions"],
  },
};

export async function POST(req: NextRequest) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { topic, difficulty = "Medium", count = 5 } = await req.json();
  if (!topic || typeof topic !== "string") {
    return NextResponse.json({ error: "topic is required" }, { status: 400 });
  }
  const n = Math.max(1, Math.min(15, Number(count) || 5));

  if (!hasClaudeKey()) {
    return NextResponse.json(fallbackQuiz(topic, difficulty, n));
  }

  const system =
    "You are an expert quiz writer. Always call the `generate_quiz` tool. Make the questions clear, factual, with exactly 4 plausible options each. Vary correctness location.";
  const user = `Generate exactly ${n} multiple-choice questions on the topic "${topic}" at "${difficulty}" difficulty. Cover varied subtopics. Keep each question under 220 characters.`;

  try {
    const res = await claudeChatJSON({
      system,
      messages: [{ role: "user", content: user }],
      tools: [generateQuizTool],
      tool_choice: { type: "tool", name: "generate_quiz" },
      max_tokens: 2048,
    });
    if (res.tool && res.tool.name === "generate_quiz") {
      return NextResponse.json(res.tool.input);
    }
    return NextResponse.json(fallbackQuiz(topic, difficulty, n));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg, ...fallbackQuiz(topic, difficulty, n) }, { status: 200 });
  }
}
