"use client";

import { useState } from "react";
import WidgetCard from "@/components/dashboard/widget-card";
import TopicFormModal from "@/components/courses/topic-form-modal";
import { deleteTopic, updateTopic } from "@/lib/actions/courses";
import {
  BTN_SMALL_PRIMARY,
  ERROR_BANNER,
  TEXT_DELETE,
  TEXT_EDIT,
} from "@/components/ui/styles";
import type { ActionResult, TopicRow } from "@/lib/types";

export default function TopicsSection({
  courseId,
  topics,
}: {
  courseId: string;
  topics: TopicRow[];
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TopicRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalEstimated = topics.reduce((sum, t) => sum + t.estimated_hours, 0);
  const totalDone = topics.reduce(
    (sum, t) => sum + (t.is_completed ? t.estimated_hours : t.done_hours),
    0
  );
  const percent =
    totalEstimated > 0
      ? Math.min(100, Math.round((totalDone / totalEstimated) * 100))
      : 0;

  async function run(id: string, action: () => Promise<ActionResult>) {
    setBusyId(id);
    setError(null);
    const result = await action();
    setBusyId(null);
    if (result.error) setError(result.error);
  }

  return (
    <WidgetCard
      title={`Topics (${topics.length})`}
      action={
        <button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className={BTN_SMALL_PRIMARY}
        >
          + Add topic
        </button>
      }
    >
      {topics.length > 0 && (
        <div className="mb-5">
          <div className="flex justify-between text-xs font-bold text-muted">
            <span>Progress</span>
            <span className="tabular-nums">
              {totalDone} / {totalEstimated} h · {percent}%
            </span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full shadow-inset-sm">
            <div
              className="h-full rounded-full bg-accent transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      )}

      {error && <p className={`${ERROR_BANNER} mb-3`}>{error}</p>}

      {topics.length === 0 ? (
        <p className="text-sm font-medium text-muted">
          No topics yet. Break the course into study-sized chunks.
        </p>
      ) : (
        <ul className="space-y-3">
          {topics.map((topic) => (
            <li
              key={topic.id}
              className="flex items-center gap-3 rounded-btn bg-surface px-4 py-2 shadow-inset-sm"
            >
              <input
                type="checkbox"
                checked={topic.is_completed}
                disabled={busyId === topic.id}
                onChange={(event) =>
                  run(topic.id, () =>
                    updateTopic({
                      id: topic.id,
                      course_id: courseId,
                      is_completed: event.target.checked,
                    })
                  )
                }
                className="h-4 w-4 shrink-0 accent-success"
                aria-label={`Mark ${topic.name} complete`}
              />
              <span
                className={`min-w-0 flex-1 truncate text-sm ${
                  topic.is_completed ? "text-muted line-through" : "text-ink"
                }`}
              >
                {topic.name}
              </span>
              <span className="shrink-0 text-xs tabular-nums text-muted">
                {topic.done_hours}/{topic.estimated_hours} h
              </span>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  onClick={() =>
                    run(topic.id, () =>
                      updateTopic({
                        id: topic.id,
                        course_id: courseId,
                        done_hours: Math.max(0, topic.done_hours - 0.5),
                      })
                    )
                  }
                  disabled={busyId === topic.id || topic.done_hours <= 0}
                  aria-label={`Log less time on ${topic.name}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-base leading-none text-ink shadow-extruded-sm transition-all duration-300 hover:text-accent active:shadow-inset disabled:opacity-40"
                >
                  −
                </button>
                <button
                  onClick={() =>
                    run(topic.id, () =>
                      updateTopic({
                        id: topic.id,
                        course_id: courseId,
                        done_hours: topic.done_hours + 0.5,
                      })
                    )
                  }
                  disabled={busyId === topic.id}
                  aria-label={`Log more time on ${topic.name}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-base leading-none text-ink shadow-extruded-sm transition-all duration-300 hover:text-accent active:shadow-inset disabled:opacity-40"
                >
                  +
                </button>
                <button
                  onClick={() => {
                    setEditing(topic);
                    setModalOpen(true);
                  }}
                  className={TEXT_EDIT}
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (!window.confirm(`Delete topic "${topic.name}"?`)) return;
                    run(topic.id, () =>
                      deleteTopic({ id: topic.id, course_id: courseId })
                    );
                  }}
                  disabled={busyId === topic.id}
                  className={`${TEXT_DELETE} disabled:opacity-50`}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <TopicFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        courseId={courseId}
        topic={editing ?? undefined}
      />
    </WidgetCard>
  );
}
