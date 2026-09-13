export type PlannerTopic = {
  name: string;
  estimatedHours: number;
  doneHours: number;
};

export type PlannerCourse = {
  name: string;
  topics: PlannerTopic[];
};

export type PlannerExam = {
  courseName: string;
  examName: string;
  date: string;
};

export type PlannerAvailability = {
  weekdayHours: number;
  weekendHours: number;
};

export type PlannerRequest = {
  courses: PlannerCourse[];
  exams: PlannerExam[];
  availability: PlannerAvailability;
  startDate: string;
  endDate: string;
  blackoutDates: string[];
};

export type PlannerSourceCourse = PlannerCourse;

export type PlannerSourceExam = PlannerExam;

export type PlanItemType = "study" | "review" | "break";

export type PlanItem = {
  courseName: string;
  topicName: string;
  durationMinutes: number;
  type: PlanItemType;
};

export type PlanDay = {
  date: string;
  items: PlanItem[];
};

export type PlannerPlan = {
  days: PlanDay[];
  warnings: string[];
  model: string;
};

export type PlannerResult = PlannerPlan & {
  planId: string | null;
};

export type SavedPlanRow = {
  id: string;
  params: PlannerRequest;
  days: PlanDay[];
  warnings: string[];
  model: string;
  completed_days: string[];
};