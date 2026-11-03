-- A dated record of money received, so earnings can be reported per month.
--
-- Nothing writes to this table directly. A trigger on customers adds an entry
-- whenever a customer's amount_paid is set or changed: the entry is the
-- difference (positive for money received, negative if the amount was
-- corrected downwards), stamped with the current time.
create table if not exists public.customer_payments (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  amount numeric(12, 2) not null check (amount <> 0),
  paid_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists customer_payments_owner_paid_idx
  on public.customer_payments (owner_id, paid_at desc);
create index if not exists customer_payments_customer_idx
  on public.customer_payments (customer_id);

alter table public.customer_payments enable row level security;

-- Read-only for signed-in users: only their own rows, and no insert/update/delete
-- policies, so the history can only be written by the trigger below.
drop policy if exists "customer_payments_select_own" on public.customer_payments;
create policy "customer_payments_select_own" on public.customer_payments
  for select to authenticated
  using (owner_id = (select auth.uid()));

-- Records the change in amount_paid. SECURITY DEFINER because clients have no
-- insert policy on the table; owner_id comes from the customer row, which row
-- level security has already tied to the caller.
create or replace function public.log_customer_payment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  delta numeric(12, 2);
begin
  if tg_op = 'INSERT' then
    delta := new.amount_paid;
  else
    delta := new.amount_paid - old.amount_paid;
  end if;

  if delta <> 0 then
    insert into public.customer_payments (customer_id, owner_id, amount)
    values (new.id, new.owner_id, delta);
  end if;

  return null;
end;
$$;

drop trigger if exists customers_log_payment on public.customers;
create trigger customers_log_payment
  after insert or update of amount_paid on public.customers
  for each row execute function public.log_customer_payment();

-- Existing customers already have a paid amount but no history: record it once,
-- dated by the customer's last update (the closest date available). Safe to
-- re-run: customers that already have entries are skipped.
insert into public.customer_payments (customer_id, owner_id, amount, paid_at)
select c.id, c.owner_id, c.amount_paid, c.updated_at
from public.customers c
where c.amount_paid > 0
  and not exists (
    select 1 from public.customer_payments p where p.customer_id = c.id
  );
