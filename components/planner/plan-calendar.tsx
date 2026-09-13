"use client";

import { useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import type {
  CustomComponents,
  DayButtonProps,
  MonthCaptionProps,
  NavProps,
} from "react-day-picker";
import { format } from "date-fns";
import { parseDay } from "@/lib/planner/dates";
import type { PlanDay, PlanItem } from "@/lib/planner/types";

const MAX_CELL_ITEMS = 3;

function itemLabel(item: PlanItem): string {
  if (item.type === "break") return "Break";
  return item.topicName || item.courseName;
}

function ChevronIcon({ direction }: { direction: "prev" | "next" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      className="h-4 w-4"
      aria-hidden="true"
    >
      {direction === "prev" ? (
        <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

const NAV_BUTTON =
  "inline-flex h-11 w-11 items-center justify-center rounded-inner bg-surface text-ink shadow-extruded-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-extruded active:translate-y-0 active:shadow-inset-sm disabled:opacity-40 disabled:shadow-none";

export default function PlanCalendar({
  days,
  completed,
  selectedDate,
  onSelect,
}: {
  days: PlanDay[];
  completed: string[];
  selectedDate: Date | null;
  onSelect: (date: Date) => void;
}) {
  const itemsByDate = useMemo(() => {
    const map = new Map<string, PlanItem[]>();
    for (const day of days) map.set(day.date, day.items);
    return map;
  }, [days]);

  const completedSet = useMemo(() => new Set(completed), [completed]);

  const [month, setMonth] = useState<Date>(() => {
    const first = days[0]?.date;
    return first ? parseDay(first) : new Date();
  });

  function renderDayButton({ day, modifiers, onClick }: DayButtonProps) {
    const items = itemsByDate.get(day.isoDate) ?? [];
    const done = completedSet.has(day.isoDate);
    const selected = modifiers.selected === true;
    const today = modifiers.today === true;
    const outside = day.outside === true;
    const visible = items.slice(0, MAX_CELL_ITEMS);
    const more = items.length - visible.length;
    const weekends = day.date.getDay() === 0 || day.date.getDay() === 6;

    const cellClasses = [
      "flex h-[76px] w-full flex-col items-start justify-start gap-0.5 rounded-inner p-1.5 text-left transition-all duration-200",
      selected
        ? "bg-accent text-white shadow-extruded-sm"
        : outside
          ? "text-ink/35"
          : today
            ? "bg-surface text-ink shadow-inset-sm ring-2 ring-warn/60"
            : weekends || items.length > 0
              ? "bg-surface text-ink shadow-inset-sm hover:shadow-inset-deep"
              : "text-ink/80 hover:bg-surface hover:shadow-inset-sm",
      done && !selected ? "opacity-55" : "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        type="button"
        onClick={onClick}
        aria-selected={selected || undefined}
        className={cellClasses}
      >
        <span className="flex w-full items-center justify-between">
          <span className="text-xs font-bold leading-none">
            {day.date.getDate()}
          </span>
          {done && (
            <span className="text-[10px] font-black leading-none text-success">
              ✓
            </span>
          )}
        </span>
        <ul className="w-full space-y-0.5">
          {visible.map((item, index) => (
            <li
              key={`${day.isoDate}-${index}`}
              className="truncate text-[10px] font-medium leading-tight"
            >
              {itemLabel(item)}
            </li>
          ))}
          {more > 0 && (
            <li className="text-[10px] font-bold leading-tight opacity-80">
              +{more} more
            </li>
          )}
        </ul>
      </button>
    );
  }

  function renderCaption({ calendarMonth }: MonthCaptionProps) {
    return (
      <h2 className="font-display text-lg font-bold tracking-tight text-ink">
        {format(calendarMonth.date, "MMMM yyyy")}
      </h2>
    );
  }

  function renderNav({
    onPreviousClick,
    onNextClick,
    previousMonth,
    nextMonth,
  }: NavProps) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPreviousClick}
          disabled={!previousMonth}
          className={NAV_BUTTON}
          aria-label="Previous month"
        >
          <ChevronIcon direction="prev" />
        </button>
        <button
          type="button"
          onClick={onNextClick}
          disabled={!nextMonth}
          className={NAV_BUTTON}
          aria-label="Next month"
        >
          <ChevronIcon direction="next" />
        </button>
      </div>
    );
  }

  const components: Partial<CustomComponents> = {
    DayButton: renderDayButton,
    MonthCaption: renderCaption,
    Nav: renderNav,
  };

  return (
    <div className="rounded-container bg-surface p-5 shadow-extruded-sm">
      <DayPicker
        mode="single"
        selected={selectedDate ?? undefined}
        onSelect={(selected) => {
          if (selected) onSelect(selected);
        }}
        month={month}
        onMonthChange={setMonth}
        components={components}
        showOutsideDays
        fixedWeeks
        weekStartsOn={1}
        classNames={{
          months: "flex flex-col space-y-4",
          month: "flex flex-col space-y-3",
          nav: "",
          month_grid: "w-full border-separate border-spacing-[5px]",
          weekdays: "border-0",
          weekday:
            "pb-1 text-center text-[10px] font-bold uppercase tracking-wider text-muted/70",
          week: "border-0",
          day: "p-0 border-0",
        }}
      />
    </div>
  );
}