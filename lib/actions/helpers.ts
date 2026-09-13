import { createClient } from "@/lib/supabase-server";
import type { ActionResult } from "@/lib/types";

export function fail(err: unknown): ActionResult {
  return {
    error: err instanceof Error ? err.message : "Something went wrong.",
  };
}

export async function getContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");
  return { supabase, userId: user.id };
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
