"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import ReactMarkdown from "react-markdown";
import Modal from "@/components/ui/modal";
import MarkdownTabs from "@/components/notes/markdown-tabs";
import NoteMetaFields from "@/components/notes/note-meta-fields";
import { deleteNote, updateNote } from "@/lib/actions/notes";
import {
  BTN_GHOST,
  BTN_PRIMARY,
  ERROR_BANNER,
  FIELD_ERROR,
  INPUT,
  LABEL,
  TEXT_DELETE,
} from "@/components/ui/styles";
import type { ActionResult, CourseOption, NoteListItem } from "@/lib/types";

type FormValues = {
  title: string;
  tagsText: string;
  content: string;
  course_id: string;
  topic_id: string;
};

function toTags(tagsText: string): string[] {
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

function formatUpdated(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function NoteViewModal({
  open,
  onClose,
  note,
  courses,
  onNoteChanged,
  onNoteDeleted,
}: {
  open: boolean;
  onClose: () => void;
  note: NoteListItem | null;
  courses: CourseOption[];
  onNoteChanged?: (note: NoteListItem) => void;
  onNoteDeleted?: (id: string) => void;
}) {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [current, setCurrent] = useState<NoteListItem | null>(note);
  const [error, setError] = useState<string | null>(null);
  const [topics, setTopics] = useState<{ id: string; name: string }[]>([]);
  const [deleting, setDeleting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  const courseId = watch("course_id");
  const content = watch("content");
  const tagsText = watch("tagsText");

  useEffect(() => {
    if (open && note) {
      setCurrent(note);
      setMode("view");
      setError(null);
      reset({
        title: note.title,
        content: note.content,
        tagsText: note.tags.join(", "),
        course_id: note.course_id ?? "",
        topic_id: note.topic_id ?? "",
      });
    }
  }, [open, note, reset]);

  const handleTopicsLoaded = useCallback(
    (loaded: { id: string; name: string }[]) => setTopics(loaded),
    []
  );

  function switchToEdit() {
    setError(null);
    setMode("edit");
  }

  function cancelEdit() {
    setError(null);
    setMode("view");
    if (current) {
      reset({
        title: current.title,
        content: current.content,
        tagsText: current.tags.join(", "),
        course_id: current.course_id ?? "",
        topic_id: current.topic_id ?? "",
      });
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    if (!current) return;
    setError(null);
    const result = await updateNote({
      id: current.id,
      title: values.title,
      content: values.content,
      tagsText: values.tagsText,
      course_id: values.course_id === "" ? null : values.course_id,
      topic_id:
        values.course_id === "" || values.topic_id === ""
          ? null
          : values.topic_id,
    });
    if (result.error) {
      setError(result.error);
      return;
    }
    const course = courses.find((c) => c.id === values.course_id) ?? null;
    const topic = course
      ? (topics.find((t) => t.id === values.topic_id) ?? null)
      : null;
    const next: NoteListItem = {
      ...current,
      title: values.title.trim(),
      content: values.content,
      tags: toTags(values.tagsText),
      updated_at: new Date().toISOString(),
      course_id: course?.id ?? null,
      topic_id: topic?.id ?? null,
      course_name: course?.name ?? null,
      course_color: course?.color ?? null,
      topic_name: topic?.name ?? null,
    };
    setCurrent(next);
    if (onNoteChanged) onNoteChanged(next);
    setMode("view");
  });

  async function handleDelete() {
    if (!current) return;
    if (!window.confirm(`Delete note "${current.title}"?`)) return;
    setDeleting(true);
    setError(null);
    const result: ActionResult = await deleteNote(current.id);
    setDeleting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (onNoteDeleted) onNoteDeleted(current.id);
    onClose();
  }

  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "edit" ? "Edit note" : current?.title ?? "Note"}
      widthClass="max-w-3xl"
    >
      {mode === "edit" ? (
        <form
          onSubmit={onSubmit}
          className="max-h-[70vh] space-y-5 overflow-y-auto overscroll-contain pr-1"
        >
          <div>
            <label className={LABEL}>Title</label>
            <input
              {...register("title", { required: "Title is required" })}
              placeholder="e.g. Integrals — cheat sheet"
              className={INPUT}
            />
            {errors.title && (
              <p className={FIELD_ERROR}>{errors.title.message}</p>
            )}
          </div>

          <NoteMetaFields
            courses={courses}
            courseId={courseId}
            topicId={watch("topic_id")}
            tagsText={tagsText}
            onCourseChange={(value) => setValue("course_id", value)}
            onTopicChange={(value) => setValue("topic_id", value)}
            onTagsChange={(value) => setValue("tagsText", value)}
            onTopicsLoaded={handleTopicsLoaded}
          />

          <MarkdownTabs
            value={content}
            onChange={(value) => setValue("content", value)}
          />

          {error && <p className={ERROR_BANNER}>{error}</p>}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <button type="button" onClick={cancelEdit} className={BTN_GHOST}>
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className={BTN_PRIMARY}>
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      ) : current ? (
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-ink/10 pb-4">
            {current.course_name && (
              <span
                className="rounded-md py-0.5 pl-1.5 pr-2 text-[11px] font-bold text-ink"
                style={{
                  backgroundColor: `${current.course_color ?? "#7a8781"}33`,
                  boxShadow: `inset 2px 0 0 ${current.course_color ?? "#7a8781"}`,
                }}
              >
                {current.course_name}
              </span>
            )}
            {current.topic_name && (
              <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold text-ink shadow-inset-sm">
                {current.topic_name}
              </span>
            )}
            <span className="ml-auto shrink-0 text-[11px] font-medium text-muted">
              Updated {formatUpdated(current.updated_at)}
            </span>
          </div>

          <div className="max-h-[60vh] overflow-y-auto overscroll-contain pr-1">
            {current.content.trim() ? (
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{current.content}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-sm font-medium text-muted">Empty note.</p>
            )}
          </div>

          {error && (
            <p className={`${ERROR_BANNER} mt-4`}>{error}</p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-ink/10 pt-4">
            <button type="button" onClick={switchToEdit} className={BTN_PRIMARY}>
              Edit
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className={`${TEXT_DELETE} disabled:opacity-50`}
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}