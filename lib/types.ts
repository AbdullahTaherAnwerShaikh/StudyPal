export type ActionResult = { error: string | null };

export type CourseRow = {
  id: string;
  name: string;
  color: string;
  credits: number | null;
};

export type ExamRow = {
  id: string;
  name: string;
  date: string;
  type: string;
};

export type TopicRow = {
  id: string;
  name: string;
  estimated_hours: number;
  done_hours: number;
  is_completed: boolean;
};

export type TaskRow = {
  id: string;
  title: string;
  due_date: string | null;
  priority: "low" | "medium" | "high";
  status: "todo" | "doing" | "done";
  related_course_id: string | null;
};

export type HabitRow = {
  id: string;
  name: string;
  streak: number;
  scheduled_days: string[];
};

export type HabitLogMap = Record<string, string[]>;

export type CourseOption = {
  id: string;
  name: string;
  color: string;
};

export type NoteListItem = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  updated_at: string;
  course_id: string | null;
  topic_id: string | null;
  course_name: string | null;
  course_color: string | null;
  topic_name: string | null;
};
