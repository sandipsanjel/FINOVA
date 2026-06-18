import { useStore } from "@/store/useStore";
import { Card, CardHeader } from "@/components/ui/Card";
import {
  AccountBalanceHistory,
  ExpenseBar,
  ExpensePie,
  IncomeExpenseTrend,
  MemberSpending,
  SavingsGrowth,
} from "@/components/charts/Charts";
import { SpendingHeatmap } from "@/components/charts/SpecialCharts";
import { netWorthSeries, periodSummaries } from "@/lib/analytics";
import { formatMoney } from "@/lib/currency";
import { useMemo } from "react";

export function Analytics() {
  const data = useStore();
  const { currency } = data.settings;
  const sums = useMemo(() => periodSummaries(data), [data.transactions]);
  const nw = useMemo(() => netWorthSeries(data, 12), [data.transactions, data.accounts]);

  const yoyNetWorth = nw.length >= 2 ? ((nw[nw.length - 1].netWorth - nw[0].netWorth) / Math.max(Math.abs(nw[0].netWorth), 1)) * 100 : 0;
  const catName = (id?: string) => data.categories.find((c) => c.id === id)?.name ?? "—";

  return (
    <div className="space-y-5">
      {/* Period summaries */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <PeriodCard title="This Week" s={sums.week} currency={currency} catName={catName} />
        <PeriodCard title="This Month" s={sums.month} currency={currency} catName={catName} />
        <PeriodCard title="This Year" s={sums.year} currency={currency} catName={catName} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Monthly Income vs Expense Trend" subtitle="6-month trend" />
          <IncomeExpenseTrend />
        </Card>
        <Card>
          <CardHeader title="Savings Growth" subtitle="Cumulative, 6 months" />
          <SavingsGrowth />
        </Card>
        <Card>
          <CardHeader title="Expense Category — Pie" subtitle="This month" />
          <ExpensePie />
        </Card>
        <Card>
          <CardHeader title="Expense Category — Bar" subtitle="Top categories this month" />
          <ExpenseBar />
        </Card>
        <Card>
          <CardHeader title="Family Member Spending" subtitle="Income vs expense, this month" />
          <MemberSpending />
        </Card>
        <Card>
          <CardHeader title="Account Balance History" subtitle="End-of-month balances" />
          <AccountBalanceHistory />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Weekly Spending Heatmap" subtitle="Last 8 weeks of expenses" />
          <SpendingHeatmap />
        </Card>
        <Card>
          <CardHeader title="Yearly Net Worth Growth" subtitle={`${yoyNetWorth >= 0 ? "+" : ""}${yoyNetWorth.toFixed(1)}% over 12 months`} />
          <div className="space-y-3 pt-2">
            <Growth label="Income (YTD)" value={formatMoney(sums.year.income, currency)} />
            <Growth label="Expenses (YTD)" value={formatMoney(sums.year.expense, currency)} />
            <Growth label="Net savings (YTD)" value={formatMoney(sums.year.savings, currency)} />
            <Growth label="Net worth change" value={`${yoyNetWorth >= 0 ? "+" : ""}${yoyNetWorth.toFixed(1)}%`} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function PeriodCard({ title, s, currency, catName }: any) {
  return (
    <Card>
      <CardHeader title={title} subtitle={`${s.count} transactions`} />
      <div className="grid grid-cols-2 gap-3 text-sm">
        <Stat label="Income" value={formatMoney(s.income, currency)} tone="text-emerald-600 dark:text-emerald-400" />
        <Stat label="Expenses" value={formatMoney(s.expense, currency)} tone="text-rose-600 dark:text-rose-400" />
        <Stat label="Savings" value={formatMoney(s.savings, currency)} tone="text-violet-600 dark:text-violet-400" />
        <Stat label="Savings rate" value={`${s.savingsRate.toFixed(0)}%`} />
      </div>
      {s.largestExpense && (
        <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-400 dark:border-slate-800">
          Largest expense: <span className="font-medium text-slate-600 dark:text-slate-300">{catName(s.largestExpense.categoryId)}</span> · {formatMoney(s.largestExpense.amount, currency)}
        </p>
      )}
    </Card>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`mt-0.5 font-bold tabular-nums ${tone ?? ""}`}>{value}</p>
    </div>
  );
}

function Growth({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}
