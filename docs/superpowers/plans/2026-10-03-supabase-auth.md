# Supabase Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the mock login with real Supabase email/password auth, with a working "Remember me".

**Architecture:** `@nuxtjs/supabase` (already installed) owns the session in cookies. The Pinia `authStore` wraps `useSupabaseClient()` / `useSupabaseUser()` and keeps its public surface (`user`, `isAuthenticated`, `login`, `logout`) so the `auth`/`guest` middleware and sidebar keep working. "Remember me" = long `maxAge` on the Supabase cookie + two small cookies (`remember`, `session_alive`) and a client plugin that signs out when a non-remembered browser session ended.

**Tech Stack:** Nuxt 4, `@nuxtjs/supabase` 2.0.10 (`useSupabaseUser()` returns JWT **claims**: `sub`, `email`, `user_metadata`), Pinia, vee-validate, @nuxtjs/i18n (prefix strategy).

**Spec:** `docs/superpowers/specs/2026-10-03-supabase-auth-design.md`

## Global Constraints

- Email + password only; no sign-up page; no forgot/reset-password (link commented out, not deleted).
- Keep `supabase.redirect: false`; redirects stay in `app/middleware/auth.ts` / `guest.ts` (unchanged).
- Cookie names: `remember` (`"1"`/`"0"`, 1-year maxAge), `session_alive` (session cookie, no maxAge). Remove old `auth_token` / `auth_user` cookies.
- Wrong-credentials toast text stays `"Incorrect email or password"` (the existing code hard-codes English in `login-card.vue`; match it).
- Repo has no test runner: verification = `npm run build` plus manual browser checks. Do not add a test framework.
- Do not commit `.env`. If `nuxt.config.ts` has unrelated uncommitted edits from the user, stage only this plan's hunk (`git add -p`).

## Review Focus

- Non-remembered user closes browser, reopens a deep link (`/ar/reports`): must end on `/ar/auth`, not see the dashboard. (Task 3)
- Remembered user (`remember=1`) must never be signed out by the guard. (Task 3)
- `remember` / `session_alive` cookies missing entirely while a Supabase session exists: treated as remembered (no sign-out). (Task 3)
- Login success must set the store user before navigation so the `guest`/`auth` middleware does not bounce back. (Task 1)
- Logout must clear the Supabase session and both cookies, then land on `/auth`. (Tasks 1, 2)

---

### Task 1: Config + auth store

**Files:**
- Modify: `nuxt.config.ts` (the `supabase` block)
- Modify: `app/stores/authStore.ts` (full rewrite)

**Interfaces:**
- Produces: `useAuthStore()` returning
  `{ user: ComputedRef<AuthUser | null>, isAuthenticated: ComputedRef<boolean>, remember: Ref<"1"|"0"|null>, sessionAlive: Ref<"1"|null>, login(email: string, password: string, remember: boolean): Promise<void>, logout(): Promise<void> }`.
  `login` throws the Supabase `AuthError` on bad credentials.

- [ ] **Step 1: Configure cookie lifetime**

In `nuxt.config.ts` replace the `supabase` block with:

```ts
  supabase: {
    redirect: false,
    cookieOptions: {
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      secure: true,
    },
  },
```

- [ ] **Step 2: Rewrite the store**

`app/stores/authStore.ts`:

```ts
import type { AuthUser } from "~/types/auth";

const ONE_YEAR = 60 * 60 * 24 * 365;

export const useAuthStore = defineStore("auth", () => {
  const supabase = useSupabaseClient();
  const supabaseUser = useSupabaseUser();

  // Long-lived: did the user tick "Remember me"?
  const remember = useCookie<"1" | "0" | null>("remember", {
    default: () => null,
    maxAge: ONE_YEAR,
    sameSite: "lax",
    secure: true,
  });

  // Session cookie (no maxAge): disappears when the browser closes.
  const sessionAlive = useCookie<"1" | null>("session_alive", {
    default: () => null,
    sameSite: "lax",
    secure: true,
  });

  const user = computed<AuthUser | null>(() => {
    const claims = supabaseUser.value;
    if (!claims) return null;
    const email = claims.email ?? "";
    const meta = (claims.user_metadata ?? {}) as { name?: string };
    return {
      id: claims.sub,
      email,
      name: meta.name || email.split("@")[0] || "",
    };
  });

  const isAuthenticated = computed(() => !!supabaseUser.value);

  async function login(email: string, password: string, rememberMe: boolean) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    remember.value = rememberMe ? "1" : "0";
    sessionAlive.value = "1";

    // Set the user now so route middleware sees it before the async
    // onAuthStateChange refresh in @nuxtjs/supabase lands.
    const { data } = await supabase.auth.getClaims();
    supabaseUser.value = data?.claims ?? null;
  }

  async function logout() {
    await supabase.auth.signOut();
    supabaseUser.value = null;
    remember.value = null;
    sessionAlive.value = null;
  }

  return { user, isAuthenticated, remember, sessionAlive, login, logout };
});
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: build succeeds. (The login card still calls the old `login({...})` signature; Nuxt does not type-check at build, so this passes. Task 2 fixes the call.)

- [ ] **Step 4: Commit**

```bash
git add app/stores/authStore.ts nuxt.config.ts
git commit -m "feat(auth): back auth store with Supabase session"
```

---

### Task 2: Login card + logout

**Files:**
- Modify: `app/components/auth/login-card.vue` (forgot link, script `submit`)
- Modify: `app/components/layouts/sidebar.vue` (`handleLogout`)

**Interfaces:**
- Consumes: `authStore.login(email, password, remember)` and `authStore.logout()` from Task 1.

- [ ] **Step 1: Comment out "Forgot password?"**

In `login-card.vue`, wrap the `<template #label-end>...</template>` block in an HTML comment:

```vue
              <!-- Forgot password: disabled until the reset flow is built
              <template #label-end>
                <nuxt-link-locale
                  to="#"
                  class="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  Forgot password?
                </nuxt-link-locale>
              </template>
              -->
```

- [ ] **Step 2: Call the real login**

Replace the `submit` function in the script:

```ts
const submit = async (values: Record<string, string>) => {
  isLoading.value = true;
  try {
    await authStore.login(
      values.email ?? "",
      values.password ?? "",
      remember.value,
    );
    await navigateTo(localePath("/"));
  } catch {
    addToast({ type: "error", message: "Incorrect email or password" });
  } finally {
    isLoading.value = false;
  }
};
```

(This also removes the `console.log` and the fake `setTimeout`.)

- [ ] **Step 3: Await logout in the sidebar**

In `sidebar.vue`:

```ts
const handleLogout = async () => {
  await auth.logout();
  await navigateTo(localePath("/auth"));
};
```

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 5: Commit**

```bash
git add app/components/auth/login-card.vue app/components/layouts/sidebar.vue
git commit -m "feat(auth): wire login card and logout to Supabase"
```

---

### Task 3: Remember-me session guard

**Files:**
- Create: `app/plugins/session-guard.client.ts`

**Interfaces:**
- Consumes: `useAuthStore()` (`remember`, `sessionAlive`, `isAuthenticated`, `logout`) from Task 1.

- [ ] **Step 1: Write the plugin**

```ts
/**
 * Remember-me guard.
 * The Supabase session cookie is long-lived. If the user did NOT tick
 * "Remember me" (remember === "0") and the browser was closed since
 * (the session_alive session cookie is gone), end the session.
 * A missing `remember` cookie counts as remembered.
 */
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook("app:mounted", async () => {
    const auth = useAuthStore();
    if (!auth.isAuthenticated) return;
    if (auth.remember !== "0" || auth.sessionAlive) return;

    await auth.logout();
    await navigateTo(useLocalePath()("/auth"), { replace: true });
  });
});
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add app/plugins/session-guard.client.ts
git commit -m "feat(auth): sign out non-remembered sessions after browser close"
```

---

### Task 4: Manual verification (needs a Supabase test user)

**Prerequisite (user):** in Supabase Dashboard → Authentication → Users, create a test user; in Sign In / Providers turn off "Allow new users to sign up".

- [ ] **Step 1:** `npm run dev`, open `/ar/auth`. Wrong password → error toast, stays on `/auth`.
- [ ] **Step 2:** Correct credentials, "Remember me" ticked → lands on `/`. Reload → still logged in. DevTools → Application → Cookies: `remember=1` (expires ~1 year), `session_alive` (Session), Supabase `sb-*` cookie present.
- [ ] **Step 3:** Close the whole browser, reopen, visit `/ar/reports` → dashboard loads without login.
- [ ] **Step 4:** Log out via sidebar → `/ar/auth`; all three cookies cleared; visiting `/ar` redirects to `/ar/auth`.
- [ ] **Step 5:** Log in with "Remember me" **unticked** → `remember=0`. Reload → still logged in. Close the whole browser, reopen, visit `/ar/reports` → ends on `/ar/auth`.
- [ ] **Step 6:** While logged in, visiting `/ar/auth` redirects to `/ar` (guest middleware).
- [ ] **Step 7:** Report results honestly; fix any failure before claiming done.
