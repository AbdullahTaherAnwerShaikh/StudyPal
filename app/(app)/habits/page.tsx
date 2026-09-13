import { createClient } from "@/lib/supabase-server";
import HabitsView from "@/components/habits/habits-view";
import type { HabitLogMap, HabitRow } from "@/lib/types";

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default async function HabitsPage() {
  const supabase = await createClient();
  const today = toDateKey(new Date());

  const { data: habits } = await supabase
    .from("habits")
    .select("id, name, scheduled_days, streak")
    .order("name", { ascending: true });

  const ids = (habits ?? []).map((habit) => habit.id);
  const logsByHabit: HabitLogMap = {};

  if (ids.length > 0) {
    const weekAgo = toDateKey(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000));
    const { data: logRows } = await supabase
      .from("habit_logs")
      .select("habit_id, date")
      .in("habit_id", ids)
      .gte("date", weekAgo);
    for (const row of logRows ?? []) {
      (logsByHabit[row.habit_id] ??= []).push(row.date);
    }
  }

  return (
    <HabitsView
      habits={(habits ?? []) as HabitRow[]}
      logs={logsByHabit}
      today={today}
    />
  );
}
