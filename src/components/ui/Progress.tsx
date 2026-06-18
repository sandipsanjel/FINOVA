import { cn } from "@/lib/cn";

export function Progress({
  value,
  className,
  barClassName,
  color,
}: {
  value: number; // 0-100
  className?: string;
  barClassName?: string;
  color?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800", className)}>
      <div
        className={cn("h-full rounded-full bg-brand-500 transition-all", barClassName)}
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}
