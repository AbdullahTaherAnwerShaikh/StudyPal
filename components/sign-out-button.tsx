"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="flex min-h-[44px] w-full items-center gap-3 rounded-btn px-3 text-left text-sm text-muted transition-all duration-300 hover:text-danger hover:shadow-inset-sm"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Sign out
    </button>
  );
}
