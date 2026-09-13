"use client";

import { useMemo, useState } from "react";
import HabitFormModal from "@/components/habits/habit-form-modal";
import PageTitle from "@/components/ui/page-title";
import {
  BTN_PRIMARY,
  ERROR_BANNER,
  TEXT_DELETE,
  TEXT_EDIT,
} from "@/components/ui/styles";
import { deleteHabit, toggleTodayLog } from "@/lib/actions/habits";
import { isDueToday } from "@/lib/dates";
import type { ActionResult, HabitLogMap, HabitRow } from "@/lib/types";

const SCHEDULE_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const SCHEDULE_LABELS: Record<string, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function HabitsView({
  habits,
  logs,
  today,
}: {
  habits: HabitRow[];
  logs: HabitLogMap;
  today: string;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<HabitRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const weekDays = useMemo(() => {
    const base = new Date(`${today}T00:00:00`);
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(base);
      day.setDate(base.getDate() - (6 - index));
      return {
        key: toDateKey(day),
        label: day.toLocaleDateString("en-US", { weekday: "narrow" }),
        isToday: index === 6,
      };
    });
  }, [today]);

  async function run(id: string, action: () => Promise<ActionResult>) {
    setBusyId(id);
    setError(null);
    const result = await action();
    setBusyId(null);
    if (result.error) setError(result.error);
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageTitle>Habits</PageTitle>
        <button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className={BTN_PRIMARY}
        >
          Add habit
        </button>
      </div>

      {error && <p className={`${ERROR_BANNER} mt-6`}>{error}</p>}

      <div className="mt-8 space-y-8">
        {habits.length === 0 ? (
          <div className="rounded-container bg-surface p-12 text-center shadow-inset">
            <p className="text-sm font-medium text-ink">No habits yet.</p>
            <p className="mt-1 text-xs text-muted">
              Small daily reps beat cramming. Add your first one.
            </p>
          </div>
        ) : (
          habits.map((habit) => {
            const loggedDates = logs[habit.id] ?? [];
            const loggedToday = loggedDates.includes(today);
            const dueToday = isDueToday(habit.scheduled_days, today);

            return (
              <div
                key={habit.id}
                className={`rounded-container bg-surface p-6 shadow-extruded transition-all duration-300 hover:shadow-extruded-hover ${
                  dueToday ? "" : "opacity-70"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-bold text-ink">{habit.name}</span>
                    {!dueToday && (
                      <span className="ml-2 text-[11px] font-medium italic text-muted">
                        Not scheduled today
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1 text-xs font-semibold">
                    <span className="mr-1 font-bold text-accent">
                      {habit.streak}-day streak
                    </span>
                    {dueToday && (
                      <button
                        onClick={() =>
                          run(habit.id, () =>
                            toggleTodayLog({
                              id: habit.id,
                              currentlyLogged: loggedToday,
                            })
                          )
                        }
                        disabled={busyId === habit.id}
                        className={`min-h-[44px] rounded-btn px-4 font-bold transition-all duration-300 ease-out disabled:opacity-50 ${
                          loggedToday
                            ? "bg-surface text-success shadow-inset-sm"
                            : "bg-accent text-white shadow-extruded-sm hover:bg-accent-light hover:shadow-extruded active:shadow-inset-sm"
                        }`}
                      >
                        {loggedToday ? "Done today" : "Log today"}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setEditing(habit);
                        setModalOpen(true);
                      }}
                      className={TEXT_EDIT}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (!window.confirm(`Delete habit "${habit.name}"?`)) return;
                        run(habit.id, () => deleteHabit(habit.id));
                      }}
                      disabled={busyId === habit.id}
                      className={`${TEXT_DELETE} disabled:opacity-50`}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  {SCHEDULE_ORDER.map((key) => {
                    const scheduled = habit.scheduled_days.includes(key);
                    return (
                      <span
                        key={key}
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                          scheduled
                            ? "text-accent shadow-inset-sm"
                            : "text-muted/50"
                        }`}
                      >
                        {SCHEDULE_LABELS[key]}
                      </span>
                    );
                  })}
                </div>

                <div className="mt-4 flex gap-2">
                  {weekDays.map((day) => {
                    const filled = loggedDates.includes(day.key);
                    return (
                      <span
                        key={day.key}
                        title={day.key}
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-bold ${
                          filled
                            ? "bg-success/20 text-success"
                            : "text-muted/50 shadow-inset-sm"
                        } ${day.isToday ? "ring-1 ring-accent" : ""}`}
                      >
                        {day.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      <HabitFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        habit={editing ?? undefined}
      />
    </div>
  );
}
