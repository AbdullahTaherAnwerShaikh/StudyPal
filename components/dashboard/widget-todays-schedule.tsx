import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import WidgetCard from "@/components/dashboard/widget-card";
import WidgetEmpty from "@/components/dashboard/widget-empty";
import { PRIORITY_DOT, PRIORITY_RANK } from "@/lib/dashboard";
import { toDateKey } from "@/lib/dates";
import type { PlanDay, PlanItem } from "@/lib/planner/types";

const ITEM_DOT: Record<PlanItem["type"], string> = {
  study: "bg-accent",
  review: "bg-warn",
  break: "bg-ink/25",
};

const TYPE_LABEL: Record<PlanItem["type"], string> = {
  study: "Study",
  review: "Review",
  break: "Break",
};

type PlanRow = {
  days: unknown;
};

export default async function TodaysSchedule({ className = "" }: { className?: string }) {
  const supabase = await createClient();
  const today = toDateKey(new Date());

  const [planResult, tasksResult] = await Promise.all([
    supabase
      .from("study_plans")
      .select("days")
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("tasks")
      .select("id, title, priority, status, due_date")
      .eq("due_date", today)
      .neq("status", "done"),
  ]);

  const plan = (planResult.data ?? [])[0] as PlanRow | undefined;
  const rawDays = Array.isArray(plan?.days) ? (plan?.days as PlanDay[]) : [];
  const planDay = rawDays.find((day) => day.date === today);
  const items = planDay?.items ?? [];

  const tasks = (tasksResult.data ?? [])
    .filter((task) => task.status !== "done")
    .sort(
      (a, b) =>
        PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
        a.title.localeCompare(b.title)
    );

  const total = items.length + tasks.length;

  return (
    <WidgetCard
      title="Today's Schedule"
      action={
        <span className="text-xs font-medium text-muted">
          {total} item{total === 1 ? "" : "s"}
        </span>
      }
      className={className}
    >
      {total === 0 ? (
        <WidgetEmpty>
          Nothing scheduled today. Enjoy the free time — or{" "}
          <Link href="/planner" className="font-bold text-accent hover:text-accent-light">
            plan ahead
          </Link>
          .
        </WidgetEmpty>
      ) : (
        <ul className="space-y-3">
          {items.map((item, index) => (
            <li key={`plan-${index}`} className="flex items-center gap-3">
              <span className="w-12 shrink-0 text-xs tabular-nums text-muted">
                {item.durationMinutes}m
              </span>
              <span
                className={`h-9 w-1 shrink-0 rounded-full ${ITEM_DOT[item.type]}`}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink">
                  {item.type === "break" ? "Break" : item.topicName}
                </p>
                <p className="truncate text-xs text-muted">
                  {item.type === "break"
                    ? "Planned break"
                    : `${item.courseName} · ${TYPE_LABEL[item.type]}`}
                </p>
              </div>
            </li>
          ))}

          {items.length > 0 && tasks.length > 0 && (
            <li className="border-t border-ink/10" />
          )}

          {tasks.map((task) => (
            <li key={task.id} className="flex items-center gap-3">
              <span className="w-12 shrink-0 text-xs font-bold text-muted">Due</span>
              <span
                className={`h-9 w-1 shrink-0 rounded-full ${PRIORITY_DOT[task.priority]}`}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink">{task.title}</p>
                <p className="text-xs text-muted">Task due today</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}