create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (length(btrim(name)) > 0),
  phone text not null check (length(btrim(phone)) > 0),
  email text,
  city text,
  status text not null default 'new' check (status in ('active', 'new', 'follow-up')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customers_owner_created_idx
  on public.customers (owner_id, created_at desc);

alter table public.customers enable row level security;

drop policy if exists "customers_select_own" on public.customers;
create policy "customers_select_own" on public.customers
  for select to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists "customers_insert_own" on public.customers;
create policy "customers_insert_own" on public.customers
  for insert to authenticated
  with check (owner_id = (select auth.uid()));

drop policy if exists "customers_update_own" on public.customers;
create policy "customers_update_own" on public.customers
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "customers_delete_own" on public.customers;
create policy "customers_delete_own" on public.customers
  for delete to authenticated
  using (owner_id = (select auth.uid()));
