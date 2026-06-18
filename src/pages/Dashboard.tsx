import { useStore } from "@/store/useStore";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { InsightsPanel } from "@/components/insights/InsightsPanel";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import {
  IncomeExpenseTrend,
  CashFlowTimeline,
  ExpensePie,
  MemberSpending,
  NetWorthGrowth,
} from "@/components/charts/Charts";
import { HealthScoreGauge } from "@/components/charts/SpecialCharts";
import {
  balancesByAccount,
  monthlyTrend,
  netWorth,
  periodSummaries,
  totalCash,
} from "@/lib/analytics";
import { formatMoney } from "@/lib/currency";
import {
  Banknote,
  Landmark,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useMemo } from "react";

export function Dashboard() {
  const data = useStore();
  const { currency } = data.settings;

  const { month } = useMemo(() => periodSummaries(data), [data.transactions]);
  const nw = useMemo(() => netWorth(data), [data.transactions, data.accounts]);
  const cash = useMemo(() => totalCash(data), [data.transactions, data.accounts]);
  const balances = useMemo(() => balancesByAccount(data), [data.transactions, data.accounts]);
  const trend = useMemo(() => monthlyTrend(data, 2), [data.transactions]);

  const prev = trend[0];
  const incomeDelta = prev?.income ? ((month.income - prev.income) / prev.income) * 100 : undefined;
  const expenseDelta = prev?.expense ? ((month.expense - prev.expense) / prev.expense) * 100 : undefined;

  const recent = data.transactions.slice(0, 6);

  return (
    <div className="space-y-5">
      {/* Overview cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total Family Net Worth" value={formatMoney(nw, currency)} icon={Landmark} accent="brand" hint="across all accounts" />
        <StatCard label="Total Cash Available" value={formatMoney(cash, currency)} icon={Wallet} accent="sky" hint="bank + cash" />
        <StatCard label="Monthly Income" value={formatMoney(month.income, currency)} icon={TrendingUp} accent="brand" delta={incomeDelta} hint="vs last month" />
        <StatCard label="Monthly Expenses" value={formatMoney(month.expense, currency)} icon={TrendingDown} accent="rose" delta={expenseDelta} hint="vs last month" />
        <StatCard label="Monthly Savings" value={formatMoney(month.savings, currency)} icon={PiggyBank} accent="violet" hint="income − expenses" />
        <StatCard label="Savings Rate" value={`${month.savingsRate.toFixed(0)}%`} icon={Banknote} accent="amber" hint={`target ${data.settings.monthlySavingsTarget}%`} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Income vs Expense" subtitle="Last 6 months with savings line" />
          <IncomeExpenseTrend />
        </Card>
        <Card>
          <CardHeader title="Expense Breakdown" subtitle="This month by category" />
          <ExpensePie />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Cash Flow Timeline" subtitle="Daily income vs expense, last 30 days" />
          <CashFlowTimeline />
        </Card>
        <InsightsPanel />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Net Worth Growth" subtitle="Last 6 months" />
          <NetWorthGrowth />
        </Card>
        <Card>
          <CardHeader title="Family Spending" subtitle="This month by member" />
          <MemberSpending />
        </Card>
        <Card>
          <CardHeader title="Financial Health" subtitle="This month's composite score" />
          <HealthScoreGauge />
        </Card>
      </div>

      {/* Account balances + recent */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Account Balances" subtitle="Current balance per account" />
          <div className="space-y-2.5">
            {data.accounts.filter((a) => a.active).map((a) => (
              <div key={a.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: data.people.find((p) => p.id === a.ownerId)?.color }} />
                  <span className="text-slate-600 dark:text-slate-300">{a.name}</span>
                  <span className="text-[11px] text-slate-400">{data.people.find((p) => p.id === a.ownerId)?.name}</span>
                </div>
                <span className="font-medium tabular-nums">{formatMoney(balances[a.id] ?? 0, currency)}</span>
              </div>
            ))}
            {data.accounts.length === 0 && <p className="text-sm text-slate-400">No accounts yet.</p>}
          </div>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title="Recent Transactions" subtitle="Latest activity" />
          <TransactionTable txns={recent} />
        </Card>
      </div>
    </div>
  );
}
