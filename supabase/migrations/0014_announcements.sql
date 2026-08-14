create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

-- Enable RLS
alter table public.announcements enable row level security;

-- Everyone can read announcements
create policy "Announcements are publicly readable"
  on public.announcements for select
  using (true);

-- Only admins can insert announcements
create policy "Admins can insert announcements"
  on public.announcements for insert
  to authenticated
  with check ( (select is_admin from public.profiles where id = auth.uid()) = true );

-- Enable real-time for announcements
alter publication supabase_realtime add table public.announcements;
