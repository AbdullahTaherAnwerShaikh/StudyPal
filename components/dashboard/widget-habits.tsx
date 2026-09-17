import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { isDemoMode } from "@/lib/demo";
import { getDemoHabitsWidget } from "@/lib/demo-data";
import WidgetCard from "@/components/dashboard/widget-card";
import WidgetEmpty from "@/components/dashboard/widget-empty";
import WidgetHabitRow from "@/components/dashboard/widget-habit-row";
import { isDueToday, toDateKey } from "@/lib/dates";

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
  const today = toDateKey(new Date());
  const demo = await isDemoMode();

  let habitsData: HabitLike[];
  let loggedSet: Set<string>;

  if (demo) {
    const demo = getDemoHabitsWidget();
    habitsData = demo.habits.map((habit) => ({ ...habit }));
    loggedSet = new Set(
      demo.habits.filter((habit) => (demo.logs[habit.id] ?? []).includes(today)).map((habit) => habit.id)
    );
  } else {
    const supabase = await createClient();

    const { data: habits } = await supabase
      .from("habits")
      .select("id, name, streak, scheduled_days")
      .order("name", { ascending: true });

    habitsData = (habits ?? []).map((habit) => ({
      id: habit.id,
      name: habit.name,
      streak: habit.streak,
      scheduled_days: Array.isArray(habit.scheduled_days)
        ? (habit.scheduled_days as string[])
        : [],
    }));

    const dueIds = habitsData
      .filter((habit) => isDueToday(habit.scheduled_days, today))
      .map((habit) => habit.id);

    const loggedIds: string[] = [];
    if (dueIds.length > 0) {
      const { data: logs } = await supabase
        .from("habit_logs")
        .select("habit_id")
        .in("habit_id", dueIds)
        .eq("date", today);
      loggedIds.push(...(logs ?? []).map((row) => row.habit_id as string));
    }
    loggedSet = new Set(loggedIds);
  }

  const allHabits: HabitLike[] = habitsData;

  const dueToday = allHabits.filter((habit) =>
    isDueToday(habit.scheduled_days, today)
  );

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
      href="/habits"
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
              <WidgetHabitRow
                key={row.id}
                habit={row.habit}
                loggedToday={row.success}
                dueTodayRow={row.dueTodayRow}
                chip={row.chip}
                demo={demo}
                today={today}
              />
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