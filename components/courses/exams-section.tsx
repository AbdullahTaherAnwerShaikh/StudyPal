"use client";

import { useState } from "react";
import WidgetCard from "@/components/dashboard/widget-card";
import ExamFormModal from "@/components/courses/exam-form-modal";
import { deleteExam } from "@/lib/actions/courses";
import {
  BTN_SMALL_PRIMARY,
  ERROR_BANNER,
  TEXT_DELETE,
  TEXT_EDIT,
} from "@/components/ui/styles";
import type { ActionResult, ExamRow } from "@/lib/types";

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function ExamsSection({
  courseId,
  exams,
}: {
  courseId: string;
  exams: ExamRow[];
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ExamRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(exam: ExamRow) {
    if (!window.confirm(`Delete exam "${exam.name}"?`)) return;
    setBusyId(exam.id);
    setError(null);
    const result: ActionResult = await deleteExam({
      id: exam.id,
      course_id: courseId,
    });
    setBusyId(null);
    if (result.error) setError(result.error);
  }

  return (
    <WidgetCard
      title={`Exams (${exams.length})`}
      action={
        <button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className={BTN_SMALL_PRIMARY}
        >
          + Add exam
        </button>
      }
    >
      {error && <p className={`${ERROR_BANNER} mb-3`}>{error}</p>}

      {exams.length === 0 ? (
        <p className="text-sm font-medium text-muted">
          No exams yet. Add your first one to start planning backwards from it.
        </p>
      ) : (
        <ul className="space-y-3">
          {exams.map((exam) => (
            <li
              key={exam.id}
              className="flex items-center gap-3 rounded-btn bg-surface px-4 py-2 shadow-inset-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{exam.name}</p>
                <span className="mt-0.5 inline-block text-[11px] font-semibold capitalize text-muted">
                  {exam.type}
                </span>
              </div>
              <span className="shrink-0 text-xs tabular-nums text-muted">
                {formatDate(exam.date)}
              </span>
              <div className="flex shrink-0">
                <button
                  onClick={() => {
                    setEditing(exam);
                    setModalOpen(true);
                  }}
                  className={TEXT_EDIT}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(exam)}
                  disabled={busyId === exam.id}
                  className={`${TEXT_DELETE} disabled:opacity-50`}
                >
                  {busyId === exam.id ? "..." : "Delete"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ExamFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        courseId={courseId}
        exam={editing ?? undefined}
      />
    </WidgetCard>
  );
}
