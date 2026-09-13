import PageTitle from "@/components/ui/page-title";
import ThemeSettings from "@/components/settings/theme-settings";
import { createClient } from "@/lib/supabase-server";
import { sanitizeTheme, sanitizeThemeMode } from "@/lib/theme";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_settings")
    .select("theme, theme_mode")
    .maybeSingle();

  const theme = sanitizeTheme(data?.theme);
  const themeMode = sanitizeThemeMode(data?.theme_mode);

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle>Settings</PageTitle>
      <p className="mt-3 text-sm text-ink/55">
        Personalize how the app looks and behaves.
      </p>
      <div className="mt-6 max-w-xl space-y-4">
        <ThemeSettings initialTheme={theme} initialMode={themeMode} />
      </div>
    </div>
  );
}