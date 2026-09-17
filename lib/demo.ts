import { cookies } from "next/headers";
import { DEMO_COOKIE } from "@/lib/demo-cookie";

export { DEMO_COOKIE } from "@/lib/demo-cookie";

export async function isDemoMode(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(DEMO_COOKIE)?.value === "1";
}