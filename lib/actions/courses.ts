"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";
import type { ActionResult } from "@/lib/types";

function fail(err: unknown): ActionResult {
  return {
    error: err instanceof Error ? err.message : "Something went wrong.",
  };
}

async function getContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");
  return { supabase, userId: user.id };
}

function refreshCourse(id: string) {
  revalidatePath("/courses");
  revalidatePath(`/courses/${id}`);
}

export async function createCourse(input: {
  name: string;
  color: string;
  credits: number | null;
}): Promise<ActionResult> {
  try {
    const { supabase, userId } = await getContext();
    const { error } = await supabase.from("courses").insert({
      user_id: userId,
      name: input.name.trim(),
      color: input.color,
      credits: input.credits,
    });
    if (error) return { error: error.message };
    revalidatePath("/courses");
    return { error: null };
  } catch (err) {
    return fail(err);
  }
}

export async function createCourseFromSyllabus(input: {
  name: string;
  color: string;
  credits: number | null;
  topics: { name: string; estimated_hours: number }[];
  exams: { name: string; date: string }[];
}): Promise<ActionResult> {
  try {
    const { supabase, userId } = await getContext();
    const name = input.name.trim();
    if (!name) return { error: "Course name is required." };

    const { data: course, error } = await supabase
      .from("courses")
      .insert({
        user_id: userId,
        name,
        color: input.color,
        credits: input.credits,
      })
      .select("id")
      .single();
    if (error || !course) {
      return { error: error?.message ?? "Couldn't create the course." };
    }

    const failures: string[] = [];
    for (const topic of input.topics) {
      if (!topic.name.trim()) continue;
      const { error: topicError } = await supabase.from("topics").insert({
        course_id: course.id,
        name: topic.name.trim(),
        estimated_hours: Math.max(0, Math.round(topic.estimated_hours || 0)),
        done_hours: 0,
      });
      if (topicError) failures.push(`Topic "${topic.name}": ${topicError.message}`);
    }

    for (const exam of input.exams) {
      if (!exam.name.trim() || !exam.date) continue;
      const { error: examError } = await supabase.from("exams").insert({
        course_id: course.id,
        name: exam.name.trim(),
        date: exam.date,
        type: "exam",
      });
      if (examError) failures.push(`Exam "${exam.name}": ${examError.message}`);
    }

    revalidatePath("/courses");
    revalidatePath(`/courses/${course.id}`);

    if (failures.length > 0) {
      return {
        error: `Course created, but some items failed to save: ${failures.join("; ")}`,
      };
    }
    return { error: null };
  } catch (err) {
    return fail(err);
  }
}

export async function updateCourse(
  id: string,
  input: { name?: string; color?: string; credits?: number | null }
): Promise<ActionResult> {
  try {
    const { supabase } = await getContext();
    const patch: Record<string, unknown> = {};
    if (input.name !== undefined) patch.name = input.name.trim();
    if (input.color !== undefined) patch.color = input.color;
    if (input.credits !== undefined) patch.credits = input.credits;
    const { error } = await supabase.from("courses").update(patch).eq("id", id);
    if (error) return { error: error.message };
    refreshCourse(id);
    return { error: null };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteCourse(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await getContext();

    const { data: topics, error: topicsError } = await supabase
      .from("topics")
      .select("id")
      .eq("course_id", id);
    if (topicsError) return { error: topicsError.message };

    const topicIds = topics?.map((topic) => topic.id) ?? [];
    const orFilter = [
      `course_id.eq.${id}`,
      ...topicIds.map((topicId) => `topic_id.eq.${topicId}`),
    ].join(",");

    const { error: notesError } = await supabase
      .from("notes")
      .delete()
      .or(orFilter);
    if (notesError) return { error: notesError.message };

    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/courses");
    return { error: null };
  } catch (err) {
    return fail(err);
  }
}

export async function createExam(input: {
  course_id: string;
  name: string;
  date: string;
  type: string;
}): Promise<ActionResult> {
  try {
    const { supabase } = await getContext();
    const { error } = await supabase.from("exams").insert({
      course_id: input.course_id,
      name: input.name.trim(),
      date: input.date,
      type: input.type,
    });
    if (error) return { error: error.message };
    refreshCourse(input.course_id);
    return { error: null };
  } catch (err) {
    return fail(err);
  }
}

export async function updateExam(input: {
  id: string;
  course_id: string;
  name: string;
  date: string;
  type: string;
}): Promise<ActionResult> {
  try {
    const { supabase } = await getContext();
    const { error } = await supabase
      .from("exams")
      .update({
        name: input.name.trim(),
        date: input.date,
        type: input.type,
      })
      .eq("id", input.id);
    if (error) return { error: error.message };
    refreshCourse(input.course_id);
    return { error: null };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteExam(input: {
  id: string;
  course_id: string;
}): Promise<ActionResult> {
  try {
    const { supabase } = await getContext();
    const { error } = await supabase.from("exams").delete().eq("id", input.id);
    if (error) return { error: error.message };
    refreshCourse(input.course_id);
    return { error: null };
  } catch (err) {
    return fail(err);
  }
}

export async function createTopic(input: {
  course_id: string;
  name: string;
  estimated_hours: number;
}): Promise<ActionResult> {
  try {
    const { supabase } = await getContext();
    const { error } = await supabase.from("topics").insert({
      course_id: input.course_id,
      name: input.name.trim(),
      estimated_hours: input.estimated_hours,
      done_hours: 0,
    });
    if (error) return { error: error.message };
    refreshCourse(input.course_id);
    return { error: null };
  } catch (err) {
    return fail(err);
  }
}

export async function updateTopic(input: {
  id: string;
  course_id: string;
  name?: string;
  estimated_hours?: number;
  done_hours?: number;
  is_completed?: boolean;
}): Promise<ActionResult> {
  try {
    const { supabase } = await getContext();
    const patch: Record<string, unknown> = {};
    if (input.name !== undefined) patch.name = input.name.trim();
    if (input.estimated_hours !== undefined)
      patch.estimated_hours = input.estimated_hours;
    if (input.done_hours !== undefined) patch.done_hours = input.done_hours;
    if (input.is_completed !== undefined)
      patch.is_completed = input.is_completed;
    const { error } = await supabase
      .from("topics")
      .update(patch)
      .eq("id", input.id);
    if (error) return { error: error.message };
    refreshCourse(input.course_id);
    return { error: null };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteTopic(input: {
  id: string;
  course_id: string;
}): Promise<ActionResult> {
  try {
    const { supabase } = await getContext();
    const { error } = await supabase.from("topics").delete().eq("id", input.id);
    if (error) return { error: error.message };
    refreshCourse(input.course_id);
    return { error: null };
  } catch (err) {
    return fail(err);
  }
}
