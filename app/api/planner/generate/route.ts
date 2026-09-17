import { NextResponse } from "next/server";
import { MODEL, PlannerApiError, generatePlanJson } from "@/lib/planner/gemini";
import { parseRequest } from "@/lib/planner/parse";
import { repairPlan } from "@/lib/planner/repair";
import { createClient } from "@/lib/supabase-server";
import { isDemoMode } from "@/lib/demo";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON in request body." }, { status: 400 });
  }

  const parsed = parseRequest(body);
  if (parsed.ok === false) {
    return NextResponse.json({ error: parsed.message }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    if (await isDemoMode()) {
      return NextResponse.json(
        { error: "Plan generation is turned off in demo mode. Sign in for a real account to generate a new plan." },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "You must be signed in to generate a plan." },
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
    const rawText = await generatePlanJson(apiKey, parsed.value);
    const { days, warnings } = repairPlan(rawText, parsed.value);

    let planId: string | null = null;
    const { data: saved, error: saveError } = await supabase
      .from("study_plans")
      .insert({
        user_id: user.id,
        params: parsed.value,
        days,
        warnings,
        model: MODEL,
      })
      .select("id")
      .single();

    if (saveError || !saved) {
      const detail = saveError
        ? `[${saveError.code ?? "unknown"}] ${saveError.message}${
            saveError.details ? ` — ${saveError.details}` : ""
          }`
        : "The insert returned no row.";
      console.error("Failed to save study plan:", detail);
      warnings.push(`Couldn't save the plan: ${detail}`);
    } else {
      planId = saved.id;
    }

    return NextResponse.json({
      planId,
      days,
      warnings,
      model: MODEL,
    });
  } catch (err) {
    if (err instanceof PlannerApiError) {
      const status = err.status === 429 ? 429 : 502;
      return NextResponse.json(
        { error: err.message, retryable: err.retryable },
        { status }
      );
    }
    return NextResponse.json(
      { error: "An unexpected server error occurred while generating the plan." },
      { status: 500 }
    );
  }
}