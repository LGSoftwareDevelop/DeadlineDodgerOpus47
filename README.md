# Deadline Dodger

> We are here to help you with your horrible homework.

A Progressive Web App for high school students to track homework, classes, and the rotating cycle-day schedule (Green/Gold/etc.). Mascot included.

## Features

- **Homework tracking** with due-first sorting, overdue highlighting, mark-complete celebrations.
- **Classes** with custom colors and the cycle-days they meet on.
- **Rotating schedule** — fully user-defined cycle days (Green, Gold, Blue, A/B, whatever). Anchor-walk math handles the "Monday isn't always Green" reality. Holidays and per-date manual overrides supported.
- **Daily prompt** — when you open the app, every class meeting today asks "Got homework?" → Yes/No/Later.
- **Attachments + camera** — snap a photo of the worksheet/whiteboard, upload images or files, all stored locally in IndexedDB.
- **Hyperlinks** on assignments (Google Doc, Khan Academy lesson, etc.).
- **Free-form todos** for non-school stuff.
- **Celebration animations** with confetti, the Dodger raccoon mascot, and snarky quotes (snark level: Mild / Medium / Savage).
- **Theme**: System / Light / Dark.
- **Backup**: JSON file export/import + clipboard copy/paste (Google Drive friendly).
- **Fully offline** PWA — install to home screen, works without a connection.

## Local development

```bash
npm install
npm run dev
```

Visit the printed URL (usually <http://localhost:5173>).

## Production build

```bash
npm run build
npm run preview   # local preview of the built app
```

The built site lives in `dist/`. It's a static SPA. On Cloudflare's
Workers + static assets pipeline, the auto-generated `wrangler.jsonc`
sets `assets.not_found_handling: "single-page-application"`, which
serves `/index.html` for any unknown route so client-side routing works
on refresh.

## Deploy to Cloudflare Pages

### Option 1 — Git-based (recommended)

1. Push this repo to GitHub.
2. In the Cloudflare dashboard → **Pages** → **Create project** → connect your repo.
3. Build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Node version**: 20+
4. Deploy. Cloudflare will rebuild on every push.

### Option 2 — Direct upload via Wrangler

```bash
npm run build
npx wrangler pages deploy dist --project-name deadline-dodger
```

(First time, Wrangler will prompt you to create the project.)

## ✨ Natural-language quick add (optional, server-backed)

Tap **"Paste it"** on the Today header or Assignments page, type something
like:

> chem reading ch 4 wed, math wks fri, history outline mon

and it gets parsed into structured assignments, matched to your existing
classes, and dropped into a review screen where you can edit each one
before it's added. Parsing is done by a free OpenRouter model via a
Cloudflare Worker — your API key stays on the server.

### Configuring the AI parser

All three knobs are env vars / Worker secrets — **no code changes needed
to tune them.**

#### 1. Set your OpenRouter API key (required to enable the feature)

The key is a Worker **secret** — encrypted at rest, never in the repo.

```bash
npm run secret:set        # alias for: wrangler secret put OPENROUTER_API_KEY
```

Or in the Cloudflare dashboard: **Workers → deadlinedodgeropus47 →
Settings → Variables and Secrets → Add → Secret**. Name it
`OPENROUTER_API_KEY`.

Without the key, the endpoint returns 503 and the modal shows
"AI parsing isn't set up yet."

#### 2. Change which model is used

Edit `wrangler.jsonc` → `vars.OPENROUTER_MODEL` (primary) and
`vars.OPENROUTER_MODELS_FALLBACK` (comma-separated list — OpenRouter
falls through to these if the primary is unavailable).

Defaults (all free):
- Primary: `google/gemini-2.0-flash-exp:free`
- Fallbacks: `meta-llama/llama-3.3-70b-instruct:free`, `mistralai/mistral-7b-instruct:free`

To switch to a paid auto-router for better accuracy:
```jsonc
"vars": {
  "OPENROUTER_MODEL": "openrouter/auto"
}
```

#### 3. Change the rate limit

Edit `wrangler.jsonc` → `unsafe.bindings[0].simple`:
- `limit`: how many requests
- `period`: time window in seconds (Cloudflare allows only **10** or **60**)

Default: 5 requests per 60 seconds, per IP. Lower it to harden, raise it
to loosen.

#### 4. Other knobs

- `PARSE_MAX_TOKENS` (default `800`): caps the model's response size and
  worst-case cost. Lower it to be stingier, raise it if real assignments
  get truncated.

After editing `wrangler.jsonc`, redeploy: `npm run deploy`.

### Local development of the AI endpoint

The Vite dev server (`npm run dev`) doesn't run the Worker. To exercise
the `/api/parse-homework` endpoint locally:

```bash
npx wrangler secret put OPENROUTER_API_KEY    # one-time, dev-only secret
npm run dev:worker                            # runs `wrangler dev`
```

Then hit the worker URL directly (printed by wrangler) or proxy from
Vite. The UI in `npm run dev` will show a friendly error until the
worker is reachable.

## Data & privacy

Everything is stored on-device:

- **App state** (classes, assignments, todos, settings, schedule) → IndexedDB (`dd-store-v1`).
- **Attachments** (photos/files) → IndexedDB blob store.
- **No accounts. No servers. No tracking.**

Use Settings → **Backup** to export a JSON snapshot you can stash in Google Drive / Notes / email. Attachments aren't included in JSON backups (binary blobs stay on the device).

The only thing that ever leaves the device is what you type into the
**Paste it** quick-add box (if you enabled it). That text + your class
names + today's date are sent to the Worker, which forwards them to
OpenRouter. Attachments, notes from other assignments, and any other
state are never forwarded.

## Tech

- React 18 + TypeScript + Vite
- Tailwind CSS
- Zustand (persisted to IndexedDB via `idb`)
- React Router
- Framer Motion + canvas-confetti
- vite-plugin-pwa (Workbox)
- date-fns, lucide-react

## Project structure

```
src/
├─ pages/         Today, Assignments, Classes, Schedule, Todos, Settings
├─ components/    Mascot, BottomNav, AssignmentCard/Form, AttachmentPreview, ...
├─ store/         Zustand store with IndexedDB persistence
├─ lib/           db (IDB), cycle (day rotation math), date, quotes, id
├─ styles/        Tailwind + small base CSS
└─ types.ts
```

## License

MIT — go forth and dodge deadlines.
