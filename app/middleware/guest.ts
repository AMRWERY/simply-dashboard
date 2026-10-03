/**
 * guest middleware
 * Apply to pages that should only be visible to unauthenticated users (e.g. login).
 * Apply via:
 *   definePageMeta({ middleware: "guest" })
 *
 * If already authenticated → redirect to /
 */
export default defineNuxtRouteMiddleware(() => {
  const auth = useAuthStore();
  const localePath = useLocalePath();

  if (auth.isAuthenticated) {
    return navigateTo(localePath("/"), { replace: true });
  }
});
