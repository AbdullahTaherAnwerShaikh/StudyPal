import { buildSystemPrompt, buildUserPrompt } from "@/lib/planner/prompt";
import type { PlannerRequest } from "@/lib/planner/types";

export const MODEL = "gemini-3.6-flash";
const API_URL = "https://generativelanguage.googleapis.com/v1beta/interactions";
const API_REVISION = "2026-05-20";
const RETRY_DELAY_MS = 4000;
const MAX_ATTEMPTS = 2;

export class PlannerApiError extends Error {
  status: number;
  retryable: boolean;

  constructor(message: string, status: number, retryable: boolean) {
    super(message);
    this.name = "PlannerApiError";
    this.status = status;
    this.retryable = retryable;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildResponseSchema() {
  return {
    type: "object",
    properties: {
      plan: {
        type: "array",
        items: {
          type: "object",
          properties: {
            date: { type: "string" },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  courseName: { type: "string" },
                  topicName: { type: "string" },
                  durationMinutes: { type: "integer" },
                  type: {
                    type: "string",
                    enum: ["study", "review", "break"],
                  },
                },
                required: ["courseName", "topicName", "durationMinutes", "type"],
              },
            },
          },
          required: ["date", "items"],
        },
      },
    },
    required: ["plan"],
  };
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

async function callGemini(apiKey: string, request: PlannerRequest): Promise<string> {
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
        model: MODEL,
        system_instruction: buildSystemPrompt(),
        input: buildUserPrompt(request),
        response_format: {
          type: "text",
          mime_type: "application/json",
          schema: buildResponseSchema(),
        },
      }),
    });
  } catch {
    throw new PlannerApiError(
      "Could not reach the Gemini API (network error).",
      0,
      true
    );
  }

  if (res.status === 429) {
    throw new PlannerApiError(
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
    throw new PlannerApiError(
      `Gemini API error (HTTP ${res.status})${detail ? `: ${detail}` : ""}`,
      res.status,
      retryable
    );
  }

  const data = (await res.json()) as unknown;
  const text = extractResponseText(data);

  if (!text.trim()) {
    throw new PlannerApiError(
      "Gemini returned an empty response. Try again.",
      502,
      true
    );
  }

  return text;
}

export async function generatePlanJson(
  apiKey: string,
  request: PlannerRequest
): Promise<string> {
  let lastError: PlannerApiError | null = null;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) await sleep(RETRY_DELAY_MS);
    try {
      return await callGemini(apiKey, request);
    } catch (err) {
      if (err instanceof PlannerApiError && err.retryable) {
        lastError = err;
        continue;
      }
      throw err;
    }
  }
  throw lastError ?? new PlannerApiError("Unknown Gemini failure.", 500, false);
}