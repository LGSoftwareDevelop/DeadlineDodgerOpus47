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
  completed: boolean;
  completedAt?: string;
  createdAt: string;
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
- The student tells us **today is Green Day** (one-time setup, editable).
- The app stores that as an anchor, then advances one cycle-day per school day, skipping weekends + holidays.
- Because cycle days don't reset on the calendar week, this anchor-walk approach handles the "switches week to week" requirement naturally.
- Example: Mon=Green, Tue=Gold, Wed=Green, Thu=Gold, Fri=Green → next Mon=Gold (it flipped).

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
   - Each row: title, class (color chip), due date (relative: "in 2 days", "tomorrow", "OVERDUE 3d"), checkbox.

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
   - Theme (light/dark/system).
   - Snark level slider (Mild / Medium / Savage) → tunes quote pool.
   - Export / Import JSON backup.
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

## 10. Open Questions for You Before I Start

1. **Cycle days** — default to just **Green / Gold**, or seed more (Blue/Red) and let you delete?
2. **Snark level default** — Mild, Medium, or Savage out of the box?
3. **Dark mode** — default to system, or force dark (high schooler aesthetic)?
4. **Mascot?** — want me to design a small character (e.g., a tired but supportive raccoon) for empty states and the celebration toast, or keep it text-only?
5. **Backup** — JSON export only, or also a "copy to clipboard" shortcut?

Once you green-light the plan (and answer any of the above you care about), I'll start at Phase 1 and commit phase-by-phase.
