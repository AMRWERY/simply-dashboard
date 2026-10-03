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
