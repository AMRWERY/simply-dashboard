<template>
  <div class="space-y-6">
    <!-- Identity banner -->
    <section
      class="fade-up relative flex flex-col items-center gap-6 overflow-hidden rounded-3xl bg-[#151733] p-6 text-center text-white shadow-xl shadow-indigo-950/20 sm:flex-row sm:p-8 sm:text-start"
    >
      <div
        class="pointer-events-none absolute -top-20 -end-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl"
      />
      <div
        class="pointer-events-none absolute -bottom-20 -start-20 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl"
      />

      <!-- Avatar: click to change the photo -->
      <div class="relative shrink-0">
        <button
          type="button"
          class="group relative flex h-28 w-28 cursor-pointer items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-indigo-500 text-3xl font-extrabold text-white shadow-xl shadow-indigo-950/40 outline-none ring-4 ring-white/10 transition-all duration-200 hover:ring-white/30 focus-visible:ring-indigo-300"
          :disabled="isUploading"
          :aria-label="t('change_profile_picture')"
          @click="fileInput?.click()"
        >
          <img
            v-if="auth.avatarUrl"
            :src="auth.avatarUrl"
            :alt="userName"
            class="h-full w-full object-cover"
          />
          <span v-else>{{ initials }}</span>
          <span
            class="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/55 text-[11px] font-bold transition-opacity duration-200"
            :class="
              isUploading
                ? 'animate-pulse opacity-100'
                : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'
            "
          >
            <svg
              class="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
              <circle cx="12" cy="13" r="3.5" />
            </svg>
            {{ t("change_photo") }}
          </span>
        </button>
        <input
          ref="fileInput"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          class="hidden"
          @change="onFileSelected"
        />
      </div>

      <div class="relative min-w-0">
        <div class="flex items-center justify-center gap-2 sm:justify-start">
          <h1 class="truncate text-2xl font-extrabold capitalize sm:text-3xl">
            {{ userName }}
          </h1>
          <!-- Blue tick next to the name when the email is verified -->
          <span
            v-if="details?.verified"
            :title="t('verified')"
            class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-500 text-white shadow-md shadow-sky-500/40"
          >
            <svg
              class="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="3.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="m5 13 4 4L19 7" />
            </svg>
          </span>
        </div>
        <p
          dir="ltr"
          class="mt-1 truncate text-sm text-indigo-200/80 sm:text-start"
        >
          {{ auth.user?.email }}
        </p>
        <div
          class="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start"
        >
          <span
            v-if="details"
            :class="[
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold',
              details.verified
                ? 'bg-emerald-400/20 text-emerald-300'
                : 'bg-amber-400/20 text-amber-300',
            ]"
          >
            <!-- Shield with a tick when verified, an alert circle otherwise -->
            <svg
              class="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <template v-if="details.verified">
                <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
                <path d="m9 12 2 2 4-4" />
              </template>
              <template v-else>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v4M12 16h.01" />
              </template>
            </svg>
            {{ details.verified ? t("verified") : t("not_verified") }}
          </span>
          <span
            v-if="details?.createdAt"
            class="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-indigo-100"
          >
            {{ t("member_since") }} {{ formatDate(details.createdAt, "date") }}
          </span>
        </div>
      </div>
    </section>

    <div class="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <!-- Account details -->
      <section
        style="--d: 80ms"
        class="fade-up rounded-3xl border border-gray-100 bg-white p-6 shadow-sm shadow-indigo-900/5 lg:col-span-2 dark:border-gray-800 dark:bg-[#1e1f2b] dark:shadow-none"
      >
        <h2 class="text-base font-extrabold text-gray-900 dark:text-white">
          {{ t("account_details") }}
        </h2>
        <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          {{ t("profile_description") }}
        </p>

        <dl
          class="mt-4 divide-y divide-dashed divide-gray-100 text-sm dark:divide-gray-800"
        >
          <div
            v-for="row in rows"
            :key="row.label"
            class="-mx-2 flex items-center justify-between gap-4 rounded-lg px-2 py-3 transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/40"
          >
            <dt class="shrink-0 font-bold text-gray-700 dark:text-gray-300">
              {{ row.label }}
            </dt>
            <dd class="flex min-w-0 items-center gap-2">
              <span
                dir="auto"
                class="truncate font-medium text-gray-500 select-all dark:text-gray-400"
                :class="{ capitalize: row.capitalize }"
                >{{ row.value }}</span
              >
            </dd>
          </div>
        </dl>
      </section>

      <!-- Activity -->
      <section
        style="--d: 160ms"
        class="fade-up rounded-3xl border border-gray-100 bg-white p-6 shadow-sm shadow-indigo-900/5 dark:border-gray-800 dark:bg-[#1e1f2b] dark:shadow-none"
      >
        <h2 class="text-base font-extrabold text-gray-900 dark:text-white">
          {{ t("your_activity") }}
        </h2>

        <ul class="mt-4 space-y-3">
          <li
            v-for="stat in stats"
            :key="stat.label"
            class="flex items-center justify-between gap-3 rounded-2xl bg-gray-50/80 px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:bg-gray-800/40"
          >
            <span class="text-xs font-bold text-gray-500 dark:text-gray-400">{{
              stat.label
            }}</span>
            <span
              dir="ltr"
              :class="['text-lg font-extrabold tabular-nums', stat.class]"
              >{{ stat.value }}</span
            >
          </li>
        </ul>
      </section>
    </div>

    <!-- Change password -->
    <section
      style="--d: 200ms"
      class="fade-up rounded-3xl border border-gray-100 bg-white p-6 shadow-sm shadow-indigo-900/5 dark:border-gray-800 dark:bg-[#1e1f2b] dark:shadow-none"
    >
      <h2 class="text-base font-extrabold text-gray-900 dark:text-white">
        {{ t("change_password") }}
      </h2>
      <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
        {{ t("change_password_description") }}
      </p>

      <Form class="mt-5 max-w-md space-y-4" @submit="changePassword">
        <LazyVInput
          name="current_password"
          :label="t('current_password')"
          type="password"
          placeholder="••••••••"
          rules="required"
          dir="ltr"
        />
        <LazyVInput
          name="new_password"
          :label="t('new_password')"
          type="password"
          placeholder="••••••••"
          rules="required|min:8"
          dir="ltr"
        />
        <LazyVInput
          name="confirm_password"
          :label="t('confirm_new_password')"
          type="password"
          placeholder="••••••••"
          rules="required|confirmed:@new_password"
          dir="ltr"
        />

        <LazyVButton type="submit" :disabled="isChangingPassword">
          {{
            isChangingPassword ? t("updating_password") : t("update_password")
          }}
        </LazyVButton>
      </Form>
    </section>
  </div>
</template>

<script lang="ts" setup>
const { locale, t } = useI18n();
const auth = useAuthStore();
const customerStore = useCustomerStore();
const api = useApi();
const localePath = useLocalePath();
const { add: addToast } = useToast();

const intlLocale = computed(() =>
  locale.value === "ar" ? "ar-EG-u-nu-latn" : "en-US",
);

const userName = computed(() => auth.user?.name || auth.user?.email || "");
const initials = computed(() => getInitials(userName.value) || "?");

// Details the sign-in token doesn't carry (created / last sign-in / verified).
const details = ref<{
  createdAt: string | null;
  lastSignInAt: string | null;
  verified: boolean;
  provider: string;
} | null>(null);

onMounted(async () => {
  try {
    details.value = await api<NonNullable<typeof details.value>>("/api/profile");
  } catch (e) {
    console.error("[profile] account details failed", e);
  }
  // Needed for the activity summary when landing here directly.
  if (!customerStore.items.length) {
    try {
      await customerStore.fetchAll();
    } catch (e) {
      console.error("[profile] customers load failed", e);
    }
  }
});

const formatDate = (iso: string | null, style: "date" | "datetime") => {
  if (!iso) return "—";
  return new Intl.DateTimeFormat(
    intlLocale.value,
    style === "date"
      ? { dateStyle: "long" }
      : { dateStyle: "long", timeStyle: "short" },
  ).format(new Date(iso));
};

const rows = computed(() => [
  { label: t("full_name"), value: auth.user?.name || "—", capitalize: true },
  { label: t("email"), value: auth.user?.email || "—" },
  {
    label: t("email_status"),
    value: details.value
      ? details.value.verified
        ? t("verified")
        : t("not_verified")
      : "—",
  },
  {
    label: t("member_since"),
    value: formatDate(details.value?.createdAt ?? null, "date"),
  },
  {
    label: t("last_sign_in"),
    value: formatDate(details.value?.lastSignInAt ?? null, "datetime"),
  },
]);

const totals = computed(() => summarizeEarnings(customerStore.items));
const money = (n: number) => formatMoney(n, locale.value);
const stats = computed(() => [
  {
    label: t("customers"),
    value: String(customerStore.items.length),
    class: "text-gray-900 dark:text-white",
  },
  {
    label: t("total_earnings"),
    value: money(totals.value.earned),
    class: "text-emerald-600 dark:text-emerald-400",
  },
  {
    label: t("outstanding"),
    value: money(totals.value.outstanding),
    class: "text-amber-600 dark:text-amber-400",
  },
]);

const copy = async (value: string) => {
  try {
    await navigator.clipboard.writeText(value);
    addToast({ type: "success", message: t("copied") });
  } catch {
    // Clipboard can be blocked (insecure context); the id is also select-all.
  }
};

// ── Avatar upload ──────────────────────────────────────────────────────────
const fileInput = ref<HTMLInputElement | null>(null);
const isUploading = ref(false);

const onFileSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = ""; // lets the same file be picked again
  if (!file) return;

  isUploading.value = true;
  try {
    await auth.uploadAvatar(file);
    addToast({ type: "success", message: t("profile_photo_updated") });
  } catch (e) {
    const message =
      e instanceof Error && e.message === "invalid-type"
        ? t("invalid_image_type")
        : e instanceof Error && e.message === "too-large"
          ? t("image_too_large")
          : t("upload_image_failed");
    addToast({ type: "error", message });
  } finally {
    isUploading.value = false;
  }
};

// ── Change password ────────────────────────────────────────────────────────
const isChangingPassword = ref(false);

const changePassword = async (
  values: Record<string, string>,
  { resetForm }: { resetForm: () => void },
) => {
  const current = values.current_password ?? "";
  const next = values.new_password ?? "";
  if (isChangingPassword.value) return;

  if (current === next) {
    addToast({ type: "error", message: t("password_same_as_current") });
    return;
  }

  isChangingPassword.value = true;
  try {
    // The server re-checks the current password, changes it, and ends the
    // session (clearing the cookies), so the user signs in with the new one.
    await api("/api/auth/password", {
      method: "POST",
      body: { currentPassword: current, newPassword: next },
    });

    resetForm();
    auth.clearLocalSession();
    addToast({ type: "success", message: t("password_updated") });
    // The toast lives in the app root, so it stays visible on the login page.
    await navigateTo(localePath("/auth"));
  } catch (e) {
    const code = (e as { data?: { data?: { code?: string } } })?.data?.data?.code;
    if (isNetworkError(e) || code === "upstream_unreachable") {
      addToast({ type: "error", message: t("network_error"), duration: 9000 });
    } else if (code === "current_password_incorrect") {
      addToast({ type: "error", message: t("current_password_incorrect") });
    } else {
      console.error("[profile] password update failed", e);
      addToast({ type: "error", message: t("password_update_failed") });
    }
  } finally {
    isChangingPassword.value = false;
  }
};

const handleLogout = async () => {
  try {
    await auth.logout();
  } catch {
    addToast({ type: "error", message: t("logout_failed") });
    return;
  }
  await navigateTo(localePath("/auth"));
};

definePageMeta({
  layout: "dashboard",
  middleware: "auth",
});

useSeoPage({
  title: () => t("profile"),
  description: () => t("profile_description"),
  private: true,
});
</script>