-- Every customer is now simply "active": move existing rows over and make it the default.
alter table public.customers drop constraint if exists customers_status_check;
update public.customers set status = 'active' where status <> 'active';
alter table public.customers alter column status set default 'active';
alter table public.customers add constraint customers_status_check check (status = 'active');
