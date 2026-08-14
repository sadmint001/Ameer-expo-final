alter table public.partner_inquiries
  add column if not exists selection text,
  add column if not exists amount numeric;

comment on column public.partner_inquiries.selection is
  'Booth size (exhibitor) or package tier (sponsor) chosen in the registration wizard, e.g. "Standard Booth" or "Platinum".';
comment on column public.partner_inquiries.amount is
  'KES price of the selected booth size or sponsorship tier, at time of submission.';
