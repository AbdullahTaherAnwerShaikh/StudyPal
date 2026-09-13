import { toDateKey } from "@/lib/dates";

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parseDay(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

export function isWeekend(date: Date): boolean {
  const dow = date.getDay();
  return dow === 0 || dow === 6;
}

export function dayRange(startKey: string, endKey: string): string[] {
  const days: string[] = [];
  const cursor = parseDay(startKey);
  const end = parseDay(endKey);
  while (cursor.getTime() <= end.getTime()) {
    days.push(toDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}