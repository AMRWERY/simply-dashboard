-- A customer's phone number is now optional.
alter table public.customers drop constraint if exists customers_phone_check;
alter table public.customers alter column phone drop not null;
