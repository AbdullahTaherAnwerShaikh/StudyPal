import Link from "next/link";
import type { ReactNode } from "react";
import { CARD } from "@/components/ui/styles";

export default function WidgetCard({
  title,
  action,
  href,
  className = "",
  children,
}: {
  title: string;
  action?: ReactNode;
  href?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={`${CARD} p-6 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-extruded-hover ${className}`}
    >
      <div className="mb-5 flex items-center justify-between">
        {href ? (
          <Link
            href={href}
            className="font-display text-base font-bold text-ink transition-colors hover:text-accent"
          >
            {title}
          </Link>
        ) : (
          <h2 className="font-display text-base font-bold text-ink">{title}</h2>
        )}
        {action}
      </div>
      {children}
    </section>
  );
}