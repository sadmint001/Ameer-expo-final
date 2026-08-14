-- Migration: 0019_catchup_missing_schema
-- Applies schema items that exist in local migration files (0012, 0014)
-- but were not present in the live Supabase database (applied via differently-
-- named migrations that omitted these specific DDL statements).

-- 1. announcements.expires_at (from 0014_announcements.sql)
--    Allows timed/expiring announcements to be filtered client-side.
alter table public.announcements
  add column if not exists expires_at timestamptz;

-- 2. profiles UPDATE policy for authenticated users editing their own row
--    (from 0012_networking.sql — SELECT policies existed but UPDATE was missing)
drop policy if exists "Users can update own profile networking fields" on public.profiles;
create policy "Users can update own profile networking fields"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);
