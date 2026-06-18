import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  ComposedChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useStore } from "@/store/useStore";
import {
  accountBalanceHistory,
  cashFlowTimeline,
  memberSpending,
  monthlyTrend,
  netWorthSeries,
  periodSummaries,
  savingsSeries,
} from "@/lib/analytics";
import { formatMoney } from "@/lib/currency";
import { EmptyChart, MoneyTooltip, useGrid } from "./chartkit";
import { useMemo } from "react";

const H = 260;

function compactAxis(currency: string) {
  return (v: number) => formatMoney(v, currency as any, { compact: true }).replace(/^.*?\s/, "");
}

// 1. Monthly Income vs Expense Trend ----------------------------------------
export function IncomeExpenseTrend() {
  const data = useStore();
  const g = useGrid();
  const series = useMemo(() => monthlyTrend(data, 6), [data.transactions]);
  return (
    <ResponsiveContainer width="100%" height={H}>
      <ComposedChart data={series} margin={{ left: -10, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={g.grid} vertical={false} />
        <XAxis dataKey="label" tick={{ fill: g.axis, fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: g.axis, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={compactAxis(data.settings.currency)} />
        <Tooltip content={<MoneyTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar name="Income" dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={26} />
        <Bar name="Expense" dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={26} />
        <Line name="Savings" dataKey="savings" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// 2. Cash Flow Timeline -----------------------------------------------------
export function CashFlowTimeline() {
  const data = useStore();
  const g = useGrid();
  const series = useMemo(() => cashFlowTimeline(data, 30), [data.transactions]);
  return (
    <ResponsiveContainer width="100%" height={H}>
      <AreaChart data={series} margin={{ left: -10, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="inc" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={g.grid} vertical={false} />
        <XAxis dataKey="label" tick={{ fill: g.axis, fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
        <YAxis tick={{ fill: g.axis, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={compactAxis(data.settings.currency)} />
        <Tooltip content={<MoneyTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area name="Income" dataKey="income" stroke="#10b981" fill="url(#inc)" strokeWidth={2} />
        <Area name="Expense" dataKey="expense" stroke="#f43f5e" fill="url(#exp)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// 3 & 4. Expense Category Pie / Bar -----------------------------------------
function useCategorySpend() {
  const data = useStore();
  return useMemo(() => {
    const { month } = periodSummaries(data);
    return month.byCategory.map((c) => {
      const cat = data.categories.find((x) => x.id === c.categoryId);
      return { name: cat?.name ?? "Other", value: c.amount, color: cat?.color ?? "#64748b" };
    });
  }, [data.transactions, data.categories]);
}

export function ExpensePie() {
  const rows = useCategorySpend();
  if (rows.length === 0) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height={H}>
      <PieChart>
        <Pie data={rows} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={2} stroke="none">
          {rows.map((r, i) => (
            <Cell key={i} fill={r.color} />
          ))}
        </Pie>
        <Tooltip content={<MoneyTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function ExpenseBar() {
  const data = useStore();
  const g = useGrid();
  const rows = useCategorySpend().slice(0, 8);
  if (rows.length === 0) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height={H}>
      <BarChart data={rows} layout="vertical" margin={{ left: 14, right: 12 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={g.grid} horizontal={false} />
        <XAxis type="number" tick={{ fill: g.axis, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={compactAxis(data.settings.currency)} />
        <YAxis type="category" dataKey="name" tick={{ fill: g.axis, fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
        <Tooltip content={<MoneyTooltip />} cursor={{ fill: g.grid, opacity: 0.3 }} />
        <Bar dataKey="value" name="Spent" radius={[0, 4, 4, 0]} maxBarSize={22}>
          {rows.map((r, i) => (
            <Cell key={i} fill={r.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// 5. Family Member Spending Comparison --------------------------------------
export function MemberSpending() {
  const data = useStore();
  const g = useGrid();
  const rows = useMemo(
    () => memberSpending(data).map((m) => ({ name: m.person.name, Income: m.income, Expense: m.expense, Savings: m.savings })),
    [data.transactions, data.people]
  );
  if (rows.length === 0) return <EmptyChart label="Add family members" />;
  return (
    <ResponsiveContainer width="100%" height={H}>
      <BarChart data={rows} margin={{ left: -10, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={g.grid} vertical={false} />
        <XAxis dataKey="name" tick={{ fill: g.axis, fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: g.axis, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={compactAxis(data.settings.currency)} />
        <Tooltip content={<MoneyTooltip />} cursor={{ fill: g.grid, opacity: 0.3 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
        <Bar dataKey="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// 6. Account Balance History ------------------------------------------------
export function AccountBalanceHistory() {
  const data = useStore();
  const g = useGrid();
  const accounts = data.accounts.filter((a) => a.active).slice(0, 6);
  const rows = useMemo(() => accountBalanceHistory(data, 6), [data.transactions, data.accounts]);
  if (accounts.length === 0) return <EmptyChart label="Add accounts" />;
  return (
    <ResponsiveContainer width="100%" height={H}>
      <ComposedChart data={rows} margin={{ left: -10, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={g.grid} vertical={false} />
        <XAxis dataKey="label" tick={{ fill: g.axis, fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: g.axis, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={compactAxis(data.settings.currency)} />
        <Tooltip content={<MoneyTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {accounts.map((a, i) => (
          <Line key={a.id} dataKey={a.id} name={a.name} stroke={PALETTE[i % PALETTE.length]} strokeWidth={2} dot={false} />
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  );
}

const PALETTE = ["#10b981", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6", "#14b8a6"];

// 7. Savings Growth ---------------------------------------------------------
export function SavingsGrowth() {
  const data = useStore();
  const g = useGrid();
  const rows = useMemo(() => savingsSeries(data, 6), [data.transactions]);
  return (
    <ResponsiveContainer width="100%" height={H}>
      <AreaChart data={rows} margin={{ left: -10, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="sav" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={g.grid} vertical={false} />
        <XAxis dataKey="label" tick={{ fill: g.axis, fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: g.axis, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={compactAxis(data.settings.currency)} />
        <Tooltip content={<MoneyTooltip />} />
        <Area name="Cumulative savings" dataKey="cumulative" stroke="#6366f1" fill="url(#sav)" strokeWidth={2.5} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// 8. Net Worth Growth -------------------------------------------------------
export function NetWorthGrowth() {
  const data = useStore();
  const g = useGrid();
  const rows = useMemo(() => netWorthSeries(data, 6), [data.transactions, data.accounts]);
  return (
    <ResponsiveContainer width="100%" height={H}>
      <AreaChart data={rows} margin={{ left: -10, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="nw" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={g.grid} vertical={false} />
        <XAxis dataKey="label" tick={{ fill: g.axis, fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: g.axis, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={compactAxis(data.settings.currency)} />
        <Tooltip content={<MoneyTooltip />} />
        <Area name="Net worth" dataKey="netWorth" stroke="#10b981" fill="url(#nw)" strokeWidth={2.5} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
