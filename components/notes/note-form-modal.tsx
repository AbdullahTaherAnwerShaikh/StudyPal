"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Modal from "@/components/ui/modal";
import MarkdownTabs from "@/components/notes/markdown-tabs";
import NoteMetaFields from "@/components/notes/note-meta-fields";
import { createNote } from "@/lib/actions/notes";
import {
  BTN_GHOST,
  BTN_PRIMARY,
  ERROR_BANNER,
  FIELD_ERROR,
  INPUT,
  LABEL,
} from "@/components/ui/styles";
import type { CourseOption } from "@/lib/types";

type FormValues = {
  title: string;
  tagsText: string;
  content: string;
  course_id: string;
  topic_id: string;
};

export default function NoteFormModal({
  open,
  onClose,
  courses,
}: {
  open: boolean;
  onClose: () => void;
  courses: CourseOption[];
}) {
  const [error, setError] = useState<string | null>(null);
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
    if (open) {
      reset({
        title: "",
        tagsText: "",
        content: "",
        course_id: "",
        topic_id: "",
      });
      setError(null);
    }
  }, [open, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    const result = await createNote({
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
    onClose();
  });

  return (
    <Modal open={open} onClose={onClose} title="New note" widthClass="max-w-3xl">
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
          {errors.title && <p className={FIELD_ERROR}>{errors.title.message}</p>}
        </div>

        <NoteMetaFields
          courses={courses}
          courseId={courseId}
          topicId={watch("topic_id")}
          tagsText={tagsText}
          onCourseChange={(value) => setValue("course_id", value)}
          onTopicChange={(value) => setValue("topic_id", value)}
          onTagsChange={(value) => setValue("tagsText", value)}
        />

        <MarkdownTabs
          value={content}
          onChange={(value) => setValue("content", value)}
        />

        {error && <p className={ERROR_BANNER}>{error}</p>}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <button type="button" onClick={onClose} className={BTN_GHOST}>
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className={BTN_PRIMARY}>
            {isSubmitting ? "Saving..." : "Create note"}
          </button>
        </div>
      </form>
    </Modal>
  );
}