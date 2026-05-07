import {
  format,
  parseISO,
  differenceInCalendarDays,
  isToday,
  isTomorrow,
  isYesterday,
} from "date-fns";

export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function isoToDate(iso: string): Date {
  return parseISO(iso);
}

export function formatDueDate(iso: string): string {
  const d = parseISO(iso);
  const diff = differenceInCalendarDays(d, new Date());
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  if (isYesterday(d)) return "Yesterday";
  if (diff < 0) return `Overdue ${Math.abs(diff)}d`;
  if (diff <= 6) return `In ${diff} days`;
  return format(d, "EEE, MMM d");
}

export function isOverdue(iso: string, completed: boolean): boolean {
  if (completed) return false;
  return differenceInCalendarDays(parseISO(iso), new Date()) < 0;
}

export function daysUntil(iso: string): number {
  return differenceInCalendarDays(parseISO(iso), new Date());
}

export function prettyDate(iso: string): string {
  return format(parseISO(iso), "EEEE, MMM d, yyyy");
}
