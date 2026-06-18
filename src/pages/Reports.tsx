import { useStore } from "@/store/useStore";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { summarize } from "@/lib/analytics";
import { exportCSV, exportExcel } from "@/lib/export";
import { formatMoney } from "@/lib/currency";
import { fmtDate } from "@/lib/dates";
import {
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subMonths,
} from "date-fns";
import { parseISO } from "date-fns";
import { Download, Printer } from "lucide-react";
import { useMemo, useState } from "react";

type Period = "week" | "month" | "quarter" | "year";

function rangeFor(p: Period): { from: Date; to: Date; label: string } {
  const now = new Date();
  if (p === "week") return { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }), label: "Weekly" };
  if (p === "month") return { from: startOfMonth(now), to: endOfMonth(now), label: "Monthly" };
  if (p === "quarter") return { from: startOfMonth(subMonths(now, 2)), to: endOfMonth(now), label: "Quarterly" };
  return { from: startOfYear(now), to: endOfYear(now), label: "Yearly" };
}

export function Reports() {
  const data = useStore();
  const { currency } = data.settings;
  const [period, setPeriod] = useState<Period>("month");

  const { from, to, label } = rangeFor(period);
  const txns = useMemo(
    () => data.transactions.filter((t) => {
      const d = parseISO(t.date);
      return d >= from && d <= to;
    }),
    [data.transactions, period]
  );
  const summary = useMemo(() => summarize(txns), [txns]);
  const catName = (id?: string) => data.categories.find((c) => c.id === id)?.name ?? "Uncategorized";

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="no-print inline-flex rounded-xl border border-slate-200 p-1 dark:border-slate-800">
            {(["week", "month", "quarter", "year"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition ${period === p ? "bg-brand-600 text-white" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="no-print flex gap-2">
            <Button variant="outline" size="sm" onClick={() => exportCSV(data, txns, `${label.toLowerCase()}-report`)}><Download size={15} /> CSV</Button>
            <Button variant="outline" size="sm" onClick={() => exportExcel(data, txns, `${label.toLowerCase()}-report`)}><Download size={15} /> Excel</Button>
            <Button size="sm" onClick={() => window.print()}><Printer size={15} /> Print / PDF</Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="mb-5 border-b border-slate-100 pb-4 dark:border-slate-800">
          <h2 className="text-xl font-bold">{label} Financial Report</h2>
          <p className="text-sm text-slate-400">{fmtDate(from.toISOString())} — {fmtDate(to.toISOString())} · Finova Family Finance</p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <ReportStat label="Total Income" value={formatMoney(summary.income, currency)} tone="text-emerald-600 dark:text-emerald-400" />
          <ReportStat label="Total Expenses" value={formatMoney(summary.expense, currency)} tone="text-rose-600 dark:text-rose-400" />
          <ReportStat label="Net Savings" value={formatMoney(summary.savings, currency)} tone="text-violet-600 dark:text-violet-400" />
          <ReportStat label="Savings Rate" value={`${summary.savingsRate.toFixed(0)}%`} />
        </div>

        <div className="mt-6">
          <h3 className="mb-3 text-sm font-semibold">Category Breakdown</h3>
          <div className="space-y-2">
            {summary.byCategory.map((c) => {
              const pct = summary.expense > 0 ? (c.amount / summary.expense) * 100 : 0;
              return (
                <div key={c.categoryId} className="flex items-center gap-3 text-sm">
                  <span className="w-32 shrink-0 text-slate-600 dark:text-slate-300">{catName(c.categoryId)}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-24 shrink-0 text-right font-medium tabular-nums">{formatMoney(c.amount, currency)}</span>
                  <span className="w-12 shrink-0 text-right text-xs text-slate-400">{pct.toFixed(0)}%</span>
                </div>
              );
            })}
            {summary.byCategory.length === 0 && <p className="text-sm text-slate-400">No expenses in this period.</p>}
          </div>
        </div>
      </Card>

      <Card className="p-0">
        <div className="p-5 pb-0"><CardHeader title="Transactions in period" subtitle={`${txns.length} entries`} /></div>
        <TransactionTable txns={txns} />
      </Card>
    </div>
  );
}

function ReportStat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/40">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`mt-1 text-lg font-bold tabular-nums ${tone ?? ""}`}>{value}</p>
    </div>
  );
}
