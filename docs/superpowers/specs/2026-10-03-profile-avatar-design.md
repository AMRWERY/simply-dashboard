# Profile Avatar Upload — Design

Date: 2026-10-03
Builds on: `2026-10-03-supabase-auth-design.md` (branch `feat/supabase-auth`)

## Goal
A signed-in user can upload a profile image from the sidebar. It is stored in
Supabase Storage, its URL is saved in a `profiles` table, and the sidebar shows
it instead of the initials (initials remain the fallback).

## Success criteria
- Click the sidebar avatar, pick a JPG/PNG/WebP up to 2 MB: it uploads and the
  sidebar shows the new image; reload still shows it (also on first SSR render).
- Wrong type or >2 MB: rejected before upload with an error toast.
- A user can only write to their own `<user-id>/` folder and their own
  `profiles` row (enforced by RLS/Storage policies, not just the UI).
- Replacing the avatar deletes the previous file. Logging out clears the avatar
  from client state so the next user never sees it.

## Out of scope
Cropping/resizing, other profile fields (name, phone), showing the avatar
outside the sidebar, generated Supabase types (hand-written for now).

## Design

### Database (`supabase/migrations/20261003000000_profiles_avatars.sql`, run by the user in the Supabase SQL editor)
- `public.profiles(id uuid pk → auth.users on delete cascade, avatar_url text, updated_at timestamptz)`.
- RLS on: authenticated users can `select` / `update` only the row where `id = auth.uid()`. No insert policy.
- Trigger `on_auth_user_created` (security definer) inserts a profile row for each new auth user; the file backfills existing users.
- Public Storage bucket `avatars`: 2 MB limit, `image/jpeg|png|webp` only.
- `storage.objects` policies for `authenticated`: select/insert/update/delete only where `bucket_id = 'avatars'` and the first folder segment equals `auth.uid()`.

### App
- `app/types/database.types.ts`: hand-written `Database` type with `profiles`.
- `authStore`: `avatarUrl` (`useState`, SSR-safe), `fetchProfile()`, `uploadAvatar(file)`; `logout()` clears `avatarUrl`.
  - `uploadAvatar` validates type/size, uploads to `<uid>/avatar-<timestamp>.<ext>` (unique name avoids stale caches), updates `profiles.avatar_url`, then removes the previous file. If the DB update fails, the just-uploaded file is removed.
- `layouts/dashboard.vue`: `await useAsyncData` calls `fetchProfile()` so the avatar is present on first render.
- `components/layouts/sidebar.vue`: avatar becomes a button + hidden file input, hover camera overlay, spinner while uploading, `<img>` when set else initials, error toasts (hard-coded English like the rest of the app).

## Manual setup (user)
Run the migration SQL once in Supabase → SQL editor.

## Testing
Manual (no test runner): upload valid image; wrong type; >2 MB; replace (old
file gone from bucket); reload (avatar persists); logout/login as another user
(no stale avatar); try writing another user's folder with the anon client
(must be denied).
