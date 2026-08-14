alter table public.profiles
  add column if not exists is_public boolean default false,
  add column if not exists company text,
  add column if not exists job_title text,
  add column if not exists bio text,
  add column if not exists industry text,
  add column if not exists networking_goals text;

create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references public.profiles(id) on delete cascade not null,
  target_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(requester_id, target_id)
);

alter table public.connections enable row level security;

-- Users can see connection requests where they are requester or target
create policy "Users can view their connections" on public.connections
  for select to authenticated
  using (auth.uid() = requester_id or auth.uid() = target_id);

-- Users can insert connections where they are requester
create policy "Users can request connections" on public.connections
  for insert to authenticated
  with check (auth.uid() = requester_id);

-- Target users can update status (accept/reject)
create policy "Targets can update connection status" on public.connections
  for update to authenticated
  using (auth.uid() = target_id);

-- Re-declare profile view policy for public profiles
-- Note: if 0001_init.sql had a restrictive policy, this adds an OR condition via the union.
create policy "Anyone can view public profiles" on public.profiles
  for select
  using (is_public = true);

-- Profile update policy
create policy "Users can update own profile networking fields" on public.profiles
  for update to authenticated
  using (auth.uid() = id);
