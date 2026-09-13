import { redirect } from "next/navigation";
import PageTitle from "@/components/ui/page-title";
import ProfileInfo from "@/components/settings/profile-info";
import { createClient } from "@/lib/supabase-server";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const displayName =
    typeof metadata.display_name === "string" ? metadata.display_name : "";
  const username =
    typeof metadata.username === "string" ? metadata.username : "";

  const memberSince = user.created_at
    ? new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
      }).format(new Date(user.created_at))
    : null;

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle>Profile</PageTitle>
      <p className="mt-3 text-sm text-ink/55">
        Your public profile and account details.
      </p>
      <div className="mt-6 max-w-xl space-y-4">
        <ProfileInfo
          initialDisplayName={displayName}
          initialUsername={username}
          memberSince={memberSince}
        />
      </div>
    </div>
  );
}