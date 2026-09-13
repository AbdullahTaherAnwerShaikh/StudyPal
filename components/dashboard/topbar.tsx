"use client";

import { BTN_PRIMARY } from "@/components/ui/styles";

export default function Topbar({
  email,
  onMenu,
}: {
  email: string;
  onMenu: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 bg-surface px-4 shadow-extruded sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenu}
          aria-label="Open menu"
          className="flex h-11 w-11 items-center justify-center rounded-inner text-muted transition-all duration-300 hover:text-ink hover:shadow-inset-sm lg:hidden"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
        </button>
        <span className="font-display text-lg font-extrabold tracking-tight lg:hidden">
          Personal OS
        </span>
      </div>

      <div className="flex items-center gap-3">
        {email && (
          <span className="hidden max-w-[16rem] truncate text-xs font-medium text-muted sm:inline">
            {email}
          </span>
        )}
        <button
          type="button"
          title="Quick add — coming soon"
          className={`${BTN_PRIMARY} px-4 py-2`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Add
        </button>
      </div>
    </header>
  );
}
