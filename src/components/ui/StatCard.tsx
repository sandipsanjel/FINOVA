import { cn } from "@/lib/cn";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = "brand",
  delta,
  hint,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  accent?: "brand" | "sky" | "rose" | "violet" | "amber" | "slate";
  delta?: number;
  hint?: string;
}) {
  const accents: Record<string, string> = {
    brand: "from-emerald-500/15 to-emerald-500/5 text-emerald-600 dark:text-emerald-400",
    sky: "from-sky-500/15 to-sky-500/5 text-sky-600 dark:text-sky-400",
    rose: "from-rose-500/15 to-rose-500/5 text-rose-600 dark:text-rose-400",
    violet: "from-violet-500/15 to-violet-500/5 text-violet-600 dark:text-violet-400",
    amber: "from-amber-500/15 to-amber-500/5 text-amber-600 dark:text-amber-400",
    slate: "from-slate-500/15 to-slate-500/5 text-slate-600 dark:text-slate-300",
  };

  return (
    <div className="panel relative overflow-hidden p-5">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 truncate text-2xl font-bold tracking-tight">{value}</p>
          {delta !== undefined && (
            <div
              className={cn(
                "mt-2 inline-flex items-center gap-1 text-xs font-medium",
                delta >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              )}
            >
              {delta >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {Math.abs(delta).toFixed(1)}% {hint}
            </div>
          )}
          {delta === undefined && hint && (
            <p className="mt-2 text-xs text-slate-400">{hint}</p>
          )}
        </div>
        <div className={cn("rounded-xl bg-gradient-to-br p-2.5", accents[accent])}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}
