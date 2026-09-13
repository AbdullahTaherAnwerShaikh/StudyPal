-- ============================================================
-- Migration 0004: cascade delete notes with their course/topic
-- Run in Supabase Dashboard > SQL Editor. Safe to re-run.
-- ============================================================

-- Notes disappear when the course they belong to is deleted
alter table public.notes drop constraint if exists notes_course_id_fkey;
alter table public.notes
  add constraint notes_course_id_fkey
  foreign key (course_id) references public.courses(id) on delete cascade;

-- Notes disappear when the topic they belong to is deleted
alter table public.notes drop constraint if exists notes_topic_id_fkey;
alter table public.notes
  add constraint notes_topic_id_fkey
  foreign key (topic_id) references public.topics(id) on delete cascade;