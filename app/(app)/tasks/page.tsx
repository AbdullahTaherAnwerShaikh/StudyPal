import { createClient } from "@/lib/supabase-server";
import { isDemoMode } from "@/lib/demo";
import { getDemoTasksPage } from "@/lib/demo-data";
import TasksView from "@/components/tasks/tasks-view";
import type { TaskRow } from "@/lib/types";

export default async function TasksPage() {
  if (await isDemoMode()) {
    return <TasksView {...getDemoTasksPage()} />;
  }

  const supabase = await createClient();
  const [tasksResult, coursesResult] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, due_date, priority, status, related_course_id")
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase.from("courses").select("id, name, color").order("name"),
  ]);

  return (
    <TasksView
      tasks={(tasksResult.data ?? []) as TaskRow[]}
      courses={coursesResult.data ?? []}
    />
  );
}
