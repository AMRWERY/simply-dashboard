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
    secure: !import.meta.dev,
  });

  // Session cookie (no maxAge): disappears when the browser closes.
  const sessionAlive = useCookie<"1" | null>("session_alive", {
    default: () => null,
    sameSite: "lax",
    secure: !import.meta.dev,
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
    if (!data?.claims) throw new Error("Could not read session after sign-in");
    supabaseUser.value = data.claims;
  }

  async function logout() {
    // "local": end only this browser's session, not the user's other devices.
    const { error } = await supabase.auth.signOut({ scope: "local" });
    // Keep the remember cookies if sign-out failed, so a non-remembered
    // session is not silently promoted to a remembered one.
    if (error) throw error;
    supabaseUser.value = null;
    remember.value = null;
    sessionAlive.value = null;
  }

  return { user, isAuthenticated, remember, sessionAlive, login, logout };
});
