import { redirect } from "next/navigation";
import PageTitle from "@/components/ui/page-title";
import AccountSettings from "@/components/settings/account-settings";
import { createClient } from "@/lib/supabase-server";

const PROVIDER_LABELS: Record<string, string> = {
  google: "Google",
  github: "GitHub",
  email: "Email & password",
};

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const appMetadata = (user.app_metadata ?? {}) as Record<string, unknown>;
  const identities = user.identities ?? [];

  const primaryProvider =
    typeof appMetadata.provider === "string"
      ? appMetadata.provider
      : (identities[0]?.provider ?? "email");

  const hasPassword =
    primaryProvider === "email" ||
    identities.some((identity) => identity.provider === "email");

  const providerLabel =
    PROVIDER_LABELS[primaryProvider] ??
    primaryProvider.charAt(0).toUpperCase() + primaryProvider.slice(1);

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle>Account</PageTitle>
      <p className="mt-3 text-sm text-ink/55">
        Manage your sign-in details and account security.
      </p>
      <div className="mt-6 max-w-xl">
        <AccountSettings
          email={user.email ?? "Not available"}
          providerLabel={providerLabel}
          hasPassword={hasPassword}
        />
      </div>
    </div>
  );
}