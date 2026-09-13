"use server";

import { revalidatePath } from "next/cache";
import { fail, getContext } from "@/lib/actions/helpers";
import type { ActionResult } from "@/lib/types";

export async function createTask(input: {
  title: string;
  due_date: string | null;
  priority: string;
  related_course_id: string | null;
}): Promise<ActionResult> {
  try {
    const { supabase, userId } = await getContext();
    const { error } = await supabase.from("tasks").insert({
      user_id: userId,
      title: input.title.trim(),
      due_date: input.due_date,
      priority: input.priority,
      status: "todo",
      related_course_id: input.related_course_id,
    });
    if (error) return { error: error.message };
    revalidatePath("/tasks");
    return { error: null };
  } catch (err) {
    return fail(err);
  }
}

export async function updateTask(input: {
  id: string;
  title: string;
  due_date: string | null;
  priority: string;
  related_course_id: string | null;
}): Promise<ActionResult> {
  try {
    const { supabase } = await getContext();
    const { error } = await supabase
      .from("tasks")
      .update({
        title: input.title.trim(),
        due_date: input.due_date,
        priority: input.priority,
        related_course_id: input.related_course_id,
      })
      .eq("id", input.id);
    if (error) return { error: error.message };
    revalidatePath("/tasks");
    return { error: null };
  } catch (err) {
    return fail(err);
  }
}

export async function setTaskStatus(input: {
  id: string;
  status: string;
}): Promise<ActionResult> {
  try {
    const { supabase } = await getContext();
    const { error } = await supabase
      .from("tasks")
      .update({ status: input.status })
      .eq("id", input.id);
    if (error) return { error: error.message };
    revalidatePath("/tasks");
    return { error: null };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteTask(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await getContext();
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/tasks");
    return { error: null };
  } catch (err) {
    return fail(err);
  }
}
