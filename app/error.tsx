"use client";

import { useEffect } from "react";
import Link from "next/link";
import { BTN_SMALL_GHOST, BTN_SMALL_PRIMARY } from "@/components/ui/styles";

export default function RootError({
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
    <div className="flex min-h-screen items-center justify-center bg-surface px-6">
      <div className="w-full max-w-md rounded-container bg-surface p-8 text-center shadow-extruded">
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
          <Link href="/" className={BTN_SMALL_PRIMARY}>
            Go home
          </Link>
          <button type="button" onClick={retry} className={BTN_SMALL_GHOST}>
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}