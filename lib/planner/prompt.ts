import type { PlannerRequest } from "@/lib/planner/types";

const SYSTEM_PROMPT = `You are an expert study planner that produces a realistic, day-by-day study schedule.

Your response must be a single JSON object. No markdown, no extra text, no commentary. It must match exactly this shape:

{
  "plan": [
    {
      "date": "YYYY-MM-DD",
      "items": [
        {
          "courseName": string,
          "topicName": string,
          "durationMinutes": integer,
          "type": "study" | "review" | "break"
        }
      ]
    }
  ]
}

Rules:
- Every day in the requested date range must appear exactly once, even if its items list is empty.
- Only use course names and topic names exactly as given by the user (verbatim, same casing).
- "study" = first time learning a topic. "review" = revisiting a topic, especially close to an exam. "break" = a short rest between blocks (5-15 minutes).
- Never schedule a topic after the start of its course's earliest exam.
- Never schedule anything on a blackout date (the user is fully unavailable those days).
- Put a short "review" item for that course on the day before each exam as a buffer.
- Total minutes of "study" + "review" on any day must not exceed the user's daily availability for that day.
- Make sure every topic is covered at least once before its exam. Distribute larger topics across multiple days with realistic block sizes of 45-120 minutes each.
- Keep the schedule realistic: don't cram everything into one day, and don't leave obvious gaps you could have used for studying.`;

export function buildSystemPrompt(): string {
  return SYSTEM_PROMPT;
}

export function buildUserPrompt(request: PlannerRequest): string {
  const data = {
    dateRange: {
      startDate: request.startDate,
      endDate: request.endDate,
    },
    availability: request.availability,
    blackoutDates: request.blackoutDates,
    courses: request.courses,
    exams: request.exams,
  };

  return `Plan my studies.

Start date: ${request.startDate}
End date: ${request.endDate} (inclusive)

My daily availability:
- Weekdays: ${request.availability.weekdayHours} hours per day
- Weekends: ${request.availability.weekendHours} hours per day
- Blackout dates (fully unavailable): ${
    request.blackoutDates.length > 0
      ? request.blackoutDates.join(", ")
      : "none"
  }

Here is my data:

${JSON.stringify(data, null, 2)}

Return only the JSON plan object.`;
}