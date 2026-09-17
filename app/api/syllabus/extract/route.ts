import { NextResponse } from "next/server";
import {
  SyllabusApiError,
  extractSyllabus,
  type SyllabusInput,
} from "@/lib/syllabus/extract";
import { createClient } from "@/lib/supabase-server";
import { isDemoMode } from "@/lib/demo";

export const runtime = "nodejs";
export const maxDuration = 45;

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const IMAGE_RE = /^data:image\/(jpeg|png|webp|gif);base64,([A-Za-z0-9+/=\s]+)$/;

function parsePayload(body: unknown): SyllabusInput | { error: string } {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { error: "Request body must be a JSON object." };
  }
  const record = body as Record<string, unknown>;
  const imageRaw = typeof record.image === "string" ? record.image : null;
  const text = typeof record.text === "string" ? record.text.trim() : "";

  let image: SyllabusInput["image"];
  if (imageRaw) {
    const match = IMAGE_RE.exec(imageRaw);
    if (!match) {
      return {
        error: "Image must be a base64 data URL in JPEG, PNG, WebP, or GIF format.",
      };
    }
    const data = match[2].replace(/\s+/g, "");
    if (Math.floor((data.length * 3) / 4) > MAX_IMAGE_BYTES) {
      return { error: "Image is too large (max 20 MB)." };
    }
    image = { mimeType: `image/${match[1]}`, data };
  }

  if (!image && !text) {
    return { error: "Provide an image or pasted text to extract from." };
  }

  return { image, text: text || undefined };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON in request body." }, { status: 400 });
  }

  const payload = parsePayload(body);
  if ("error" in payload) {
    return NextResponse.json(payload, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    if (await isDemoMode()) {
      return NextResponse.json(
        { error: "Syllabus import is turned off in demo mode. Sign in for a real account to import a syllabus." },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "You must be signed in to use this." },
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

  try {
    const result = await extractSyllabus(apiKey, payload);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof SyllabusApiError) {
      const status = err.status === 429 ? 429 : 502;
      return NextResponse.json(
        { error: err.message, retryable: err.retryable },
        { status }
      );
    }
    return NextResponse.json(
      { error: "An unexpected server error occurred while reading the syllabus." },
      { status: 500 }
    );
  }
}