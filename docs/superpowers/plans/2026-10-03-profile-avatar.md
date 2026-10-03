# Profile Avatar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a signed-in user upload a profile image from the sidebar, stored in Supabase Storage with its URL in a `profiles` table.

**Architecture:** SQL migration (table, RLS, trigger, bucket, storage policies) run once by the user. `authStore` gains `avatarUrl` / `fetchProfile` / `uploadAvatar`. Dashboard layout preloads the profile; the sidebar avatar becomes an upload button.

**Tech Stack:** Nuxt 4, `@nuxtjs/supabase` 2.0.10 (`useSupabaseUser()` = JWT claims, id is `sub`), Pinia, Supabase Storage.

**Spec:** `docs/superpowers/specs/2026-10-03-profile-avatar-design.md`

## Global Constraints

- Bucket `avatars`: public, 2 MB (2097152 bytes), `image/jpeg`, `image/png`, `image/webp` only.
- Object path: `<user-id>/avatar-<timestamp>.<jpg|png|webp>`.
- Table `public.profiles(id, avatar_url, updated_at)` only; no other fields.
- Toast text hard-coded English (matches the app); error toasts use `type: "error"`.
- No test runner in repo: verify with `npm run build` + manual checks. Do not add a test framework.
- The user's uncommitted `capitalize` class edit on the name `<p>` in `sidebar.vue` is theirs: never revert it; stage only your hunks (`git add -p`).

## Review Focus

- Non-image or >2 MB file: rejected client-side, no upload attempted. (Task 2)
- Upload succeeds but profile update fails: orphan file is removed, avatar state unchanged. (Task 2)
- Picking the same file twice in a row still fires (input value reset). (Task 3)
- Logout then login as another user: no stale avatar. (Task 2)
- Reload: avatar present on first render (SSR) without flicker to initials. (Task 3)
- A user cannot write into another user's folder (policy). (Task 1, manual)

---

### Task 1: SQL migration + types

**Files:**
- Create: `supabase/migrations/20261003000000_profiles_avatars.sql`
- Modify: `app/types/database.types.ts` (currently empty)

**Interfaces:**
- Produces: `Database` type with `public.Tables.profiles` (`Row`, `Insert`, `Update`); table `profiles` and bucket `avatars` existing in Supabase.

- [ ] **Step 1: Write the migration**

```sql
-- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  avatar_url text,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- backfill existing users
insert into public.profiles (id)
select id from auth.users
on conflict do nothing;

-- avatars bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "avatars_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "avatars_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "avatars_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "avatars_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
```

- [ ] **Step 2: Write the types**

`app/types/database.types.ts`:

```ts
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; avatar_url: string | null; updated_at: string };
        Insert: { id: string; avatar_url?: string | null; updated_at?: string };
        Update: { id?: string; avatar_url?: string | null; updated_at?: string };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20261003000000_profiles_avatars.sql app/types/database.types.ts
git commit -m "feat(profile): add profiles table, avatars bucket and policies"
```

- [ ] **Step 5 (user):** run the SQL file in Supabase → SQL editor. Expected: "Success", a `profiles` row per existing user, and an `avatars` bucket in Storage.

---

### Task 2: Store — avatar state and upload

**Files:**
- Modify: `app/stores/authStore.ts`

**Interfaces:**
- Consumes: `Database` type from Task 1; existing `useSupabaseClient()`, `supabaseUser` (claims; id = `sub`), `useToast` is NOT used here (store throws, UI toasts).
- Produces: store members `avatarUrl: Ref<string | null>`, `fetchProfile(): Promise<void>`, `uploadAvatar(file: File): Promise<void>`. `uploadAvatar` throws `Error` whose `message` is exactly `"invalid-type"` or `"too-large"` for client-side rejections; any other thrown value is a Supabase error.

- [ ] **Step 1: Type the client and add state**

In `authStore.ts`, add at top: `import type { Database } from "~/types/database.types";`, change the client line to
`const supabase = useSupabaseClient<Database>();`, and add near the other state:

```ts
const AVATAR_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

const avatarUrl = useState<string | null>("avatar_url", () => null);
```

(Put the two constants at module level above `defineStore`.)

- [ ] **Step 2: Add `fetchProfile` and `uploadAvatar`**

Inside the store, before `return`:

```ts
async function fetchProfile() {
  const id = supabaseUser.value?.sub;
  if (!id) {
    avatarUrl.value = null;
    return;
  }
  const { data } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", id)
    .maybeSingle();
  avatarUrl.value = data?.avatar_url ?? null;
}

async function uploadAvatar(file: File) {
  const id = supabaseUser.value?.sub;
  if (!id) throw new Error("not-authenticated");

  const ext = AVATAR_TYPES[file.type];
  if (!ext) throw new Error("invalid-type");
  if (file.size > AVATAR_MAX_BYTES) throw new Error("too-large");

  const bucket = supabase.storage.from("avatars");
  const path = `${id}/avatar-${Date.now()}.${ext}`;

  const { error: uploadError } = await bucket.upload(path, file, {
    contentType: file.type,
    cacheControl: "31536000",
  });
  if (uploadError) throw uploadError;

  const { data } = bucket.getPublicUrl(path);
  const previous = avatarUrl.value;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: data.publicUrl, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (updateError) {
    await bucket.remove([path]); // don't leave an orphan file
    throw updateError;
  }

  avatarUrl.value = data.publicUrl;

  const previousPath = previous?.split("/avatars/")[1];
  if (previousPath) await bucket.remove([previousPath]);
}
```

- [ ] **Step 3: Clear on logout and export**

In `logout()`, after `supabaseUser.value = null;` add `avatarUrl.value = null;`. Change the return to:

```ts
return {
  user,
  isAuthenticated,
  remember,
  sessionAlive,
  avatarUrl,
  login,
  logout,
  fetchProfile,
  uploadAvatar,
};
```

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 5: Commit**

```bash
git add app/stores/authStore.ts
git commit -m "feat(profile): add avatar state and upload to auth store"
```

---

### Task 3: Layout preload + sidebar upload UI

**Files:**
- Modify: `app/layouts/dashboard.vue` (script)
- Modify: `app/components/layouts/sidebar.vue` (the initials `<div>` around line 124-128; script)

**Interfaces:**
- Consumes: `auth.avatarUrl`, `auth.fetchProfile()`, `auth.uploadAvatar(file)` from Task 2 (`"invalid-type"` / `"too-large"` messages).

- [ ] **Step 1: Preload the profile**

`app/layouts/dashboard.vue` script:

```ts
const isMobileMenuOpen = ref(false);

// Load the avatar before first render (SSR) so it doesn't flash initials.
const auth = useAuthStore();
await useAsyncData("profile", async () => {
  await auth.fetchProfile();
  return true;
});
```

- [ ] **Step 2: Replace the initials square with an upload button**

In `sidebar.vue`, replace the `<div ...>{{ userInitials }}</div>` (the gradient square) with:

```vue
<button
  type="button"
  class="group relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-500 text-xs font-extrabold text-white shadow-md shadow-indigo-600/20 focus-visible:ring-2 focus-visible:ring-indigo-500"
  :disabled="isUploadingAvatar"
  aria-label="Change profile picture"
  @click="avatarInput?.click()"
>
  <img
    v-if="auth.avatarUrl"
    :src="auth.avatarUrl"
    alt=""
    class="h-full w-full object-cover"
  />
  <span v-else>{{ userInitials }}</span>
  <span
    class="absolute inset-0 flex items-center justify-center bg-black/50 transition-opacity"
    :class="isUploadingAvatar ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'"
  >
    <svg
      v-if="isUploadingAvatar"
      class="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round"
    >
      <path d="M12 3a9 9 0 1 0 9 9" />
    </svg>
    <svg
      v-else
      class="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  </span>
</button>
<input
  ref="avatarInput"
  type="file"
  accept="image/jpeg,image/png,image/webp"
  class="hidden"
  @change="onAvatarSelected"
/>
```

- [ ] **Step 3: Add the script**

In the sidebar `<script setup>` (after `auth` is defined):

```ts
const { add: addToast } = useToast();
const avatarInput = ref<HTMLInputElement | null>(null);
const isUploadingAvatar = ref(false);

const onAvatarSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = ""; // lets the same file be picked again
  if (!file) return;

  isUploadingAvatar.value = true;
  try {
    await auth.uploadAvatar(file);
  } catch (e) {
    const message =
      e instanceof Error && e.message === "invalid-type"
        ? "Please choose a JPG, PNG or WebP image"
        : e instanceof Error && e.message === "too-large"
          ? "Image must be 2 MB or smaller"
          : "Could not upload the image, try again";
    addToast({ type: "error", message });
  } finally {
    isUploadingAvatar.value = false;
  }
};
```

(If `useToast` is already called in the sidebar script, reuse it instead of redeclaring.)

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 5: Commit** (stage only your hunks in `sidebar.vue`; leave the user's `capitalize` edit)

```bash
git add app/layouts/dashboard.vue
git add -p app/components/layouts/sidebar.vue
git commit -m "feat(profile): sidebar avatar upload"
```

---

### Task 4: Manual verification (after the user runs the SQL)

- [ ] **Step 1:** Log in, click the sidebar avatar, pick a valid JPG/PNG/WebP under 2 MB → image appears, success without error toast.
- [ ] **Step 2:** Reload → avatar present immediately (no flash of initials).
- [ ] **Step 3:** Pick a PDF/GIF → error toast, no network upload request. Pick an image over 2 MB → error toast.
- [ ] **Step 4:** Upload a second image → new one shows; Storage → `avatars/<user-id>/` holds only the newest file.
- [ ] **Step 5:** Log out, log in as another user → no stale avatar.
- [ ] **Step 6:** In the browser console with the app's anon client, try uploading to another user's `<other-id>/x.png` → denied by policy.
- [ ] **Step 7:** Report results honestly; fix failures before claiming done.
