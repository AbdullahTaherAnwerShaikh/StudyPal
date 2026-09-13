import type { ReactNode } from "react";

export default function WidgetEmpty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-btn bg-surface p-5 text-center shadow-inset">
      <p className="text-sm font-medium text-ink">{children}</p>
    </div>
  );
}