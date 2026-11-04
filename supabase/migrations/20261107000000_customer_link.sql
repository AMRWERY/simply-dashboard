-- Customers now store a profile link (e.g. Facebook) instead of an email.
alter table public.customers rename column email to link;
