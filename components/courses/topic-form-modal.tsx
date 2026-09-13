"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Modal from "@/components/ui/modal";
import { createTopic, updateTopic } from "@/lib/actions/courses";
import {
  BTN_SUBMIT,
  ERROR_BANNER,
  FIELD_ERROR,
  INPUT,
  LABEL,
} from "@/components/ui/styles";

type FormValues = {
  name: string;
  estimated_hours: number;
  done_hours: number;
};

export default function TopicFormModal({
  open,
  onClose,
  courseId,
  topic,
}: {
  open: boolean;
  onClose: () => void;
  courseId: string;
  topic?: {
    id: string;
    name: string;
    estimated_hours: number;
    done_hours: number;
    is_completed: boolean;
  };
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
        name: topic?.name ?? "",
        estimated_hours: topic?.estimated_hours ?? 2,
        done_hours: topic?.done_hours ?? 0,
      });
      setError(null);
    }
  }, [open, topic, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    const estimated = Number.isFinite(values.estimated_hours)
      ? values.estimated_hours
      : 0;
    if (topic) {
      const result = await updateTopic({
        id: topic.id,
        course_id: courseId,
        name: values.name,
        estimated_hours: estimated,
        done_hours: Number.isFinite(values.done_hours) ? values.done_hours : 0,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
    } else {
      const result = await createTopic({
        course_id: courseId,
        name: values.name,
        estimated_hours: estimated,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
    }
    onClose();
  });

  return (
    <Modal open={open} onClose={onClose} title={topic ? "Edit topic" : "Add topic"}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className={LABEL}>Name</label>
          <input
            {...register("name", { required: "Name is required" })}
            placeholder="e.g. Integrals by parts"
            className={INPUT}
          />
          {errors.name && <p className={FIELD_ERROR}>{errors.name.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL}>Estimated hours</label>
            <input
              {...register("estimated_hours", { valueAsNumber: true })}
              type="number"
              min={0}
              max={999}
              step={0.5}
              className={INPUT}
            />
          </div>
          {topic && (
            <div>
              <label className={LABEL}>Done hours</label>
              <input
                {...register("done_hours", { valueAsNumber: true })}
                type="number"
                min={0}
                max={999}
                step={0.5}
                className={INPUT}
              />
            </div>
          )}
        </div>

        {error && <p className={ERROR_BANNER}>{error}</p>}

        <button type="submit" disabled={isSubmitting} className={BTN_SUBMIT}>
          {isSubmitting ? "Saving..." : topic ? "Save changes" : "Add topic"}
        </button>
      </form>
    </Modal>
  );
}
