import { todayISO } from "./date";
import { cycleDayForDate, getCycleDay } from "./cycle";
import type { Class, ScheduleConfig } from "../types";

export type ParsedAssignment = {
  title: string;
  classId: string | null;
  classNameGuess: string | null;
  dueDate: string;
  notes: string | null;
  confidence: number;
};

export type ParseResponse =
  | { ok: true; assignments: ParsedAssignment[] }
  | { ok: false; error: string; message?: string };

export async function parseHomeworkText(
  text: string,
  classes: Class[],
  schedule: ScheduleConfig,
): Promise<ParseResponse> {
  const today = todayISO();
  const todayCycleId = cycleDayForDate(today, schedule);
  const todayCycleLabel = getCycleDay(todayCycleId, schedule.cycleDays)?.label ?? "";

  const trimmedClasses = classes.map((c) => ({
    id: c.id,
    name: c.name,
    meetsOnCycleDayLabels: c.meetsOnCycleDayIds
      .map((id) => schedule.cycleDays.find((d) => d.id === id)?.label)
      .filter((s): s is string => Boolean(s)),
  }));

  let res: Response;
  try {
    res = await fetch("/api/parse-homework", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        today,
        todayCycleDayLabel: todayCycleLabel,
        classes: trimmedClasses,
      }),
    });
  } catch (e) {
    return {
      ok: false,
      error: "network",
      message:
        e instanceof Error
          ? e.message
          : "Couldn't reach the parser. Are you offline?",
    };
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return { ok: false, error: "bad_response" };
  }

  if (!res.ok) {
    const d = data as { error?: string; message?: string };
    return { ok: false, error: d.error ?? "http_" + res.status, message: d.message };
  }

  const d = data as { assignments?: unknown };
  if (!Array.isArray(d.assignments)) {
    return { ok: false, error: "no_assignments" };
  }
  return { ok: true, assignments: d.assignments as ParsedAssignment[] };
}
