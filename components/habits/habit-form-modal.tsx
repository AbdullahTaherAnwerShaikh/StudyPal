"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Modal from "@/components/ui/modal";
import { createHabit, updateHabit } from "@/lib/actions/habits";
import {
  BTN_SUBMIT,
  ERROR_BANNER,
  FIELD_ERROR,
  INPUT,
  LABEL,
} from "@/components/ui/styles";

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
const WEEKDAY_DEFAULT = ["mon", "tue", "wed", "thu", "fri"];

type FormValues = {
  name: string;
  scheduled_days: string[];
};

export default function HabitFormModal({
  open,
  onClose,
  habit,
}: {
  open: boolean;
  onClose: () => void;
  habit?: { id: string; name: string; scheduled_days: string[] };
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

  useEffect(() => {
    if (open) {
      reset({
        name: habit?.name ?? "",
        scheduled_days:
          habit?.scheduled_days && habit.scheduled_days.length > 0
            ? [...habit.scheduled_days]
            : [...WEEKDAY_DEFAULT],
      });
      setError(null);
    }
  }, [open, habit, reset]);

  const selectedDays = watch("scheduled_days") ?? [];

  function toggleDay(key: string) {
    const next = selectedDays.includes(key)
      ? selectedDays.filter((day) => day !== key)
      : DAY_KEYS.filter((day) => selectedDays.includes(day) || day === key);
    setValue("scheduled_days", next);
  }

  const onSubmit = handleSubmit(async (values) => {
    if (selectedDays.length === 0) {
      setError("Pick at least one day of the week.");
      return;
    }
    setError(null);
    const payload = { name: values.name, scheduled_days: selectedDays };
    const result = habit
      ? await updateHabit({ id: habit.id, ...payload })
      : await createHabit(payload);
    if (result.error) {
      setError(result.error);
      return;
    }
    onClose();
  });

  return (
    <Modal open={open} onClose={onClose} title={habit ? "Edit habit" : "Add habit"}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className={LABEL}>Name</label>
          <input
            {...register("name", { required: "Name is required" })}
            placeholder="e.g. Morning review"
            className={INPUT}
          />
          {errors.name && <p className={FIELD_ERROR}>{errors.name.message}</p>}
        </div>

        <div>
          <label className={LABEL}>Scheduled days</label>
          <div className="flex gap-1.5">
            {DAY_KEYS.map((key, index) => {
              const active = selectedDays.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleDay(key)}
                  aria-label={key}
                  aria-pressed={active}
                  className={`h-9 flex-1 rounded-lg text-xs font-bold transition-colors ${
                    active
                      ? "bg-moss text-white"
                      : "bg-ink/5 text-ink/45 hover:bg-ink/10 hover:text-ink"
                  }`}
                >
                  {DAY_LABELS[index]}
                </button>
              );
            })}
          </div>
        </div>

        {error && <p className={ERROR_BANNER}>{error}</p>}

        <button type="submit" disabled={isSubmitting} className={BTN_SUBMIT}>
          {isSubmitting ? "Saving..." : habit ? "Save changes" : "Add habit"}
        </button>
      </form>
    </Modal>
  );
}
