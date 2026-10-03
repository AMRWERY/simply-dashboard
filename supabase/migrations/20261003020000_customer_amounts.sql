-- Amount each customer must pay, and how much of it has been paid so far.
-- The unpaid (remaining) amount is derived in the app: amount_due - amount_paid.
alter table public.customers
  add column if not exists amount_due numeric(12, 2) not null default 0,
  add column if not exists amount_paid numeric(12, 2) not null default 0;

alter table public.customers drop constraint if exists customers_amounts_valid;
alter table public.customers
  add constraint customers_amounts_valid
  check (amount_due >= 0 and amount_paid >= 0 and amount_paid <= amount_due);
