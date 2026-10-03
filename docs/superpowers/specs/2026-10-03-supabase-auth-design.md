# Supabase Auth Integration — Design

Date: 2026-10-03

## Goal
Replace the mock login with real Supabase Auth (email + password). Accounts are
created by an admin (Supabase dashboard or invite); there is no sign-up page.

## Success criteria
- Real email/password sign-in via Supabase; wrong credentials show the existing
  translated "Incorrect email or password" toast.
- Session persists across reloads and SSR; `auth` / `guest` middleware enforce
  access using the real Supabase user.
- "Remember me" checked: the user opens the site and lands on the dashboard
  without logging in again. Unchecked: the session ends when the browser closes.
- Logout clears the session and redirects to `/auth`.

## Out of scope
Sign-up, forgot/reset password (link commented out), social login, roles,
database tables and RLS.

## Existing context
- `@nuxtjs/supabase` is installed; `nuxt.config.ts` has `supabase.redirect: false`.
- `.env` has `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SECRET_KEY`.
- `app/stores/authStore.ts` holds a fake token/user in cookies.
- `app/components/auth/login-card.vue` fakes sign-in with `setTimeout`.
- `app/middleware/auth.ts` and `guest.ts` read `authStore.isAuthenticated`.
- i18n uses prefix strategy (`ar` default, `en`).

## Design

### Config (`nuxt.config.ts`)
Add `supabase.cookieOptions.maxAge` (long, e.g. 1 year). Keep `redirect: false`.

### Auth store (`app/stores/authStore.ts`)
- `login(email, password, remember)`: `supabase.auth.signInWithPassword`, then
  set cookies `remember` (`1`/`0`, long-lived) and `session_alive` (session
  cookie, no expiry). Throws on error.
- `logout()`: `supabase.auth.signOut()`, clear both cookies.
- `isAuthenticated`: derived from `useSupabaseUser()`.
- `user`: `AuthUser` mapped from the Supabase user (`name` from
  `user_metadata.name`, falling back to the email).
- Remove the fake `auth_token` / `auth_user` cookies.

### Login card (`login-card.vue`)
Keep the form; submit calls `authStore.login(email, password, remember)` and
navigates to `/`. Map errors to the translated toast. Comment out the
"Forgot password?" link.

### Remember-me guard (`app/plugins/session-guard.client.ts`)
On client startup, if `remember === '0'` and `session_alive` is absent (browser
was closed), call `signOut()`. Trade-off: for unchecked users the Supabase
cookie stays on disk until the next app load clears it.

### Route protection
`auth` / `guest` middleware unchanged. Ensure dashboard pages (`index`,
`reports`) declare `middleware: "auth"`.

### Logout
Wire the header/sidebar logout control to `authStore.logout()` and redirect to
`/auth`.

## Manual setup (user)
In Supabase: Authentication → Sign In / Providers → turn off "Allow new users
to sign up"; create users via the dashboard or invite.

## Testing
Manual (no test runner in repo): login, reload, close/reopen browser with the
box checked and unchecked, protected-route redirect, guest redirect, wrong
credentials, logout.
