import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import CourseActions from "@/components/courses/course-actions";
import ExamsSection from "@/components/courses/exams-section";
import TopicsSection from "@/components/courses/topics-section";
import { CARD } from "@/components/ui/styles";
import type { ExamRow, TopicRow } from "@/lib/types";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("id, name, color, credits")
    .eq("id", id)
    .maybeSingle();

  if (!course) notFound();

  const [examsResult, topicsResult] = await Promise.all([
    supabase
      .from("exams")
      .select("id, name, date, type")
      .eq("course_id", id)
      .order("date", { ascending: true }),
    supabase
      .from("topics")
      .select("id, name, estimated_hours, done_hours, is_completed")
      .eq("course_id", id)
      .order("name", { ascending: true }),
  ]);

  const exams = (examsResult.data ?? []) as ExamRow[];
  const topics = (topicsResult.data ?? []) as TopicRow[];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Link
        href="/courses"
        className="inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold text-muted hover:text-ink"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
          <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        All courses
      </Link>

      <div className={`flex flex-wrap items-center justify-between gap-4 p-6 sm:p-8 ${CARD}`}>
        <div className="flex items-center gap-4">
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-inner text-lg font-extrabold text-white"
            style={{ backgroundColor: course.color }}
          >
            {course.name[0]?.toUpperCase()}
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
              {course.name}
            </h1>
            <p className="mt-1 text-xs font-medium text-muted">
              {course.credits != null ? `${course.credits} credits · ` : ""}
              {exams.length} exam{exams.length === 1 ? "" : "s"} ·{" "}
              {topics.length} topic{topics.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <CourseActions course={course} />
      </div>

      <ExamsSection courseId={course.id} exams={exams} />
      <TopicsSection courseId={course.id} topics={topics} />
    </div>
  );
}
