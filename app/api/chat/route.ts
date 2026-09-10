import { NextRequest, NextResponse } from "next/server";
import {
  AllTiersExhaustedError,
  type ChatMessage,
  type ChatRole,
  chatWithCascade,
} from "@/lib/openrouter";
import { buildSystemPrompt } from "@/lib/assistant/systemPrompt";
import type { DaybriefContext } from "@/lib/assistant/context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_MESSAGES = 32;
const MAX_CONTENT_LEN = 4000;

function isValidRole(r: unknown): r is ChatRole {
  return r === "system" || r === "user" || r === "assistant";
}

function parseMessages(input: unknown): ChatMessage[] | string {
  if (!Array.isArray(input)) return "messages must be an array";
  if (input.length === 0 || input.length > MAX_MESSAGES) {
    return `messages must contain 1-${MAX_MESSAGES} entries`;
  }
  const out: ChatMessage[] = [];
  for (const m of input) {
    if (!m || typeof m !== "object") return "each message must be an object";
    const role = (m as { role?: unknown }).role;
    const content = (m as { content?: unknown }).content;
    if (!isValidRole(role)) return "message.role must be system | user | assistant";
    if (typeof content !== "string" || content.length === 0) {
      return "message.content must be a non-empty string";
    }
    if (content.length > MAX_CONTENT_LEN) {
      return `message.content exceeds ${MAX_CONTENT_LEN} characters`;
    }
    out.push({ role, content });
  }
  return out;
}

export async function POST(req: NextRequest) {
  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY is not configured on the server" },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body must be a JSON object" }, { status: 400 });
  }
  const b = body as { messages?: unknown; context?: unknown };

  const parsed = parseMessages(b.messages);
  if (typeof parsed === "string") {
    return NextResponse.json({ error: parsed }, { status: 400 });
  }

  let context: DaybriefContext | null = null;
  if (b.context !== undefined && b.context !== null) {
    // Trust shape from loadAssistantContext(); we don't deeply revalidate here,
    // since the same client controls the page. A bad payload won't crash the model.
    context = b.context as DaybriefContext;
  }

  const systemPrompt = buildSystemPrompt(context);
  const messages: ChatMessage[] = [{ role: "system", content: systemPrompt }, ...parsed];

  try {
    const result = await chatWithCascade(messages, { signal: req.signal });
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    if (err instanceof AllTiersExhaustedError) {
      return NextResponse.json(
        {
          error: "All model tiers failed",
          attempts: err.attempts,
        },
        { status: 502 },
      );
    }
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
