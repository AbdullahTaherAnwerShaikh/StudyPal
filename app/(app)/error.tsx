"use client";

import { useEffect } from "react";
import Link from "next/link";
import { BTN_SMALL_GHOST, BTN_SMALL_PRIMARY } from "@/components/ui/styles";

export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col items-center justify-center px-6 py-24 text-center">
      <div className="w-full max-w-md rounded-container bg-surface p-8 shadow-extruded">
        <p className="text-xs font-bold uppercase tracking-wide text-danger">
          Something went wrong
        </p>
        <h2 className="mt-2 text-xl font-bold text-ink">
          We couldn&apos;t load this page
        </h2>
        <p className="mt-2 text-sm text-muted">
          Your data is safe. Try again, or head back to the dashboard.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/dashboard" className={BTN_SMALL_PRIMARY}>
            Go to dashboard
          </Link>
          <button
            type="button"
            onClick={retry}
            className={BTN_SMALL_GHOST}
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}