create table if not exists public.partner_inquiries (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('exhibitor', 'sponsor')),
  company_name text not null,
  contact_name text not null,
  email text not null,
  phone text,
  message text,
  created_at timestamptz default now()
);
alter table public.partner_inquiries enable row level security;
