// Cloudflare Worker entry: serves the SPA static assets and exposes
// POST /api/parse-homework, which proxies natural-language homework text
// to OpenRouter so the API key never reaches the browser.
//
// All three knobs are configurable without code changes:
//   - OPENROUTER_API_KEY → Worker SECRET (set via `wrangler secret put` or
//     the Cloudflare dashboard). Never committed.
//   - OPENROUTER_MODEL + OPENROUTER_MODELS_FALLBACK → Worker `vars` in
//     wrangler.jsonc. Edit + redeploy.
//   - Rate limits → simple Cloudflare rate-limit binding in wrangler.jsonc
//     (per-IP, configurable limit + period there).

export interface Env {
  // Secret — set with `wrangler secret put OPENROUTER_API_KEY`
  OPENROUTER_API_KEY?: string;

  // Vars — set in wrangler.jsonc, redeploy to change
  OPENROUTER_MODEL?: string;
  OPENROUTER_MODELS_FALLBACK?: string; // comma-separated
  PARSE_MAX_TOKENS?: string;

  // Bindings
  PARSE_RATE_LIMITER?: { limit: (opts: { key: string }) => Promise<{ success: boolean }> };
  ASSETS: { fetch: (req: Request) => Promise<Response> };
}

const DEFAULT_MODEL = "google/gemini-2.0-flash-exp:free";
const DEFAULT_FALLBACKS = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "mistralai/mistral-7b-instruct:free",
];
const DEFAULT_MAX_TOKENS = 800;

const SCHEMA = {
  type: "object",
  properties: {
    assignments: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          classId: { type: ["string", "null"] },
          classNameGuess: { type: ["string", "null"] },
          dueDate: { type: "string", description: "ISO YYYY-MM-DD" },
          notes: { type: ["string", "null"] },
          confidence: { type: "number" },
        },
        required: ["title", "dueDate", "confidence"],
      },
    },
  },
  required: ["assignments"],
};

function systemPrompt(
  today: string,
  cycleLabel: string,
  classes: { id: string; name: string; meetsOnCycleDayLabels?: string[] }[],
): string {
  const classBlock =
    classes.length === 0
      ? "  (none yet — leave classId null on every item)"
      : classes
          .map(
            (c) =>
              `  • "${c.name}" (id: ${c.id})${
                c.meetsOnCycleDayLabels && c.meetsOnCycleDayLabels.length
                  ? ` — meets on ${c.meetsOnCycleDayLabels.join(", ")}`
                  : ""
              }`,
          )
          .join("\n");

  return `You parse a high-school student's free-form homework notes into structured JSON.

Today: ${today}${cycleLabel ? ` (${cycleLabel})` : ""}.

The student's classes:
${classBlock}

Rules:
- Pick a "title" that's clear and student-readable (e.g., "Reading: Ch. 4 + Qs", not "ch4r").
- Resolve relative dates to ISO YYYY-MM-DD using today (${today}) as anchor:
  • "today" / "tn" (tonight) → ${today}
  • "tomorrow" / "tmrw" / "tom" → next calendar day
  • Weekday names ("monday", "fri", "next thu") → the upcoming occurrence
  • "next week" → exactly 7 days from today
  • Any unparseable date → use ${today} and note the ambiguity in "notes"
- Match each item to a classId from the list when you're ≥70% confident; otherwise leave classId null and put your best textual guess in classNameGuess.
- "notes" only for extra detail not captured by the title.
- "confidence" is a 0..1 float.

Output ONLY the JSON. No prose, no markdown fences.`;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === "/api/parse-homework") {
      if (req.method === "OPTIONS") return new Response(null, { status: 204 });
      if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
      return handleParse(req, env);
    }

    if (url.pathname === "/api/health") {
      return json(
        {
          ok: true,
          configured: Boolean(env.OPENROUTER_API_KEY),
          model: env.OPENROUTER_MODEL || DEFAULT_MODEL,
        },
        200,
      );
    }

    return env.ASSETS.fetch(req);
  },
};

async function handleParse(req: Request, env: Env): Promise<Response> {
  if (!env.OPENROUTER_API_KEY) {
    return json(
      {
        error: "not_configured",
        message:
          "OPENROUTER_API_KEY is not set on the Worker. Run `wrangler secret put OPENROUTER_API_KEY` or set it in the Cloudflare dashboard.",
      },
      503,
    );
  }

  const url = new URL(req.url);
  const origin = req.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== url.host) {
        return json({ error: "forbidden" }, 403);
      }
    } catch {
      return json({ error: "bad_origin" }, 400);
    }
  }

  const raw = await req.text();
  if (raw.length > 8000) return json({ error: "too_large" }, 413);

  let body: {
    text?: unknown;
    today?: unknown;
    todayCycleDayLabel?: unknown;
    classes?: unknown;
  };
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: "bad_json" }, 400);
  }

  if (typeof body.text !== "string" || body.text.trim().length === 0) {
    return json({ error: "bad_request", message: "text is required" }, 400);
  }
  if (body.text.length > 2000) {
    return json({ error: "text_too_long", message: "text must be 2000 chars or fewer" }, 413);
  }

  const ip = req.headers.get("CF-Connecting-IP") ?? "unknown";
  if (env.PARSE_RATE_LIMITER) {
    try {
      const result = await env.PARSE_RATE_LIMITER.limit({ key: ip });
      if (!result.success) {
        return json(
          { error: "rate_limited", message: "Too many requests. Take a breath and try again in a moment." },
          429,
        );
      }
    } catch (e) {
      console.error("rate_limit_error", e);
    }
  }

  const today =
    typeof body.today === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.today)
      ? body.today
      : new Date().toISOString().slice(0, 10);
  const cycleLabel = typeof body.todayCycleDayLabel === "string" ? body.todayCycleDayLabel : "";
  const classes = Array.isArray(body.classes)
    ? (body.classes as Array<{
        id?: unknown;
        name?: unknown;
        meetsOnCycleDayLabels?: unknown;
      }>)
        .filter((c) => typeof c.id === "string" && typeof c.name === "string")
        .slice(0, 20)
        .map((c) => ({
          id: c.id as string,
          name: c.name as string,
          meetsOnCycleDayLabels: Array.isArray(c.meetsOnCycleDayLabels)
            ? (c.meetsOnCycleDayLabels as unknown[]).filter((s) => typeof s === "string") as string[]
            : [],
        }))
    : [];

  const model = (env.OPENROUTER_MODEL || DEFAULT_MODEL).trim();
  const fallbacks = env.OPENROUTER_MODELS_FALLBACK
    ? env.OPENROUTER_MODELS_FALLBACK.split(",").map((s) => s.trim()).filter(Boolean)
    : DEFAULT_FALLBACKS;
  const maxTokens = Number(env.PARSE_MAX_TOKENS) || DEFAULT_MAX_TOKENS;

  const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": url.origin,
      "X-Title": "Deadline Dodger",
    },
    body: JSON.stringify({
      model,
      models: fallbacks,
      response_format: {
        type: "json_schema",
        json_schema: { name: "homework_extraction", schema: SCHEMA, strict: true },
      },
      messages: [
        { role: "system", content: systemPrompt(today, cycleLabel, classes) },
        { role: "user", content: body.text },
      ],
      max_tokens: maxTokens,
      temperature: 0,
    }),
  });

  if (!orRes.ok) {
    const errText = await orRes.text().catch(() => "");
    return json(
      { error: "upstream", status: orRes.status, message: errText.slice(0, 500) },
      502,
    );
  }

  const data: any = await orRes.json();
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (!content) {
    return json({ error: "no_content", raw: data }, 502);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return json({ error: "bad_model_output", raw: content.slice(0, 500) }, 502);
  }
  return json(parsed, 200);
}

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
