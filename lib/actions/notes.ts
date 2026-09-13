"use server";

import { revalidatePath } from "next/cache";
import { fail, getContext } from "@/lib/actions/helpers";
import type { ActionResult } from "@/lib/types";

function cleanTags(tagsText: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const raw of tagsText.split(",")) {
    const tag = raw.trim();
    if (tag && !seen.has(tag.toLowerCase())) {
      seen.add(tag.toLowerCase());
      tags.push(tag);
    }
  }
  return tags.slice(0, 8);
}

export async function createNote(input: {
  title: string;
  content: string;
  tagsText: string;
  course_id: string | null;
  topic_id: string | null;
}): Promise<ActionResult> {
  try {
    const { supabase, userId } = await getContext();
    const { error } = await supabase.from("notes").insert({
      user_id: userId,
      title: input.title.trim(),
      content: input.content,
      tags: cleanTags(input.tagsText),
      course_id: input.course_id,
      topic_id: input.topic_id,
    });
    if (error) return { error: error.message };
    revalidatePath("/notes");
    return { error: null };
  } catch (err) {
    return fail(err);
  }
}

export async function updateNote(input: {
  id: string;
  title: string;
  content: string;
  tagsText: string;
  course_id: string | null;
  topic_id: string | null;
}): Promise<ActionResult> {
  try {
    const { supabase } = await getContext();
    const { error } = await supabase
      .from("notes")
      .update({
        title: input.title.trim(),
        content: input.content,
        tags: cleanTags(input.tagsText),
        course_id: input.course_id,
        topic_id: input.topic_id,
      })
      .eq("id", input.id);
    if (error) return { error: error.message };
    revalidatePath("/notes");
    return { error: null };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteNote(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await getContext();
    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/notes");
    return { error: null };
  } catch (err) {
    return fail(err);
  }
}
