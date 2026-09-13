"use server";

import { revalidatePath } from "next/cache";
import { fail, getContext } from "@/lib/actions/helpers";
import { isValidDayKey, toDateKey } from "@/lib/dates";
import type { ActionResult } from "@/lib/types";

const VALID_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function cleanDays(days: string[]): string[] | null {
  if (!Array.isArray(days) || days.length === 0) return null;
  const unique = [...new Set(days)];
  if (!unique.every((day) => isValidDayKey(day))) return null;
  return VALID_DAYS.filter((day) => unique.includes(day));
}

export async function createHabit(input: {
  name: string;
  scheduled_days: string[];
}): Promise<ActionResult> {
  try {
    const { supabase, userId } = await getContext();
    const scheduledDays = cleanDays(input.scheduled_days);
    if (!scheduledDays) {
      return { error: "Pick at least one day of the week." };
    }
    const { error } = await supabase.from("habits").insert({
      user_id: userId,
      name: input.name.trim(),
      scheduled_days: scheduledDays,
      streak: 0,
    });
    if (error) return { error: error.message };
    revalidatePath("/habits");
    return { error: null };
  } catch (err) {
    return fail(err);
  }
}

export async function updateHabit(input: {
  id: string;
  name: string;
  scheduled_days: string[];
}): Promise<ActionResult> {
  try {
    const { supabase } = await getContext();
    const scheduledDays = cleanDays(input.scheduled_days);
    if (!scheduledDays) {
      return { error: "Pick at least one day of the week." };
    }
    const { error } = await supabase
      .from("habits")
      .update({ name: input.name.trim(), scheduled_days: scheduledDays })
      .eq("id", input.id);
    if (error) return { error: error.message };
    revalidatePath("/habits");
    revalidatePath("/dashboard");
    return { error: null };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteHabit(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await getContext();
    const { error } = await supabase.from("habits").delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/habits");
    return { error: null };
  } catch (err) {
    return fail(err);
  }
}

export async function toggleTodayLog(input: {
  id: string;
  currentlyLogged: boolean;
}): Promise<ActionResult> {
  try {
    const { supabase } = await getContext();
    const today = toDateKey(new Date());

    if (input.currentlyLogged) {
      const { error } = await supabase
        .from("habit_logs")
        .delete()
        .eq("habit_id", input.id)
        .eq("date", today);
      if (error) return { error: error.message };
    } else {
      const { error } = await supabase
        .from("habit_logs")
        .upsert({ habit_id: input.id, date: today, completed: true });
      if (error) return { error: error.message };
    }

    const since = toDateKey(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));
    const { data: recent, error: logsError } = await supabase
      .from("habit_logs")
      .select("date")
      .eq("habit_id", input.id)
      .gte("date", since);
    if (logsError) return { error: logsError.message };

    const loggedDates = new Set((recent ?? []).map((row) => row.date));
    let streak = 0;
    const cursor = new Date(`${today}T00:00:00`);
    while (loggedDates.has(toDateKey(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    const { error: updateError } = await supabase
      .from("habits")
      .update({ streak })
      .eq("id", input.id);
    if (updateError) return { error: updateError.message };

    revalidatePath("/habits");
    revalidatePath("/dashboard");
    return { error: null };
  } catch (err) {
    return fail(err);
  }
}
