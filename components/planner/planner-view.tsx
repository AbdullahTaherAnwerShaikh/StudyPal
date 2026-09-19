"use client";

import { useState } from "react";
import Link from "next/link";
import DatePicker from "@/components/ui/date-picker";
import PageTitle from "@/components/ui/page-title";
import PlanCalendar from "@/components/planner/plan-calendar";
import {
  BTN_PRIMARY,
  BTN_SMALL_GHOST,
  CARD,
  ERROR_BANNER,
  INFO_BANNER,
  INPUT,
  LABEL,
  SEGMENT_ACTIVE,
  SEGMENT_IDLE,
  SEGMENT_TRACK,
  TEXT_EDIT,
} from "@/components/ui/styles";
import { toDateKey } from "@/lib/dates";
import { isWeekend, parseDay } from "@/lib/planner/dates";
import type {
  PlanItem,
  PlannerCourse,
  PlannerExam,
  PlannerResult,
  SavedPlanRow,
} from "@/lib/planner/types";
import { savePlanEdit } from "@/lib/actions/planner";

const TYPE_LABEL: Record<PlanItem["type"], string> = {
  study: "Study",
  review: "Review",
  break: "Break",
};

const TYPE_DOT: Record<PlanItem["type"], string> = {
  study: "bg-accent",
  review: "bg-warn",
  break: "bg-ink/25",
};

function formatDay(dateKey: string): string {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function PlannerView({
  courses,
  exams,
  latest,
  demo = false,
}: {
  courses: PlannerCourse[];
  exams: PlannerExam[];
  latest: SavedPlanRow | null;
  demo?: boolean;
}) {
  const initialParams = latest?.params;
  const [startDate, setStartDate] = useState(initialParams?.startDate ?? "");
  const [endDate, setEndDate] = useState(initialParams?.endDate ?? "");
  const [weekdayHours, setWeekdayHours] = useState(
    String(initialParams?.availability.weekdayHours ?? 2)
  );
  const [weekendHours, setWeekendHours] = useState(
    String(initialParams?.availability.weekendHours ?? 4)
  );
  const [blackouts, setBlackouts] = useState<string[]>(
    (initialParams?.blackoutDates ?? []) as string[]
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [result, setResult] = useState<PlannerResult | null>(
    latest
      ? {
          planId: latest.id,
          days: latest.days,
          warnings: latest.warnings,
          model: latest.model,
        }
      : null
  );
  const [completed, setCompleted] = useState<string[]>(latest?.completed_days ?? []);
  const [tab, setTab] = useState<"generate" | "view">(
    latest && latest.days.length > 0 ? "view" : "generate"
  );
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [moveKey, setMoveKey] = useState<string | null>(null);
  const [moveTarget, setMoveTarget] = useState<string>("");

  const topicCount = courses.reduce((sum, course) => sum + course.topics.length, 0);

  async function persist(
    planId: string | null,
    days: PlannerResult["days"],
    completedDays: string[]
  ) {
    if (!planId || demo) return;
    setSaving(true);
    setSaveError(null);
    const res = await savePlanEdit({ planId, days, completedDays });
    if (res.error) setSaveError(res.error);
    setSaving(false);
  }

  async function handleGenerate() {
    const weekday = Number(weekdayHours);
    const weekend = Number(weekendHours);
    const blackoutDates = [...new Set(blackouts.filter(Boolean))].sort();

    if (courses.length === 0) {
      setError("Add at least one course with topics before generating a plan.");
      return;
    }
    if (!startDate || !endDate) {
      setError("Choose a start and end date.");
      return;
    }
    if (parseDay(endDate).getTime() < parseDay(startDate).getTime()) {
      setError("The end date must be on or after the start date.");
      return;
    }
    if (
      !Number.isFinite(weekday) ||
      weekday < 0 ||
      weekday > 24 ||
      !Number.isFinite(weekend) ||
      weekend < 0 ||
      weekend > 24
    ) {
      setError("Availability hours must be between 0 and 24.");
      return;
    }
    if (weekday + weekend === 0) {
      setError("Set at least a little study time on weekdays or weekends.");
      return;
    }

    setError(null);
    setLoading(true);
    setSaveError(null);
    setMoveKey(null);

    try {
      const res = await fetch("/api/planner/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courses,
          exams,
          availability: { weekdayHours: weekday, weekendHours: weekend },
          startDate,
          endDate,
          blackoutDates,
        }),
      });
      const data = (await res.json().catch(() => null)) as PlannerResult | null;

      if (!res.ok) {
        const message =
          data && "error" in data ? String((data as { error: string }).error) : "";
        setError(message || `Request failed (HTTP ${res.status}).`);
        return;
      }
      if (!data) {
        setError("The server returned an empty response.");
        return;
      }

      setResult({
        planId: data.planId ?? null,
        days: data.days,
        warnings: data.warnings ?? [],
        model: data.model,
      });
      setCompleted([]);
      setSelectedDateKey(null);
      setTab("view");
    } catch {
      setError("Couldn't reach the server. Is the dev server running?");
    } finally {
      setLoading(false);
    }
  }

  function toggleDay(date: string) {
    const next = completed.includes(date)
      ? completed.filter((d) => d !== date)
      : [...completed, date].sort();
    setCompleted(next);
    if (result) void persist(result.planId, result.days, next);
  }

  function startMove(date: string, index: number) {
    const key = `${date}::${index}`;
    setMoveTarget("");
    setMoveKey(moveKey === key ? null : key);
  }

  function confirmMove(fromDate: string, index: number, toDate: string) {
    if (!result || !toDate || toDate === fromDate) {
      setMoveKey(null);
      return;
    }
    const days = result.days.map((day) => ({ date: day.date, items: [...day.items] }));
    const from = days.find((day) => day.date === fromDate);
    const to = days.find((day) => day.date === toDate);
    if (!from || !to || !from.items[index]) {
      setMoveKey(null);
      return;
    }
    const [moved] = from.items.splice(index, 1);
    to.items.push(moved);
    const nextDays = days.filter((day) => day.items.length > 0);
    setResult({ ...result, days: nextDays });
    setMoveKey(null);
    void persist(result.planId, nextDays, completed);
  }

  const selectedKey = selectedDateKey ?? result?.days[0]?.date ?? null;
  const selectedDate = selectedKey ? parseDay(selectedKey) : null;
  const selectedDay = result?.days.find((day) => day.date === selectedKey) ?? null;
  const dayWarnings = selectedKey
    ? (result?.warnings ?? []).filter((warning) => warning.includes(selectedKey))
    : [];
  const generalWarnings = selectedKey
    ? (result?.warnings ?? []).filter((warning) => !warning.includes(selectedKey))
    : result?.warnings ?? [];

  const moveOptions = result
    ? result.days
        .filter((day) => day.date !== selectedKey)
        .map((day) => day.date)
    : [];

  const segmentClass = (active: boolean) =>
    active ? SEGMENT_ACTIVE : `${SEGMENT_IDLE} min-h-[36px]`;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <PageTitle>Planner</PageTitle>
        <p className="mt-3 text-sm text-muted">
          Build a day-by-day study schedule with Gemini, tuned to your availability.
        </p>
      </div>

      <div className={SEGMENT_TRACK}>
        <button
          type="button"
          onClick={() => setTab("generate")}
          className={segmentClass(tab === "generate")}
        >
          Generate
        </button>
        <button
          type="button"
          onClick={() => setTab("view")}
          disabled={!result}
          className={`${segmentClass(tab === "view")} disabled:opacity-40`}
        >
          View Plan
        </button>
      </div>

      {tab === "generate" && (
        <>
          {courses.length === 0 && (
            <section className={`${CARD} p-10 text-center`}>
              <p className="font-display text-lg font-bold text-ink">
                No courses to plan yet
              </p>
              <p className="mt-2 text-sm text-muted">
                Add a course with topics and set exam dates, then come back to
                generate a plan.
              </p>
              <Link href="/courses" className={`${BTN_PRIMARY} mt-6`}>
                Go to Courses
              </Link>
            </section>
          )}

          <section className="rounded-container bg-surface p-6 shadow-extruded">
            {demo && (
              <div className={`${INFO_BANNER} mb-6`}>
                Demo mode has restricted functionality — plan generation is
                disabled. Sign in to generate a new plan.
              </div>
            )}
            <h2 className="font-display text-base font-bold text-ink">Schedule</h2>
            <p className="mt-1 text-xs font-medium text-muted">
              When can you study? The plan spreads topics across these dates.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="planner-start" className={LABEL}>
                  Start date
                </label>
                <DatePicker
                  value={startDate}
                  onChange={setStartDate}
                  placeholder="Pick start date"
                />
              </div>
              <div>
                <label htmlFor="planner-end" className={LABEL}>
                  End date
                </label>
                <DatePicker
                  value={endDate}
                  onChange={setEndDate}
                  placeholder="Pick end date"
                />
              </div>
              <div>
                <label htmlFor="planner-weekday" className={LABEL}>
                  Weekday hours per day
                </label>
                <input
                  id="planner-weekday"
                  type="number"
                  min={0}
                  max={24}
                  step={0.5}
                  value={weekdayHours}
                  onChange={(e) => setWeekdayHours(e.target.value)}
                  className={INPUT}
                />
              </div>
              <div>
                <label htmlFor="planner-weekend" className={LABEL}>
                  Weekend hours per day
                </label>
                <input
                  id="planner-weekend"
                  type="number"
                  min={0}
                  max={24}
                  step={0.5}
                  value={weekendHours}
                  onChange={(e) => setWeekendHours(e.target.value)}
                  className={INPUT}
                />
              </div>
            </div>

            <div className="mt-6">
              <span className={LABEL}>Blackout dates (optional)</span>
              {blackouts.length === 0 ? (
                <p className="text-xs font-medium text-muted">No days blocked.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {blackouts.map((date, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="flex-1">
                        <DatePicker
                          value={date}
                          onChange={(value) =>
                            setBlackouts((list) =>
                              list.map((entry, i) => (i === index ? value : entry))
                            )
                          }
                          placeholder="Pick a blocked date"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setBlackouts((list) => list.filter((_, i) => i !== index))
                        }
                        className={TEXT_EDIT}
                        aria-label="Remove blackout date"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => setBlackouts((list) => [...list, ""])}
                className={`${TEXT_EDIT} mt-2`}
              >
                + Add unavailable day
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-medium text-muted">
                {courses.length} course{courses.length === 1 ? "" : "s"} · {topicCount}{" "}
                topic{topicCount === 1 ? "" : "s"} · {exams.length} exam
                {exams.length === 1 ? "" : "s"}
              </p>
              <button
                onClick={handleGenerate}
                disabled={demo || loading || courses.length === 0}
                className={BTN_PRIMARY}
              >
                {loading
                  ? "Generating plan…"
                  : result
                    ? "Regenerate plan"
                    : "Generate plan"}
              </button>
            </div>

            {error && <p className={`${ERROR_BANNER} mt-4`}>{error}</p>}
          </section>
        </>
      )}

      {tab === "view" &&
        (result ? (
          <>
            {saveError && <p className={ERROR_BANNER}>{saveError}</p>}

            {generalWarnings.length > 0 && (
              <div className="rounded-btn bg-surface p-4 shadow-inset">
                <p className="text-xs font-bold uppercase tracking-wide text-warn">
                  Plan notes
                </p>
                <ul className="mt-2 space-y-1.5">
                  {generalWarnings.map((warning, index) => (
                    <li key={index} className="text-xs font-medium text-warn">
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <PlanCalendar
              days={result.days}
              completed={completed}
              selectedDate={selectedDate}
              onSelect={(date) => setSelectedDateKey(toDateKey(date))}
            />

            <section className="rounded-container bg-surface p-5 shadow-extruded-sm">
              {!selectedDay ? (
                <p className="py-6 text-center text-sm text-muted">
                  Pick a day on the calendar to see its schedule.
                </p>
              ) : (
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <input
                        type="checkbox"
                        checked={completed.includes(selectedDay.date)}
                        onChange={() => toggleDay(selectedDay.date)}
                        className="h-5 w-5 shrink-0 accent-success"
                        aria-label={`Mark ${formatDay(selectedDay.date)} done`}
                      />
                      <div className="min-w-0">
                        <h3
                          className={`truncate font-bold text-ink ${
                            completed.includes(selectedDay.date)
                              ? "line-through"
                              : ""
                          }`}
                        >
                          {formatDay(selectedDay.date)}
                        </h3>
                        <p className="text-xs font-medium text-muted">
                          {selectedDay.items.length === 0
                            ? "Nothing scheduled"
                            : `${selectedDay.items.reduce(
                                (sum, item) =>
                                  item.type === "break"
                                    ? sum
                                    : sum + item.durationMinutes,
                                0
                              )} min · ${selectedDay.items.filter(
                                (item) => item.type !== "break"
                              ).length} block${
                                selectedDay.items.filter(
                                  (item) => item.type !== "break"
                                ).length === 1
                                  ? ""
                                  : "s"
                              }`}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-surface px-2.5 py-1 text-[11px] font-bold text-muted shadow-inset-sm">
                      {isWeekend(parseDay(selectedDay.date)) ? "Weekend" : "Weekday"}
                    </span>
                  </div>

                  {dayWarnings.length > 0 && (
                    <div className="mt-4 rounded-btn bg-surface p-3 shadow-inset">
                      <ul className="space-y-1.5">
                        {dayWarnings.map((warning, index) => (
                          <li key={index} className="text-xs font-medium text-warn">
                            {warning}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedDay.items.length > 0 && (
                    <ul className="mt-4 space-y-2">
                      {selectedDay.items.map((item, index) => {
                        const key = `${selectedDay.date}::${index}`;
                        const moving = moveKey === key;
                        return (
                          <li
                            key={key}
                            className="rounded-btn bg-surface px-3 py-2 shadow-inset-sm"
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`h-2 w-2 shrink-0 rounded-full ${
                                  TYPE_DOT[item.type]
                                }`}
                              />
                              <div className="min-w-0 flex-1">
                                {item.type === "break" ? (
                                  <p className="truncate text-sm font-medium text-muted">
                                    Break
                                  </p>
                                ) : (
                                  <>
                                    <p className="truncate text-sm font-medium text-ink">
                                      {item.topicName}
                                    </p>
                                    <p className="truncate text-xs text-muted">
                                      {item.courseName} · {TYPE_LABEL[item.type]}
                                    </p>
                                  </>
                                )}
                              </div>
                              <span className="shrink-0 text-xs font-bold tabular-nums text-muted">
                                {item.durationMinutes} min
                              </span>
                              {item.type !== "break" && (
                                <button
                                  type="button"
                                  onClick={() => startMove(selectedDay.date, index)}
                                  className={TEXT_EDIT}
                                >
                                  {moving ? "Cancel" : "Move"}
                                </button>
                              )}
                            </div>

                            {moving && (
                              <div className="mt-2 flex items-center gap-2 border-t border-ink/10 pt-2">
                                <span className="shrink-0 text-xs font-semibold text-muted">
                                  Move to
                                </span>
                                <select
                                  value={moveTarget}
                                  onChange={(e) => setMoveTarget(e.target.value)}
                                  className={`${INPUT} min-h-[40px] flex-1`}
                                  aria-label="Move item to another day"
                                >
                                  <option value="">Pick a day…</option>
                                  {moveOptions.map((date) => (
                                    <option key={date} value={date}>
                                      {formatDay(date)}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() =>
                                    confirmMove(selectedDay.date, index, moveTarget)
                                  }
                                  disabled={!moveTarget}
                                  className={`${BTN_PRIMARY} px-3 py-2 text-xs`}
                                >
                                  Move
                                </button>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}

              {result && result.days.length > 0 && (
                <div className="mt-4 border-t border-ink/10 pt-3">
                  <button
                    type="button"
                    onClick={() => setTab("generate")}
                    className={BTN_SMALL_GHOST}
                  >
                    Tweak availability &amp; regenerate
                  </button>
                </div>
              )}
            </section>
          </>
        ) : (
          <section className={`${CARD} p-10 text-center`}>
            <p className="font-display text-lg font-bold text-ink">No plan yet</p>
            <p className="mt-2 text-sm text-muted">
              Generate a study plan first, then come back here to see it on the
              calendar.
            </p>
            <button
              type="button"
              onClick={() => setTab("generate")}
              className={`${BTN_PRIMARY} mt-6`}
            >
              Go to Generate
            </button>
          </section>
        ))}
    </div>
  );
}