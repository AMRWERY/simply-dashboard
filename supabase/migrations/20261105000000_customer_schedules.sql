-- Scheduled dates/times for a customer (many per customer), each markable as done.
create table if not exists public.customer_schedules (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  scheduled_at timestamptz not null,
  done boolean not null default false,
  done_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists customer_schedules_customer_idx
  on public.customer_schedules (customer_id, scheduled_at);
create index if not exists customer_schedules_owner_idx
  on public.customer_schedules (owner_id, scheduled_at);

alter table public.customer_schedules enable row level security;

drop policy if exists "customer_schedules_select_own" on public.customer_schedules;
create policy "customer_schedules_select_own" on public.customer_schedules
  for select to authenticated
  using (owner_id = (select auth.uid()));

-- A schedule can only be attached to one of the caller's own customers.
drop policy if exists "customer_schedules_insert_own" on public.customer_schedules;
create policy "customer_schedules_insert_own" on public.customer_schedules
  for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.customers c
      where c.id = customer_id and c.owner_id = (select auth.uid())
    )
  );

drop policy if exists "customer_schedules_update_own" on public.customer_schedules;
create policy "customer_schedules_update_own" on public.customer_schedules
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "customer_schedules_delete_own" on public.customer_schedules;
create policy "customer_schedules_delete_own" on public.customer_schedules
  for delete to authenticated
  using (owner_id = (select auth.uid()));
