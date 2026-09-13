-- ============================================================
-- Migration 0003: study plans
-- Run in Supabase Dashboard > SQL Editor. Safe to re-run.
-- ============================================================

create table if not exists public.study_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  params jsonb not null default '{}'::jsonb,
  days jsonb not null default '[]'::jsonb,
  warnings text[] not null default '{}',
  model text not null default '',
  completed_days text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists study_plans_user_idx on public.study_plans(user_id);
create index if not exists study_plans_created_at_idx on public.study_plans(created_at desc);

alter table public.study_plans enable row level security;

drop policy if exists "study_plans_owner_all" on public.study_plans;
create policy "study_plans_owner_all" on public.study_plans
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);