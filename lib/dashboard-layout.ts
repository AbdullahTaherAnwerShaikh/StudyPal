export const DASHBOARD_WIDGETS = [
  { key: "schedule", label: "Today's Schedule", span: "md:col-span-2" },
  { key: "study-plan", label: "Current Study Plan", span: "" },
  { key: "tasks", label: "Tasks", span: "" },
  { key: "habits", label: "Habits", span: "" },
  { key: "notes", label: "Recent Notes", span: "md:col-span-2" },
] as const;

export type DashboardWidgetKey = (typeof DASHBOARD_WIDGETS)[number]["key"];

export type DashboardWidgetSpan = "" | "md:col-span-2";

export type DashboardLayoutEntry = {
  key: DashboardWidgetKey;
  span: DashboardWidgetSpan;
};

export const DASHBOARD_WIDGET_KEYS: readonly DashboardWidgetKey[] =
  DASHBOARD_WIDGETS.map((widget) => widget.key);

export const WIDE_SPAN: DashboardWidgetSpan = "md:col-span-2";

const DEFAULT_SPANS = Object.fromEntries(
  DASHBOARD_WIDGETS.map((widget) => [widget.key, widget.span])
) as Record<DashboardWidgetKey, DashboardWidgetSpan>;

export function defaultDashboardLayout(): DashboardLayoutEntry[] {
  return DASHBOARD_WIDGETS.map((widget) => ({
    key: widget.key,
    span: widget.span,
  }));
}

function isWidgetKey(value: string): value is DashboardWidgetKey {
  return (DASHBOARD_WIDGET_KEYS as readonly string[]).includes(value);
}

function parseSpan(value: unknown): DashboardWidgetSpan {
  return value === WIDE_SPAN ? WIDE_SPAN : "";
}

function parseLayoutItem(item: unknown): DashboardLayoutEntry | null {
  if (typeof item === "string") {
    if (!isWidgetKey(item)) return null;
    return { key: item, span: DEFAULT_SPANS[item] };
  }
  if (typeof item === "object" && item !== null && !Array.isArray(item)) {
    const record = item as { key?: unknown; span?: unknown };
    if (typeof record.key === "string" && isWidgetKey(record.key)) {
      return { key: record.key, span: parseSpan(record.span) };
    }
  }
  return null;
}

export function sanitizeDashboardLayout(input: unknown): DashboardLayoutEntry[] {
  if (!Array.isArray(input)) return defaultDashboardLayout();

  const seen = new Set<DashboardWidgetKey>();
  const ordered: DashboardLayoutEntry[] = [];
  for (const item of input) {
    const parsed = parseLayoutItem(item);
    if (parsed && !seen.has(parsed.key)) {
      seen.add(parsed.key);
      ordered.push(parsed);
    }
  }
  for (const { key, span } of defaultDashboardLayout()) {
    if (!seen.has(key)) ordered.push({ key, span });
  }
  return ordered;
}

export function serializeDashboardLayout(
  entries: DashboardLayoutEntry[]
): (string | { key: DashboardWidgetKey; span: DashboardWidgetSpan })[] {
  return entries.map((entry) => (entry.span ? { key: entry.key, span: entry.span } : entry.key));
}

export function layoutsAreEqual(
  a: readonly DashboardLayoutEntry[],
  b: readonly DashboardLayoutEntry[]
): boolean {
  return (
    a.length === b.length &&
    a.every((entry, index) => entry.key === b[index].key && entry.span === b[index].span)
  );
}