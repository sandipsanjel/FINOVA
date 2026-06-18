-- Finance Dashboard — Supabase schema
-- Run this once in your Supabase project: SQL Editor → New query → paste → Run.
--
-- Model: single JSONB document per user. The whole app state (people, accounts,
-- categories, transactions, etc.) is stored in one row, isolated per user via RLS.

create table if not exists public.finance_state (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.finance_state enable row level security;

-- A user can only read/write their own row.
drop policy if exists "own finance_state" on public.finance_state;
create policy "own finance_state"
  on public.finance_state
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
