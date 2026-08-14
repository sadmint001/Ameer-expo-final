-- Migration: 0010_checkin_audit
-- Adds an audit log table for ticket check-ins and undos.

create table if not exists public.ticket_checkin_log (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null,
  action text not null check (action in ('check_in', 'undo')),
  performed_at timestamptz not null default now()
);

alter table public.ticket_checkin_log enable row level security;
-- no public policies: only the service role (server) can read/write this table
