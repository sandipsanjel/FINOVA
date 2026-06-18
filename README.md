# Finova — Personal & Family Finance Dashboard

A premium, local-first finance management dashboard for tracking money across
multiple people and multiple accounts. Built for a family (you, father, mother,
and any future members) with accounts, transactions, budgets, goals, recurring
rules, rich analytics and reports.

> **Local-first:** all data lives in your browser (localStorage). No server, no
> login, fully private. Export/import JSON backups any time. The data layer is
> abstracted so a backend (e.g. Supabase) can be added later without UI changes.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5180
```

The app loads a rich **demo dataset** on first run. Go to **Settings → Reset
everything** to start blank, or **Load demo data** to restore the sample.

```bash
npm run build    # production build to /dist
npm run preview  # preview the built app
npm run typecheck
```

## Features

| Area | What's included |
|------|-----------------|
| **Accounts** | Multiple people, each with bank / cash / savings / investment accounts. Opening balance, notes, active status, live computed balances. |
| **Transactions** | Income, Expense, Transfer, Adjustment. Fast-entry modal (`n` to open, *Save & add another*, Enter to submit). Categories, tags, person, account. |
| **Dashboard** | Net worth, cash, monthly income/expense, savings, savings rate, account balances, 5 charts + insights. |
| **Analytics** | Weekly / monthly / yearly summaries, 10 charts, category breakdowns, member comparison, heatmap, health score. |
| **Budgets** | Monthly limits per category with used / remaining / over-budget alerts. |
| **Goals** | Savings goals with target, saved, remaining, progress; contribute / withdraw. |
| **Recurring** | Salary / rent / bills rules with weekly/monthly/yearly cadence and **Generate due** auto-posting. |
| **Reports** | Weekly / monthly / quarterly / yearly reports with category breakdown. Export **CSV**, **Excel**, **PDF** (print). |
| **Insights** | Auto-generated observations (spending changes, top category, savings vs target, budget overruns). |
| **Filters** | Date range, person, account, category, type, search — instantly update tables/charts. |
| **UX** | Dark/Light mode, fully responsive, keyboard-friendly, premium SaaS styling. |

## The 10 charts

1. Monthly Income vs Expense Trend  2. Cash Flow Timeline  3. Expense Category Pie
4. Expense Category Bar  5. Family Member Spending  6. Account Balance History
7. Savings Growth  8. Net Worth Growth  9. Weekly Spending Heatmap  10. Financial Health Score

## Tech stack

- **React 18 + TypeScript + Vite** — fast SPA, no SSR needed for a local app
- **Tailwind CSS** — design system, dark/light theming
- **Recharts** — charts and visualizations
- **Zustand** (with `persist`) — state + localStorage persistence
- **date-fns** — date math   ·   **lucide-react** — icons

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the data model, schema,
component architecture, API surface and scalability plan.

## Keyboard shortcuts

- `n` — new transaction   ·   `Esc` — close modal   ·   `Enter` — save in modal
```
