import PageTitle from "@/components/ui/page-title";
import ThemeSettings from "@/components/settings/theme-settings";
import { createClient } from "@/lib/supabase-server";
import { isDemoMode } from "@/lib/demo";
import { sanitizeTheme, sanitizeThemeMode } from "@/lib/theme";

export default async function SettingsPage() {
  const demo = await isDemoMode();

  let theme: ReturnType<typeof sanitizeTheme>;
  let themeMode: ReturnType<typeof sanitizeThemeMode>;

  if (demo) {
    theme = sanitizeTheme(undefined);
    themeMode = sanitizeThemeMode(undefined);
  } else {
    const supabase = await createClient();
    const { data } = await supabase
      .from("user_settings")
      .select("theme, theme_mode")
      .maybeSingle();

    theme = sanitizeTheme(data?.theme);
    themeMode = sanitizeThemeMode(data?.theme_mode);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle>Settings</PageTitle>
      <p className="mt-3 text-sm text-ink/55">
        Personalize how the app looks and behaves.
      </p>
      <div className="mt-6 max-w-xl space-y-4">
        <ThemeSettings initialTheme={theme} initialMode={themeMode} demo={demo} />
      </div>
    </div>
  );
}