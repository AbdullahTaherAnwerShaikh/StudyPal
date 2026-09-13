export const DASHBOARD_WIDGETS = [
  { key: "schedule", label: "Today's Schedule", span: "md:col-span-2" },
  { key: "study-plan", label: "Current Study Plan", span: "" },
  { key: "tasks", label: "Tasks", span: "" },
  { key: "habits", label: "Habits", span: "" },
  { key: "notes", label: "Recent Notes", span: "md:col-span-2" },
] as const;

export type DashboardWidgetKey = (typeof DASHBOARD_WIDGETS)[number]["key"];

export const DASHBOARD_WIDGET_KEYS: readonly DashboardWidgetKey[] =
  DASHBOARD_WIDGETS.map((widget) => widget.key);

export const DEFAULT_DASHBOARD_LAYOUT: readonly DashboardWidgetKey[] = [
  ...DASHBOARD_WIDGET_KEYS,
];

export function sanitizeDashboardLayout(
  input: unknown
): DashboardWidgetKey[] {
  if (!Array.isArray(input)) return [...DEFAULT_DASHBOARD_LAYOUT];

  const seen = new Set<DashboardWidgetKey>();
  const ordered: DashboardWidgetKey[] = [];
  for (const key of input) {
    if (
      typeof key === "string" &&
      (DASHBOARD_WIDGET_KEYS as readonly string[]).includes(key) &&
      !seen.has(key as DashboardWidgetKey)
    ) {
      seen.add(key as DashboardWidgetKey);
      ordered.push(key as DashboardWidgetKey);
    }
  }
  for (const key of DEFAULT_DASHBOARD_LAYOUT) {
    if (!seen.has(key)) ordered.push(key);
  }
  return ordered;
}

export function layoutsAreEqual(
  a: readonly DashboardWidgetKey[],
  b: readonly DashboardWidgetKey[]
): boolean {
  return a.length === b.length && a.every((key, index) => key === b[index]);
}