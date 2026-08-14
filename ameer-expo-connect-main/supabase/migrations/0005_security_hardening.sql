revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop policy if exists "no public access" on public.exhibitor_leads;
create policy "no public access" on public.exhibitor_leads
  for all using (false) with check (false);

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
  for select using ((select auth.uid()) = id);

drop policy if exists "Users can view own registrations" on public.registrations;
create policy "Users can view own registrations" on public.registrations
  for select using ((select auth.uid()) = user_id);
