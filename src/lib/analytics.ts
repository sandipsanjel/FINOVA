import type { Account, AppData, Filters, Transaction } from "@/types";
import { parseISO, format } from "date-fns";
import { inRange, lastNMonths, monthRange, weekRange, yearRange } from "./dates";

// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------

export function applyFilters(txns: Transaction[], f: Filters): Transaction[] {
  return txns.filter((t) => {
    if (!inRange(t.date, f.from, f.to)) return false;
    if (f.personId && f.personId !== "all" && t.personId !== f.personId) return false;
    if (
      f.accountId &&
      f.accountId !== "all" &&
      t.accountId !== f.accountId &&
      t.toAccountId !== f.accountId
    )
      return false;
    if (f.categoryId && f.categoryId !== "all" && t.categoryId !== f.categoryId) return false;
    if (f.type && f.type !== "all" && t.type !== f.type) return false;
    if (f.search) {
      const q = f.search.toLowerCase();
      const hay = `${t.description ?? ""} ${t.tags.join(" ")}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

// ---------------------------------------------------------------------------
// Balances & net worth
// ---------------------------------------------------------------------------

/** Net signed effect of a transaction on a given account. */
export function accountDelta(t: Transaction, accountId: string): number {
  if (t.accountId === accountId) {
    if (t.type === "income") return t.amount;
    if (t.type === "expense") return -t.amount;
    if (t.type === "transfer") return -t.amount;
    if (t.type === "adjustment") return t.amount; // signed amount stored as +/- via amount
  }
  if (t.type === "transfer" && t.toAccountId === accountId) return t.amount;
  return 0;
}

export function accountBalance(account: Account, txns: Transaction[], asOf?: string): number {
  let bal = account.openingBalance;
  for (const t of txns) {
    if (asOf && parseISO(t.date) > parseISO(asOf)) continue;
    bal += accountDelta(t, account.id);
  }
  return bal;
}

export function balancesByAccount(data: AppData, asOf?: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const a of data.accounts) out[a.id] = accountBalance(a, data.transactions, asOf);
  return out;
}

export function netWorth(data: AppData, asOf?: string): number {
  return data.accounts
    .filter((a) => a.active)
    .reduce((s, a) => s + accountBalance(a, data.transactions, asOf), 0);
}

export function totalCash(data: AppData): number {
  return data.accounts
    .filter((a) => a.active && (a.type === "cash" || a.type === "bank"))
    .reduce((s, a) => s + accountBalance(a, data.transactions), 0);
}

// ---------------------------------------------------------------------------
// Period summaries
// ---------------------------------------------------------------------------

export interface PeriodSummary {
  income: number;
  expense: number;
  savings: number;
  savingsRate: number;
  count: number;
  largestExpense?: Transaction;
  byCategory: { categoryId: string; amount: number }[];
}

export function summarize(txns: Transaction[]): PeriodSummary {
  let income = 0;
  let expense = 0;
  let largest: Transaction | undefined;
  const catMap: Record<string, number> = {};

  for (const t of txns) {
    if (t.type === "income") income += t.amount;
    if (t.type === "expense") {
      expense += t.amount;
      if (!largest || t.amount > largest.amount) largest = t;
      if (t.categoryId) catMap[t.categoryId] = (catMap[t.categoryId] ?? 0) + t.amount;
    }
  }

  const savings = income - expense;
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;
  const byCategory = Object.entries(catMap)
    .map(([categoryId, amount]) => ({ categoryId, amount }))
    .sort((a, b) => b.amount - a.amount);

  return { income, expense, savings, savingsRate, count: txns.length, largestExpense: largest, byCategory };
}

function within(txns: Transaction[], from: Date, to: Date) {
  return txns.filter((t) => {
    const d = parseISO(t.date);
    return d >= from && d <= to;
  });
}

export function periodSummaries(data: AppData) {
  const all = data.transactions;
  const wk = weekRange();
  const mo = monthRange();
  const yr = yearRange();
  return {
    week: summarize(within(all, wk.from, wk.to)),
    month: summarize(within(all, mo.from, mo.to)),
    year: summarize(within(all, yr.from, yr.to)),
  };
}

// ---------------------------------------------------------------------------
// Trend series (for charts)
// ---------------------------------------------------------------------------

export function monthlyTrend(data: AppData, n = 6) {
  const months = lastNMonths(n);
  return months.map((m) => {
    const slice = within(data.transactions, m.start, m.end);
    const s = summarize(slice);
    return {
      key: m.key,
      label: m.label,
      income: s.income,
      expense: s.expense,
      savings: s.savings,
    };
  });
}

/** Running net worth at the end of each of the last N months. */
export function netWorthSeries(data: AppData, n = 6) {
  const months = lastNMonths(n);
  return months.map((m) => ({
    label: m.label,
    netWorth: netWorth(data, format(m.end, "yyyy-MM-dd")),
  }));
}

/** Cumulative savings (income - expense) over last N months. */
export function savingsSeries(data: AppData, n = 6) {
  const months = lastNMonths(n);
  let cum = 0;
  return months.map((m) => {
    const s = summarize(within(data.transactions, m.start, m.end));
    cum += s.savings;
    return { label: m.label, monthly: s.savings, cumulative: cum };
  });
}

/** Daily cash-flow timeline for last N days. */
export function cashFlowTimeline(data: AppData, days = 30) {
  const out: { label: string; date: string; income: number; expense: number; net: number }[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = format(d, "yyyy-MM-dd");
    const dayTx = data.transactions.filter((t) => t.date === iso);
    const income = dayTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = dayTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    out.push({ label: format(d, "dd MMM"), date: iso, income, expense, net: income - expense });
  }
  return out;
}

/** Per-account balance history (end of each month). */
export function accountBalanceHistory(data: AppData, n = 6) {
  const months = lastNMonths(n);
  return months.map((m) => {
    const row: Record<string, string | number> = { label: m.label };
    for (const a of data.accounts) {
      row[a.id] = accountBalance(a, data.transactions, format(m.end, "yyyy-MM-dd"));
    }
    return row;
  });
}

/** Spending by family member in current month. */
export function memberSpending(data: AppData) {
  const mo = monthRange();
  return data.people.map((p) => {
    const slice = within(data.transactions, mo.from, mo.to).filter((t) => t.personId === p.id);
    const s = summarize(slice);
    return { person: p, income: s.income, expense: s.expense, savings: s.savings };
  });
}

/** Weekly spending heatmap: rows = weeks (last 8), cols = weekday. */
export function spendingHeatmap(data: AppData, weeks = 8) {
  const today = new Date();
  const grid: { week: number; day: number; amount: number; label: string }[] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    for (let day = 0; day < 7; day++) {
      const d = new Date(today);
      // Monday-based offset
      const dayOffset = (today.getDay() + 6) % 7;
      d.setDate(today.getDate() - dayOffset - w * 7 + day);
      const iso = format(d, "yyyy-MM-dd");
      const amount = data.transactions
        .filter((t) => t.date === iso && t.type === "expense")
        .reduce((s, t) => s + t.amount, 0);
      grid.push({ week: weeks - 1 - w, day, amount, label: format(d, "dd MMM") });
    }
  }
  return grid;
}

// ---------------------------------------------------------------------------
// Financial health score (0-100)
// ---------------------------------------------------------------------------

export function healthScore(data: AppData): { score: number; parts: { label: string; value: number; max: number }[] } {
  const { month } = periodSummaries(data);
  const target = data.settings.monthlySavingsTarget;

  // 1. Savings rate vs target (40)
  const savingsPart = Math.max(0, Math.min(40, (month.savingsRate / Math.max(target, 1)) * 40));

  // 2. Budget adherence (30)
  const budgetPart = budgetAdherence(data) * 30;

  // 3. Emergency runway: cash / avg monthly expense (20)
  const trend = monthlyTrend(data, 3);
  const avgExp = trend.reduce((s, t) => s + t.expense, 0) / Math.max(trend.length, 1) || 1;
  const runwayMonths = totalCash(data) / avgExp;
  const runwayPart = Math.max(0, Math.min(20, (runwayMonths / 6) * 20));

  // 4. Positive net worth trend (10)
  const nw = netWorthSeries(data, 3);
  const growing = nw.length >= 2 && nw[nw.length - 1].netWorth >= nw[0].netWorth;
  const trendPart = growing ? 10 : 4;

  const score = Math.round(savingsPart + budgetPart + runwayPart + trendPart);
  return {
    score: Math.max(0, Math.min(100, score)),
    parts: [
      { label: "Savings rate", value: Math.round(savingsPart), max: 40 },
      { label: "Budget adherence", value: Math.round(budgetPart), max: 30 },
      { label: "Emergency runway", value: Math.round(runwayPart), max: 20 },
      { label: "Net worth trend", value: Math.round(trendPart), max: 10 },
    ],
  };
}

function budgetAdherence(data: AppData): number {
  if (data.budgets.length === 0) return 0.7; // neutral-ish default
  const mo = monthRange();
  const monthTx = within(data.transactions, mo.from, mo.to);
  let ok = 0;
  for (const b of data.budgets) {
    const spent = monthTx
      .filter((t) => t.type === "expense" && t.categoryId === b.categoryId)
      .reduce((s, t) => s + t.amount, 0);
    if (spent <= b.amount) ok++;
  }
  return ok / data.budgets.length;
}

// ---------------------------------------------------------------------------
// Smart insights
// ---------------------------------------------------------------------------

export interface Insight {
  id: string;
  tone: "positive" | "warning" | "neutral";
  title: string;
}

export function generateInsights(data: AppData): Insight[] {
  const out: Insight[] = [];
  const catName = (id?: string) => data.categories.find((c) => c.id === id)?.name ?? "Uncategorized";

  const trend = monthlyTrend(data, 2);
  const cur = trend[trend.length - 1];
  const prev = trend[trend.length - 2];

  if (cur && prev && prev.expense > 0) {
    const pct = ((cur.expense - prev.expense) / prev.expense) * 100;
    if (Math.abs(pct) >= 5) {
      out.push({
        id: "exp-change",
        tone: pct > 0 ? "warning" : "positive",
        title: `Spending ${pct > 0 ? "increased" : "decreased"} ${Math.abs(pct).toFixed(0)}% compared to last month.`,
      });
    }
  }

  const { month } = periodSummaries(data);
  if (month.expense > 0 && month.byCategory[0]) {
    const top = month.byCategory[0];
    const share = (top.amount / month.expense) * 100;
    out.push({
      id: "top-cat",
      tone: share > 40 ? "warning" : "neutral",
      title: `${catName(top.categoryId)} is ${share.toFixed(0)}% of total spending this month.`,
    });
  }

  const target = data.settings.monthlySavingsTarget;
  if (month.income > 0) {
    if (month.savingsRate < target) {
      out.push({
        id: "savings-low",
        tone: "warning",
        title: `Savings rate is ${month.savingsRate.toFixed(0)}%, below your ${target}% target.`,
      });
    } else {
      out.push({
        id: "savings-ok",
        tone: "positive",
        title: `Great — savings rate is ${month.savingsRate.toFixed(0)}%, above your ${target}% target.`,
      });
    }
  }

  // budget overruns
  const mo = monthRange();
  const monthTx = within(data.transactions, mo.from, mo.to);
  for (const b of data.budgets) {
    const spent = monthTx
      .filter((t) => t.type === "expense" && t.categoryId === b.categoryId)
      .reduce((s, t) => s + t.amount, 0);
    if (spent > b.amount) {
      out.push({
        id: `budget-${b.id}`,
        tone: "warning",
        title: `Over budget on ${catName(b.categoryId)} by ${Math.round(((spent - b.amount) / b.amount) * 100)}%.`,
      });
    }
  }

  if (month.largestExpense) {
    out.push({
      id: "largest",
      tone: "neutral",
      title: `Largest expense this month: ${catName(month.largestExpense.categoryId)} (${month.largestExpense.description || "—"}).`,
    });
  }

  return out.slice(0, 6);
}
