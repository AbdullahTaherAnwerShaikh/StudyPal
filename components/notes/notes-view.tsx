"use client";

import { useMemo, useState } from "react";
import NoteFormModal from "@/components/notes/note-form-modal";
import NoteViewModal from "@/components/notes/note-view-modal";
import PageTitle from "@/components/ui/page-title";
import { BTN_PRIMARY, CARD } from "@/components/ui/styles";
import type { CourseOption, NoteListItem } from "@/lib/types";

function excerpt(content: string): string {
  const plain = content.replace(/[#>*`~\[\]()!_-]/g, " ").replace(/\s+/g, " ");
  return plain.length > 140 ? `${plain.slice(0, 140)}...` : plain;
}

function formatUpdated(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function NotesView({
  notes,
  courses,
}: {
  notes: NoteListItem[];
  courses: CourseOption[];
}) {
  const [items, setItems] = useState(notes);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewing, setViewing] = useState<NoteListItem | null>(null);
  const [courseFilter, setCourseFilter] = useState("all");
  const [topicFilter, setTopicFilter] = useState("all");

  const courseFiltered =
    courseFilter === "all"
      ? items
      : items.filter((note) => note.course_id === courseFilter);

  const topicOptions = useMemo(() => {
    const byId = new Map<string, string>();
    for (const note of courseFiltered) {
      if (note.topic_id && note.topic_name) {
        byId.set(note.topic_id, note.topic_name);
      }
    }
    return [...byId.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [courseFiltered]);

  const visible =
    topicFilter === "all"
      ? courseFiltered
      : courseFiltered.filter((note) => note.topic_id === topicFilter);

  function handleNoteChanged(updated: NoteListItem) {
    setItems((prev) =>
      prev.map((note) => (note.id === updated.id ? updated : note))
    );
    setViewing((prev) => (prev && prev.id === updated.id ? updated : prev));
  }

  function handleNoteDeleted(id: string) {
    setItems((prev) => prev.filter((note) => note.id !== id));
    setViewing(null);
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <PageTitle>Notes</PageTitle>
          <p className="mt-3 text-sm text-muted">
            Markdown supported: headings, lists, code, bold, and more.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className={BTN_PRIMARY}
        >
          New note
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <select
          value={courseFilter}
          onChange={(event) => {
            setCourseFilter(event.target.value);
            setTopicFilter("all");
          }}
          aria-label="Filter by course"
          className="min-h-[44px] rounded-btn bg-surface px-4 text-xs font-semibold text-ink shadow-inset outline-none transition-shadow duration-300 focus:shadow-inset-deep"
        >
          <option value="all">All courses</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.name}
            </option>
          ))}
        </select>
        <select
          value={topicFilter}
          onChange={(event) => setTopicFilter(event.target.value)}
          aria-label="Filter by topic"
          disabled={topicOptions.length === 0}
          className="min-h-[44px] rounded-btn bg-surface px-4 text-xs font-semibold text-ink shadow-inset outline-none transition-shadow duration-300 focus:shadow-inset-deep disabled:opacity-40"
        >
          <option value="all">All topics</option>
          {topicOptions.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
        {(courseFilter !== "all" || topicFilter !== "all") && (
          <button
            onClick={() => {
              setCourseFilter("all");
              setTopicFilter("all");
            }}
            className="inline-flex min-h-[44px] items-center px-3 text-xs font-bold text-muted hover:text-ink"
          >
            Clear filters
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="mt-10 rounded-container bg-surface p-12 text-center shadow-inset">
          <p className="text-sm font-medium text-ink">
            {items.length === 0 ? "No notes yet." : "No notes match these filters."}
          </p>
          <p className="mt-1 text-xs text-muted">
            Create your first one and tag it by subject.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((note) => (
            <article
              key={note.id}
              onClick={() => setViewing(note)}
              className={`${CARD} flex cursor-pointer flex-col p-5 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-extruded-hover`}
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="min-w-0 truncate font-bold text-ink">
                  {note.title}
                </h2>
                <span className="shrink-0 text-[11px] font-medium text-muted">
                  {formatUpdated(note.updated_at)}
                </span>
              </div>

              {(note.course_name || note.topic_name) && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {note.course_name && (
                    <span
                      className="rounded-md py-0.5 pl-1.5 pr-2 text-[11px] font-bold text-ink"
                      style={{
                        backgroundColor: `${note.course_color ?? "#7a8781"}33`,
                        boxShadow: `inset 2px 0 0 ${note.course_color ?? "#7a8781"}`,
                      }}
                    >
                      {note.course_name}
                    </span>
                  )}
                  {note.topic_name && (
                    <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold text-ink shadow-inset-sm">
                      {note.topic_name}
                    </span>
                  )}
                </div>
              )}

              {note.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {note.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-muted">
                {excerpt(note.content) || "Empty note."}
              </p>
            </article>
          ))}
        </div>
      )}

      <NoteFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        courses={courses}
      />

      <NoteViewModal
        open={viewing !== null}
        onClose={() => setViewing(null)}
        note={viewing}
        courses={courses}
        onNoteChanged={handleNoteChanged}
        onNoteDeleted={handleNoteDeleted}
      />
    </div>
  );
}