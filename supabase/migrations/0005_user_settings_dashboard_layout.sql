-- ============================================================
-- Migration 0005: user settings (dashboard layout)
-- Run in Supabase Dashboard > SQL Editor. Safe to re-run.
-- ============================================================

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  dashboard_layout jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

drop policy if exists "user_settings_owner_all" on public.user_settings;
create policy "user_settings_owner_all" on public.user_settings
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);