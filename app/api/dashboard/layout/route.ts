import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { isDemoMode } from "@/lib/demo";
import {
  sanitizeDashboardLayout,
  serializeDashboardLayout,
} from "@/lib/dashboard-layout";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON in request body." }, { status: 400 });
  }

  const entries = sanitizeDashboardLayout((body as { layout?: unknown }).layout);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    if (await isDemoMode()) {
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const { error } = await supabase.from("user_settings").upsert(
    {
      user_id: user.id,
      dashboard_layout: serializeDashboardLayout(entries),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    const detail = `[${error.code ?? "unknown"}] ${error.message}${
      error.details ? ` — ${error.details}` : ""
    }`;
    console.error("Failed to save dashboard layout:", detail);
    return NextResponse.json(
      { error: "Failed to save layout.", detail },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}