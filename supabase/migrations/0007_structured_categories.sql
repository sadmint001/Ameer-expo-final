alter table public.registrations
  add column if not exists gender text,
  add column if not exists id_number text,
  add column if not exists whatsapp text,
  add column if not exists linkedin text,
  add column if not exists industry text,
  add column if not exists website text,
  add column if not exists business_type text,
  add column if not exists experience text,
  add column if not exists interests text[],
  add column if not exists wants_b2b text,
  add column if not exists networking_targets text[],
  add column if not exists needs_hotel boolean default false,
  add column if not exists needs_pickup boolean default false,
  add column if not exists needs_visa boolean default false,
  add column if not exists dietary text,
  add column if not exists accessibility text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'registrations_reference_code_key'
  ) then
    alter table public.registrations
    add constraint registrations_reference_code_key unique (reference_code);
  end if;
end $$;
