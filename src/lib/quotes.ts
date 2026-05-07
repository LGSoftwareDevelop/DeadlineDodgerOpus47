import type { SnarkLevel } from "../types";

const MILD = [
  "One down. Nicely done.",
  "Look at you, getting things done!",
  "Progress is progress. Keep going.",
  "That's one less thing on your mind.",
  "Future-you says thanks.",
  "Well played.",
  "Crossing it off feels good, doesn't it?",
  "Steady wins this race.",
];

const MEDIUM = [
  "One down. The void grows quieter.",
  "Look at you, functioning.",
  "Homework: 0. You: 1.",
  "That assignment? Obliterated.",
  "Another one bites the binder.",
  "Boom. Done. Next victim?",
  "The pile fears you now.",
  "You're basically a productivity wizard.",
  "Take that, deadline.",
  "Snack break? You earned it.",
];

const SAVAGE = [
  "One assignment dispatched. The rest are next.",
  "Homework cried. You laughed.",
  "Crushed it. Absolutely crushed it.",
  "Deadline dodged like a pro.",
  "Your worksheet just rage-quit.",
  "Another soul claimed by the great Done List.",
  "School: tried it. You: did it.",
  "That homework is now legally afraid of you.",
  "Pure carnage. Glorious.",
  "Teachers hate this one simple trick: actually doing it.",
];

const QUOTE_OF_DAY_MILD = [
  "You've got this. One thing at a time.",
  "Small steps, big wins.",
  "Tomorrow's you is rooting for today's you.",
];

const QUOTE_OF_DAY_MEDIUM = [
  "Homework is temporary. The vibes are forever.",
  "Today's plan: do the thing. Then do the next thing.",
  "We're not procrastinating. We're percolating.",
  "Deadline who? You don't know her.",
];

const QUOTE_OF_DAY_SAVAGE = [
  "School is a roguelike. We respawn daily.",
  "Make the syllabus weep.",
  "Eat the assignment. Spit out the bones.",
];

export function completionQuote(level: SnarkLevel): string {
  const pool = level === "mild" ? MILD : level === "savage" ? SAVAGE : MEDIUM;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function quoteOfTheDay(level: SnarkLevel, dateSeed: string): string {
  const pool =
    level === "mild"
      ? QUOTE_OF_DAY_MILD
      : level === "savage"
      ? QUOTE_OF_DAY_SAVAGE
      : QUOTE_OF_DAY_MEDIUM;
  // Deterministic based on date so it doesn't change when re-rendering today.
  let h = 0;
  for (let i = 0; i < dateSeed.length; i++) h = (h * 31 + dateSeed.charCodeAt(i)) | 0;
  return pool[Math.abs(h) % pool.length];
}
