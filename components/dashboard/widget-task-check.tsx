"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setTaskStatus } from "@/lib/actions/tasks";

export default function WidgetTaskCheck({
  id,
  title,
  done,
  demo,
}: {
  id: string;
  title: string;
  done: boolean;
  demo: boolean;
}) {
  const [checked, setChecked] = useState(done);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    if (demo) {
      setChecked((value) => !value);
      return;
    }

    const next = !checked;
    setChecked(next);
    startTransition(async () => {
      const result = await setTaskStatus({ id, status: next ? "done" : "todo" });
      if (result.error) {
        setChecked(!next);
        return;
      }
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={`Mark ${title} ${checked ? "pending" : "done"}`}
      onClick={handleClick}
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-inner bg-surface shadow-inset-sm transition-colors ${
        checked ? "bg-success text-white" : ""
      } ${pending ? "opacity-60" : ""}`}
    >
      {checked && (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="h-3 w-3">
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}