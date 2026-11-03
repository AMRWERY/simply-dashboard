/**
 * The fetch the app uses to call its own /api routes (server/api).
 *
 * It forwards the visitor's cookies during server rendering (like
 * `useRequestFetch`) and adds one behaviour: if an API route answers 401 while
 * the UI still thinks someone is signed in, the session has really ended
 * (expired, or signed out in another tab). The client state is cleared and the
 * visitor is sent to the login page, instead of being left on a screen where
 * every request fails.
 *
 * The Supabase browser client used to notice this; the browser no longer talks
 * to Supabase at all, so the server's 401 is the signal.
 *
 * Written as a wrapper rather than `.create({ onResponseError })` because on
 * the server `useRequestFetch()` returns a plain function with no `.create`.
 */
export const useApi = () => {
  const nuxtApp = useNuxtApp();
  const fetcher = useRequestFetch();

  const endSession = () => {
    // The caller may be outside a component, so restore the Nuxt context first.
    nuxtApp.runWithContext(() => {
      const auth = useAuthStore();
      if (!auth.isAuthenticated) return;
      auth.clearLocalSession();
      navigateTo(useLocalePath()("/auth"), { replace: true });
    });
  };

  const api = async (request: Parameters<typeof fetcher>[0], options?: object) => {
    try {
      return await (fetcher as (r: unknown, o?: object) => Promise<unknown>)(request, options);
    } catch (e) {
      const status =
        (e as { status?: number; statusCode?: number }).status ??
        (e as { statusCode?: number }).statusCode;
      const url = String(request);
      // A wrong password on the login form is also a 401, but not a lost session.
      if (
        import.meta.client &&
        status === 401 &&
        url.startsWith("/api/") &&
        !url.startsWith("/api/auth/login")
      ) {
        endSession();
      }
      throw e;
    }
  };

  // Same call signature as $fetch, so callers keep their `api<Type>(...)` generics.
  return api as unknown as typeof fetcher;
};
