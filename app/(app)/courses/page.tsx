import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import AddCourseButton from "@/components/courses/add-course-button";
import PageTitle from "@/components/ui/page-title";
import { CARD } from "@/components/ui/styles";

type CourseCard = {
  id: string;
  name: string;
  color: string;
  credits: number | null;
  examCount: number;
  topicCount: number;
};

export default async function CoursesPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .select("id, name, color, credits, exams(count), topics(count)")
    .order("created_at", { ascending: true });

  const courses: CourseCard[] = (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    color: row.color,
    credits: row.credits,
    examCount: Array.isArray(row.exams) ? row.exams[0]?.count ?? 0 : 0,
    topicCount: Array.isArray(row.topics) ? row.topics[0]?.count ?? 0 : 0,
  }));

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageTitle>Courses</PageTitle>
        <AddCourseButton />
      </div>
      <p className="mt-3 text-sm text-muted">
        Your subjects for this semester.
        {error && (
          <span className="font-semibold text-danger"> (Couldn&apos;t load counts.)</span>
        )}
      </p>

      {courses.length === 0 ? (
        <div className="mt-10 rounded-container bg-surface p-12 text-center shadow-inset">
          <p className="text-sm font-medium text-ink">No courses yet.</p>
          <p className="mt-1 text-xs text-muted">
            Click &quot;Add course&quot; to create your first one.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/courses/${course.id}`}
              className={`${CARD} block overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-extruded-hover`}
            >
              <div className="h-1.5" style={{ backgroundColor: course.color }} />
              <div className="p-6">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="truncate font-bold text-ink">{course.name}</h2>
                  {course.credits != null && (
                    <span className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold text-muted shadow-inset-sm">
                      {course.credits} cr
                    </span>
                  )}
                </div>
                <p className="mt-2 text-xs font-medium text-muted">
                  {course.examCount} exam{course.examCount === 1 ? "" : "s"} ·{" "}
                  {course.topicCount} topic{course.topicCount === 1 ? "" : "s"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
