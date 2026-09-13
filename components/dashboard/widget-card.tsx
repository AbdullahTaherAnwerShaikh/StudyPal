import type { ReactNode } from "react";
import { CARD } from "@/components/ui/styles";

export default function WidgetCard({
  title,
  action,
  className = "",
  children,
}: {
  title: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={`${CARD} p-6 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-extruded-hover ${className}`}
    >
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-base font-bold text-ink">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
