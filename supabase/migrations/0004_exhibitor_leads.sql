create table if not exists public.exhibitor_leads (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  contact_name text not null,
  email text not null,
  phone text,
  interest text not null, -- 'booth' | 'sponsorship'
  tier_or_size text,
  message text,
  created_at timestamptz default now()
);
alter table public.exhibitor_leads enable row level security;
-- no public policies: only the service role (server-side) touches this table
