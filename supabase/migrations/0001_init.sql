-- Auto-create a profile row whenever a Supabase Auth user is created
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  first_name text,
  last_name text,
  created_at timestamptz default now()
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Registrations, linked to the auth user via user_id
create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  company text,
  job_title text,
  pass_type text not null default 'general',
  amount numeric default 0,
  payment_status text default 'free',
  order_tracking_id text,
  payload jsonb not null,
  created_at timestamptz default now()
);

create index if not exists registrations_email_idx on public.registrations (email);
create index if not exists registrations_order_tracking_idx on public.registrations (order_tracking_id);
create index if not exists registrations_user_id_idx on public.registrations (user_id);

-- RLS: default-deny. All reads/writes in this app happen server-side via
-- the service role key, which bypasses RLS entirely — these policies exist
-- so that nothing is exposed if the anon key is ever used against these
-- tables directly in a future feature.
alter table public.profiles enable row level security;
alter table public.registrations enable row level security;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can view own registrations" on public.registrations
  for select using (auth.uid() = user_id);
