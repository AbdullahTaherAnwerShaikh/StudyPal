"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { SEGMENT_ACTIVE, SEGMENT_IDLE, SEGMENT_TRACK } from "@/components/ui/styles";

export default function MarkdownTabs({
  value,
  onChange,
  rows = 14,
  placeholder = "## Key idea\n- write your note here",
}: {
  value: string;
  onChange: (next: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  const [tab, setTab] = useState<"write" | "preview">("write");

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold text-muted">Content (markdown)</span>
        <div className={SEGMENT_TRACK} role="tablist" aria-label="Markdown tabs">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "write"}
            onClick={() => setTab("write")}
            className={tab === "write" ? SEGMENT_ACTIVE : SEGMENT_IDLE}
          >
            Write
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "preview"}
            onClick={() => setTab("preview")}
            className={tab === "preview" ? SEGMENT_ACTIVE : SEGMENT_IDLE}
          >
            Preview
          </button>
        </div>
      </div>

      {tab === "write" ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={rows}
          placeholder={placeholder}
          aria-label="Note content (markdown)"
          className="w-full resize-y rounded-lg border border-ink/20 bg-white px-3 py-2 font-mono text-xs leading-relaxed text-ink outline-none placeholder:text-ink/35 focus:border-moss"
        />
      ) : (
        <div
          role="tabpanel"
          aria-label="Rendered preview"
          className="h-72 overflow-auto rounded-lg border border-ink/15 bg-paper p-4"
        >
          {value.trim() ? (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{value}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-xs text-ink/40">Nothing to preview yet.</p>
          )}
        </div>
      )}
    </div>
  );
}