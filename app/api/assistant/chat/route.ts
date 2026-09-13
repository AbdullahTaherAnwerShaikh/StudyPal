import { NextResponse } from "next/server";
import {
  ASSISTANT_MODEL,
  AssistantApiError,
  AssistantCourse,
  buildCoursesSummary,
  buildSystemPrompt,
  buildTranscript,
  runChat,
} from "@/lib/assistant/gemini";
import { createClient } from "@/lib/supabase-server";
import type { AssistantMessage } from "@/lib/assistant/gemini";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_MESSAGES = 40;
const MAX_CONTENT_LENGTH = 10000;

type CourseRow = {
  name: string;
  topics: { name: string }[] | null;
  exams: { name: string; date: string }[] | null;
};

function parseMessages(value: unknown): AssistantMessage[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;

  const rawMessages = value.slice(-MAX_MESSAGES);
  const messages: AssistantMessage[] = [];

  for (const entry of rawMessages) {
    if (typeof entry !== "object" || entry === null) return null;
    const record = entry as Record<string, unknown>;
    const role = record.role;
    const content = record.content;
    if (role !== "user" && role !== "assistant") return null;
    if (typeof content !== "string") return null;
    const text = content.trim().slice(0, MAX_CONTENT_LENGTH);
    if (!text) return null;
    messages.push({ role, content: text });
  }

  if (messages.length === 0) return null;
  if (messages[messages.length - 1].role !== "user") return null;
  return messages;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body." },
      { status: 400 }
    );
  }

  const raw = body as Record<string, unknown>;
  const messages = parseMessages(raw.messages);
  if (!messages) {
    return NextResponse.json(
      { error: "Provide a messages array ending with a user message." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to talk to the assistant." },
      { status: 401 }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Server is missing GEMINI_API_KEY. Add your Google AI Studio API key to .env.local and restart the dev server.",
      },
      { status: 500 }
    );
  }

  let rows: CourseRow[] = [];
  try {
    const { data, error } = await supabase
      .from("courses")
      .select("name, topics(name, estimated_hours, done_hours), exams(name, date)")
      .order("created_at", { ascending: true });
    if (error) {
      return NextResponse.json(
        { error: "Couldn't load your courses for context." },
        { status: 500 }
      );
    }
    rows = (data ?? []) as unknown as CourseRow[];
  } catch {
    return NextResponse.json(
      { error: "Couldn't load your courses for context." },
      { status: 500 }
    );
  }

  const courses: AssistantCourse[] = rows.map((row) => ({
    name: row.name,
    topics: (row.topics ?? []).map((topic) => ({
      name: topic.name,
      estimatedHours: 0,
      doneHours: 0,
    })),
    exams: (row.exams ?? []).map((exam) => ({
      name: exam.name,
      date: exam.date,
    })),
  }));

  const systemPrompt = buildSystemPrompt(buildCoursesSummary(courses));
  const transcript = buildTranscript(messages);

  try {
    const reply = await runChat(apiKey, systemPrompt, transcript);
    return NextResponse.json({ reply, model: ASSISTANT_MODEL });
  } catch (err) {
    if (err instanceof AssistantApiError) {
      const status = err.status === 429 ? 429 : 502;
      return NextResponse.json(
        {
          error: err.message,
          retryable: err.retryable,
          rateLimited: err.status === 429,
        },
        { status }
      );
    }
    return NextResponse.json(
      { error: "An unexpected server error occurred while talking to the assistant." },
      { status: 500 }
    );
  }
}