"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseKey(key: string): Date {
  return new Date(`${key}T00:00:00`);
}

function formatDisplay(key: string): string {
  return parseKey(key).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const initial = value ? parseKey(value) : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      const anchor = value ? parseKey(value) : new Date();
      setViewYear(anchor.getFullYear());
      setViewMonth(anchor.getMonth());
    }
  }, [open, value]);

  const cells = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const start = new Date(first);
    start.setDate(1 - first.getDay());
    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return day;
    });
  }, [viewYear, viewMonth]);

  const todayKey = toDateKey(new Date());
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric" }
  );

  function step(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="flex min-h-[44px] min-w-0 flex-1 items-center gap-2 rounded-btn bg-surface px-4 text-sm text-ink shadow-inset outline-none transition-shadow duration-300 focus:shadow-inset-deep"
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 shrink-0 text-muted">
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
          </svg>
          <span className={`min-w-0 truncate ${value ? "" : "text-muted/70"}`}>
            {value ? formatDisplay(value) : placeholder}
          </span>
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Clear date"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-inner text-muted transition-all duration-300 hover:text-danger hover:shadow-inset-sm"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {open && (
        <div
          role="dialog"
          aria-label="Choose date"
          className="absolute left-0 top-full z-50 mt-3 w-72 rounded-container bg-surface p-4 shadow-extruded"
        >
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous month"
              className="flex h-9 w-9 items-center justify-center rounded-inner text-muted transition-all duration-300 hover:text-ink hover:shadow-inset-sm"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <span className="font-display text-sm font-bold text-ink">{monthLabel}</span>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next month"
              className="flex h-9 w-9 items-center justify-center rounded-inner text-muted transition-all duration-300 hover:text-ink hover:shadow-inset-sm"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {WEEKDAY_LABELS.map((label, index) => (
              <span
                key={`${label}-${index}`}
                className="flex h-6 items-center justify-center text-[10px] font-bold uppercase text-muted"
              >
                {label}
              </span>
            ))}
            {cells.map((day) => {
              const key = toDateKey(day);
              const inMonth = day.getMonth() === viewMonth;
              const selected = key === value;
              const isToday = key === todayKey;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    onChange(key);
                    setOpen(false);
                  }}
                  className={[
                    "h-9 rounded-inner text-xs transition-all duration-200",
                    inMonth ? "text-ink" : "text-muted/40",
                    !selected && "hover:shadow-inset-sm",
                    !selected && isToday && "ring-1 ring-accent",
                    selected ? "bg-accent font-bold text-white" : "",
                  ].join(" ")}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between pt-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                onChange(todayKey);
                setOpen(false);
              }}
              className="text-accent hover:text-accent-light"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="text-muted hover:text-ink"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
