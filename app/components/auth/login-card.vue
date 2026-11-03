<template>
  <div
    class="min-h-screen bg-[#f4f4f8] font-sans text-gray-900 transition-colors dark:bg-[#17181f]"
  >
    <!-- Status bar -->
    <header class="flex items-center justify-end gap-2 px-6 pt-6">
      <LazyVToggleLocale />

      <LazyVToggleTheme />
    </header>

    <!-- Card -->
    <main class="mx-auto flex max-w-md flex-col items-center px-4 pt-6 pb-16">
      <div
        class="relative w-full overflow-hidden rounded-[2rem] bg-white p-8 shadow-xl shadow-indigo-900/5 dark:bg-[#1e1f2b]"
      >
        <!-- Decorative blobs -->
        <div
          class="pointer-events-none absolute -top-16 -start-16 h-56 w-56 rounded-full bg-amber-100/60 blur-3xl dark:bg-amber-400/10"
        />
        <div
          class="pointer-events-none absolute -bottom-20 -end-16 h-56 w-56 rounded-full bg-indigo-100/70 blur-3xl dark:bg-indigo-500/10"
        />

        <div class="relative">
          <!-- Header -->
          <div class="flex flex-col items-center">
            <h1
              class="mt-6 text-3xl font-extrabold tracking-tight dark:text-white"
            >
              {{ t("sign_in") }}
            </h1>
            <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {{ t("access_management_portal") }}
            </p>
          </div>

          <!-- Form -->
          <Form class="mt-6 space-y-5" @submit="submit">
            <!-- Email -->
            <LazyVInput
              name="email"
              :label="t('email')"
              type="email"
              placeholder="admin@simply.com"
              icon="email-icon"
              rules="required|email"
              dir="ltr"
            />

            <!-- Password -->
            <LazyVInput
              name="password"
              :label="t('password')"
              type="password"
              placeholder="••••••••"
              rules="required|min:8"
              dir="ltr"
            >
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
            </LazyVInput>

            <!-- Remember me -->
            <div class="flex items-center gap-2 pt-1">
              <LazyVButton
                size="icon-sm"
                :variant="remember ? 'primary' : 'secondary'"
                role="checkbox"
                :aria-checked="remember"
                @click="remember = !remember"
                class="!h-5 !w-5 !min-h-0 !min-w-0 !rounded-md !p-0 shadow-none focus-visible:ring-2"
              >
                <svg
                  v-if="remember"
                  class="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="3.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="m5 13 4 4L19 7" />
                </svg>
              </LazyVButton>
              <span
                class="text-sm font-semibold text-gray-700 dark:text-gray-300 select-none cursor-pointer"
                @click="remember = !remember"
                >{{ t("remember_me") }}</span
              >
            </div>

            <!-- Submit -->
            <LazyVButton
              type="submit"
              variant="primary"
              size="lg"
              block
              :disabled="isLoading"
              class="mt-2 py-4 text-base sm:text-lg"
            >
              {{ isLoading ? t("signing_in") : t("sign_in") }}
            </LazyVButton>
          </Form>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n();
const localePath = useLocalePath();

const authStore = useAuthStore();
const { add: addToast } = useToast();

const remember = ref(true);
const isLoading = ref(false);

// Called by vee-validate <Form> only when all fields are valid
const submit = async (values: Record<string, string>) => {
  isLoading.value = true;
  try {
    await authStore.login(
      values.email ?? "",
      values.password ?? "",
      remember.value,
    );
    await navigateTo(localePath("/"));
  } catch (e) {
    const code = (e as { data?: { data?: { code?: string } } })?.data?.data?.code;
    if (isNetworkError(e) || code === "upstream_unreachable") {
      addToast({ type: "error", message: t("network_error"), duration: 9000 });
    } else {
      addToast({ type: "error", message: t("incorrect_email_or_password") });
    }
  } finally {
    isLoading.value = false;
  }
};
</script>