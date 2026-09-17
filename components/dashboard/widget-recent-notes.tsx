import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { isDemoMode } from "@/lib/demo";
import { getDemoRecentNotesWidget } from "@/lib/demo-data";
import WidgetCard from "@/components/dashboard/widget-card";
import WidgetEmpty from "@/components/dashboard/widget-empty";
import { timeAgo } from "@/lib/dashboard";

type RawNote = {
  id: string;
  title: string;
  updated_at: string;
  course_id: string | null;
  topic_id: string | null;
  courses: { name: string; color: string }[] | null;
  topics: { name: string }[] | null;
};

export default async function RecentNotes({ className = "" }: { className?: string }) {
  let notes: {
    id: string;
    title: string;
    updated_at: string;
    course_id: string | null;
    topic_id: string | null;
    course_name: string | null;
    course_color: string | null;
    topic_name: string | null;
  }[];

  if (await isDemoMode()) {
    notes = getDemoRecentNotesWidget();
  } else {
    const supabase = await createClient();

    const { data } = await supabase
      .from("notes")
      .select(
        "id, title, updated_at, course_id, topic_id, courses(name, color), topics(name)"
      )
      .order("updated_at", { ascending: false })
      .limit(4);

    notes = ((data ?? []) as RawNote[]).map((row) => ({
      id: row.id,
      title: row.title,
      updated_at: row.updated_at,
      course_id: row.course_id,
      topic_id: row.topic_id,
      course_name: row.courses?.[0]?.name ?? null,
      course_color: row.courses?.[0]?.color ?? null,
      topic_name: row.topics?.[0]?.name ?? null,
    }));
  }

  return (
    <WidgetCard
      title="Recent Notes"
      href="/notes"
      action={
        <span className="text-xs font-medium text-muted">{notes.length} recent</span>
      }
      className={className}
    >
      {notes.length === 0 ? (
        <WidgetEmpty>
          No notes yet.{" "}
          <Link href="/notes" className="font-bold text-accent hover:text-accent-light">
            Jot your first one
          </Link>
          .
        </WidgetEmpty>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {notes.map((note) => (
            <li key={note.id} className="rounded-inner bg-surface p-3 shadow-inset-sm">
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 truncate text-sm font-medium text-ink">
                  {note.title}
                </p>
                <span className="shrink-0 text-[11px] text-muted">
                  {timeAgo(note.updated_at)}
                </span>
              </div>
              {(note.course_name || note.topic_name) && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {note.course_name && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-2 py-0.5 text-[11px] font-bold text-ink shadow-inset-sm">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: note.course_color ?? "currentColor" }}
                      />
                      {note.course_name}
                    </span>
                  )}
                  {note.topic_name && (
                    <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-bold text-accent shadow-inset-sm">
                      {note.topic_name}
                    </span>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}