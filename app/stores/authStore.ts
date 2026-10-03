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
