import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { isDemoMode } from "@/lib/demo";
import { getDemoStudyPlanWidget, DEMO_COURSES, DEMO_TOPICS } from "@/lib/demo-data";
import WidgetCard from "@/components/dashboard/widget-card";
import WidgetEmpty from "@/components/dashboard/widget-empty";
import { formatDateKey, relativeDayLabel } from "@/lib/dashboard";
import { toDateKey } from "@/lib/dates";
import type { PlanDay, PlanItem, PlannerRequest } from "@/lib/planner/types";

const RING_RADIUS = 52;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const MAX_ITEMS_SHOWN = 3;

function summaryFor(day: PlanDay): { label: string; minutes: number } {
  const blocks = day.items.filter((item) => item.type !== "break");
  const minutes = blocks.reduce((sum, item) => sum + item.durationMinutes, 0);
  const names = [...new Set(blocks.map((item) => item.topicName))];
  const label =
    names.length > 2
      ? `${names.slice(0, 2).join(", ")} +${names.length - 2} more`
      : names.join(", ");
  return { label, minutes };
}

function formatMinutes(total: number): string {
  if (total < 60) return `${total}m`;
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return rest > 0 ? `${hours}h ${rest}m` : `${hours}h`;
}

function topicKey(courseName: string, topicName: string): string {
  return `${courseName.trim().toLowerCase()}::${topicName.trim().toLowerCase()}`;
}

function studyItems(day: PlanDay | undefined): PlanItem[] {
  return (day?.items ?? []).filter((item) => item.type !== "break");
}

type PlanRow = {
  params: PlannerRequest | null;
  days: PlanDay[] | null;
  completed_days: string[] | null;
};

type CourseWithTopics = {
  name: string;
  topics: { name: string; is_completed: boolean }[] | null;
};

export default async function StudyPlanWidget({ className = "" }: { className?: string }) {
  const today = toDateKey(new Date());

  let plan: PlanRow | undefined;
  let coursesData: CourseWithTopics[];

  if (await isDemoMode()) {
    const demo = getDemoStudyPlanWidget();
    plan = {
      params: demo.plan.params,
      days: demo.plan.days,
      completed_days: demo.plan.completed_days,
    };
    coursesData = DEMO_COURSES.map((c) => ({
      name: c.name,
      topics: (DEMO_TOPICS[c.id] ?? []).map((t) => ({
        name: t.name,
        is_completed: t.is_completed,
      })),
    }));
  } else {
    const supabase = await createClient();

    const [planResult, coursesResult] = await Promise.all([
      supabase
        .from("study_plans")
        .select("params, days, completed_days")
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("courses")
        .select("name, topics(name, is_completed)"),
    ]);

    plan = (planResult.data ?? [])[0] as PlanRow | undefined;
    coursesData = (coursesResult.data ?? []) as CourseWithTopics[];
  }

  const completedTopicKeys = new Set<string>();
  for (const course of coursesData) {
    for (const topic of course.topics ?? []) {
      if (topic.is_completed) {
        completedTopicKeys.add(topicKey(course.name, topic.name));
      }
    }
  }

  const topicsFlat = coursesData.flatMap((course) => course.topics ?? []);
  const topicTotal = topicsFlat.length;
  const topicDone = topicsFlat.filter((topic) => topic.is_completed).length;
  const percent = topicTotal > 0 ? Math.round((topicDone / topicTotal) * 100) : 0;

  const days = Array.isArray(plan?.days)
    ? [...(plan?.days as PlanDay[])].sort((a, b) => a.date.localeCompare(b.date))
    : [];
  const upcoming = days.filter((day) => day.date >= today).slice(0, MAX_ITEMS_SHOWN);
  const params = plan?.params as PlannerRequest | null;

  const todayItems = studyItems(days.find((day) => day.date === today));
  const designatedMinutes = todayItems.reduce(
    (sum, item) => sum + item.durationMinutes,
    0
  );
  const dayDone = (plan?.completed_days ?? []).includes(today);
  const completedMinutes = dayDone
    ? designatedMinutes
    : todayItems.reduce(
        (sum, item) =>
          sum +
          (completedTopicKeys.has(topicKey(item.courseName, item.topicName))
            ? item.durationMinutes
            : 0),
        0
      );
  const todayPercent =
    designatedMinutes > 0
      ? Math.min(100, Math.round((completedMinutes / designatedMinutes) * 100))
      : 0;
  const ringOffset = RING_CIRCUMFERENCE * (1 - todayPercent / 100);

  const rangeLabel = params?.startDate
    ? `${formatDateKey(params.startDate)} – ${formatDateKey(
        params.endDate || params.startDate
      )}`
    : "";

  return (
    <WidgetCard
      title="Current Study Plan"
      href="/planner"
      action={
        <span className="text-xs font-medium text-muted">
          {topicTotal > 0 ? `${percent}% of topics done` : "No topics yet"}
        </span>
      }
      className={className}
    >
      {!plan ? (
        <WidgetEmpty>
          No study plan yet.{" "}
          <Link href="/planner" className="font-bold text-accent hover:text-accent-light">
            Generate one in the Planner
          </Link>
          .
        </WidgetEmpty>
      ) : (
        <>
          {rangeLabel && <p className="text-sm text-ink">{rangeLabel}</p>}
          <div className="mt-2 h-2.5 overflow-hidden rounded-full shadow-inset-sm">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>

          {upcoming.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              No upcoming sessions — this plan has finished.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {upcoming.map((day) => {
                const summary = summaryFor(day);
                return (
                  <li
                    key={day.date}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="min-w-0 truncate text-ink">
                      <span className="font-semibold text-accent">
                        {relativeDayLabel(day.date)}
                      </span>
                      <span className="text-muted"> · </span>
                      {summary.label || "Nothing scheduled"}
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-muted">
                      {summary.minutes} min
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-5 flex items-center gap-5 rounded-btn bg-surface p-4 shadow-inset-sm">
            <div className="relative h-28 w-28 shrink-0">
              <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                <circle
                  cx="60"
                  cy="60"
                  r={RING_RADIUS}
                  fill="none"
                  strokeWidth="12"
                  className="stroke-current text-ink/10"
                />
                <circle
                  cx="60"
                  cy="60"
                  r={RING_RADIUS}
                  fill="none"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={RING_CIRCUMFERENCE}
                  strokeDashoffset={ringOffset}
                  className="stroke-current text-accent transition-all duration-500"
                />
              </svg>
              <span className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-lg font-bold text-ink">
                  {todayPercent}%
                </span>
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-muted">
                Today's planned time
              </p>
              <p className="mt-1 text-sm font-semibold text-ink">
                {formatMinutes(completedMinutes)} done{" "}
                <span className="font-medium text-muted">
                  / {formatMinutes(designatedMinutes)}
                </span>
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                {designatedMinutes === 0
                  ? "No study time planned for today."
                  : todayPercent === 100
                    ? "All of today's plan is done."
                    : "Based on topics you've marked complete."}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <Link
              href="/planner"
              className="text-xs font-bold text-accent hover:text-accent-light"
            >
              Open planner →
            </Link>
          </div>
        </>
      )}
    </WidgetCard>
  );
}