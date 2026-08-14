-- ============================================================
-- 0023: Security & Performance hardening
-- Fixes all Supabase advisor warnings
-- ============================================================

-- ── 1. RLS policies with no rows: add service-role-only policies ──────────────
-- admin_setup_audit: only service role can insert/select (no public access needed)
create policy "Service role only: admin_setup_audit select"
  on public.admin_setup_audit for select using (false);

-- ticket_checkin_log: already written via service role; block public reads
create policy "Service role only: ticket_checkin_log select"
  on public.ticket_checkin_log for select using (false);

-- ── 2. Auth RLS initplan — wrap auth.uid() in (select ...) for all affected tables ──
-- user_bookmarks
drop policy if exists "Users manage own bookmarks" on public.user_bookmarks;
create policy "Users manage own bookmarks"
  on public.user_bookmarks
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- connections: Users view own connections
drop policy if exists "Users view own connections" on public.connections;
create policy "Users view own connections"
  on public.connections for select
  using (
    (select auth.uid()) = requester_id
    or (select auth.uid()) = target_id
  );

-- connections: Users create own connection requests
drop policy if exists "Users create own connection requests" on public.connections;
create policy "Users create own connection requests"
  on public.connections for insert
  with check ((select auth.uid()) = requester_id);

-- connections: Recipients update connection status
drop policy if exists "Recipients update connection status" on public.connections;
create policy "Recipients update connection status"
  on public.connections for update
  using ((select auth.uid()) = target_id);

-- registrations: Admins can view all registrations
drop policy if exists "Admins can view all registrations" on public.registrations;
create policy "Admins can view all registrations"
  on public.registrations for select
  using (
    (select auth.uid()) in (
      select id from public.profiles where is_admin = true
    )
  );

-- sessions: Admins can insert sessions
drop policy if exists "Admins can insert sessions" on public.sessions;
create policy "Admins can insert sessions"
  on public.sessions for insert
  with check (
    (select auth.uid()) in (
      select id from public.profiles where is_admin = true
    )
  );

-- sessions: Admins can update sessions
drop policy if exists "Admins can update sessions" on public.sessions;
create policy "Admins can update sessions"
  on public.sessions for update
  using (
    (select auth.uid()) in (
      select id from public.profiles where is_admin = true
    )
  );

-- sessions: Admins can delete sessions
drop policy if exists "Admins can delete sessions" on public.sessions;
create policy "Admins can delete sessions"
  on public.sessions for delete
  using (
    (select auth.uid()) in (
      select id from public.profiles where is_admin = true
    )
  );

-- announcements: Admins can insert announcements
drop policy if exists "Admins can insert announcements" on public.announcements;
create policy "Admins can insert announcements"
  on public.announcements for insert
  with check (
    (select auth.uid()) in (
      select id from public.profiles where is_admin = true
    )
  );

-- partner_inquiries: Admins can view all partner inquiries
drop policy if exists "Admins can view all partner inquiries" on public.partner_inquiries;
create policy "Admins can view all partner inquiries"
  on public.partner_inquiries for select
  using (
    (select auth.uid()) in (
      select id from public.profiles where is_admin = true
    )
  );

-- profiles: Users can update own profile networking fields
drop policy if exists "Users can update own profile networking fields" on public.profiles;
create policy "Users can update own profile networking fields"
  on public.profiles for update
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- ── 3. Missing FK index: announcements.created_by ────────────────────────────
create index if not exists announcements_created_by_idx on public.announcements(created_by);
