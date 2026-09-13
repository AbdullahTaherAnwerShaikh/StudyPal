import WidgetCard from "@/components/dashboard/widget-card";

export default function WidgetSkeleton({
  title,
  lines = 4,
}: {
  title: string;
  lines?: number;
}) {
  const widths = [88, 64, 76, 52, 70, 58, 84];
  return (
    <WidgetCard title={title}>
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <div key={index} className="flex items-center gap-3">
            <span className="h-3 w-10 shrink-0 animate-pulse rounded-full bg-ink/10" />
            <span
              className="h-3 animate-pulse rounded-full bg-ink/10"
              style={{ width: `${widths[index % widths.length]}%` }}
            />
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}