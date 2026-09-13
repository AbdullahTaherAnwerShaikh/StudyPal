export type SyllabusTopic = {
  name: string;
  estimatedHours: number;
};

export type SyllabusExam = {
  name: string;
  date: string;
};

export type SyllabusExtractResult = {
  courseName: string;
  topics: SyllabusTopic[];
  exams: SyllabusExam[];
};

export type SyllabusInput = {
  image?: { mimeType: string; data: string };
  text?: string;
};

export const SYLLABUS_MODEL = "gemini-3.6-flash";

const API_URL = "https://generativelanguage.googleapis.com/v1beta/interactions";
const API_REVISION = "2026-05-20";
const RETRY_DELAY_MS = 4000;
const MAX_ATTEMPTS = 2;

export class SyllabusApiError extends Error {
  status: number;
  retryable: boolean;

  constructor(message: string, status: number, retryable: boolean) {
    super(message);
    this.name = "SyllabusApiError";
    this.status = status;
    this.retryable = retryable;
  }
}

const SYSTEM_PROMPT = `You extract course syllabus information from an image or pasted text.

Respond with a single JSON object. No markdown, no commentary, no extra text. It must match exactly this shape:

{
  "courseName": string,
  "topics": [
    {
      "name": string,
      "estimatedHours": integer
    }
  ],
  "exams": [
    {
      "name": string,
      "date": string
    }
  ]
}

Rules:
- courseName: the course title. If you cannot tell a course name from the input, return an empty string.
- topics: the topics, units, or modules covered by the course, in the order they appear.
- estimatedHours: how many hours a typical student needs to study that topic, ONLY if the syllabus makes it inferable (for example from lecture counts, weeks, sections, or credit weight). Otherwise use 0. Do not invent a value.
- exams: named tests or assessments. Convert any mentioned date to YYYY-MM-DD format. If an assessment is mentioned without a date, use an empty string. Ignore vague mentions that are not actual assessments.
- Use the input only. Ignore page headers, footers, and website navigation links.`;

function buildResponseSchema() {
  return {
    type: "object",
    properties: {
      courseName: { type: "string" },
      topics: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            estimatedHours: { type: "integer" },
          },
          required: ["name", "estimatedHours"],
        },
      },
      exams: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            date: { type: "string" },
          },
          required: ["name", "date"],
        },
      },
    },
    required: ["courseName", "topics", "exams"],
  };
}

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

function toNumber(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.round(number) : 0;
}

export function normalizeExtraction(raw: unknown): SyllabusExtractResult {
  if (typeof raw !== "object" || raw === null) {
    return { courseName: "", topics: [], exams: [] };
  }
  const record = raw as Record<string, unknown>;
  const courseName =
    typeof record.courseName === "string" ? record.courseName.trim() : "";
  const topics = Array.isArray(record.topics)
    ? record.topics.flatMap((item) => {
        if (typeof item !== "object" || item === null) return [];
        const topic = item as Record<string, unknown>;
        const name = typeof topic.name === "string" ? topic.name.trim() : "";
        return name ? [{ name, estimatedHours: toNumber(topic.estimatedHours) }] : [];
      })
    : [];
  const exams = Array.isArray(record.exams)
    ? record.exams.flatMap((item) => {
        if (typeof item !== "object" || item === null) return [];
        const exam = item as Record<string, unknown>;
        const name = typeof exam.name === "string" ? exam.name.trim() : "";
        return name
          ? [{ name, date: typeof exam.date === "string" ? exam.date.trim() : "" }]
          : [];
      })
    : [];
  return { courseName, topics, exams };
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

function buildInput(input: SyllabusInput): unknown[] {
  const blocks: unknown[] = [];
  if (input.image) {
    blocks.push({
      type: "image",
      mime_type: input.image.mimeType,
      data: input.image.data,
    });
  }
  if (input.text) {
    blocks.push({ type: "text", text: input.text });
  }
  return blocks;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callExtract(apiKey: string, input: SyllabusInput): Promise<string> {
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
        model: SYLLABUS_MODEL,
        system_instruction: SYSTEM_PROMPT,
        input: buildInput(input),
        response_format: {
          type: "text",
          mime_type: "application/json",
          schema: buildResponseSchema(),
        },
      }),
    });
  } catch {
    throw new SyllabusApiError(
      "Could not reach the Gemini API (network error).",
      0,
      true
    );
  }

  if (res.status === 429) {
    throw new SyllabusApiError(
      "Gemini free tier is rate-limited right now (HTTP 429). Wait a few seconds and try again.",
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
    throw new SyllabusApiError(
      `Gemini API error (HTTP ${res.status})${detail ? `: ${detail}` : ""}`,
      res.status,
      retryable
    );
  }

  const data = (await res.json()) as unknown;
  const text = extractResponseText(data);

  if (!text.trim()) {
    throw new SyllabusApiError(
      "Gemini returned an empty response. Try again.",
      502,
      true
    );
  }

  return text;
}

export async function extractSyllabus(
  apiKey: string,
  input: SyllabusInput
): Promise<SyllabusExtractResult> {
  let lastError: SyllabusApiError | null = null;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) await sleep(RETRY_DELAY_MS);
    try {
      const text = await callExtract(apiKey, input);
      const raw = extractJson(text);
      if (raw === null) {
        throw new SyllabusApiError(
          "The AI's response was not valid JSON. Try again.",
          502,
          true
        );
      }
      return normalizeExtraction(raw);
    } catch (err) {
      if (err instanceof SyllabusApiError && err.retryable) {
        lastError = err;
        continue;
      }
      throw err;
    }
  }
  throw lastError ?? new SyllabusApiError("Unknown Gemini failure.", 500, false);
}