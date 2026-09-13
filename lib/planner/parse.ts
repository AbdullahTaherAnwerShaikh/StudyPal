import { DATE_RE, parseDay } from "@/lib/planner/dates";
import type { PlannerRequest } from "@/lib/planner/types";

type ParseResult =
  | { ok: true; value: PlannerRequest }
  | { ok: false; message: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function parseRequest(body: unknown): ParseResult {
  if (!isRecord(body)) {
    return { ok: false, message: "Request body must be a JSON object." };
  }

  const courses: PlannerRequest["courses"] = [];
  if (!Array.isArray(body.courses) || body.courses.length === 0) {
    return { ok: false, message: '"courses" must be a non-empty array.' };
  }
  for (const course of body.courses) {
    if (!isRecord(course) || typeof course.name !== "string" || !course.name.trim()) {
      return { ok: false, message: 'Each course needs a non-empty "name".' };
    }
    if (!Array.isArray(course.topics)) {
      return {
        ok: false,
        message: `Course "${course.name}" needs a "topics" array.`,
      };
    }
    const topics = [];
    for (const topic of course.topics) {
      if (!isRecord(topic) || typeof topic.name !== "string" || !topic.name.trim()) {
        return {
          ok: false,
          message: `Course "${course.name}" has a topic without a name.`,
        };
      }
      if (
        !isFiniteNumber(topic.estimatedHours) ||
        !isFiniteNumber(topic.doneHours) ||
        topic.estimatedHours < 0 ||
        topic.doneHours < 0
      ) {
        return {
          ok: false,
          message: `Topic "${topic.name}" needs numeric estimatedHours and doneHours >= 0.`,
        };
      }
      topics.push({
        name: topic.name,
        estimatedHours: topic.estimatedHours,
        doneHours: topic.doneHours,
      });
    }
    courses.push({ name: course.name.trim(), topics });
  }

  const exams: PlannerRequest["exams"] = [];
  if (!Array.isArray(body.exams)) {
    return { ok: false, message: '"exams" must be an array.' };
  }
  for (const exam of body.exams) {
    if (
      !isRecord(exam) ||
      typeof exam.courseName !== "string" ||
      typeof exam.examName !== "string" ||
      typeof exam.date !== "string" ||
      !DATE_RE.test(exam.date)
    ) {
      return {
        ok: false,
        message: 'Each exam needs "courseName", "examName", and a "date" (YYYY-MM-DD).',
      };
    }
    exams.push({
      courseName: exam.courseName,
      examName: exam.examName,
      date: exam.date,
    });
  }

  if (!isRecord(body.availability)) {
    return { ok: false, message: '"availability" must be an object.' };
  }
  const weekdayHours = Number(body.availability.weekdayHours);
  const weekendHours = Number(body.availability.weekendHours);
  if (
    !isFiniteNumber(weekdayHours) ||
    !isFiniteNumber(weekendHours) ||
    weekdayHours < 0 ||
    weekdayHours > 24 ||
    weekendHours < 0 ||
    weekendHours > 24 ||
    weekdayHours + weekendHours === 0
  ) {
    return {
      ok: false,
      message: '"availability.weekdayHours" and "weekendHours" must be numbers between 0 and 24, with some study time available.',
    };
  }

  if (
    typeof body.startDate !== "string" ||
    !DATE_RE.test(body.startDate) ||
    typeof body.endDate !== "string" ||
    !DATE_RE.test(body.endDate)
  ) {
    return {
      ok: false,
      message: '"startDate" and "endDate" must be dates in YYYY-MM-DD format.',
    };
  }
  if (parseDay(body.endDate).getTime() < parseDay(body.startDate).getTime()) {
    return { ok: false, message: '"endDate" must be on or after "startDate".' };
  }

  const blackoutDates: string[] = [];
  if (body.blackoutDates !== undefined) {
    if (
      !Array.isArray(body.blackoutDates) ||
      body.blackoutDates.some(
        (date) => typeof date !== "string" || !DATE_RE.test(date)
      )
    ) {
      return {
        ok: false,
        message: '"blackoutDates" must be an array of dates in YYYY-MM-DD format.',
      };
    }
    blackoutDates.push(...(body.blackoutDates as string[]));
  }

  return {
    ok: true,
    value: {
      courses,
      exams,
      availability: { weekdayHours, weekendHours },
      startDate: body.startDate,
      endDate: body.endDate,
      blackoutDates: [...new Set(blackoutDates)].sort(),
    },
  };
}