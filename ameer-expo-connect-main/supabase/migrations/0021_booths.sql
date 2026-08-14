create table if not exists public.booths (
  id uuid primary key default gen_random_uuid(),
  booth_number text not null unique,
  size text not null check (size in ('standard','double','premium')),
  price numeric not null,
  status text not null default 'available' check (status in ('available','reserved','booked')),
  reserved_by_inquiry_id uuid references public.partner_inquiries(id),
  reserved_at timestamptz
);

alter table public.booths enable row level security;
create policy "Anyone can view booth availability" on public.booths for select using (true);

-- Add booth_number to partner_inquiries
alter table public.partner_inquiries add column if not exists booth_number text;

-- Seed data for 61 booths
do $$
declare
  i int;
  b_size text;
  b_price numeric;
begin
  for i in 1..61 loop
    if i <= 19 then
      b_size := 'standard';
      b_price := 90000;
    elsif i <= 51 then
      b_size := 'double';
      b_price := 130000;
    else
      b_size := 'premium';
      b_price := 220000;
    end if;

    insert into public.booths (booth_number, size, price)
    values (i::text, b_size, b_price)
    on conflict (booth_number) do nothing;
  end loop;
end;
$$;
