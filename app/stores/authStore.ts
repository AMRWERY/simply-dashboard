import type { AuthUser } from "~/types/auth";
import type { Database } from "~/types/database.types";

const ONE_YEAR = 60 * 60 * 24 * 365;

const AVATAR_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

export const useAuthStore = defineStore("auth", () => {
  const supabase = useSupabaseClient<Database>();
  const supabaseUser = useSupabaseUser();

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
    avatarUrl.value = null;
    remember.value = null;
    sessionAlive.value = null;
  }

  async function fetchProfile() {
    const id = supabaseUser.value?.sub;
    if (!id) {
      avatarUrl.value = null;
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", id)
      .maybeSingle();
    avatarUrl.value = data?.avatar_url ?? null;
  }

  /** Throws Error("invalid-type" | "too-large") for client-side rejections. */
  async function uploadAvatar(file: File) {
    const id = supabaseUser.value?.sub;
    if (!id) throw new Error("not-authenticated");

    const ext = AVATAR_TYPES[file.type];
    if (!ext) throw new Error("invalid-type");
    if (file.size > AVATAR_MAX_BYTES) throw new Error("too-large");

    const bucket = supabase.storage.from("avatars");
    const path = `${id}/avatar-${Date.now()}.${ext}`;

    const { error: uploadError } = await bucket.upload(path, file, {
      contentType: file.type,
      cacheControl: "31536000",
    });
    if (uploadError) throw uploadError;

    const { data } = bucket.getPublicUrl(path);
    const previous = avatarUrl.value;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        avatar_url: data.publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (updateError) {
      await bucket.remove([path]); // don't leave an orphan file
      throw updateError;
    }

    avatarUrl.value = data.publicUrl;

    const previousPath = previous?.split("/avatars/")[1];
    if (previousPath) await bucket.remove([previousPath]);
  }

  return {
    user,
    isAuthenticated,
    remember,
    sessionAlive,
    avatarUrl,
    login,
    logout,
    fetchProfile,
    uploadAvatar,
  };
});
