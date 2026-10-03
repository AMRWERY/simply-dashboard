/**
 * auth middleware
 * Apply to any page that requires the user to be logged in via:
 *   definePageMeta({ middleware: "auth" })
 *
 * If unauthenticated → redirect to /auth
 */
export default defineNuxtRouteMiddleware(() => {
  const auth = useAuthStore();
  const localePath = useLocalePath();

  if (!auth.isAuthenticated) {
    return navigateTo(localePath("/auth"), { replace: true });
  }
});
