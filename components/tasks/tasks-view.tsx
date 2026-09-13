"use client";

import { useState } from "react";
import TaskFormModal from "@/components/tasks/task-form-modal";
import PageTitle from "@/components/ui/page-title";
import {
  BTN_PRIMARY,
  ERROR_BANNER,
  SEGMENT_ACTIVE,
  SEGMENT_IDLE,
  SEGMENT_TRACK,
  TEXT_DELETE,
  TEXT_EDIT,
} from "@/components/ui/styles";
import { deleteTask, setTaskStatus } from "@/lib/actions/tasks";
import type { ActionResult, TaskRow } from "@/lib/types";

type Filter = "all" | "pending" | "done";

const PRIORITY_DOT: Record<TaskRow["priority"], string> = {
  high: "bg-danger",
  medium: "bg-warn",
  low: "bg-ink/25",
};

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDue(due: string) {
  return new Date(`${due}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function TasksView({
  tasks,
  courses,
}: {
  tasks: TaskRow[];
  courses: { id: string; name: string; color: string }[];
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TaskRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const courseById = new Map(courses.map((course) => [course.id, course]));
  const todayKey = toDateKey(new Date());

  const counts = {
    all: tasks.length,
    pending: tasks.filter((t) => t.status !== "done").length,
    done: tasks.filter((t) => t.status === "done").length,
  };
  const visible =
    filter === "all"
      ? tasks
      : tasks.filter((t) =>
          filter === "done" ? t.status === "done" : t.status !== "done"
        );

  async function run(id: string, action: () => Promise<ActionResult>) {
    setBusyId(id);
    setError(null);
    const result = await action();
    setBusyId(null);
    if (result.error) setError(result.error);
  }

  const FILTER_LABELS: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "done", label: "Done" },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageTitle>Tasks</PageTitle>
        <button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className={BTN_PRIMARY}
        >
          Add task
        </button>
      </div>

      <div className={`${SEGMENT_TRACK} mt-6`}>
        {FILTER_LABELS.map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key)}
            className={
              filter === item.key
                ? SEGMENT_ACTIVE
                : `${SEGMENT_IDLE} min-h-[36px]`
            }
          >
            {item.label} ({counts[item.key]})
          </button>
        ))}
      </div>

      {error && <p className={`${ERROR_BANNER} mt-6`}>{error}</p>}

      <div className="mt-6 space-y-4">
        {visible.length === 0 ? (
          <div className="rounded-container bg-surface p-12 text-center shadow-inset">
            <p className="text-sm font-medium text-ink">
              {filter === "all" ? "No tasks yet." : `No ${filter} tasks.`}
            </p>
          </div>
        ) : (
          visible.map((task) => {
            const done = task.status === "done";
            const overdue =
              !done && task.due_date !== null && task.due_date < todayKey;
            const course = task.related_course_id
              ? courseById.get(task.related_course_id)
              : undefined;

            return (
              <div
                key={task.id}
                className="flex items-center gap-3 rounded-btn bg-surface px-4 py-2 shadow-extruded-sm transition-shadow duration-300"
              >
                <input
                  type="checkbox"
                  checked={done}
                  disabled={busyId === task.id}
                  onChange={() =>
                    run(task.id, () =>
                      setTaskStatus({
                        id: task.id,
                        status: done ? "todo" : "done",
                      })
                    )
                  }
                  className="h-5 w-5 shrink-0 accent-success"
                  aria-label={`Mark ${task.title} ${done ? "pending" : "done"}`}
                />
                <span
                  className={`min-w-0 flex-1 truncate text-sm ${
                    done ? "text-muted line-through" : "text-ink"
                  }`}
                >
                  {task.title}
                </span>
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${PRIORITY_DOT[task.priority]}`}
                  title={`${task.priority} priority`}
                />
                {task.due_date && (
                  <span
                    className={`shrink-0 text-xs tabular-nums ${
                      overdue ? "font-bold text-danger" : "font-medium text-muted"
                    }`}
                    title={overdue ? "Overdue" : undefined}
                  >
                    {formatDue(task.due_date)}
                  </span>
                )}
                {course && (
                  <span className="hidden shrink-0 items-center gap-1.5 text-xs font-medium text-muted sm:flex">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: course.color }}
                    />
                    {course.name}
                  </span>
                )}
                <div className="flex shrink-0">
                  <button
                    onClick={() => {
                      setEditing(task);
                      setModalOpen(true);
                    }}
                    className={TEXT_EDIT}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (!window.confirm(`Delete task "${task.title}"?`)) return;
                      run(task.id, () => deleteTask(task.id));
                    }}
                    disabled={busyId === task.id}
                    className={`${TEXT_DELETE} disabled:opacity-50`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <TaskFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        courses={courses}
        task={editing ?? undefined}
      />
    </div>
  );
}
