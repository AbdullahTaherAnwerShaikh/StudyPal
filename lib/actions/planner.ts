"use server";

import { revalidatePath } from "next/cache";
import { fail, getContext } from "@/lib/actions/helpers";
import type { PlanDay } from "@/lib/planner/types";
import type { ActionResult } from "@/lib/types";

export async function savePlanEdit(input: {
  planId: string;
  days: PlanDay[];
  completedDays: string[];
}): Promise<ActionResult> {
  try {
    const { supabase } = await getContext();
    const { error } = await supabase
      .from("study_plans")
      .update({
        days: input.days,
        completed_days: input.completedDays,
      })
      .eq("id", input.planId);
    if (error) return { error: error.message };
    revalidatePath("/planner");
    return { error: null };
  } catch (err) {
    return fail(err);
  }
}