-- ============================================================
-- Migration 0002: note links (course/topic) + habit scheduled days
-- Run in Supabase Dashboard > SQL Editor. Safe to re-run.
-- ============================================================

-- 1. Notes can optionally belong to a course and/or a topic

alter table public.notes
  add column if not exists course_id uuid references public.courses(id) on delete set null,
  add column if not exists topic_id uuid references public.topics(id) on delete set null;

create index if not exists notes_course_idx on public.notes(course_id);
create index if not exists notes_topic_idx on public.notes(topic_id);

-- Tighten the notes policy: linked course/topic must belong to the same user

drop policy if exists "notes_owner_all" on public.notes;
create policy "notes_owner_all" on public.notes
  for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (
      course_id is null
      or exists (
        select 1 from public.courses c
        where c.id = course_id and c.user_id = auth.uid()
      )
    )
    and (
      topic_id is null
      or exists (
        select 1
        from public.topics t
        join public.courses c on c.id = t.course_id
        where t.id = topic_id and c.user_id = auth.uid()
      )
    )
  );

-- 2. Habits: replace generic frequency with explicit weekdays

alter table public.habits
  add column if not exists scheduled_days text[] not null
  default '{mon,tue,wed,thu,fri,sat,sun}';

update public.habits
set scheduled_days = case
  when frequency = 'weekdays' then array['mon','tue','wed','thu','fri']::text[]
  else array['mon','tue','wed','thu','fri','sat','sun']::text[]
end
where frequency is not null;

alter table public.habits drop column if exists frequency;

-- Existing habits RLS policy already covers every column (FOR ALL),
-- so no policy change is needed for scheduled_days.
