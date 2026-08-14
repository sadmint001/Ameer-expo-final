create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  speaker_name text,
  speaker_role text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  location text not null,
  track text not null default 'General',
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.sessions enable row level security;

-- Everyone can read sessions
create policy "Sessions are publicly readable"
  on public.sessions for select
  using (true);

-- Only service role can mutate sessions (via admin panel)
create policy "Only service role can mutate sessions"
  on public.sessions for all
  using (false)
  with check (false);


create table public.user_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  session_id uuid references public.sessions(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  unique(user_id, session_id)
);

-- Enable RLS
alter table public.user_bookmarks enable row level security;

-- Users can read their own bookmarks
create policy "Users can read their own bookmarks"
  on public.user_bookmarks for select
  to authenticated
  using (auth.uid() = user_id);

-- Users can insert their own bookmarks
create policy "Users can insert their own bookmarks"
  on public.user_bookmarks for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can delete their own bookmarks
create policy "Users can delete their own bookmarks"
  on public.user_bookmarks for delete
  to authenticated
  using (auth.uid() = user_id);
