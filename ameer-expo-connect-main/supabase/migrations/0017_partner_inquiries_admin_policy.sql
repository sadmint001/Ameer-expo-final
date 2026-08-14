-- Migration: 0017_partner_inquiries_admin_policy
-- Grants admins SELECT access to all partner_inquiries rows.
-- The table has RLS enabled (from 0006_partner_inquiries.sql) but had zero
-- policies, making every row invisible to the client-side supabase client.
-- This policy is the only one needed: the form inserts use the service-role
-- key (supabaseAdmin) which bypasses RLS entirely.

create policy "Admins can view all partner inquiries"
  on public.partner_inquiries
  for select
  to authenticated
  using (
    (select is_admin from public.profiles where id = auth.uid()) = true
  );
