import { redirect } from "next/navigation";
import PageTitle from "@/components/ui/page-title";
import { createClient } from "@/lib/supabase-server";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const appMetadata = (user.app_metadata ?? {}) as Record<string, unknown>;
  const provider =
    typeof appMetadata.provider === "string" &&
    appMetadata.provider.length > 0
      ? appMetadata.provider
      : "Email";

  const displayName =
    typeof user.user_metadata?.full_name === "string" &&
    user.user_metadata.full_name.length > 0
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === "string" &&
          user.user_metadata.name.length > 0
        ? user.user_metadata.name
        : null;

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle>Profile</PageTitle>
      <p className="mt-3 text-sm text-ink/55">
        Your account details as provided by your sign-in method.
      </p>
      <div className="mt-6 max-w-xl space-y-4">
        <section className="rounded-container bg-surface p-6 shadow-extruded">
          <dl className="space-y-4">
            {displayName && (
              <div>
                <dt className="text-xs font-semibold text-muted">Name</dt>
                <dd className="mt-1 text-sm font-bold text-ink">
                  {displayName}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-xs font-semibold text-muted">Email</dt>
              <dd className="mt-1 text-sm font-bold text-ink">
                {user.email ?? "Not available"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-muted">
                Signed in via
              </dt>
              <dd className="mt-1 text-sm font-bold text-ink">{provider}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}