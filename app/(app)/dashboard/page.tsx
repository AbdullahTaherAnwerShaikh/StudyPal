import { Suspense } from "react";
import type { ReactNode } from "react";
import TodaysSchedule from "@/components/dashboard/widget-todays-schedule";
import StudyPlanWidget from "@/components/dashboard/widget-study-plan";
import TasksWidget from "@/components/dashboard/widget-tasks";
import HabitsWidget from "@/components/dashboard/widget-habits";
import RecentNotes from "@/components/dashboard/widget-recent-notes";
import WidgetSkeleton from "@/components/dashboard/widget-skeleton";
import DashboardGrid from "@/components/dashboard/dashboard-grid";
import PageTitle from "@/components/ui/page-title";
import { createClient } from "@/lib/supabase-server";
import { isDemoMode } from "@/lib/demo";
import {
  DASHBOARD_WIDGETS,
  sanitizeDashboardLayout,
} from "@/lib/dashboard-layout";
import type { DashboardLayoutEntry, DashboardWidgetKey } from "@/lib/dashboard-layout";

const WIDGET_ELEMENTS: Record<DashboardWidgetKey, ReactNode> = {
  schedule: (
    <Suspense fallback={<WidgetSkeleton title="Today's Schedule" lines={4} />}>
      <TodaysSchedule />
    </Suspense>
  ),
  "study-plan": (
    <Suspense fallback={<WidgetSkeleton title="Current Study Plan" lines={3} />}>
      <StudyPlanWidget />
    </Suspense>
  ),
  tasks: (
    <Suspense fallback={<WidgetSkeleton title="Tasks" lines={5} />}>
      <TasksWidget />
    </Suspense>
  ),
  habits: (
    <Suspense fallback={<WidgetSkeleton title="Habits" lines={3} />}>
      <HabitsWidget />
    </Suspense>
  ),
  notes: (
    <Suspense fallback={<WidgetSkeleton title="Recent Notes" lines={3} />}>
      <RecentNotes />
    </Suspense>
  ),
};

export default async function DashboardPage() {
  let layout: DashboardLayoutEntry[];

  if (await isDemoMode()) {
    layout = sanitizeDashboardLayout([
      "schedule",
      "study-plan",
      "tasks",
      "habits",
      "notes",
    ]);
  } else {
    const supabase = await createClient();
    const { data } = await supabase
      .from("user_settings")
      .select("dashboard_layout")
      .maybeSingle();

    layout = sanitizeDashboardLayout(data?.dashboard_layout);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle>Your day at a glance</PageTitle>
      <p className="mt-3 text-sm text-ink/55">
        Live view of your plan, tasks, habits, and notes.
      </p>

      <div className="mt-6">
        <DashboardGrid
          initialLayout={layout}
          widgets={DASHBOARD_WIDGETS.map((widget) => ({
            key: widget.key,
            label: widget.label,
            element: WIDGET_ELEMENTS[widget.key],
          }))}
        />
      </div>
    </div>
  );
}