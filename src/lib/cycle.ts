import { addDays, parseISO, format, getDay, isBefore } from "date-fns";
import type { ScheduleConfig, CycleDay } from "../types";

export const NO_SCHOOL = "" as const;

function iso(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

function isWeekend(d: Date): boolean {
  const day = getDay(d);
  return day === 0 || day === 6;
}

function isSchoolDay(date: Date, config: ScheduleConfig): boolean {
  const isoDate = iso(date);
  if (config.skipWeekends && isWeekend(date)) return false;
  if (config.holidays.includes(isoDate)) return false;
  // Manual override of empty string means "no school"
  if (config.overrides[isoDate] === NO_SCHOOL && isoDate in config.overrides) return false;
  return true;
}

/**
 * Walks the cycle from the anchor to the target date, advancing one
 * cycle-day per school day. Manual overrides win.
 *
 * Returns the cycle-day id for `targetIso`, or null if not a school day.
 */
export function cycleDayForDate(
  targetIso: string,
  config: ScheduleConfig,
): string | null {
  if (config.cycleDays.length === 0) return null;

  // Manual override takes precedence
  if (targetIso in config.overrides) {
    const v = config.overrides[targetIso];
    return v === NO_SCHOOL ? null : v;
  }

  const target = parseISO(targetIso);
  if (!isSchoolDay(target, config)) return null;

  const anchor = parseISO(config.anchorDate);
  const anchorIdx = config.cycleDays.findIndex(
    (c) => c.id === config.anchorCycleDayId,
  );
  if (anchorIdx === -1) return null;

  // Walk from anchor toward target, counting school days.
  let idx = anchorIdx;
  if (config.anchorDate === targetIso) {
    return config.cycleDays[idx].id;
  }

  if (isBefore(anchor, target)) {
    let d = addDays(anchor, 1);
    while (true) {
      // Check overrides during walk too
      const dIso = iso(d);
      if (dIso in config.overrides) {
        const ov = config.overrides[dIso];
        if (ov === NO_SCHOOL) {
          // skip
        } else {
          // Snap our index to the override so subsequent walk is consistent
          const overrideIdx = config.cycleDays.findIndex((c) => c.id === ov);
          if (overrideIdx >= 0) idx = overrideIdx;
        }
      } else if (isSchoolDay(d, config)) {
        idx = (idx + 1) % config.cycleDays.length;
      }
      if (dIso === targetIso) {
        return config.cycleDays[idx].id;
      }
      d = addDays(d, 1);
    }
  } else {
    // walk backward
    let d = addDays(anchor, -1);
    while (true) {
      const dIso = iso(d);
      if (dIso in config.overrides) {
        const ov = config.overrides[dIso];
        if (ov === NO_SCHOOL) {
          // skip
        } else {
          const overrideIdx = config.cycleDays.findIndex((c) => c.id === ov);
          if (overrideIdx >= 0) idx = overrideIdx;
        }
      } else if (isSchoolDay(d, config)) {
        idx = (idx - 1 + config.cycleDays.length) % config.cycleDays.length;
      }
      if (dIso === targetIso) {
        return config.cycleDays[idx].id;
      }
      d = addDays(d, -1);
    }
  }
}

export function getCycleDay(
  cycleDayId: string | null,
  cycleDays: CycleDay[],
): CycleDay | null {
  if (!cycleDayId) return null;
  return cycleDays.find((c) => c.id === cycleDayId) ?? null;
}

/** Compute the next N school days with their cycle-day labels. */
export function upcomingCycleDays(
  fromIso: string,
  count: number,
  config: ScheduleConfig,
): { date: string; cycleDayId: string | null }[] {
  const out: { date: string; cycleDayId: string | null }[] = [];
  let d = parseISO(fromIso);
  let collected = 0;
  let safety = 0;
  while (collected < count && safety < 365) {
    const isoStr = iso(d);
    const cd = cycleDayForDate(isoStr, config);
    if (cd) {
      out.push({ date: isoStr, cycleDayId: cd });
      collected++;
    }
    d = addDays(d, 1);
    safety++;
  }
  return out;
}
