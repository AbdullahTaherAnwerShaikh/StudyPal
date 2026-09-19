import { toDateKey } from "@/lib/dates";
import type {
  CourseOption,
  CourseRow,
  ExamRow,
  HabitLogMap,
  HabitRow,
  NoteListItem,
  TaskRow,
  TopicRow,
} from "@/lib/types";
import type {
  PlanDay,
  PlannerCourse,
  PlannerExam,
  SavedPlanRow,
} from "@/lib/planner/types";

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function iso(date: Date): string {
  return date.toISOString();
}

const TODAY = new Date();
const TODAY_KEY = toDateKey(TODAY);

const CS_ID = "demo-cs";
const CALC_ID = "demo-calc";
const HIST_ID = "demo-hist";

export const DEMO_COURSES: (CourseRow & { created_at: string })[] = [
  { id: CS_ID, name: "Introduction to Computer Science", color: "#6c63ff", credits: 4, created_at: iso(addDays(TODAY, -60)) },
  { id: CALC_ID, name: "Calculus II", color: "#059669", credits: 3, created_at: iso(addDays(TODAY, -55)) },
  { id: HIST_ID, name: "World History", color: "#d97706", credits: 3, created_at: iso(addDays(TODAY, -50)) },
];

export const DEMO_TOPICS: Record<string, TopicRow[]> = {
  [CS_ID]: [
    { id: "t-cs-1", name: "Data Structures", estimated_hours: 12, done_hours: 8, is_completed: false },
    { id: "t-cs-2", name: "Algorithms", estimated_hours: 10, done_hours: 3, is_completed: false },
    { id: "t-cs-3", name: "Binary Trees", estimated_hours: 8, done_hours: 0, is_completed: false },
  ],
  [CALC_ID]: [
    { id: "t-calc-1", name: "Integration by Parts", estimated_hours: 6, done_hours: 6, is_completed: true },
    { id: "t-calc-2", name: "Series & Sequences", estimated_hours: 8, done_hours: 2, is_completed: false },
    { id: "t-calc-3", name: "Multivariable Calculus", estimated_hours: 10, done_hours: 0, is_completed: false },
  ],
  [HIST_ID]: [
    { id: "t-hist-1", name: "The Renaissance", estimated_hours: 5, done_hours: 5, is_completed: true },
    { id: "t-hist-2", name: "World War I", estimated_hours: 7, done_hours: 4, is_completed: false },
    { id: "t-hist-3", name: "Cold War Era", estimated_hours: 6, done_hours: 0, is_completed: false },
  ],
};

export const DEMO_EXAMS: Record<string, ExamRow[]> = {
  [CS_ID]: [
    { id: "e-cs-1", name: "Midterm Exam", date: toDateKey(addDays(TODAY, 14)), type: "exam" },
    { id: "e-cs-2", name: "Final Exam", date: toDateKey(addDays(TODAY, 60)), type: "exam" },
  ],
  [CALC_ID]: [
    { id: "e-calc-1", name: "Quiz 3", date: toDateKey(addDays(TODAY, 7)), type: "quiz" },
    { id: "e-calc-2", name: "Final Exam", date: toDateKey(addDays(TODAY, 60)), type: "exam" },
  ],
  [HIST_ID]: [
    { id: "e-hist-1", name: "Essay Due", date: toDateKey(addDays(TODAY, 10)), type: "essay" },
  ],
};

export const DEMO_TASKS: TaskRow[] = [
  { id: "task-1", title: "Read Chapter 5 — Data Structures", due_date: toDateKey(addDays(TODAY, 1)), priority: "high", status: "doing", related_course_id: CS_ID },
  { id: "task-2", title: "Complete Problem Set 7", due_date: toDateKey(addDays(TODAY, 3)), priority: "high", status: "todo", related_course_id: CALC_ID },
  { id: "task-3", title: "Write history essay outline", due_date: toDateKey(addDays(TODAY, 5)), priority: "medium", status: "todo", related_course_id: HIST_ID },
  { id: "task-4", title: "Review algorithm complexity", due_date: TODAY_KEY, priority: "medium", status: "doing", related_course_id: CS_ID },
  { id: "task-5", title: "Update study schedule", due_date: null, priority: "low", status: "todo", related_course_id: null },
  { id: "task-6", title: "Submit lab report", due_date: toDateKey(addDays(TODAY, -1)), priority: "high", status: "done", related_course_id: CS_ID },
];

export const DEMO_HABITS: HabitRow[] = [
  { id: "hab-1", name: "Review flashcards", streak: 5, scheduled_days: ["mon", "tue", "wed", "thu", "fri"] },
  { id: "hab-2", name: "Read for 30 minutes", streak: 12, scheduled_days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] },
  { id: "hab-3", name: "Exercise", streak: 3, scheduled_days: ["mon", "wed", "fri"] },
];

function buildHabitLogs(): HabitLogMap {
  const logs: HabitLogMap = {};
  for (const habit of DEMO_HABITS) {
    const dates: string[] = [];
    for (let i = 1; i < 7; i++) {
      const d = addDays(TODAY, -i);
      const key = toDateKey(d);
      const dayName = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][d.getDay()];
      if (habit.scheduled_days.includes(dayName)) {
        dates.push(key);
      }
    }
    logs[habit.id] = dates;
  }
  return logs;
}

export const DEMO_HABIT_LOGS: HabitLogMap = buildHabitLogs();

export const DEMO_NOTES: NoteListItem[] = [
  {
    id: "note-1",
    title: "Binary Search Trees — Key Concepts",
    content: "# Binary Search Trees\n\nA **BST** is a binary tree where each node follows the invariant:\n\n- Left subtree values < node value\n- Right subtree values > node value\n\n## Operations\n\n| Operation | Average | Worst |\n|-----------|---------|-------|\n| Search    | O(log n) | O(n) |\n| Insert    | O(log n) | O(n) |\n| Delete    | O(log n) | O(n) |\n\n## Traversal\n\n- **In-order** gives sorted sequence\n- **Pre-order** useful for copying\n- **Post-order** useful for deletion",
    tags: ["trees", "algorithms", "data-structures"],
    updated_at: iso(addDays(TODAY, -1)),
    course_id: CS_ID,
    topic_id: "t-cs-3",
    course_name: "Introduction to Computer Science",
    course_color: "#6c63ff",
    topic_name: "Binary Trees",
  },
  {
    id: "note-2",
    title: "Integration Techniques Cheat Sheet",
    content: "# Integration Techniques\n\n## Integration by Parts\n\n`∫ u dv = uv − ∫ v du`\n\nChoose `u` using LIATE:\n1. **L**ogarithmic\n2. **I**nverse trig\n3. **A**lgebraic\n4. **T**rigonometric\n5. **E**xponential\n\n## Key Formulas\n\n- `∫ x^n dx = x^(n+1)/(n+1) + C`\n- `∫ e^x dx = e^x + C`\n- `∫ sin(x) dx = -cos(x) + C`",
    tags: ["calculus", "reference", "formulas"],
    updated_at: iso(addDays(TODAY, -3)),
    course_id: CALC_ID,
    topic_id: "t-calc-1",
    course_name: "Calculus II",
    course_color: "#059669",
    topic_name: "Integration by Parts",
  },
  {
    id: "note-3",
    title: "Cold War Timeline",
    content: "# Cold War Timeline (1947–1991)\n\n## Key Events\n\n- **1947** — Truman Doctrine\n- **1948** — Berlin Blockade\n- **1950** — Korean War begins\n- **1955** — Warsaw Pact formed\n- **1961** — Berlin Wall built\n- **1962** — Cuban Missile Crisis\n- **1969** — Moon landing\n- **1979** — Soviet invasion of Afghanistan\n- **1989** — Fall of the Berlin Wall\n- **1991** — Dissolution of the USSR\n\n## Key Figures\n\n- Franklin D. Roosevelt\n- Joseph Stalin\n- John F. Kennedy\n- Nikita Khrushchev\n- Ronald Reagan\n- Mikhail Gorbachev",
    tags: ["history", "timeline", "cold-war"],
    updated_at: iso(addDays(TODAY, -5)),
    course_id: HIST_ID,
    topic_id: "t-hist-3",
    course_name: "World History",
    course_color: "#d97706",
    topic_name: "Cold War Era",
  },
];

function buildStudyPlan(): SavedPlanRow {
  const startDate = toDateKey(addDays(TODAY, -2));
  const endDate = toDateKey(addDays(TODAY, 12));

  const days: PlanDay[] = [];
  for (let i = -2; i <= 12; i++) {
    const d = addDays(TODAY, i);
    const key = toDateKey(d);
    const dow = d.getDay();
    const isWeekend = dow === 0 || dow === 6;

    const items: PlanDay["items"] = [];

    if (!isWeekend) {
      if (i <= 0) {
        items.push(
          { courseName: "Intro to CS", topicName: "Data Structures", durationMinutes: 45, type: "study" },
          { courseName: "Intro to CS", topicName: "Data Structures", durationMinutes: 15, type: "review" },
          { courseName: "Calculus II", topicName: "Series & Sequences", durationMinutes: 40, type: "study" },
        );
      } else if (i <= 5) {
        items.push(
          { courseName: "Intro to CS", topicName: "Algorithms", durationMinutes: 45, type: "study" },
          { courseName: "Calculus II", topicName: "Series & Sequences", durationMinutes: 30, type: "study" },
          { courseName: "World History", topicName: "World War I", durationMinutes: 30, type: "study" },
          { courseName: "Break", topicName: "Break", durationMinutes: 10, type: "break" },
        );
      } else {
        items.push(
          { courseName: "Intro to CS", topicName: "Binary Trees", durationMinutes: 40, type: "study" },
          { courseName: "Calculus II", topicName: "Multivariable Calculus", durationMinutes: 40, type: "study" },
          { courseName: "World History", topicName: "Cold War Era", durationMinutes: 30, type: "study" },
        );
      }
    } else {
      items.push(
        { courseName: "Intro to CS", topicName: "Data Structures", durationMinutes: 60, type: "review" },
        { courseName: "World History", topicName: "World War I", durationMinutes: 45, type: "review" },
      );
    }

    days.push({ date: key, items });
  }

  return {
    id: "demo-plan-1",
    params: {
      courses: [
        { name: "Intro to CS", topics: [
          { name: "Data Structures", estimatedHours: 12, doneHours: 8 },
          { name: "Algorithms", estimatedHours: 10, doneHours: 3 },
          { name: "Binary Trees", estimatedHours: 8, doneHours: 0 },
        ]},
        { name: "Calculus II", topics: [
          { name: "Integration by Parts", estimatedHours: 6, doneHours: 6 },
          { name: "Series & Sequences", estimatedHours: 8, doneHours: 2 },
          { name: "Multivariable Calculus", estimatedHours: 10, doneHours: 0 },
        ]},
        { name: "World History", topics: [
          { name: "The Renaissance", estimatedHours: 5, doneHours: 5 },
          { name: "World War I", estimatedHours: 7, doneHours: 4 },
          { name: "Cold War Era", estimatedHours: 6, doneHours: 0 },
        ]},
      ],
      exams: [
        { courseName: "Intro to CS", examName: "Midterm Exam", date: toDateKey(addDays(TODAY, 14)) },
        { courseName: "Calculus II", examName: "Quiz 3", date: toDateKey(addDays(TODAY, 7)) },
        { courseName: "World History", examName: "Essay Due", date: toDateKey(addDays(TODAY, 10)) },
      ],
      availability: { weekdayHours: 2.5, weekendHours: 4 },
      startDate,
      endDate,
      blackoutDates: [],
    },
    days,
    warnings: ["Midterm Exam for Intro to CS is in 2 weeks — consider extra review sessions."],
    model: "demo",
    completed_days: [toDateKey(addDays(TODAY, -2)), toDateKey(addDays(TODAY, -1))],
  };
}

export const DEMO_STUDY_PLAN: SavedPlanRow = buildStudyPlan();

export const DEMO_DASHBOARD_LAYOUT = ["schedule", "study-plan", "tasks", "habits", "notes"] as const;

export function getDemoCourseOptions(): CourseOption[] {
  return DEMO_COURSES.map((c) => ({ id: c.id, name: c.name, color: c.color }));
}

export function getDemoCoursesPage() {
  return DEMO_COURSES.map((c) => ({
    id: c.id,
    name: c.name,
    color: c.color,
    credits: c.credits,
    examCount: (DEMO_EXAMS[c.id] ?? []).length,
    topicCount: (DEMO_TOPICS[c.id] ?? []).length,
  }));
}

export function getDemoCourseDetail(id: string) {
  const course = DEMO_COURSES.find((c) => c.id === id);
  if (!course) return null;
  return {
    course: { id: course.id, name: course.name, color: course.color, credits: course.credits },
    exams: DEMO_EXAMS[id] ?? [],
    topics: DEMO_TOPICS[id] ?? [],
  };
}

export function getDemoTasksPage() {
  return { tasks: DEMO_TASKS, courses: getDemoCourseOptions() };
}

export function getDemoHabitsPage() {
  return { habits: DEMO_HABITS, logs: DEMO_HABIT_LOGS, today: TODAY_KEY };
}

export function getDemoNotesPage() {
  return { notes: DEMO_NOTES, courses: getDemoCourseOptions() };
}

export function getDemoPlannerPage() {
  const courses: PlannerCourse[] = DEMO_COURSES.map((c) => ({
    name: c.name,
    topics: (DEMO_TOPICS[c.id] ?? []).map((t) => ({
      name: t.name,
      estimatedHours: t.estimated_hours,
      doneHours: t.done_hours,
    })),
  }));

  const exams: PlannerExam[] = DEMO_COURSES.flatMap((c) =>
    (DEMO_EXAMS[c.id] ?? []).map((e) => ({
      courseName: c.name,
      examName: e.name,
      date: e.date,
    }))
  );

  return { courses, exams, latest: DEMO_STUDY_PLAN };
}

export function getDemoAssistantPage() {
  const courseNames = DEMO_COURSES.map((c) => c.name);
  const topicNames = DEMO_COURSES.flatMap((c) =>
    (DEMO_TOPICS[c.id] ?? []).map((t) => t.name)
  );

  const suggestions: string[] = [];
  if (topicNames[0]) suggestions.push(`Quiz me on ${topicNames[0]}`);
  if (courseNames[0]) suggestions.push(`Explain ${courseNames[0]} from scratch`);
  if (topicNames[1]) suggestions.push(`I'm stuck on ${topicNames[1]} — help me`);
  suggestions.push("What should I work on today?");

  return {
    greeting: "Hi, I'm your study assistant. I can see your courses and topics — ask me to explain something, quiz you, or figure out what to study next.",
    suggestions: suggestions.slice(0, 4),
  };
}

export function getDemoScheduleWidget() {
  const planDay = DEMO_STUDY_PLAN.days.find((d) => d.date === TODAY_KEY);
  const items = planDay?.items ?? [];
  const tasks = DEMO_TASKS.filter(
    (t) => t.due_date === TODAY_KEY && t.status !== "done"
  );
  return { items, tasks };
}

export function getDemoStudyPlanWidget() {
  const topicCount = DEMO_COURSES.flatMap((c) => DEMO_TOPICS[c.id] ?? []).length;
  const doneCount = DEMO_COURSES.flatMap((c) => DEMO_TOPICS[c.id] ?? []).filter(
    (t) => t.is_completed
  ).length;

  return { plan: DEMO_STUDY_PLAN, topicCount, doneCount };
}

export function getDemoTasksWidget() {
  return DEMO_TASKS.filter((t) => t.status !== "done");
}

export function getDemoHabitsWidget() {
  return { habits: DEMO_HABITS, logs: DEMO_HABIT_LOGS, today: TODAY_KEY };
}

export function getDemoRecentNotesWidget() {
  return DEMO_NOTES.slice(0, 4);
}
