"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Modal from "@/components/ui/modal";
import DatePicker from "@/components/ui/date-picker";
import { createTask, updateTask } from "@/lib/actions/tasks";
import {
  BTN_SUBMIT,
  ERROR_BANNER,
  FIELD_ERROR,
  INPUT,
  LABEL,
} from "@/components/ui/styles";
import type { TaskRow } from "@/lib/types";

type FormValues = {
  title: string;
  due_date: string;
  priority: string;
  related_course_id: string;
};

export default function TaskFormModal({
  open,
  onClose,
  courses,
  task,
}: {
  open: boolean;
  onClose: () => void;
  courses: { id: string; name: string; color: string }[];
  task?: TaskRow;
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

  const dueDate = watch("due_date");

  useEffect(() => {
    if (open) {
      reset({
        title: task?.title ?? "",
        due_date: task?.due_date ?? "",
        priority: task?.priority ?? "medium",
        related_course_id: task?.related_course_id ?? "",
      });
      setError(null);
    }
  }, [open, task, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    const payload = {
      title: values.title,
      due_date: values.due_date === "" ? null : values.due_date,
      priority: values.priority,
      related_course_id:
        values.related_course_id === "" ? null : values.related_course_id,
    };
    const result = task
      ? await updateTask({ id: task.id, ...payload })
      : await createTask(payload);
    if (result.error) {
      setError(result.error);
      return;
    }
    onClose();
  });

  return (
    <Modal open={open} onClose={onClose} title={task ? "Edit task" : "Add task"}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className={LABEL}>Title</label>
          <input
            {...register("title", { required: "Title is required" })}
            placeholder="e.g. Finish problem set 7"
            className={INPUT}
          />
          {errors.title && <p className={FIELD_ERROR}>{errors.title.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL}>Due date</label>
            <DatePicker
              value={dueDate ?? ""}
              onChange={(next) => setValue("due_date", next)}
              placeholder="No due date"
            />
          </div>
          <div>
            <label className={LABEL}>Priority</label>
            <select {...register("priority")} className={INPUT}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div>
          <label className={LABEL}>Course (optional)</label>
          <select {...register("related_course_id")} className={INPUT}>
            <option value="">No course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </div>

        {error && <p className={ERROR_BANNER}>{error}</p>}

        <button type="submit" disabled={isSubmitting} className={BTN_SUBMIT}>
          {isSubmitting ? "Saving..." : task ? "Save changes" : "Add task"}
        </button>
      </form>
    </Modal>
  );
}
