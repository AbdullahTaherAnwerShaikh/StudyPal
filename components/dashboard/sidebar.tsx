"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SignOutButton from "@/components/sign-out-button";
import Brand from "@/components/ui/brand";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/courses", label: "Courses" },
  { href: "/planner", label: "Planner" },
  { href: "/assistant", label: "Assistant" },
  { href: "/tasks", label: "Tasks" },
  { href: "/habits", label: "Habits" },
  { href: "/notes", label: "Notes" },
  { href: "/settings", label: "Settings" },
];

export default function Sidebar({
  open,
  onClose,
  demo = false,
}: {
  open: boolean;
  onClose: () => void;
  demo?: boolean;
}) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-30 bg-ink/30 backdrop-blur-sm lg:hidden"
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-surface shadow-extruded transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Link href="/" className="flex items-center">
            <Brand />
          </Link>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-11 w-11 items-center justify-center rounded-inner text-muted transition-all duration-300 hover:text-ink hover:shadow-inset-sm lg:hidden"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto p-4">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex min-h-[44px] items-center gap-3 rounded-btn px-3 text-sm transition-all duration-300 ${
                  active
                    ? "font-bold text-accent shadow-inset"
                    : "text-muted hover:text-ink"
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-inner text-[11px] font-bold ${
                    active ? "text-accent shadow-extruded-sm" : "text-muted shadow-inset-sm"
                  }`}
                >
                  {item.label[0]}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4">
          <SignOutButton demo={demo} />
        </div>
      </aside>
    </>
  );
}
