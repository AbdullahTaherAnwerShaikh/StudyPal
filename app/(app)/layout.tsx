import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { isDemoMode } from "@/lib/demo";
import DashboardShell from "@/components/dashboard/shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const demo = await isDemoMode();

  if (demo) {
    return <DashboardShell email="demo@studypal.app" demo>{children}</DashboardShell>;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <DashboardShell email={user.email ?? ""}>{children}</DashboardShell>;
}
