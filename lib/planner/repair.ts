import { DATE_RE, dayRange, isWeekend, parseDay } from "@/lib/planner/dates";
import { PlannerApiError } from "@/lib/planner/gemini";
import type { PlanDay, PlanItem, PlanItemType, PlannerRequest } from "@/lib/planner/types";

const VALID_TYPES: PlanItemType[] = ["study", "review", "break"];
const MIN_BLOCK_MINUTES = 15;
const MAX_BLOCK_MINUTES = 480;

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced ? fenced[1] : trimmed).trim();
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}

function normalizeItem(raw: unknown): PlanItem | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  const type = VALID_TYPES.find(
    (t) => record.type === t
  ) as PlanItemType | undefined;
  if (!type) return null;

  let duration = Math.round(Number(record.durationMinutes));
  if (!Number.isFinite(duration) || duration <= 0) duration = 60;
  if (type === "break") {
    duration = Math.min(Math.max(duration, 5), 30);
  } else {
    duration = Math.min(Math.max(duration, MIN_BLOCK_MINUTES), MAX_BLOCK_MINUTES);
  }

  return {
    courseName: typeof record.courseName === "string" ? record.courseName : "",
    topicName: typeof record.topicName === "string" ? record.topicName : "",
    durationMinutes: duration,
    type,
  };
}

function planFromRaw(raw: unknown): PlanDay[] | null {
  const array = Array.isArray(raw)
    ? raw
    : typeof raw === "object" &&
        raw !== null &&
        Array.isArray((raw as Record<string, unknown>).plan)
      ? ((raw as Record<string, unknown>).plan as unknown[])
      : null;
  if (!array) return null;

  const days: PlanDay[] = [];
  for (const entry of array) {
    if (typeof entry !== "object" || entry === null) continue;
    const record = entry as Record<string, unknown>;
    if (typeof record.date !== "string" || !DATE_RE.test(record.date)) continue;
    const items = Array.isArray(record.items)
      ? (record.items.map(normalizeItem).filter((item) => item !== null) as PlanItem[])
      : [];
    if (items.length > 0 || days.every((d) => d.date !== record.date)) {
      days.push({ date: record.date, items });
    }
  }
  return days;
}

function topicKey(courseName: string, topicName: string): string {
  return `${courseName.trim().toLowerCase()}::${topicName.trim().toLowerCase()}`;
}

type RemainingTopic = {
  courseKey: string;
  courseName: string;
  topicName: string;
  minutes: number;
  deadlineIndex: number;
};

export function repairPlan(text: string, request: PlannerRequest): { days: PlanDay[]; warnings: string[] } {
  const warnings: string[] = [];
  const range = dayRange(request.startDate, request.endDate);
  const indexByDate = new Map(range.map((date, index) => [date, index]));
  const blackoutDates = new Set(request.blackoutDates ?? []);

  const rawDays = planFromRaw(extractJson(text));
  if (!rawDays) {
    throw new PlannerApiError(
      "Gemini returned a response that is not valid plan JSON. Try again.",
      502,
      true
    );
  }

  const capacityMinutes = (date: string): number => {
    if (blackoutDates.has(date)) return 0;
    const weekend = isWeekend(parseDay(date));
    const hours = weekend
      ? request.availability.weekendHours
      : request.availability.weekdayHours;
    return Math.round(hours * 60);
  };

  const byDate = new Map<string, PlanItem[]>();
  for (const day of rawDays) {
    const index = indexByDate.get(day.date);
    if (index === undefined) {
      warnings.push(`Skipped "${day.date}" — it is outside the selected range.`);
      continue;
    }
    const list = byDate.get(day.date) ?? [];
    list.push(...day.items);
    byDate.set(day.date, list);
  }

  const dayMinutes = new Map<string, number>();
  for (const date of range) {
    let total = 0;
    for (const item of byDate.get(date) ?? []) {
      if (item.type !== "break") total += item.durationMinutes;
    }
    dayMinutes.set(date, total);
  }

  for (const date of range) {
    const used = dayMinutes.get(date) ?? 0;
    const cap = capacityMinutes(date);
    if (used <= cap) continue;
    const list = byDate.get(date) ?? [];
    let overflow = used - cap;
    for (let i = list.length - 1; i >= 0 && overflow > 0; i--) {
      const item = list[i];
      if (item.type === "break") continue;
      const removable = Math.min(item.durationMinutes, overflow);
      item.durationMinutes -= removable;
      overflow -= removable;
      if (item.durationMinutes <= 0) list.splice(i, 1);
    }
    dayMinutes.set(date, Math.min(used, cap));
    warnings.push(
      cap === 0
        ? `Removed scheduled study on ${date} — it is a blackout date.`
        : `Trimmed excess study time on ${date} to fit ${cap / 60}h of daily availability.`
    );
  }

  const examsForCourse = new Map<string, { examName: string; date: string }[]>();
  const earliestExamIndex = new Map<string, number>();
  for (const exam of request.exams) {
    const key = exam.courseName.trim().toLowerCase();
    const list = examsForCourse.get(key) ?? [];
    list.push({ examName: exam.examName, date: exam.date });
    examsForCourse.set(key, list);
    const idx = indexByDate.get(exam.date);
    if (idx !== undefined) {
      const current = earliestExamIndex.get(key);
      if (current === undefined || idx < current) earliestExamIndex.set(key, idx);
    }
  }

  const deadlineIndexFor = (courseKey: string): number =>
    earliestExamIndex.get(courseKey) ?? range.length;

  const remaining: RemainingTopic[] = [];
  for (const course of request.courses) {
    const courseKey = course.name.trim().toLowerCase();
    const deadlineIndex = deadlineIndexFor(courseKey);
    for (const topic of course.topics) {
      const minutes = Math.round((topic.estimatedHours - topic.doneHours) * 60);
      if (minutes < MIN_BLOCK_MINUTES) continue;
      remaining.push({
        courseKey,
        courseName: course.name,
        topicName: topic.name,
        minutes,
        deadlineIndex,
      });
    }
  }

  const studyMinutes = new Map<string, number>();
  for (const date of range) {
    for (const item of byDate.get(date) ?? []) {
      if (item.type === "break") continue;
      const key = topicKey(item.courseName, item.topicName);
      studyMinutes.set(key, (studyMinutes.get(key) ?? 0) + item.durationMinutes);
    }
  }

  const addItem = (date: string, item: PlanItem) => {
    const list = byDate.get(date) ?? [];
    list.push(item);
    byDate.set(date, list);
    if (item.type !== "break") {
      const used = dayMinutes.get(date) ?? 0;
      dayMinutes.set(date, used + item.durationMinutes);
      const key = topicKey(item.courseName, item.topicName);
      studyMinutes.set(key, (studyMinutes.get(key) ?? 0) + item.durationMinutes);
    }
  };

  remaining
    .sort((a, b) => a.deadlineIndex - b.deadlineIndex || a.topicName.localeCompare(b.topicName))
    .forEach((topic) => {
      const key = topicKey(topic.courseName, topic.topicName);
      let needed = Math.max(0, topic.minutes - (studyMinutes.get(key) ?? 0));
      if (needed <= 0) return;

      for (let index = 0; index < topic.deadlineIndex && needed > 0; index++) {
        const date = range[index];
        const used = dayMinutes.get(date) ?? 0;
        const free = capacityMinutes(date) - used;
        if (free < MIN_BLOCK_MINUTES) continue;
        const chunk = Math.min(needed, Math.min(free, 120));
        addItem(date, {
          courseName: topic.courseName,
          topicName: topic.topicName,
          durationMinutes: chunk,
          type: "study",
        });
        needed -= chunk;
      }

      if (needed > 0) {
        const deadlineDate =
          topic.deadlineIndex < range.length
            ? range[topic.deadlineIndex]
            : request.endDate;
        warnings.push(
          `Not enough available time to fully cover "${topic.courseName} — ${topic.topicName}" before ${deadlineDate}.`
        );
      }
    });

  const bufferedKey = (date: string, courseKey: string) => `${date}::${courseKey}`;
  const buffered = new Set<string>();
  for (const exam of request.exams) {
    const index = indexByDate.get(exam.date);
    if (index === undefined || index <= 0) continue;
    const courseKey = exam.courseName.trim().toLowerCase();
    const prevDate = range[index - 1];
    const bufferKey = bufferedKey(prevDate, courseKey);
    if (buffered.has(bufferKey)) continue;
    buffered.add(bufferKey);

    const list = byDate.get(prevDate) ?? [];
    const hasReview = list.some(
      (item) => item.type === "review" && topicKey(item.courseName, item.topicName) === topicKey(exam.courseName, exam.examName)
    );
    if (hasReview) continue;

    const used = dayMinutes.get(prevDate) ?? 0;
    const free = capacityMinutes(prevDate) - used;
    const minutes = Math.min(45, free);
    if (minutes >= MIN_BLOCK_MINUTES) {
      addItem(prevDate, {
        courseName: exam.courseName,
        topicName: exam.examName,
        durationMinutes: minutes,
        type: "review",
      });
    } else {
      warnings.push(
        `No room for a buffer review on ${prevDate} before "${exam.examName}".`
      );
    }
  }

  const days: PlanDay[] = range.map((date) => ({
    date,
    items: byDate.get(date) ?? [],
  }));

  return { days, warnings };
}