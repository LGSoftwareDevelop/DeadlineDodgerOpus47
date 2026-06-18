# Deadline Dodger — Build Plan

> **Vibe:** "We are here to help you with your horrible homework."
> A friendly, slightly snarky companion app for high schoolers that turns the homework grind into something tolerable (and occasionally fun).

---

## 1. Product Overview

**Deadline Dodger** is a Progressive Web App (PWA) that helps a high school student:

1. Track homework assignments with due dates (sorted by what's due first).
2. Manage their list of classes, including which day-of-the-cycle the class meets (e.g., Green Day / Gold Day rotating schedules).
3. Get a daily prompt for each class that meets *today* asking "Did you get homework in this class?"
4. Mark assignments complete and get a celebratory animation + a fun/snarky quote.
5. Maintain a free-form todo list for any other tasks (chores, reminders, life stuff).

Everything is **client-side, offline-capable**, and **deployable to Cloudflare Pages** with zero backend required (data lives in `localStorage` / `IndexedDB`).

---

## 2. Tech Stack

| Concern | Choice | Why |
|---|---|---|
| Framework | **React + Vite + TypeScript** | Fast dev, great PWA tooling, Cloudflare Pages friendly |
| Styling | **Tailwind CSS** | Quick to theme the snarky/friendly vibe |
| State | **Zustand** (small) + `localStorage` persistence | Tiny, no boilerplate |
| Storage | **IndexedDB** via `idb` (with localStorage fallback for settings) | Handles assignments/classes/todos cleanly offline |
| PWA | **vite-plugin-pwa** (Workbox under the hood) | Service worker, manifest, offline cache |
| Animations | **canvas-confetti** + **Framer Motion** | Confetti burst + smooth UI transitions on complete |
| Date handling | **date-fns** | Sorting/grouping due dates |
| Icons | **lucide-react** | Clean, free icons |
| Hosting | **Cloudflare Pages** | Free static hosting, easy deploy via `wrangler` or Git |

No backend, no auth — single-user, single-device (with optional future export/import JSON for backup).

---

## 3. Core Data Models

```ts
type Assignment = {
  id: string;
  title: string;
  classId?: string;       // optional link to a Class
  dueDate: string;        // ISO date
  notes?: string;
  links?: { url: string; label?: string }[];   // hyperlinks
  attachments?: AttachmentRef[];               // images/files (IndexedDB blobs)
  completed: boolean;
  completedAt?: string;
  createdAt: string;
};

type AttachmentRef = {
  id: string;             // blob id in IDB
  name: string;
  mime: string;
  size: number;
  kind: "image" | "file";
};

type Class = {
  id: string;
  name: string;          // "AP Biology"
  teacher?: string;
  room?: string;
  color: string;         // user-picked color for the class
  // Which cycle days the class meets on:
  meetsOn: CycleDay[];   // e.g., ["GREEN"] or ["GREEN", "GOLD"]
};

type CycleDay = {
  id: string;            // "GREEN", "GOLD", "BLUE", etc.
  label: string;         // "Green Day"
  color: string;         // hex for UI
};

type ScheduleConfig = {
  cycleDays: CycleDay[];                 // user defines: Green, Gold, ...
  // Anchor: a known date + which cycle day it was, so we can compute today.
  anchorDate: string;                    // ISO date
  anchorCycleDayId: string;              // which day the anchor was
  skipWeekends: boolean;                 // default true
  holidays: string[];                    // ISO dates to skip
};

type Todo = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
};

type DailyPrompt = {
  date: string;           // ISO date
  classId: string;
  answered: boolean;      // did they answer the "got homework?" prompt yet?
};
```

### Cycle-day rotation logic
- Cycle days are **fully user-defined** — any number, any names, any colors. Default seeds (Green Day, Gold Day) are editable/deletable, and the user can add Blue Day, Red Day, A Day, B Day, etc.
- The student tells us **what cycle day today is** (one-time setup, editable any time).
- The app stores that as an anchor, then advances one cycle-day per school day, skipping weekends + holidays + manual "no-school" overrides.
- Because cycle days don't reset on the calendar week, this anchor-walk approach handles the "rhythm changes week to week" requirement naturally — Monday is **not** locked to any color.
- The user can also **manually override any specific date** ("today was supposed to be Green but a snow-day pushed it to Gold") so reality always wins over math.
- Example: Mon=Green, Tue=Gold, Wed=Green, Thu=Gold, Fri=Green → next Mon=Gold (flipped). Add a holiday on Wed → Wed skipped, Thu becomes Wed's slot, etc.

---

## 4. Screens / Routes

1. **`/` Home (Today)**
   - Big header: "Today is **Gold Day**" with the day's color as accent.
   - Section: **Classes meeting today** → for each class, a card "Got homework in AP Bio? [Yes / No / Later]". Yes opens the Add-Assignment quick form pre-filled with that class.
   - Section: **Due soon** (next 7 days, sorted), with overdue items at top in red.
   - Snarky quote of the day in the header.

2. **`/assignments` All Homework**
   - Filter: All / Active / Completed / Overdue.
   - Sort: Due date asc (default), by class, by recently added.
   - Each row: title, class (color chip), due date (relative: "in 2 days", "tomorrow", "OVERDUE 3d"), checkbox, paperclip icon if attachments/links exist.
   - Add/edit form supports:
     - **Hyperlinks**: list of URLs with optional labels (e.g., "Google Doc", "Khan Academy lesson").
     - **Attachments**: image picker, generic file picker, **and direct camera capture** (`<input type="file" accept="image/*" capture="environment">` for snapping a photo of the worksheet/whiteboard). Stored as Blobs in IndexedDB. Image attachments show as thumbnails.

3. **`/classes` Classes**
   - List of classes with color chip + meeting days.
   - Add/edit class form: name, teacher, room, color picker, multi-select of cycle days.

4. **`/schedule` Schedule Setup**
   - Define cycle days (default: Green Day, Gold Day; allow add/remove/rename/recolor).
   - Set anchor: "Today (May 7) is **___ Day**".
   - Toggle: skip weekends. Holidays list.

5. **`/todos` Todo List**
   - Free-form todos. Add, complete, delete, reorder.

6. **`/settings`**
   - Theme: **System** (default), Light, Dark — user-overridable.
   - Snark level: Mild / **Medium (default)** / Savage → tunes quote pool.
   - Backup: **Export to JSON file** (download) **and "Copy JSON to clipboard"** (one-tap paste into Google Drive / Keep / Notes). Import from file or clipboard paste.
   - Reset everything.

Bottom nav (mobile-first): **Today · Homework · Classes · Todos · More**

---

## 5. Completion Celebration

When an assignment is marked complete:
1. Confetti burst from the checkbox (`canvas-confetti`).
2. Card does a satisfying scale + fade animation (Framer Motion).
3. Toast appears with a randomized snarky-supportive quote, e.g.:
   - "One down. The void grows quieter."
   - "Look at you, functioning."
   - "Homework: 0. You: 1. The streak continues."
   - "That assignment? Obliterated."
   - Snark level setting tunes the pool (mild → medium → savage).

A small streak counter ("🔥 4 done today") on the Today screen for extra dopamine.

---

## 6. PWA Specifics

- **manifest.webmanifest**: name "Deadline Dodger", short_name "Dodger", themed colors, maskable icons (192/512), standalone display mode.
- **Service Worker** (via vite-plugin-pwa, `registerType: 'autoUpdate'`):
  - Precache the app shell.
  - Runtime cache for fonts / icons.
  - Fully usable offline (all data is local anyway).
- **Install prompt** banner: "Install Deadline Dodger for the full experience" (dismissible, remembered).
- **Daily prompt mechanic**: on app open, check if today's `DailyPrompt` rows exist for today's classes; if not, generate them. (No push notifications in v1 — those need a backend; we use in-app prompt on open.)

---

## 7. Cloudflare Hosting

- **Cloudflare Pages** (recommended over Workers — pure static SPA).
- Build command: `npm run build`
- Output dir: `dist`
- SPA fallback: add `_redirects` with `/* /index.html 200` so client-side routes work on refresh.
- `wrangler.toml` not strictly needed for Pages, but include a `wrangler pages deploy dist` script for one-shot deploys.
- Optional later: Cloudflare D1 + Workers if we ever add cross-device sync.

---

## 8. Project Structure

```
/
├─ public/
│  ├─ icons/ (192, 512, maskable)
│  └─ _redirects               # SPA fallback for Pages
├─ src/
│  ├─ main.tsx
│  ├─ App.tsx
│  ├─ router.tsx
│  ├─ pages/
│  │  ├─ Today.tsx
│  │  ├─ Assignments.tsx
│  │  ├─ Classes.tsx
│  │  ├─ Schedule.tsx
│  │  ├─ Todos.tsx
│  │  └─ Settings.tsx
│  ├─ components/
│  │  ├─ AssignmentCard.tsx
│  │  ├─ AddAssignmentForm.tsx
│  │  ├─ ClassCard.tsx
│  │  ├─ DailyPromptCard.tsx
│  │  ├─ TodoItem.tsx
│  │  ├─ BottomNav.tsx
│  │  ├─ CompletionConfetti.tsx
│  │  └─ SnarkyQuote.tsx
│  ├─ store/
│  │  ├─ assignments.ts
│  │  ├─ classes.ts
│  │  ├─ schedule.ts
│  │  ├─ todos.ts
│  │  └─ settings.ts
│  ├─ lib/
│  │  ├─ db.ts                 # IndexedDB wrapper
│  │  ├─ cycle.ts              # cycle-day math
│  │  ├─ quotes.ts             # snarky quote pool
│  │  └─ date.ts               # formatting helpers
│  └─ styles/index.css
├─ index.html
├─ vite.config.ts              # vite-plugin-pwa here
├─ tailwind.config.js
├─ tsconfig.json
├─ package.json
└─ README.md
```

---

## 9. Build Order — Todo List for Claude

> Each item is a discrete commit. I'll pause for review between phases if you want.

### Phase 1 — Scaffold
- [ ] Initialize Vite React+TS project, add Tailwind, set up base layout.
- [ ] Add router, bottom nav, and empty page stubs for all 6 routes.
- [ ] Wire `vite-plugin-pwa` with manifest + autoUpdate service worker; add icons + `_redirects`.

### Phase 2 — Data Layer
- [ ] Implement IndexedDB wrapper (`lib/db.ts`) with stores for assignments, classes, cycleDays, todos, settings.
- [ ] Build Zustand stores (one per domain) with persistence to IDB.
- [ ] Implement `lib/cycle.ts` with anchor-based cycle-day computation + holidays/weekend skip + unit-testable pure functions.

### Phase 3 — Schedule & Classes
- [ ] Schedule Setup page: define cycle days (default Green/Gold), set anchor, holidays.
- [ ] Classes page: CRUD for classes with color picker and multi-select of cycle days.

### Phase 4 — Assignments
- [ ] Add Assignment form (title, class, due date, notes).
- [ ] Assignments page with filters/sorts and overdue highlighting.
- [ ] Mark complete + delete + edit.

### Phase 5 — Today Screen
- [ ] Compute "today's cycle day" and list classes meeting today.
- [ ] DailyPrompt cards: "Got homework in <class>? Yes / No / Later" — Yes opens prefilled add-assignment.
- [ ] "Due soon" list (next 7 days + overdue at top).
- [ ] Snarky quote of the day in header.

### Phase 6 — Celebration
- [ ] Confetti + Framer Motion animation on assignment complete.
- [ ] Snarky quote pool with mild/medium/savage tiers tied to settings.
- [ ] Daily streak counter.

### Phase 7 — Todos
- [ ] Todos page: add/complete/delete/reorder, persisted.

### Phase 8 — Settings & Polish
- [ ] Theme toggle (light/dark/system).
- [ ] Snark level slider.
- [ ] Export / Import JSON backup.
- [ ] Reset-all confirmation.
- [ ] Empty states with on-vibe copy ("No homework. Suspicious. Or glorious.").
- [ ] Install prompt banner.

### Phase 9 — Deploy
- [ ] README with local dev + Cloudflare Pages deploy steps.
- [ ] Verify production build works offline (Lighthouse PWA audit).
- [ ] Add `wrangler pages deploy` script.

### Phase 10 — Stretch (only if you want them)
- [ ] iCal export of due dates.
- [ ] Per-class assignment stats ("AP Bio has eaten 4 of your last 7 days").
- [ ] Optional Cloudflare D1 sync for multi-device.
- [ ] Web push notifications (requires Workers + a small backend).

---

## 10. Decisions (locked in)

| Question | Decision |
|---|---|
| Cycle days | **Fully user-customizable.** Seed Green + Gold by default; user can add/rename/recolor/delete any number. Rhythm is anchor-walked, not pinned to weekdays — Monday can be any day. Manual per-date override supported. |
| Snark level default | **Medium**, user adjustable (Mild / Medium / Savage). |
| Dark mode | **Follow system by default**, user can override to Light or Dark. |
| Mascot | **Yes — Dodger the tired-but-supportive raccoon.** Appears in empty states, the celebration toast, and the install banner. SVG-based for crispness at any size. |
| Backup | **Both** — JSON file export/import **and** "Copy to clipboard" / "Paste from clipboard" for Google Drive friendliness. |
| Attachments | **Yes** — image picker, file picker, and direct **camera capture** on assignments. Stored as Blobs in IndexedDB. |
| Hyperlinks | **Yes** — assignments can have any number of titled URLs. |

Building now, phase-by-phase, committing along the way.

---

## 11. Addendum: Natural-language assignment entry (v2 feature)

> Lets a student paste/type something like *"got chem reading ch 4 due wed, math worksheet for friday, history essay outline due monday"* and have it parsed into structured assignments matched against their existing classes.

### 11.1 The non-negotiable: never ship the API key

The OpenRouter key **must not** be in any file Vite bundles or in any environment variable readable by the client. `VITE_*` env vars get baked into the JS bundle and are publicly viewable. The only safe place for the key is on the server.

We already deploy as a **Cloudflare Worker + static assets** (see `wrangler.jsonc`). That same Worker can expose a tiny API surface alongside serving the static SPA. The key lives as a Worker **secret** (encrypted at rest, never in source, never returned in any response).

```bash
wrangler secret put OPENROUTER_API_KEY    # interactive prompt, never committed
```

### 11.2 Architecture

```
Browser (PWA)                Cloudflare Worker                  OpenRouter
─────────────                ─────────────────                  ──────────
[Quick-add modal]
  ↓ POST /api/parse-homework
  { text, classes, today,    →  validate + rate-limit
    cycleDayId }                 ↓ inject OPENROUTER_API_KEY
                                 ↓ POST /api/v1/chat/completions  →  model
                                 ←  JSON response                 ←
                              ←  return parsed array
[Confirm screen]
  user edits / removes
  ↓ "Add all" → writes to local store
```

The Worker is the **only** thing that ever sees the key. The client only ever sees its own text + the parsed response.

### 11.3 The Worker endpoint

New file: `worker/index.ts` (wired into `wrangler.jsonc` as the Worker entry; static assets served as a fallback).

Endpoint: `POST /api/parse-homework`

Request body (sent from the PWA):
```json
{
  "text": "chem reading ch 4 wed, math wks fri, history outline mon",
  "today": "2026-06-18",
  "cycleDays": [{ "id": "...", "label": "Green Day" }, ...],
  "todayCycleDayId": "...",
  "classes": [
    { "id": "abc", "name": "AP Chemistry", "meetsOnCycleDayIds": ["green"] },
    { "id": "def", "name": "Algebra II", "meetsOnCycleDayIds": ["gold"] }
  ]
}
```

Response:
```json
{
  "assignments": [
    {
      "title": "Reading: Chapter 4",
      "classId": "abc",
      "classNameGuess": "AP Chemistry",
      "dueDate": "2026-06-24",
      "notes": "Ch 4",
      "confidence": 0.9
    },
    ...
  ]
}
```

The Worker calls OpenRouter with `model: "openrouter/auto"` (or `"<provider>/<model>:free"` if you want to lock to the free tier — `auto` is OpenRouter's best-fit router and **does** include free models when requested via the `:floor` price hint, or we can explicitly list a `models` array of `:free` variants as fallbacks). System prompt asks for **strict JSON**, includes the class list + today's date + today's cycle day, and uses OpenRouter's `response_format: { type: "json_schema", ... }` so the model returns validated structured output.

### 11.4 Worker code skeleton

```ts
// worker/index.ts
export interface Env {
  OPENROUTER_API_KEY: string;       // secret
  ASSETS: Fetcher;                  // static-assets binding
  RATE_LIMITER?: RateLimit;         // optional binding
}

const SCHEMA = {
  type: "object",
  properties: {
    assignments: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          classId: { type: "string", nullable: true },
          classNameGuess: { type: "string", nullable: true },
          dueDate: { type: "string", description: "ISO YYYY-MM-DD" },
          notes: { type: "string", nullable: true },
          confidence: { type: "number" }
        },
        required: ["title", "dueDate"]
      }
    }
  },
  required: ["assignments"]
};

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === "/api/parse-homework" && req.method === "POST") {
      // 1) Same-origin guard (cheap CSRF protection)
      const origin = req.headers.get("origin");
      if (origin && new URL(origin).host !== url.host) {
        return json({ error: "forbidden" }, 403);
      }

      // 2) Body size limit
      const raw = await req.text();
      if (raw.length > 8_000) return json({ error: "too_large" }, 413);
      const body = JSON.parse(raw);
      if (typeof body.text !== "string" || body.text.length > 2_000) {
        return json({ error: "bad_request" }, 400);
      }

      // 3) Rate limit (per-IP, 20/hour default; tunable)
      const ip = req.headers.get("CF-Connecting-IP") ?? "unknown";
      if (env.RATE_LIMITER) {
        const { success } = await env.RATE_LIMITER.limit({ key: ip });
        if (!success) return json({ error: "rate_limited" }, 429);
      }

      // 4) Call OpenRouter
      const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://deadline-dodger.workers.dev",
          "X-Title": "Deadline Dodger"
        },
        body: JSON.stringify({
          model: "openrouter/auto",
          // Or lock to free tier with explicit fallbacks:
          // model: "meta-llama/llama-3.3-70b-instruct:free",
          // models: ["google/gemini-2.0-flash-exp:free", "openrouter/auto"],
          response_format: { type: "json_schema", json_schema: { name: "homework", schema: SCHEMA, strict: true } },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: buildUserPrompt(body) }
          ],
          // Belt-and-suspenders: keep cost capped
          max_tokens: 800,
          temperature: 0
        })
      });

      if (!orRes.ok) return json({ error: "upstream", status: orRes.status }, 502);
      const data = await orRes.json();
      const content = data.choices?.[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(content);
      return json(parsed, 200);
    }

    // Everything else: serve the SPA static assets
    return env.ASSETS.fetch(req);
  }
};
```

### 11.5 Prompt design

System prompt (short — costs money on big models, free on free):
> You parse American high-school student homework notes into structured JSON. Today is `<DATE>` (`<CYCLE_DAY_LABEL>`). The student's classes are: `<CLASS LIST WITH IDS + CYCLE DAYS THEY MEET ON>`. Resolve relative dates ("monday", "next fri", "tomorrow", "tn" = tonight, etc.) to ISO YYYY-MM-DD using TODAY as the anchor. Match each item to a `classId` from the list when you're confident; otherwise leave `classId` null and put your best guess in `classNameGuess`. Output strictly the JSON schema provided. Title each item in plain student-readable form (e.g., "Worksheet — Ch 4", "Read pages 88–96").

User message: just the raw `text`.

### 11.6 Client-side UX

New button on the **Today** screen header and on the **Assignments** page: **`✨ Paste it`** (small, accent-colored, unmistakably the AI option).

Flow:
1. Tap opens a modal: big textarea, placeholder *"chem reading ch 4 due wed, math wks fri…"*, single submit button.
2. Submit → POST to `/api/parse-homework` with the student's data context.
3. Spinner with a snarky line ("Decoding teen shorthand…").
4. Response → render a **review screen**: each parsed item as an editable card with title / class / due-date / notes, individually delete-able, with class-match confidence shown subtly.
5. **"Looks good — add them all"** button writes the lot to the local store. Existing `addAssignment` action is reused; nothing about the data model changes.

Important: the AI never directly mutates the store. The student always confirms.

### 11.7 Key protection — the full belt

1. **Secret in Worker only.** `wrangler secret put OPENROUTER_API_KEY`. Never in `.env`, never in `wrangler.jsonc`, never `VITE_*`.
2. **Same-origin check** on `POST /api/parse-homework` (blocks browser-from-elsewhere abuse).
3. **Body size cap** (8KB request, 2KB text field).
4. **`max_tokens` cap** on the OpenRouter call (~800) so a malicious caller can't burn your quota with one shot.
5. **Per-IP rate limit** via Cloudflare Workers' built-in `RateLimit` binding (e.g., 20 calls/hour/IP, 100/day/IP). Free tier.
6. **Optional: Turnstile** invisible challenge in front of the modal if abuse shows up later. Free Cloudflare product.
7. **Optional but recommended**: cap monthly spend on the OpenRouter dashboard so even worst case is bounded.
8. **No PII forwarded** to OpenRouter: we send `text + classes + dates`. No names, no attachments, no notes from other assignments.
9. **Telemetry**: log only `{ ip_hash, length, model, latency_ms, success }` to Workers Analytics — never the raw `text` or response, to avoid hoarding student data.

### 11.8 Cost guardrails

- Default to `openrouter/auto` with **a fallback list of `:free` models** in `models: [...]`. Auto picks the cheapest viable model; if it can't, it falls through to free.
- If you want **strict free**: set `model: "meta-llama/llama-3.3-70b-instruct:free"` (or whichever current free model handles JSON schema best — Gemini 2 Flash free is also good). Free OpenRouter models have request-per-minute limits per OpenRouter account; the per-IP rate limit above will keep us well under.
- `temperature: 0` for deterministic output (less variation, less retry cost).
- The whole interaction is ~500 tokens in, ~300 out. Even on paid tier auto, single-digit fractions of a cent per parse.

### 11.9 Build steps

1. **Add a Worker entry.** Create `worker/index.ts` with the handler above. Update `wrangler.jsonc`:
   ```jsonc
   {
     "main": "worker/index.ts",
     "assets": {
       "directory": "./dist",
       "binding": "ASSETS",
       "not_found_handling": "single-page-application"
     },
     "compatibility_date": "2026-06-01",
     "compatibility_flags": ["nodejs_compat"]
   }
   ```
   And add a `[[unsafe.bindings]]` or `[[rate_limiting]]` block for the rate-limit binding.

2. **Set the secret.**
   ```bash
   npx wrangler secret put OPENROUTER_API_KEY
   ```

3. **Build the client UI:** a new `QuickAddModal` component + a small `lib/quickAdd.ts` that POSTs to `/api/parse-homework`. Buttons on the Today and Assignments pages.

4. **Build the review screen:** edit-able list, per-item discard, bulk submit. Reuses existing `useStore.addAssignment`.

5. **Local dev:** `wrangler dev` runs the Worker locally with the secret, proxies static assets from Vite's dev server. Or use Cloudflare's Vite plugin for one-process dev.

6. **Deploy:** `npm run build && wrangler deploy`. Cloudflare's auto-config already wires the Worker — we just need to give it a `main` entry.

### 11.10 Decisions for you

Three quick choices before I build:

1. **Model preference**: `openrouter/auto` (smartest, costs cents/parse) or **lock to `:free`** (zero cost, slightly dumber)?
2. **Default rate limit**: per-IP. **20/hour, 100/day** sound right? Easy to tune.
3. **Quick-add button placement**: just **Today + Assignments**, or also add a floating action button visible everywhere?

Answer those and I'll build it phase-by-phase: Worker first (verify with `curl`), then the UI, then the review screen.
