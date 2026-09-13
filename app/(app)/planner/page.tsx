import { createClient } from "@/lib/supabase-server";
import PlannerView from "@/components/planner/planner-view";
import type {
  PlannerCourse,
  PlannerExam,
  SavedPlanRow,
} from "@/lib/planner/types";

type CourseWithChildren = {
  name: string;
  topics: { name: string; estimated_hours: number; done_hours: number }[] | null;
  exams: { name: string; date: string }[] | null;
};

type SavedPlanRowData = {
  id: string;
  params: SavedPlanRow["params"] | null;
  days: SavedPlanRow["days"] | null;
  warnings: string[] | null;
  model: string | null;
  completed_days: string[] | null;
};

export default async function PlannerPage() {
  const supabase = await createClient();

  const [coursesResult, plansResult] = await Promise.all([
    supabase
      .from("courses")
      .select("name, topics(name, estimated_hours, done_hours), exams(name, date)")
      .order("created_at", { ascending: true }),
    supabase
      .from("study_plans")
      .select("id, params, days, warnings, model, completed_days")
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  const rows = (coursesResult.data ?? []) as unknown as CourseWithChildren[];

  const courses: PlannerCourse[] = rows.map((row) => ({
    name: row.name,
    topics: (row.topics ?? []).map((topic) => ({
      name: topic.name,
      estimatedHours: topic.estimated_hours,
      doneHours: topic.done_hours,
    })),
  }));

  const exams: PlannerExam[] = rows.flatMap((row) =>
    (row.exams ?? []).map((exam) => ({
      courseName: row.name,
      examName: exam.name,
      date: exam.date,
    }))
  );

  const latestRow = (plansResult.data ?? [])[0] as SavedPlanRowData | undefined;
  const latest: SavedPlanRow | null = latestRow
    ? {
        id: latestRow.id,
        params: latestRow.params ?? {
          courses: [],
          exams: [],
          availability: { weekdayHours: 2, weekendHours: 4 },
          startDate: "",
          endDate: "",
          blackoutDates: [],
        },
        days: latestRow.days ?? [],
        warnings: latestRow.warnings ?? [],
        model: latestRow.model ?? "",
        completed_days: latestRow.completed_days ?? [],
      }
    : null;

  return <PlannerView courses={courses} exams={exams} latest={latest} />;
}