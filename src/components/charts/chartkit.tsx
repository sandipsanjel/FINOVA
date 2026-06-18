import { useStore } from "@/store/useStore";
import { formatMoney } from "@/lib/currency";
import type { TooltipProps } from "recharts";

export function useGrid() {
  const theme = useStore((s) => s.settings.theme);
  return {
    grid: theme === "dark" ? "#1e293b" : "#e2e8f0",
    axis: theme === "dark" ? "#64748b" : "#94a3b8",
    text: theme === "dark" ? "#cbd5e1" : "#475569",
  };
}

export function MoneyTooltip({ active, payload, label }: TooltipProps<number, string>) {
  const currency = useStore((s) => s.settings.currency);
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-card-lg dark:border-slate-700 dark:bg-slate-800">
      {label !== undefined && <p className="mb-1 font-semibold text-slate-700 dark:text-slate-200">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || (p.payload && p.payload.fill) }} />
          <span className="text-slate-500 dark:text-slate-400">{p.name}</span>
          <span className="ml-auto font-medium text-slate-800 dark:text-slate-100">
            {formatMoney(Number(p.value), currency)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function EmptyChart({ label = "No data yet" }: { label?: string }) {
  return (
    <div className="grid h-full min-h-[200px] place-items-center text-sm text-slate-400">{label}</div>
  );
}
