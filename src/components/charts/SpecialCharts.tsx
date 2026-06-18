import { useStore } from "@/store/useStore";
import { healthScore, spendingHeatmap } from "@/lib/analytics";
import { formatMoney } from "@/lib/currency";
import { useMemo } from "react";
import { cn } from "@/lib/cn";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// 9. Weekly Spending Heatmap ------------------------------------------------
export function SpendingHeatmap() {
  const data = useStore();
  const cells = useMemo(() => spendingHeatmap(data, 8), [data.transactions]);
  const max = Math.max(1, ...cells.map((c) => c.amount));
  const weeks = 8;

  const intensity = (amt: number) => {
    if (amt <= 0) return "bg-slate-100 dark:bg-slate-800/50";
    const r = amt / max;
    if (r < 0.25) return "bg-emerald-200 dark:bg-emerald-900/60";
    if (r < 0.5) return "bg-emerald-300 dark:bg-emerald-700/70";
    if (r < 0.75) return "bg-emerald-400 dark:bg-emerald-600";
    return "bg-emerald-500 dark:bg-emerald-500";
  };

  return (
    <div>
      <div className="flex gap-2">
        <div className="flex flex-col justify-around pr-1 text-[10px] text-slate-400">
          {DAYS.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="grid flex-1 gap-1.5" style={{ gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))` }}>
          {Array.from({ length: 7 }).map((_, day) =>
            Array.from({ length: weeks }).map((__, week) => {
              const cell = cells.find((c) => c.day === day && c.week === week);
              return (
                <div
                  key={`${day}-${week}`}
                  title={cell ? `${cell.label}: ${formatMoney(cell.amount, data.settings.currency)}` : ""}
                  className={cn("aspect-square rounded-[4px] transition hover:ring-2 hover:ring-brand-400", intensity(cell?.amount ?? 0))}
                  style={{ gridColumn: week + 1, gridRow: day + 1 }}
                />
              );
            })
          )}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-slate-400">
        <span>Less</span>
        {["bg-slate-100 dark:bg-slate-800/50", "bg-emerald-200 dark:bg-emerald-900/60", "bg-emerald-300 dark:bg-emerald-700/70", "bg-emerald-400 dark:bg-emerald-600", "bg-emerald-500"].map((c, i) => (
          <span key={i} className={cn("h-3 w-3 rounded-[3px]", c)} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

// 10. Monthly Financial Health Score ----------------------------------------
export function HealthScoreGauge() {
  const data = useStore();
  const { score, parts } = useMemo(() => healthScore(data), [data.transactions, data.budgets, data.accounts]);

  const radius = 70;
  const circ = 2 * Math.PI * radius;
  const dash = (score / 100) * circ;
  const color = score >= 75 ? "#10b981" : score >= 50 ? "#f59e0b" : "#f43f5e";
  const label = score >= 75 ? "Excellent" : score >= 50 ? "Fair" : "Needs work";

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="relative grid place-items-center">
        <svg width="180" height="180" className="-rotate-90">
          <circle cx="90" cy="90" r={radius} fill="none" stroke="currentColor" strokeWidth="14" className="text-slate-200 dark:text-slate-800" />
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute text-center">
          <p className="text-4xl font-bold" style={{ color }}>{score}</p>
          <p className="text-xs text-slate-400">/ 100 · {label}</p>
        </div>
      </div>
      <div className="flex-1 space-y-2.5 self-stretch">
        {parts.map((p) => (
          <div key={p.label}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">{p.label}</span>
              <span className="font-medium">{p.value}/{p.max}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div className="h-full rounded-full bg-brand-500" style={{ width: `${(p.value / p.max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
