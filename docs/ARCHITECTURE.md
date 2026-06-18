# Finova — Architecture & Design

This document covers the deliverables: UX flow, data/DB schema, component
architecture, API structure, folder structure and the future scalability plan.

---

## 1. Tech stack (recommended)

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | **React 18 + TypeScript + Vite** | Fast SPA, no SSR needed for a private local tool. Portable to Next.js later. |
| Styling | **Tailwind CSS** | Design-system speed, first-class dark mode. |
| Charts | **Recharts** | Declarative, responsive, composable. |
| State | **Zustand** + `persist` | Tiny, no boilerplate; localStorage persistence built in. |

---

## 2. UX flow

```
First run ──> Demo data auto-loaded ──> Dashboard
                                          │
   ┌──────────────────────────────────────┼─────────────────────────────┐
   │            │            │             │              │               │
 Add tx      Accounts     Analytics     Budgets/Goals   Recurring       Reports
 (modal,     (people +    (summaries +  (limits +       (rules +        (period +
  press n)    accounts)    10 charts)    progress)       Generate due)   export)
   │
   └─> Type → Amount → Person → Account → Category → Save / Save & add another
```

**Fast-entry principles:** quick-add button always in the top bar; `n` opens the
modal from anywhere; Enter saves; "Save & add another" keeps person/account/date
for batch entry; everything reachable in ≤ 3 clicks.

---

## 3. Data model / database schema

The TypeScript model in `src/types/index.ts` is the source of truth. Mapped to a
relational schema (Postgres / Supabase) it is:

```sql
-- people (family members)
create table people (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  color       text not null,
  created_at  timestamptz default now()
);

create table accounts (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  owner_id        uuid not null references people(id) on delete cascade,
  type            text not null check (type in ('bank','cash','savings','investment')),
  opening_balance numeric not null default 0,
  notes           text,
  active          boolean not null default true,
  created_at      timestamptz default now()
);

create table categories (
  id       uuid primary key default gen_random_uuid(),
  name     text not null,
  type     text not null check (type in ('income','expense','adjustment')),
  color    text not null,
  builtin  boolean default false
);

create table transactions (
  id            uuid primary key default gen_random_uuid(),
  type          text not null check (type in ('income','expense','transfer','adjustment')),
  date          date not null,
  amount        numeric not null check (amount >= 0),
  person_id     uuid not null references people(id) on delete cascade,
  account_id    uuid not null references accounts(id) on delete cascade,
  to_account_id uuid references accounts(id),       -- transfers only
  category_id   uuid references categories(id),
  description   text,
  tags          text[] default '{}',
  created_at    timestamptz default now()
);
create index on transactions (date);
create index on transactions (person_id);
create index on transactions (account_id);

create table recurring_rules (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  type          text not null,
  amount        numeric not null,
  person_id     uuid not null references people(id) on delete cascade,
  account_id    uuid not null references accounts(id) on delete cascade,
  to_account_id uuid references accounts(id),
  category_id   uuid references categories(id),
  tags          text[] default '{}',
  recurrence    text not null check (recurrence in ('weekly','monthly','yearly')),
  day_of_month  int,
  start_date    date not null,
  last_run      date,
  active        boolean not null default true,
  created_at    timestamptz default now()
);

create table budgets (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete cascade,
  person_id   uuid references people(id) on delete cascade, -- null = whole family
  amount      numeric not null,
  created_at  timestamptz default now()
);

create table goals (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  target_amount numeric not null,
  saved_amount  numeric not null default 0,
  target_date   date,
  person_id     uuid references people(id) on delete cascade,
  color         text not null,
  created_at    timestamptz default now()
);
```

**Balance derivation** (never stored, always computed):

```
balance(account) = opening_balance
  + Σ income.amount  where account_id = account
  − Σ expense.amount where account_id = account
  − Σ transfer.amount where account_id = account      (out)
  + Σ transfer.amount where to_account_id = account    (in)
  ± adjustment.amount
```

---

## 4. Folder structure

```
finance-dashboard/
├─ index.html
├─ vite.config.ts · tailwind.config.js · tsconfig.json
├─ docs/ARCHITECTURE.md
└─ src/
   ├─ main.tsx · App.tsx · index.css
   ├─ types/           # domain model (single source of truth)
   ├─ lib/             # pure logic: analytics, currency, dates, export, seed, id
   ├─ store/           # Zustand store (the data layer / "repository")
   ├─ components/
   │  ├─ ui/           # design-system primitives (Card, Button, Modal, Field…)
   │  ├─ layout/       # Sidebar, Topbar
   │  ├─ charts/       # Recharts charts + heatmap + health gauge
   │  ├─ transactions/ # TransactionModal, TransactionTable
   │  ├─ filters/      # FilterBar
   │  └─ insights/     # InsightsPanel
   └─ pages/           # Dashboard, Transactions, Accounts, Analytics,
                       # Budgets, Goals, Recurring, Reports, Settings
```

---

## 5. Component architecture

```
App (theme + routing + global shortcuts)
├─ Sidebar / Topbar
├─ <Page> ── reads store via selectors, composes:
│   ├─ ui/*        (presentational primitives)
│   ├─ charts/*    (self-contained: read store, compute via lib/analytics)
│   ├─ FilterBar   (writes ui.filters → analytics.applyFilters)
│   └─ Insights / Tables
└─ TransactionModal (global, controlled by store ui state)
```

- **Pure logic in `lib/`** — `analytics.ts` has no React; fully unit-testable.
- **Single store** — `useStore` holds both domain data and UI state, persisted.
- **Charts are self-contained** — each pulls the data it needs and memoizes.

---

## 6. API structure (when a backend is added)

The Zustand store actions map 1:1 to a future REST/RPC surface:

```
GET    /people                 store.people
POST   /people                 addPerson
PATCH  /people/:id             updatePerson
DELETE /people/:id             removePerson
… same shape for /accounts /transactions /budgets /goals /recurring …
POST   /recurring/run-due      runDueRecurring
GET    /analytics/summary?range=month   periodSummaries (or compute server-side)
```

Because every read goes through `lib/analytics` and every write through a store
action, swapping localStorage for HTTP/Supabase only touches `store/useStore.ts`.

---

## 7. Future scalability plan

1. **Cloud sync** — replace the `persist` storage adapter with Supabase calls;
   add Row-Level Security keyed by a `household_id`. UI untouched.
2. **Auth & multi-household** — Supabase Auth; add `household_id` to every table.
3. **More members** — already supported; the model is person-agnostic.
4. **Server-side analytics** — move heavy aggregations to SQL views / Postgres
   functions for large datasets.
5. **Attachments** — receipts/bills via Supabase Storage linked to transactions.
6. **Bank import** — CSV/PDF statement parsers feeding the same `addTransaction`.
7. **Multi-currency** — per-account currency + FX table; `formatMoney` already
   currency-aware.
8. **Performance** — virtualize long transaction lists; code-split chart bundle.
9. **PWA/offline** — installable, offline-first (local-first already supports it).
```
