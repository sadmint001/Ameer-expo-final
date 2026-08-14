-- Migration: 0018_checkin_log_pin_fail
-- Expands the ticket_checkin_log.action check constraint to include 'pin_fail'.
-- This new value is written by confirmCheckIn when an incorrect STAFF_CHECKIN_PIN
-- is submitted, enabling the rate-limit query in verify.ts to count bad attempts
-- without requiring a separate table.

alter table public.ticket_checkin_log
  drop constraint if exists ticket_checkin_log_action_check;

alter table public.ticket_checkin_log
  add constraint ticket_checkin_log_action_check
    check (action in ('check_in', 'undo', 'pin_fail'));

-- Index to make the 5-minute rate-limit query fast
create index if not exists ticket_checkin_log_pin_fail_idx
  on public.ticket_checkin_log (action, performed_at)
  where action = 'pin_fail';
