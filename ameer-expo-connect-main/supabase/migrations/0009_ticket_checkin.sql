-- Migration: 0009_ticket_checkin
-- Adds check-in tracking columns to the registrations table.
-- checked_in_at: set atomically on first scan — the "IS NULL" predicate in the
--   UPDATE prevents duplicate check-ins even under concurrent staff scanning.
-- checked_in_by: identifier for the staff device / operator that performed the scan.

alter table public.registrations
  add column if not exists checked_in_at  timestamptz,
  add column if not exists checked_in_by  text;
