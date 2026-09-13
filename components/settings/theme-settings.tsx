"use client";

import { useState } from "react";
import { THEME_MODES, THEME_PRESETS } from "@/lib/theme";
import type { ThemeKey, ThemeMode } from "@/lib/theme";
import { SEGMENT_ACTIVE, SEGMENT_IDLE, SEGMENT_TRACK } from "@/components/ui/styles";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function ThemeSettings({
  initialTheme,
  initialMode,
}: {
  initialTheme: ThemeKey;
  initialMode: ThemeMode;
}) {
  const [theme, setTheme] = useState<ThemeKey>(initialTheme);
  const [mode, setMode] = useState<ThemeMode>(initialMode);
  const [status, setStatus] = useState<SaveStatus>("idle");

  async function persist(nextTheme: ThemeKey, nextMode: ThemeMode) {
    setStatus("saving");
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: nextTheme, theme_mode: nextMode }),
      });
      const payload = (await res.json()) as { ok?: boolean; detail?: string };
      if (!res.ok || !payload.ok) {
        console.error("Theme save failed:", res.status, payload.detail);
        throw new Error(`Save failed with status ${res.status}`);
      }
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  function apply(nextTheme: ThemeKey, nextMode: ThemeMode) {
    setTheme(nextTheme);
    setMode(nextMode);
    document.documentElement.dataset.themeAccent = nextTheme;
    document.documentElement.dataset.themeMode = nextMode;
    void persist(nextTheme, nextMode);
  }

  return (
    <section className="rounded-container bg-surface p-6 shadow-extruded">
      <h2 className="font-display text-base font-bold text-ink">Theme</h2>
      <p className="mt-1 text-xs font-semibold text-muted">Accent color</p>

      <div className="mt-3 flex flex-wrap gap-3">
        {THEME_PRESETS.map((preset) => {
          const selected = theme === preset.key;
          return (
            <button
              key={preset.key}
              type="button"
              aria-label={preset.label}
              aria-pressed={selected}
              title={preset.label}
              onClick={() => apply(preset.key, mode)}
              className={`flex h-12 w-12 items-center justify-center rounded-full shadow-extruded-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-extruded ${
                selected ? "ring-2 ring-accent ring-offset-2 ring-offset-surface" : ""
              }`}
              style={{ backgroundColor: preset.accent }}
            >
              {selected && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M5 12.5l4.5 4.5L19 7.5"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      <p className="mt-6 text-xs font-semibold text-muted">Appearance</p>
      <div className={`mt-3 ${SEGMENT_TRACK}`}>
        {THEME_MODES.map((candidate) => (
          <button
            key={candidate}
            type="button"
            onClick={() => apply(theme, candidate)}
            className={`capitalize ${
              mode === candidate ? SEGMENT_ACTIVE : SEGMENT_IDLE
            }`}
          >
            {candidate}
          </button>
        ))}
      </div>

      <p
        className={`mt-4 text-xs font-semibold ${
          status === "error" ? "text-danger" : "text-accent"
        }`}
        aria-live="polite"
      >
        {status === "saving"
          ? "Saving…"
          : status === "saved"
            ? "Saved."
            : status === "error"
              ? "Couldn't save — try again."
              : "\u00A0"}
      </p>
    </section>
  );
}