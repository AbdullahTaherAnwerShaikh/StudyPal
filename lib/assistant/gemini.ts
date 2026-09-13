export type AssistantMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AssistantCourse = {
  name: string;
  topics: { name: string; estimatedHours: number; doneHours: number }[];
  exams: { name: string; date: string }[];
};

export const ASSISTANT_MODEL = "gemini-3.6-flash";

const API_URL = "https://generativelanguage.googleapis.com/v1beta/interactions";
const API_REVISION = "2026-05-20";
const RETRY_DELAY_MS = 4000;
const MAX_ATTEMPTS = 2;

export class AssistantApiError extends Error {
  status: number;
  retryable: boolean;

  constructor(message: string, status: number, retryable: boolean) {
    super(message);
    this.name = "AssistantApiError";
    this.status = status;
    this.retryable = retryable;
  }
}

export function buildCoursesSummary(courses: AssistantCourse[]): string {
  if (courses.length === 0) {
    return "The user has no courses yet.";
  }

  const lines: string[] = [];
  for (const course of courses) {
    lines.push(`Course: ${course.name}`);
    if (course.topics.length > 0) {
      lines.push(
        `  Topics: ${course.topics.map((topic) => topic.name).join(", ")}`
      );
    }
    const dated = course.exams.filter((exam) => exam.date);
    const undated = course.exams.filter((exam) => !exam.date);
    if (dated.length > 0) {
      lines.push(
        `  Exams: ${dated
          .map((exam) => `${exam.name} (${exam.date})`)
          .join(", ")}`
      );
    }
    if (undated.length > 0) {
      lines.push(
        `  Exams (no date set): ${undated.map((exam) => exam.name).join(", ")}`
      );
    }
  }
  return lines.join("\n");
}

export function buildSystemPrompt(coursesSummary: string): string {
  return `You are a friendly, encouraging AI study assistant for the user's personal study dashboard.

Here is a summary of the user's current courses and topics:

----- COURSES -----
${coursesSummary}
-------------------

Use this context to make every answer meaningful to the user's actual coursework:
- When asked to explain something, explain it clearly using the user's own course material where relevant.
- When asked to quiz the user, ask ONE question at a time, then give brief feedback on the answer before moving on.
- When asked to prioritize or plan, work from their actual topics and exam dates.
- If the user asks about something not in their course list, be honest about it, but still help where you can.

Guidelines:
- Respond in short, well-structured markdown (headings, bullet lists) so it renders nicely in a chat bubble.
- Be concise: prefer a few tight paragraphs or bullets over walls of text.
- Never invent facts about the user's courses, grades, or history.
- Never claim you can access the internet or external files.`;
}

export function buildTranscript(messages: AssistantMessage[]): string {
  return messages
    .map((message) =>
      `${
        message.role === "user" ? "User" : "Assistant"
      }: ${message.content}`
    )
    .join("\n\n");
}

function extractResponseText(data: unknown): string {
  if (typeof data !== "object" || data === null) return "";
  const record = data as Record<string, unknown>;
  if (typeof record.output_text === "string") return record.output_text;

  const steps = Array.isArray(record.steps)
    ? record.steps
    : Array.isArray(record.outputs)
      ? record.outputs
      : null;
  if (!steps) return "";

  const parts: string[] = [];
  for (const step of steps) {
    if (typeof step !== "object" || step === null) continue;
    const entry = step as Record<string, unknown>;
    const content = Array.isArray(entry.content) ? entry.content : [entry];
    for (const block of content) {
      if (typeof block !== "object" || block === null) continue;
      const item = block as Record<string, unknown>;
      if (item.type === "text" && typeof item.text === "string") {
        parts.push(item.text);
      }
    }
  }
  return parts.join("");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callChat(
  apiKey: string,
  systemPrompt: string,
  transcript: string
): Promise<string> {
  let res: Response;
  try {
    res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
        "Api-Revision": API_REVISION,
      },
      body: JSON.stringify({
        model: ASSISTANT_MODEL,
        system_instruction: systemPrompt,
        input: transcript,
      }),
    });
  } catch {
    throw new AssistantApiError(
      "Could not reach the Gemini API (network error).",
      0,
      true
    );
  }

  if (res.status === 429) {
    throw new AssistantApiError(
      "Gemini's free tier is rate-limited right now. Give it a moment, then try again.",
      429,
      true
    );
  }

  if (!res.ok) {
    let detail = "";
    try {
      const data = (await res.json()) as { error?: { message?: string } };
      if (data?.error?.message) detail = data.error.message;
    } catch {
      // non-JSON error body; fall through with empty detail
    }
    const retryable = res.status === 500 || res.status === 503;
    throw new AssistantApiError(
      `Gemini API error (HTTP ${res.status})${detail ? `: ${detail}` : ""}`,
      res.status,
      retryable
    );
  }

  const data = (await res.json()) as unknown;
  const text = extractResponseText(data);

  if (!text.trim()) {
    throw new AssistantApiError(
      "Gemini returned an empty response. Try again.",
      502,
      true
    );
  }

  return text.trim();
}

export async function runChat(
  apiKey: string,
  systemPrompt: string,
  transcript: string
): Promise<string> {
  let lastError: AssistantApiError | null = null;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) await sleep(RETRY_DELAY_MS);
    try {
      return await callChat(apiKey, systemPrompt, transcript);
    } catch (err) {
      if (err instanceof AssistantApiError && err.retryable) {
        lastError = err;
        continue;
      }
      throw err;
    }
  }
  throw lastError ?? new AssistantApiError("Unknown Gemini failure.", 500, false);
}