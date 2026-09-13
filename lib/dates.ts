export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const DAY_NAMES = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export function isValidDayKey(value: string): boolean {
  return DAY_NAMES.includes(value);
}

export function isDueToday(scheduledDays: string[], todayKey: string): boolean {
  const dayName = DAY_NAMES[new Date(`${todayKey}T00:00:00`).getDay()];
  return scheduledDays.includes(dayName);
}
