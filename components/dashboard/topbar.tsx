"use client";

import Brand from "@/components/ui/brand";

export default function Topbar({
  email,
  onMenu,
  demo = false,
}: {
  email: string;
  onMenu: () => void;
  demo?: boolean;
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
        <span className="lg:hidden">
          <Brand />
        </span>
      </div>

      <div className="flex items-center gap-3">
        {email && (
          <span className="hidden max-w-[16rem] truncate text-xs font-medium text-muted sm:inline">
            {demo ? "Demo mode" : email}
          </span>
        )}
      </div>
    </header>
  );
}
