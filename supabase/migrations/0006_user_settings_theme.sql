-- ============================================================
-- Migration 0006: user theming (accent preset + light/dark)
-- Run in Supabase Dashboard > SQL Editor. Safe to re-run.
-- Requires 0005 (user_settings table) to be applied first.
-- ============================================================

alter table public.user_settings
  add column if not exists theme text not null default 'indigo',
  add column if not exists theme_mode text not null default 'light';

alter table public.user_settings
  drop constraint if exists user_settings_theme_mode_check;

alter table public.user_settings
  add constraint user_settings_theme_mode_check
  check (theme_mode in ('light', 'dark'));

-- The accent preset list is intentionally enforced app-side
-- (curated keys like 'indigo', 'sky', 'emerald', 'amber', 'rose')
-- so new presets don't require a schema change.