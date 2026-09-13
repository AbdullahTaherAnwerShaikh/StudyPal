"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Modal from "@/components/ui/modal";
import { createExam, updateExam } from "@/lib/actions/courses";
import {
  BTN_SUBMIT,
  ERROR_BANNER,
  FIELD_ERROR,
  INPUT,
  LABEL,
} from "@/components/ui/styles";

const EXAM_TYPES = ["exam", "midterm", "final", "quiz", "project", "other"];

type FormValues = {
  name: string;
  date: string;
  type: string;
};

export default function ExamFormModal({
  open,
  onClose,
  courseId,
  exam,
}: {
  open: boolean;
  onClose: () => void;
  courseId: string;
  exam?: { id: string; name: string; date: string; type: string };
}) {
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  useEffect(() => {
    if (open) {
      reset({
        name: exam?.name ?? "",
        date: exam?.date ?? "",
        type: exam?.type ?? "exam",
      });
      setError(null);
    }
  }, [open, exam, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    const payload = {
      course_id: courseId,
      name: values.name,
      date: values.date,
      type: values.type,
    };
    const result = exam
      ? await updateExam({ id: exam.id, ...payload })
      : await createExam(payload);
    if (result.error) {
      setError(result.error);
      return;
    }
    onClose();
  });

  return (
    <Modal open={open} onClose={onClose} title={exam ? "Edit exam" : "Add exam"}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className={LABEL}>Name</label>
          <input
            {...register("name", { required: "Name is required" })}
            placeholder="e.g. Midterm 1"
            className={INPUT}
          />
          {errors.name && <p className={FIELD_ERROR}>{errors.name.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL}>Date</label>
            <input
              {...register("date", { required: "Date is required" })}
              type="date"
              className={INPUT}
            />
            {errors.date && <p className={FIELD_ERROR}>{errors.date.message}</p>}
          </div>
          <div>
            <label className={LABEL}>Type</label>
            <select {...register("type")} className={INPUT}>
              {EXAM_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type[0].toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && <p className={ERROR_BANNER}>{error}</p>}

        <button type="submit" disabled={isSubmitting} className={BTN_SUBMIT}>
          {isSubmitting ? "Saving..." : exam ? "Save changes" : "Add exam"}
        </button>
      </form>
    </Modal>
  );
}
