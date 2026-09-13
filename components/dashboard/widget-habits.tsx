import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import WidgetCard from "@/components/dashboard/widget-card";
import WidgetEmpty from "@/components/dashboard/widget-empty";
import { isDueToday, toDateKey } from "@/lib/dates";

const SCHEDULE_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const SCHEDULE_LABELS: Record<string, string> = {
  mon: "M",
  tue: "T",
  wed: "W",
  thu: "T",
  fri: "F",
  sat: "S",
  sun: "S",
};
const DAY_NAMES = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

type HabitLike = {
  id: string;
  name: string;
  streak: number;
  scheduled_days: string[];
};

function nextSchedule(
  habit: HabitLike,
  today: string
): { dateKey: string; label: string } | null {
  const base = new Date(`${today}T00:00:00`);
  for (let offset = 1; offset <= 7; offset += 1) {
    const day = new Date(base);
    day.setDate(base.getDate() + offset);
    if (habit.scheduled_days.includes(DAY_NAMES[day.getDay()])) {
      const dateKey = toDateKey(day);
      const label =
        offset === 1
          ? "Tomorrow"
          : new Date(`${dateKey}T00:00:00`).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            });
      return { dateKey, label };
    }
  }
  return null;
}

export default async function HabitsWidget({ className = "" }: { className?: string }) {
  const supabase = await createClient();
  const today = toDateKey(new Date());

  const { data: habits } = await supabase
    .from("habits")
    .select("id, name, streak, scheduled_days")
    .order("name", { ascending: true });

  const allHabits: HabitLike[] = (habits ?? []).map((habit) => ({
    ...habit,
    scheduled_days: Array.isArray(habit.scheduled_days)
      ? (habit.scheduled_days as string[])
      : [],
  }));

  const dueToday = allHabits.filter((habit) =>
    isDueToday(habit.scheduled_days, today)
  );

  const loggedIds: string[] = [];
  if (dueToday.length > 0) {
    const ids = dueToday.map((habit) => habit.id);
    const { data: logs } = await supabase
      .from("habit_logs")
      .select("habit_id")
      .in("habit_id", ids)
      .eq("date", today);
    loggedIds.push(...(logs ?? []).map((row) => row.habit_id as string));
  }
  const loggedSet = new Set(loggedIds);

  const nextUp = allHabits
    .map((habit) => ({ habit, next: nextSchedule(habit, today) }))
    .filter(
      (entry): entry is { habit: HabitLike; next: { dateKey: string; label: string } } =>
        entry.next !== null
    )
    .sort(
      (a, b) =>
        a.next.dateKey.localeCompare(b.next.dateKey) ||
        a.habit.name.localeCompare(b.habit.name)
    );

  const rows: {
    id: string;
    habit: HabitLike;
    chip: string;
    success: boolean;
    dueTodayRow: boolean;
  }[] = [];
  for (const habit of dueToday) {
    if (rows.length >= 3) break;
    rows.push({
      id: habit.id,
      habit,
      chip: loggedSet.has(habit.id) ? "Done today" : "Log today",
      success: loggedSet.has(habit.id),
      dueTodayRow: true,
    });
  }
  if (rows.length < 3) {
    for (const { habit, next } of nextUp) {
      if (rows.length >= 3) break;
      if (rows.some((row) => row.id === habit.id)) continue;
      rows.push({
        id: habit.id,
        habit,
        chip: `Next: ${next.label}`,
        success: false,
        dueTodayRow: false,
      });
    }
  }
  const hiddenDue = dueToday.length - rows.filter((row) => row.dueTodayRow).length;
  const hiddenTotal = allHabits.length - rows.length;

  return (
    <WidgetCard
      title="Habits"
      action={
        <span className="text-xs font-medium text-muted">
          {dueToday.length > 0 ? `${dueToday.length} due today` : `${allHabits.length} habits`}
        </span>
      }
      className={className}
    >
      {allHabits.length === 0 ? (
        <WidgetEmpty>
          No habits yet.{" "}
          <Link href="/habits" className="font-bold text-accent hover:text-accent-light">
            Add your first habit
          </Link>
          .
        </WidgetEmpty>
      ) : rows.length === 0 ? (
        <WidgetEmpty>
          No habits scheduled — add a day to a habit to start a streak.
        </WidgetEmpty>
      ) : (
        <>
          {dueToday.length === 0 && (
            <p className="mb-4 text-xs font-medium text-muted">
              Nothing scheduled today — here's what's up next:
            </p>
          )}

          <ul className="space-y-4">
            {rows.map((row) => (
              <li key={row.id}>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate text-ink">{row.habit.name}</span>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      row.success
                        ? "bg-success/15 text-success"
                        : "bg-surface text-accent shadow-inset-sm"
                    }`}
                  >
                    {row.chip}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-3">
                  <div className="flex gap-1.5">
                    {SCHEDULE_ORDER.map((key) => {
                      const scheduled = row.habit.scheduled_days.includes(key);
                      return (
                        <span
                          key={key}
                          title={key}
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] ${
                            scheduled
                              ? "font-bold text-accent shadow-inset-sm"
                              : "text-muted/50"
                          }`}
                        >
                          {SCHEDULE_LABELS[key]}
                        </span>
                      );
                    })}
                  </div>
                  <span className="shrink-0 text-xs font-bold text-accent">
                    {row.habit.streak}-day streak
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {hiddenDue > 0 && (
        <p className="mt-3 text-xs font-medium text-muted">
          +{hiddenDue} more habit{hiddenDue === 1 ? "" : "s"} due today.
        </p>
      )}
      {hiddenDue === 0 && hiddenTotal > 0 && (
        <p className="mt-3 text-xs font-medium text-muted">
          +{hiddenTotal} more habit{hiddenTotal === 1 ? "" : "s"}.
        </p>
      )}

      {allHabits.length > 0 && (
        <div className="mt-4">
          <Link
            href="/habits"
            className="text-xs font-bold text-accent hover:text-accent-light"
          >
            Open all habits →
          </Link>
        </div>
      )}
    </WidgetCard>
  );
}