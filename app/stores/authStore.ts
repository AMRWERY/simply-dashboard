import type { AuthUser } from "~/types/auth";

export const useAuthStore = defineStore("auth", () => {
  const token = useCookie<string | null>("auth_token", {
    default: () => null,
    watch: true,
  });

  const user = useCookie<AuthUser | null>("auth_user", {
    default: () => null,
    watch: true,
  });

  const isAuthenticated = computed(() => !!token.value);

  function login(credentials: AuthUser & { token: string }) {
    user.value = {
      id: credentials.id,
      email: credentials.email,
      name: credentials.name,
    };
    token.value = credentials.token;
  }

  function logout() {
    user.value = null;
    token.value = null;
  }

  return { user, token, isAuthenticated, login, logout };
});
