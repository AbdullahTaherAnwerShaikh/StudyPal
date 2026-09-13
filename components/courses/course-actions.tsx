"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CourseFormModal from "@/components/courses/course-form-modal";
import { deleteCourse } from "@/lib/actions/courses";
import { BTN_SMALL_GHOST } from "@/components/ui/styles";
import type { CourseRow } from "@/lib/types";

export default function CourseActions({ course }: { course: CourseRow }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!window.confirm(`Delete "${course.name}"? Its exams and topics go too.`))
      return;
    setDeleting(true);
    setError(null);
    const result = await deleteCourse(course.id);
    if (result.error) {
      setError(result.error);
      setDeleting(false);
      return;
    }
    router.push("/courses");
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <button onClick={() => setEditOpen(true)} className={BTN_SMALL_GHOST}>
          Edit
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="inline-flex min-h-[44px] items-center rounded-btn bg-surface px-4 text-xs font-bold text-danger shadow-extruded-sm transition-all duration-300 ease-out hover:shadow-inset-sm active:shadow-inset disabled:opacity-50"
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>
      {error && <p className="max-w-56 text-right text-xs font-semibold text-danger">{error}</p>}
      <CourseFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        course={course}
      />
    </div>
  );
}
