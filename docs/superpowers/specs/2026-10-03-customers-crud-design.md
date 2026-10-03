# Customers CRUD (Supabase) — Design

Date: 2026-10-03
Builds on: `2026-10-03-supabase-auth-design.md`, `2026-10-03-profile-avatar-design.md` (branch `feat/profile-avatar`)

## Goal
Replace the mock customer array in `app/pages/index.vue` with a real Supabase
`customers` table so add / update / delete persist. The existing UI (cards,
modal, delete dialog, search, filters, pagination, toasts) is kept.

## Decisions (from the user)
- **Per-user data:** each user sees and changes only the customers they created.
- **Required fields:** `name` and `phone`. `email`, `city`, `status` are optional
  (`status` defaults to `new`).

## Success criteria
- List loads from the database (skeleton while loading); reload shows the same data.
- Create / update / delete persist; success toasts as today, error toast on failure.
- A failed save keeps the modal open with the user's input; a failed delete shows an error.
- A user cannot read, update or delete another user's customers, nor create one
  owned by someone else (enforced by RLS, not only the UI).
- A customer with no email/city renders without a blank/"null" line.

## Out of scope
Server-side pagination (all of the user's customers load at once; search, filter
and pagination stay client-side), import/export, notes or other fields.

## Design

### Database (`supabase/migrations/20261003010000_customers.sql`, run once by the user)
`public.customers`:
- `id uuid pk default gen_random_uuid()`
- `owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade`
- `name text not null` and `phone text not null`, each with `check (length(btrim(...)) > 0)`
- `email text null`, `city text null`
- `status text not null default 'new' check (status in ('active','new','follow-up'))`
- `created_at timestamptz not null default now()`, `updated_at timestamptz not null default now()`
- index on `(owner_id, created_at desc)`

RLS enabled; policies for `authenticated`: select/update/delete `using (owner_id = auth.uid())`;
insert `with check (owner_id = auth.uid())`; update also `with check (owner_id = auth.uid())`.
The migration is re-runnable (`drop policy if exists`, `create table if not exists`).

### App
- `app/types/database.types.ts`: add `customers` (Row/Insert/Update).
- `app/types/home.ts`: `Customer.id` becomes `string`; `email`/`city` become `string | null`;
  add `CustomerInput { name; phone; email?; city?; status? }`. `initials` and `avatarClass` stay on `Customer` but are derived, never stored.
- `app/utils/customer.ts`: `getInitials(name)`, `avatarClassFor(id)` (deterministic hash of the id into the existing colour palette), `toCustomer(row)`.
- `app/stores/customerStore.ts` (Pinia): `items`, `fetchAll()`, `create(input)`, `update(id, input)`, `remove(id)`.
  Trims name/phone, stores empty email/city as `null`, defaults status to `new`.
  `update`/`remove` throw when no row is affected (missing or not owned).
- `app/pages/index.vue`: remove seed data / fake fetch / local `getInitials`; use the store; save and delete are async with error toasts; modal stays open on failure.
- `home-customer-modal.vue`: validated with vee-validate (`<Form>` + `rules="required"` on name and phone, `rules="email"` on the optional email), no native `required`; field display names added in `plugins/vee-validate.ts`; `saving` prop disables/loads the submit button; default status `new`; null-safe edit prefill.
- `home-customer-card.vue` / `home-customer-list.vue`: `id` is `string`; city and email lines render only when present.
- Search handles null email/city.

## Manual setup (user)
Run the migration SQL once in the Supabase SQL editor.

## Testing
Manual (no test runner): create with only name+phone; create with all fields;
edit; delete; reload persistence; blank/whitespace name or phone rejected;
two different users see separate lists; another user's row id cannot be
updated/deleted via the API (denied); search with null email/city.
