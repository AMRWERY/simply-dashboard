# Customers CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist customer add / update / delete in a per-user Supabase `customers` table, keeping the existing home UI.

**Architecture:** SQL migration (table + RLS). Pure helpers in `app/utils/customer.ts` map rows to the existing `Customer` UI shape. A Pinia `customerStore` owns the Supabase calls. `pages/index.vue` swaps its mock array for the store; modal/card/list get small null-safety changes.

**Tech Stack:** Nuxt 4, `@nuxtjs/supabase` 2.0.10, Pinia, vee-validate (modal uses a plain native form).

**Spec:** `docs/superpowers/specs/2026-10-03-customers-crud-design.md`

## Global Constraints

- Required: `name`, `phone`. Optional: `email`, `city`, `status` (default `"new"`). Empty optional strings are stored as `null`.
- `status` values: `"active" | "new" | "follow-up"`.
- `Customer.id` is a `string` (uuid) everywhere (cards, list, delete emit, page).
- Toast style: existing `addToast({ type: "success" | "error", message })`, English text.
- No test runner: verify with `npm run build` + manual checks. Do not add a test framework.
- The user's uncommitted `capitalize` class edit in `app/components/layouts/sidebar.vue` is theirs: do not touch or commit it.

## Review Focus

- Whitespace-only name or phone must be rejected (store trims; DB check rejects blank). (Tasks 1, 3, 4: vee-validate `required` rejects whitespace; the DB check is the backstop)
- Empty email/city saved as `null`; card hides those lines; edit modal prefills them as empty; search does not crash on null. (Tasks 3, 4)
- Updating/deleting a row the user does not own (or that no longer exists) affects 0 rows and must surface as an error toast, not a fake success. (Tasks 1, 3, 4)
- A failed save keeps the modal open with the user's input. (Task 4)
- Deleting the last card on the last page clamps the page (existing watcher still works with string ids). (Task 4)
- Two users each see only their own customers. (Task 1, manual)

---

### Task 1: Migration + DB types

**Files:**
- Create: `supabase/migrations/20261003010000_customers.sql`
- Modify: `app/types/database.types.ts`

**Interfaces:**
- Produces: table `public.customers`; `Database["public"]["Tables"]["customers"]` with `Row`, `Insert`, `Update`.

- [ ] **Step 1: Write the migration**

```sql
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
```

- [ ] **Step 2: Add the table to `database.types.ts`**

Inside `Tables`, next to `profiles`, add:

```ts
      customers: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          phone: string;
          email: string | null;
          city: string | null;
          status: "active" | "new" | "follow-up";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id?: string;
          name: string;
          phone: string;
          email?: string | null;
          city?: string | null;
          status?: "active" | "new" | "follow-up";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          phone?: string;
          email?: string | null;
          city?: string | null;
          status?: "active" | "new" | "follow-up";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20261003010000_customers.sql app/types/database.types.ts
git commit -m "feat(customers): add customers table with per-owner RLS"
```

- [ ] **Step 5 (user):** run the SQL in the Supabase SQL editor. Expected: "Success"; a `customers` table with RLS enabled.

---

### Task 2: Types + mapping helpers

**Files:**
- Modify: `app/types/home.ts`
- Create: `app/utils/customer.ts`

**Interfaces:**
- Consumes: `Database` from Task 1.
- Produces:
  - `Customer { id: string; name: string; initials: string; status: Status; city: string | null; phone: string; email: string | null; avatarClass: string }`
  - `CustomerInput { name: string; phone: string; email?: string; city?: string; status?: Status }`
  - `getInitials(name: string): string`, `avatarClassFor(id: string): string`, `toCustomer(row: CustomerRow): Customer`, `type CustomerRow`.

- [ ] **Step 1: Update `types/home.ts`**

```ts
export type Status = "active" | "new" | "follow-up";

export interface Customer {
  id: string;
  name: string;
  initials: string;
  status: Status;
  city: string | null;
  phone: string;
  email: string | null;
  avatarClass: string;
}

export interface CustomerInput {
  name: string;
  phone: string;
  email?: string;
  city?: string;
  status?: Status;
}

export interface Filter {
  label: string;
  count: number;
}
```

- [ ] **Step 2: Create `app/utils/customer.ts`**

```ts
import type { Database } from "~/types/database.types";
import type { Customer } from "~/types/home";

export type CustomerRow = Database["public"]["Tables"]["customers"]["Row"];

const AVATAR_CLASSES = [
  "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
  "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
  "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-400",
  "bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400",
  "bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-400",
];

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0]! + parts[1][0]!).toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase();
}

/** Same id -> same colour, so the avatar doesn't change between reloads. */
export function avatarClassFor(id: string): string {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_CLASSES[hash % AVATAR_CLASSES.length]!;
}

export function toCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    name: row.name,
    initials: getInitials(row.name),
    status: row.status,
    city: row.city,
    phone: row.phone,
    email: row.email,
    avatarClass: avatarClassFor(row.id),
  };
}
```

- [ ] **Step 3: Commit** (build runs in Task 3 once the store consumes these; the page still compiles meanwhile because Nuxt does not type-check at build)

```bash
git add app/types/home.ts app/utils/customer.ts
git commit -m "feat(customers): customer types and row mapping helpers"
```

---

### Task 3: Customer store

**Files:**
- Create: `app/stores/customerStore.ts`

**Interfaces:**
- Consumes: `Database`, `Customer`, `CustomerInput`, `toCustomer` (Tasks 1-2).
- Produces: `useCustomerStore()` returning `{ items: Ref<Customer[]>, fetchAll(): Promise<void>, create(input: CustomerInput): Promise<void>, update(id: string, input: CustomerInput): Promise<void>, remove(id: string): Promise<void> }`. All reject on failure; `update`/`remove` also reject when no row was affected.

- [ ] **Step 1: Write the store**

```ts
import type { Database } from "~/types/database.types";
import type { Customer, CustomerInput } from "~/types/home";

export const useCustomerStore = defineStore("customers", () => {
  const supabase = useSupabaseClient<Database>();
  const items = ref<Customer[]>([]);

  function toPayload(input: CustomerInput) {
    return {
      name: input.name.trim(),
      phone: input.phone.trim(),
      email: input.email?.trim() || null,
      city: input.city?.trim() || null,
      status: input.status ?? "new",
    };
  }

  async function fetchAll() {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    items.value = data.map(toCustomer);
  }

  async function create(input: CustomerInput) {
    const { data, error } = await supabase
      .from("customers")
      .insert(toPayload(input))
      .select()
      .single();
    if (error) throw error;
    items.value.unshift(toCustomer(data));
  }

  async function update(id: string, input: CustomerInput) {
    // .single() errors when no row matched (missing or not owned).
    const { data, error } = await supabase
      .from("customers")
      .update({ ...toPayload(input), updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    const idx = items.value.findIndex((c) => c.id === id);
    if (idx !== -1) items.value[idx] = toCustomer(data);
  }

  async function remove(id: string) {
    const { data, error } = await supabase
      .from("customers")
      .delete()
      .eq("id", id)
      .select("id");
    if (error) throw error;
    if (!data.length) throw new Error("customer-not-found");
    items.value = items.value.filter((c) => c.id !== id);
  }

  return { items, fetchAll, create, update, remove };
});
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add app/stores/customerStore.ts
git commit -m "feat(customers): add customer store backed by Supabase"
```

---

### Task 4: Wire the page, modal, card and list

**Files:**
- Modify: `app/pages/index.vue` (script: remove `seedCustomers`, fake `fetchCustomers`, `getInitials`, local create/update/delete logic)
- Modify: `app/components/home/home-customer-modal.vue`
- Modify: `app/plugins/vee-validate.ts` (field display names)
- Modify: `app/components/home/home-customer-card.vue`
- Modify: `app/components/home/home-customer-list.vue` (emit types)

**Interfaces:**
- Consumes: `useCustomerStore()` (Task 3), `CustomerInput` (Task 2).

- [ ] **Step 1: Page — load from the store**

Replace the `seedCustomers` array, the `customers`/`isLoading`/`fetchCustomers`/`onMounted` block with:

```ts
const customerStore = useCustomerStore();
const customers = computed(() => customerStore.items);
const isLoading = ref(true);

onMounted(async () => {
  try {
    await customerStore.fetchAll();
  } catch {
    addToast({ type: "error", message: "Could not load customers, try again" });
  } finally {
    isLoading.value = false;
  }
});
```

Update the import to `import type { Customer, CustomerInput, Filter, Status } from "~/types/home";` (keep whatever the file already imports; add `CustomerInput`).

- [ ] **Step 2: Page — null-safe search**

In `visibleCustomers`, replace the `c.email.toLowerCase().includes(query) || c.city.toLowerCase().includes(query)` lines with:

```ts
      (c.email ?? "").toLowerCase().includes(query) ||
      (c.city ?? "").toLowerCase().includes(query) ||
```

- [ ] **Step 3: Page — async delete**

Change `promptDeleteCustomer` to take `id: string`, and replace `confirmDeleteCustomer` with:

```ts
const confirmDeleteCustomer = async () => {
  const target = customerToDelete.value;
  if (!target) return;
  try {
    await customerStore.remove(target.id);
    addToast({
      type: "success",
      message: `Customer "${target.name}" deleted successfully`,
    });
  } catch {
    addToast({ type: "error", message: "Could not delete the customer, try again" });
  } finally {
    isDeleteDialogOpen.value = false;
    customerToDelete.value = null;
  }
};
```

- [ ] **Step 4: Page — async save; remove local `getInitials`**

Delete the page's local `getInitials` (now auto-imported from `app/utils/customer.ts`) and replace `handleSaveCustomer` with:

```ts
const isSaving = ref(false);

const handleSaveCustomer = async (data: CustomerInput) => {
  isSaving.value = true;
  try {
    if (selectedCustomer.value) {
      await customerStore.update(selectedCustomer.value.id, data);
      addToast({ type: "success", message: "Customer updated successfully" });
    } else {
      await customerStore.create(data);
      addToast({ type: "success", message: "Customer added successfully" });
    }
    closeModal();
  } catch {
    // Keep the modal open so the user's input isn't lost.
    addToast({ type: "error", message: "Could not save the customer, try again" });
  } finally {
    isSaving.value = false;
  }
};
```

In the template, pass `:saving="isSaving"` to the `home-customer-modal` element.

- [ ] **Step 5: Modal — validate with vee-validate (not native `required`)**

In `home-customer-modal.vue`:
- Replace `<form @submit.prevent="handleSubmit" ...>` with vee-validate's `<Form @submit="handleSubmit" class="mt-3.5 space-y-2.5">` (and the closing tag). `Form` is auto-imported (`veeValidate.autoImports`) and is used the same way in `login-card.vue`; it validates every registered field and only calls `@submit` when all pass.
- Remove the native `required` attribute from **all** four inputs and give `VInput` a `name` plus `rules` (keeping the existing `v-model`; `VInput` registers itself via `useField` with `syncVModel`):
  - Name: `name="name" rules="required"`
  - Phone: `name="phone" rules="required"`
  - Email: `name="email" rules="email"` (the `email` rule passes an empty value, so it stays optional but must be valid when filled in)
  - City: no `name`/`rules` (optional)
- `required` rejects empty **and** whitespace-only values (checked against `@vee-validate/rules`).
- Add `saving?: boolean` to `defineProps`, and `:loading="saving"` on the submit `LazyVButton`.
- Change the emitted type to `CustomerInput` (`import type { Customer, CustomerInput, Status } from "~/types/home";`): `(e: "save", data: CustomerInput): void;`. `handleSubmit` keeps emitting `{ ...form.value }`.
- Default status becomes `"new"` in all three places that reset the form (the `ref` initial value and both watchers).
- Prefill uses `email: customer.email ?? ""` and `city: customer.city ?? ""`.

Field names in messages: in `app/plugins/vee-validate.ts`, add to the `names` maps: English `name: "Customer Name", phone: "Phone"`; Arabic `name: "اسم العميل", phone: "رقم الهاتف"`, so the errors read "Customer Name is required" / "Phone is required".

- [ ] **Step 6: Card and list**

`home-customer-card.vue`: wrap the city `<p>` with `v-if="customer.city"` and the email `<p>` with `v-if="customer.email"`; change `(e: "delete", id: number)` to `(e: "delete", id: string)`.
`home-customer-list.vue`: change any `id: number` in its `delete` emit to `id: string`.

- [ ] **Step 7: Build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 8: Commit**

```bash
git add app/pages/index.vue app/components/home
git commit -m "feat(customers): load and persist customers via Supabase"
```

---

### Task 5: Manual verification (after the user runs the SQL; use a normal or Incognito window)

- [ ] **Step 1:** Log in, open the home page → skeleton, then an empty list (new table). Add a customer with only name + phone → card appears with no email/city lines; reload → still there.
- [ ] **Step 2:** Add one with every field; edit it (change city, clear email) → card updates, email line disappears; reload to confirm.
- [ ] **Step 3:** Submit with empty name, then empty phone, then a name of only spaces → each blocked with an inline vee-validate message ("Customer Name is required" / "Phone is required"); no row created. A malformed email (e.g. `abc`) is blocked too; an empty email is accepted.
- [ ] **Step 4:** Delete a customer → success toast, gone after reload. Delete the only card on page 2 → pagination returns to page 1.
- [ ] **Step 5:** Search for text that exists only in a city/email, and for a customer with a null email → no crash.
- [ ] **Step 6:** Log in as a second user → empty list; customers of the first user are not visible.
- [ ] **Step 7:** Report results honestly; fix failures before claiming done.
