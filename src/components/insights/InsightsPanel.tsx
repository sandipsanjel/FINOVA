import { useStore } from "@/store/useStore";
import { generateInsights } from "@/lib/analytics";
import { useMemo } from "react";
import { AlertTriangle, CheckCircle2, Info, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";

export function InsightsPanel() {
  const data = useStore();
  const insights = useMemo(() => generateInsights(data), [data.transactions, data.budgets, data.settings]);

  const icon = { positive: CheckCircle2, warning: AlertTriangle, neutral: Info };
  const tone = {
    positive: "text-emerald-600 dark:text-emerald-400",
    warning: "text-amber-600 dark:text-amber-400",
    neutral: "text-sky-600 dark:text-sky-400",
  };

  return (
    <div className="panel p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="grid h-7 w-7 place-items-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
          <Sparkles size={15} />
        </div>
        <h3 className="text-sm font-semibold">Smart Insights</h3>
      </div>
      {insights.length === 0 ? (
        <p className="text-sm text-slate-400">Add a few transactions to unlock insights.</p>
      ) : (
        <ul className="space-y-3">
          {insights.map((ins) => {
            const Icon = icon[ins.tone];
            return (
              <li key={ins.id} className="flex items-start gap-2.5 text-sm">
                <Icon size={16} className={cn("mt-0.5 shrink-0", tone[ins.tone])} />
                <span className="text-slate-600 dark:text-slate-300">{ins.title}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
