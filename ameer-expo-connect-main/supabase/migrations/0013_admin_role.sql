alter table public.profiles
  add column if not exists is_admin boolean default false;

-- Allow admins to see all profiles
create policy "Admins can view all profiles" on public.profiles
  for select to authenticated
  using (is_admin = true);

-- Enable RLS on registrations if not fully restrictive and allow admins
drop policy if exists "Admins can view all registrations" on public.registrations;
create policy "Admins can view all registrations" on public.registrations
  for select to authenticated
  using ( (select is_admin from public.profiles where id = auth.uid()) = true );

-- Admins can update sessions
create policy "Admins can insert sessions" on public.sessions
  for insert to authenticated
  with check ( (select is_admin from public.profiles where id = auth.uid()) = true );

create policy "Admins can update sessions" on public.sessions
  for update to authenticated
  using ( (select is_admin from public.profiles where id = auth.uid()) = true );

create policy "Admins can delete sessions" on public.sessions
  for delete to authenticated
  using ( (select is_admin from public.profiles where id = auth.uid()) = true );
