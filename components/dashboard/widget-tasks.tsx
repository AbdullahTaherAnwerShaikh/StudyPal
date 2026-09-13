import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import WidgetCard from "@/components/dashboard/widget-card";
import WidgetEmpty from "@/components/dashboard/widget-empty";
import { PRIORITY_DOT, PRIORITY_RANK, relativeDayLabel } from "@/lib/dashboard";
import { toDateKey } from "@/lib/dates";

export default async function TasksWidget({ className = "" }: { className?: string }) {
  const supabase = await createClient();
  const today = toDateKey(new Date());

  const { data } = await supabase
    .from("tasks")
    .select("id, title, priority, status, due_date")
    .neq("status", "done");

  const openTasks = (data ?? []).filter((task) => task.status !== "done");
  const totalPending = openTasks.length;
  const tasks = openTasks
    .sort((a, b) => {
      const byPriority = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (byPriority !== 0) return byPriority;
      const aDue = a.due_date ?? "9999-99-99";
      const bDue = b.due_date ?? "9999-99-99";
      if (aDue !== bDue) return aDue < bDue ? -1 : 1;
      return a.title.localeCompare(b.title);
    })
    .slice(0, 3);

  return (
    <WidgetCard
      title="Tasks"
      action={<span className="text-xs font-medium text-muted">{totalPending} open</span>}
      className={className}
    >
      {tasks.length === 0 ? (
        <WidgetEmpty>
          No pending tasks.{" "}
          <Link href="/tasks" className="font-bold text-accent hover:text-accent-light">
            Add one
          </Link>{" "}
          to keep momentum.
        </WidgetEmpty>
      ) : (
        <ul className="space-y-3">
          {tasks.map((task) => {
            const done = task.status === "done";
            const overdue = task.due_date !== null && task.due_date < today;
            return (
              <li key={task.id} className="flex items-center gap-3">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-inner bg-surface shadow-inset-sm ${
                    done ? "bg-success text-white" : ""
                  }`}
                >
                  {done && (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={3}
                      className="h-3 w-3"
                    >
                      <path
                        d="M5 13l4 4L19 7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-ink">
                  {task.title}
                </span>
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    PRIORITY_DOT[task.priority]
                  }`}
                />
                <span
                  className={`w-20 shrink-0 text-right text-xs ${
                    overdue
                      ? "font-bold text-danger"
                      : "font-medium text-muted"
                  }`}
                >
                  {task.due_date
                    ? task.due_date < today
                      ? "Overdue"
                      : relativeDayLabel(task.due_date)
                    : "No due date"}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {totalPending > tasks.length && (
        <p className="mt-3 text-xs font-medium text-muted">
          +{totalPending - tasks.length} more pending task
          {totalPending - tasks.length === 1 ? "" : "s"}.
        </p>
      )}

      {tasks.length > 0 && (
        <div className="mt-4">
          <Link
            href="/tasks"
            className="text-xs font-bold text-accent hover:text-accent-light"
          >
            View all tasks →
          </Link>
        </div>
      )}
    </WidgetCard>
  );
}