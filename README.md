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

The built site lives in `dist/`. It's a static SPA — `public/_redirects` ensures client-side routes work on hosts that respect Netlify-style redirects (Cloudflare Pages does).

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

## Data & privacy

Everything is stored on-device:

- **App state** (classes, assignments, todos, settings, schedule) → IndexedDB (`dd-store-v1`).
- **Attachments** (photos/files) → IndexedDB blob store.
- **No accounts. No servers. No tracking.**

Use Settings → **Backup** to export a JSON snapshot you can stash in Google Drive / Notes / email. Attachments aren't included in JSON backups (binary blobs stay on the device).

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
