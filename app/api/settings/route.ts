import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import {
  THEME_COOKIE,
  THEME_MODE_COOKIE,
  sanitizeTheme,
  sanitizeThemeMode,
} from "@/lib/theme";

export const runtime = "nodejs";

const COOKIE_OPTIONS = {
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
  sameSite: "lax" as const,
};

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON in request body." }, { status: 400 });
  }

  const { theme: rawTheme, theme_mode: rawMode } = (body ?? {}) as {
    theme?: unknown;
    theme_mode?: unknown;
  };
  const theme = sanitizeTheme(rawTheme);
  const themeMode = sanitizeThemeMode(rawMode);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const { error } = await supabase.from("user_settings").upsert(
    {
      user_id: user.id,
      theme,
      theme_mode: themeMode,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    const detail = `[${error.code ?? "unknown"}] ${error.message}${
      error.details ? ` — ${error.details}` : ""
    }`;
    console.error("Failed to save theme:", detail);
    return NextResponse.json(
      { error: "Failed to save theme.", detail },
      { status: 500 }
    );
  }

  const response = NextResponse.json({
    ok: true,
    theme,
    theme_mode: themeMode,
  });
  response.cookies.set(THEME_COOKIE, theme, COOKIE_OPTIONS);
  response.cookies.set(THEME_MODE_COOKIE, themeMode, COOKIE_OPTIONS);
  return response;
}