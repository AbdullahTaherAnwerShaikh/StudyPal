import { createClient } from "@/lib/supabase-server";
import NotesView from "@/components/notes/notes-view";
import type { NoteListItem } from "@/lib/types";

type RawNote = {
  id: string;
  title: string;
  content: string | null;
  tags: unknown;
  updated_at: string;
  course_id: string | null;
  topic_id: string | null;
  courses: { name: string; color: string }[] | null;
  topics: { name: string }[] | null;
};

export default async function NotesPage() {
  const supabase = await createClient();
  const [notesResult, coursesResult] = await Promise.all([
    supabase
      .from("notes")
      .select(
        "id, title, content, tags, updated_at, course_id, topic_id, courses(name, color), topics(name)"
      )
      .order("updated_at", { ascending: false }),
    supabase.from("courses").select("id, name, color").order("name"),
  ]);

  const notes: NoteListItem[] = ((notesResult.data ?? []) as RawNote[]).map(
    (row) => ({
      id: row.id,
      title: row.title,
      content: row.content ?? "",
      tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
      updated_at: row.updated_at,
      course_id: row.course_id,
      topic_id: row.topic_id,
      course_name: row.courses?.[0]?.name ?? null,
      course_color: row.courses?.[0]?.color ?? null,
      topic_name: row.topics?.[0]?.name ?? null,
    })
  );

  return <NotesView notes={notes} courses={coursesResult.data ?? []} />;
}
