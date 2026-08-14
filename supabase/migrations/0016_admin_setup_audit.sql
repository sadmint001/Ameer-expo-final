-- Migration: add admin_setup_audit table to record admin setup attempts
-- This table helps enforce one-time bootstrap and provides an audit trail.
-- Ensure UUID generator is available
create extension if not exists pgcrypto;
CREATE TABLE IF NOT EXISTS public.admin_setup_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  success boolean NOT NULL DEFAULT false,
  error text,
  actor_ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_setup_audit_created_idx ON public.admin_setup_audit(created_at);
