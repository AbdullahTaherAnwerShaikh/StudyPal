import React from "react";
import { LOGO_D, LOGO_VIEWBOX } from "@/lib/logo";

const EMBLEM_FILTER =
  "drop-shadow(2px 2.5px 6px var(--brand-shade)) drop-shadow(-2px -2.5px 5px var(--brand-lite))";

export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox={LOGO_VIEWBOX} className={className} aria-hidden="true">
      <g style={{ filter: EMBLEM_FILTER }}>
        <path d={LOGO_D} fill="var(--theme-accent)" />
      </g>
    </svg>
  );
}

export default function Brand({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`}>
      <LogoMark className="h-[45px] w-[45px] shrink-0" />
      <span className="font-display text-lg font-extrabold tracking-tight">
        Study
        <span className="text-accent">Pal</span>
      </span>
    </span>
  );
}