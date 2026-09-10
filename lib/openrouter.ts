/**
 * OpenRouter client with a 10-tier (or more) model fallback cascade.
 *
 * Strategy:
 *   1. Discover live-available models via GET /api/v1/models (15-min cache).
 *   2. Filter to ":free" suffix models; rank them by quality heuristics.
 *   3. Prepend OPENROUTER_PREFERRED_MODEL (env) as tier 1 if set.
 *   4. Append a hardcoded safety-net tier (well-known free IDs).
 *   5. Attempt tiers in order; advance on transient failures, fail-fast on auth.
 *
 * No streaming in v1 — keep the surface small. Add later behind a flag.
 */

export type ChatRole = "system" | "user" | "assistant";
export type ChatMessage = { role: ChatRole; content: string };

export type CascadeResult = {
  content: string;
  modelUsed: string;
  tier: number;
  attempts: number;
};

export class AllTiersExhaustedError extends Error {
  readonly attempts: Array<{ model: string; status: number | 0; reason: string }>;
  constructor(attempts: AllTiersExhaustedError["attempts"]) {
    super(`All ${attempts.length} model tiers failed. Last error: ${attempts.at(-1)?.reason ?? "unknown"}`);
    this.name = "AllTiersExhaustedError";
    this.attempts = attempts;
  }
}

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const MODELS_CACHE_TTL_MS = 15 * 60 * 1000;

// Quality-ranked heuristic preference: matches by name fragment, ordered best→worst.
// These fragments are checked case-insensitively against model.id.
const PREFERRED_FAMILY_ORDER: ReadonlyArray<string> = [
  "deepseek",
  "qwen",
  "llama",
  "mistral",
  "gemma",
  "phi",
  "nous",
  "gemini",
  "grok",
  "command",
];

// Hardcoded last-resort tier — used if every live model 404s.
const SAFETY_NET_TIER: ReadonlyArray<string> = [
  "deepseek/deepseek-chat-v3.1:free",
  "qwen/qwen-2.5-72b-instruct:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "meta-llama/llama-3.1-8b-instruct:free",
  "mistralai/mistral-7b-instruct:free",
  "google/gemma-2-9b-it:free",
  "microsoft/phi-3-mini-128k-instruct:free",
  "nvidia/llama-3.1-nemotron-70b-instruct:free",
  "openchat/openchat-7b:free",
  "huggingfaceh4/zephyr-7b-beta:free",
];

type ModelsCacheEntry = { at: number; ids: string[] };
let modelsCache: ModelsCacheEntry | null = null;

function authHeaders(apiKey: string): Record<string, string> {
  const site = process.env.SITE_URL || "https://daybrief.app";
  return {
    Authorization: `Bearer ${apiKey}`,
    "HTTP-Referer": site,
    "X-Title": "Daybrief",
    "Content-Type": "application/json",
  };
}

async function discoverFreeModelIds(): Promise<string[]> {
  if (modelsCache && Date.now() - modelsCache.at < MODELS_CACHE_TTL_MS) {
    return modelsCache.ids;
  }
  const res = await fetch(`${OPENROUTER_BASE}/models`, {
    // Don't leak OpenRouter calls into the cache layer (Next.js fetch cache);
    // we manage our own TTL above.
    cache: "no-store",
  });
  if (!res.ok) {
    // Live fetch failed — return whatever (possibly stale) cache we have, else empty.
    return modelsCache?.ids ?? [];
  }
  const json = (await res.json()) as { data?: Array<{ id?: string }> };
  const ids = (json.data ?? [])
    .map((m) => (typeof m.id === "string" ? m.id : ""))
    .filter((id) => id.endsWith(":free"));
  modelsCache = { at: Date.now(), ids };
  return ids;
}

/**
 * Rank free models by preferred family order, then alphabetical.
 * Within a family, longer context windows (heuristic: look for "32b", "70b")
 * come first.
 */
function rankFreeModels(ids: ReadonlyArray<string>): string[] {
  const byFamily = new Map<string, string[]>();
  const others: string[] = [];
  for (const id of ids) {
    const lower = id.toLowerCase();
    const family = PREFERRED_FAMILY_ORDER.find((f) => lower.includes(f));
    if (!family) {
      others.push(id);
      continue;
    }
    const list = byFamily.get(family) ?? [];
    list.push(id);
    byFamily.set(family, list);
  }
  const rankBySize = (a: string, b: string) => paramStrength(b) - paramStrength(a);
  const ranked: string[] = [];
  for (const fam of PREFERRED_FAMILY_ORDER) {
    const list = (byFamily.get(fam) ?? []).slice().sort(rankBySize);
    ranked.push(...list);
  }
  ranked.push(...others.slice().sort());
  return ranked;
}

function paramStrength(modelId: string): number {
  // Heuristic: bigger-parameterized free variants tend to be smarter.
  // Look for "70b" > "32b" > "8b" > "7b" > "mini" > "small".
  const lower = modelId.toLowerCase();
  if (/(70|72|65|54)/.test(lower)) return 100;
  if (/32/.test(lower)) return 80;
  if (/(13|14)/.test(lower)) return 60;
  if (/(9|8)/.test(lower)) return 50;
  if (/(7|mini)/.test(lower)) return 40;
  if (/(3|small|nano)/.test(lower)) return 20;
  return 30;
}

async function buildTierList(): Promise<string[]> {
  const live = await discoverFreeModelIds();
  const ranked = rankFreeModels(live);
  const preferred = process.env.OPENROUTER_PREFERRED_MODEL?.trim();
  const seen = new Set<string>();
  const tiers: string[] = [];
  const push = (id: string) => {
    if (id && !seen.has(id)) {
      seen.add(id);
      tiers.push(id);
    }
  };
  if (preferred) push(preferred);
  for (const id of ranked) push(id);
  for (const id of SAFETY_NET_TIER) push(id);
  return tiers.slice(0, 12);
}

type AttemptOutcome =
  | { kind: "ok"; content: string }
  | { kind: "advance"; reason: string; httpStatus: number | 0 }
  | { kind: "failFast"; reason: string; httpStatus: number | 0 };

async function attemptModel(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  signal?: AbortSignal,
): Promise<AttemptOutcome> {
  let res: Response;
  try {
    res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: "POST",
      headers: authHeaders(apiKey),
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 800,
      }),
      signal,
    });
  } catch (err) {
    return {
      kind: "advance",
      reason: err instanceof Error ? err.message : "network error",
      httpStatus: 0,
    };
  }

  if (res.ok) {
    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content?.trim();
    if (content) return { kind: "ok", content };
    return { kind: "advance", reason: "empty response", httpStatus: res.status };
  }

  // Error — peek at body for the upstream reason.
  let bodyText = "";
  try {
    bodyText = (await res.text()).slice(0, 240);
  } catch {
    /* ignore */
  }
  const lower = bodyText.toLowerCase();
  // 401/403 = auth/key problem. Don't cascade; the user needs to fix the key.
  if (res.status === 401 || res.status === 403) {
    return { kind: "failFast", reason: `auth (${res.status}): ${bodyText}`, httpStatus: res.status };
  }
  // 400 with model-not-found / 404 / 429 / 402 → cascade.
  if (
    res.status === 404 ||
    res.status === 429 ||
    res.status === 402 ||
    (res.status === 400 && (lower.includes("model") || lower.includes("not found") || lower.includes("not exist")))
  ) {
    return { kind: "advance", reason: `${res.status}: ${bodyText}`, httpStatus: res.status };
  }
  // 5xx / other → cascade.
  return { kind: "advance", reason: `${res.status}: ${bodyText}`, httpStatus: res.status };
}

export async function chatWithCascade(
  messages: ChatMessage[],
  opts: { signal?: AbortSignal } = {},
): Promise<CascadeResult> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }
  const tiers = await buildTierList();
  if (tiers.length === 0) {
    throw new Error("No model tiers available — model discovery returned zero results");
  }

  const attempts: AllTiersExhaustedError["attempts"] = [];
  for (let i = 0; i < tiers.length; i++) {
    const tier = i + 1;
    const model = tiers[i];
    const outcome = await attemptModel(apiKey, model, messages, opts.signal);
    if (outcome.kind === "ok") {
      return {
        content: outcome.content,
        modelUsed: model,
        tier,
        attempts: attempts.length + 1,
      };
    }
    attempts.push({ model, status: outcome.httpStatus, reason: outcome.reason });
    if (outcome.kind === "failFast") {
      throw new AllTiersExhaustedError(attempts);
    }
  }
  throw new AllTiersExhaustedError(attempts);
}

export const __INTERNAL = {
  buildTierList,
  rankFreeModels,
  paramStrength,
  discoverFreeModelIds,
};
