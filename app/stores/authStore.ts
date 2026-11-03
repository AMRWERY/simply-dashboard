import type { AuthUser } from "~/types/auth";

const ONE_YEAR = 60 * 60 * 24 * 365;

const AVATAR_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const AVATAR_EXT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

// Some browsers report an empty file.type (e.g. .webp on Windows): fall back to the extension.
const resolveAvatarType = (file: File): string => {
  return (
    file.type ||
    AVATAR_EXT_TYPES[file.name.split(".").pop()?.toLowerCase() ?? ""] ||
    ""
  );
};

/**
 * Auth state. Every call to Supabase happens on the server (server/api); this
 * store only talks to our own /api routes. The session itself lives in the
 * cookies those routes set, which @nuxtjs/supabase exposes as `useSupabaseUser`.
 */
export const useAuthStore = defineStore("auth", () => {
  const supabaseUser = useSupabaseUser();
  // Forwards the visitor's cookies during SSR so server routes see the session,
  // and signs the UI out if the server says the session is gone (401).
  const api = useApi();

  const avatarUrl = useState<string | null>("avatar_url", () => null);

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

  const login = async (email: string, password: string, rememberMe: boolean) => {
    const { claims } = await api<{ claims: NonNullable<typeof supabaseUser.value> }>(
      "/api/auth/login",
      { method: "POST", body: { email, password } },
    );

    remember.value = rememberMe ? "1" : "0";
    sessionAlive.value = "1";

    // Set the user now so route middleware sees it before the async
    // onAuthStateChange refresh in @nuxtjs/supabase lands.
    supabaseUser.value = claims;
  };

  /** Forget the signed-in user on this client (no network). */
  const clearLocalSession = () => {
    supabaseUser.value = null;
    avatarUrl.value = null;
    useCustomerStore().reset();
    remember.value = null;
    sessionAlive.value = null;
  };

  const logout = async () => {
    // If the server call fails we throw before clearing anything, so a
    // non-remembered session is not silently promoted to a remembered one.
    await api("/api/auth/logout", { method: "POST" });
    clearLocalSession();
  };

  const fetchProfile = async () => {
    if (!supabaseUser.value?.sub) {
      avatarUrl.value = null;
      return;
    }
    try {
      const profile = await api<{ avatarUrl: string | null }>(
        "/api/profile/avatar",
      );
      avatarUrl.value = profile.avatarUrl;
    } catch {
      // On a failed fetch keep what we have rather than wiping the avatar.
    }
  };

  /** Throws Error("invalid-type" | "too-large") for client-side rejections. */
  const uploadAvatar = async (file: File) => {
    if (!supabaseUser.value?.sub) throw new Error("not-authenticated");

    const contentType = resolveAvatarType(file);
    if (!AVATAR_TYPES[contentType]) throw new Error("invalid-type");
    if (file.size > AVATAR_MAX_BYTES) throw new Error("too-large");

    const body = new FormData();
    body.append("image", file);
    const result = await api<{ avatarUrl: string }>("/api/profile/avatar", {
      method: "POST",
      body,
    });
    avatarUrl.value = result.avatarUrl;
  };

  return {
    user,
    isAuthenticated,
    remember,
    sessionAlive,
    avatarUrl,
    login,
    logout,
    clearLocalSession,
    fetchProfile,
    uploadAvatar,
  };
});
