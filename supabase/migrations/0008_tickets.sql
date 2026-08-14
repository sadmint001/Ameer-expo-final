-- Migration: 0008_tickets
-- Adds ticket_number and ticket_issued_at to the registrations table.
-- ticket_number is generated server-side at the point of confirmation (free: on insert, VIP: on IPN).
-- The unique constraint prevents duplicate ticket numbers even under concurrent retries.

alter table public.registrations
  add column if not exists ticket_number text,
  add column if not exists ticket_issued_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'registrations_ticket_number_key'
  ) then
    alter table public.registrations
      add constraint registrations_ticket_number_key unique (ticket_number);
  end if;
end $$;
