import { useStore } from "@/store/useStore";
import { FilterBar } from "@/components/filters/FilterBar";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { applyFilters, summarize } from "@/lib/analytics";
import { exportCSV, exportExcel } from "@/lib/export";
import { formatMoney } from "@/lib/currency";
import { Download, Plus } from "lucide-react";
import { useMemo } from "react";

export function Transactions() {
  const data = useStore();
  const filters = useStore((s) => s.ui.filters);
  const openTxModal = useStore((s) => s.openTxModal);

  const filtered = useMemo(() => applyFilters(data.transactions, filters), [data.transactions, filters]);
  const summary = useMemo(() => summarize(filtered), [filtered]);
  const { currency } = data.settings;

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <FilterBar />
          <div className="no-print flex gap-2">
            <Button variant="outline" size="sm" onClick={() => exportCSV(data, filtered)}>
              <Download size={15} /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportExcel(data, filtered)}>
              <Download size={15} /> Excel
            </Button>
            <Button size="sm" onClick={() => openTxModal()}>
              <Plus size={15} /> Add
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryPill label="Transactions" value={String(filtered.length)} />
        <SummaryPill label="Income" value={formatMoney(summary.income, currency)} tone="text-emerald-600 dark:text-emerald-400" />
        <SummaryPill label="Expense" value={formatMoney(summary.expense, currency)} tone="text-rose-600 dark:text-rose-400" />
        <SummaryPill label="Net" value={formatMoney(summary.savings, currency)} tone="text-violet-600 dark:text-violet-400" />
      </div>

      <Card className="p-0">
        <TransactionTable txns={filtered} />
      </Card>
    </div>
  );
}

function SummaryPill({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="panel p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`mt-1 text-lg font-bold tabular-nums ${tone ?? ""}`}>{value}</p>
    </div>
  );
}
