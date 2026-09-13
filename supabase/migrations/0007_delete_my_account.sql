-- ============================================================
-- Migration 0007: self-service account deletion
-- Run in Supabase Dashboard > SQL Editor. Safe to re-run.
--
-- Lets a signed-in user delete their own auth account plus all
-- of their data. Runs with SECURITY DEFINER (as the function
-- owner) so it can touch every data table and auth.users.
-- Child rows are deleted explicitly (in FK-safe order) before
-- the auth user, so this works whether or not the underlying
-- foreign keys have ON DELETE CASCADE.
-- ============================================================

create or replace function public.delete_my_account()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.habit_logs where user_id = auth.uid();
  delete from public.habits where user_id = auth.uid();
  delete from public.study_plans where user_id = auth.uid();
  delete from public.user_settings where user_id = auth.uid();
  delete from public.notes where user_id = auth.uid();
  delete from public.tasks where user_id = auth.uid();
  delete from public.exams where user_id = auth.uid();
  delete from public.topics where user_id = auth.uid();
  delete from public.courses where user_id = auth.uid();
  delete from auth.users where id = auth.uid();
$$;

grant execute on function public.delete_my_account() to anon, authenticated;