"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleTodayLog } from "@/lib/actions/habits";
import type { HabitRow } from "@/lib/types";

const SCHEDULE_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const SCHEDULE_LABELS: Record<string, string> = {
  mon: "M",
  tue: "T",
  wed: "W",
  thu: "T",
  fri: "F",
  sat: "S",
  sun: "S",
};
const DAY_NAMES = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export default function WidgetHabitRow({
  habit,
  loggedToday,
  dueTodayRow,
  chip,
  demo,
  today,
}: {
  habit: HabitRow;
  loggedToday: boolean;
  dueTodayRow: boolean;
  chip: string;
  demo: boolean;
  today: string;
}) {
  const [logged, setLogged] = useState(loggedToday);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const todayKey = DAY_NAMES[new Date(`${today}T00:00:00`).getDay()];

  function handleLog() {
    if (demo) {
      setLogged((value) => !value);
      return;
    }

    const next = !logged;
    setLogged(next);
    startTransition(async () => {
      const result = await toggleTodayLog({
        id: habit.id,
        currentlyLogged: !next,
      });
      if (result.error) {
        setLogged(!next);
        return;
      }
      router.refresh();
    });
  }

  return (
    <li>
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="min-w-0 truncate text-ink">{habit.name}</span>
        {dueTodayRow ? (
          <button
            type="button"
            onClick={handleLog}
            disabled={pending}
            aria-label={`${logged ? "Unlog" : "Log"} ${habit.name} for today`}
            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold transition-all duration-300 disabled:opacity-60 ${
              logged
                ? "bg-success/15 text-success"
                : "bg-accent text-white shadow-extruded-sm hover:bg-accent-light active:shadow-inset-sm"
            }`}
          >
            {logged ? "Done today" : "Log today"}
          </button>
        ) : (
          <span className="shrink-0 rounded-full bg-surface px-2.5 py-1 text-[11px] font-bold text-accent shadow-inset-sm">
            {chip}
          </span>
        )}
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-3">
        <div className="flex gap-1.5">
          {SCHEDULE_ORDER.map((key) => {
            const scheduled = habit.scheduled_days.includes(key);
            const isToday = key === todayKey;
            const complete = isToday && logged;
            return (
              <span
                key={key}
                title={
                  isToday
                    ? complete
                      ? "Completed today"
                      : "Today"
                    : scheduled
                      ? key
                      : undefined
                }
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] transition-colors ${
                  complete
                    ? "bg-success/20 font-bold text-success shadow-inset-sm ring-1 ring-success/50"
                    : isToday
                      ? "font-bold text-accent shadow-inset-sm ring-1 ring-accent/60"
                      : scheduled
                        ? "font-bold text-accent shadow-inset-sm"
                        : "text-muted/50"
                }`}
              >
                {complete ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="h-3 w-3">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  SCHEDULE_LABELS[key]
                )}
              </span>
            );
          })}
        </div>
        <span className="shrink-0 text-xs font-bold text-accent">
          {habit.streak}-day streak
        </span>
      </div>
    </li>
  );
}