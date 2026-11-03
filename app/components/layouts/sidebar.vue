<template>
  <div class="print:hidden">
    <!-- Mobile Backdrop -->
    <Transition name="backdrop">
      <div
        v-if="modelValue"
        @click="emit('update:modelValue', false)"
        class="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
      />
    </Transition>

    <!-- Sidebar (Fixed on Desktop & Mobile Drawer) -->
    <aside
      :class="[
        'fixed inset-y-0 start-0 z-40 flex w-64 flex-col justify-between border-e border-gray-200/80 bg-white transition-transform duration-300 dark:border-gray-800/80 dark:bg-[#1e1f2b] md:translate-x-0',
        modelValue
          ? 'translate-x-0'
          : '-translate-x-full rtl:translate-x-full md:rtl:translate-x-0',
      ]"
    >
      <!-- Top: Brand & Navigation -->
      <div class="flex flex-1 flex-col min-h-0">
        <!-- Brand / Logo -->
        <div
          class="flex h-20 shrink-0 items-center justify-between border-b border-gray-100 px-6 dark:border-gray-800"
        >
          <nuxt-link-locale
            to="/"
            class="flex items-center gap-3 transition hover:opacity-90"
            @click="emit('update:modelValue', false)"
          >
            <div
              class="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-500 shadow-lg shadow-indigo-600/30"
            >
              <LazyVIcon
                key="persons"
                name="persons-icon"
                alt="persons"
                class="h-5 w-5"
              />
            </div>
            <div>
              <span
                class="text-lg font-extrabold tracking-tight text-gray-900 dark:text-white"
              >
                Simply
              </span>
            </div>
          </nuxt-link-locale>

          <!-- Mobile close button -->
          <LazyVButton
            variant="ghost"
            size="icon"
            icon="close-icon"
            class="md:hidden"
            @click="emit('update:modelValue', false)"
          />
        </div>

        <!-- 2 Routes Navigation -->
        <nav class="flex-1 space-y-1.5 overflow-y-auto px-4 py-6">
          <p
            class="mb-3 px-3 text-[11px] font-bold tracking-wider text-gray-400 uppercase dark:text-gray-500"
          >
            {{ t("menu") }}
          </p>

          <!-- Route 1: Customers -->
          <nuxt-link-locale
            to="/"
            @click="emit('update:modelValue', false)"
            :class="[
              'group flex items-center gap-3 rounded-2xl px-4 py-3 text-xs font-bold transition-all duration-200',
              isCustomersActive
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                : 'text-gray-600 hover:translate-x-1 hover:bg-gray-100 hover:text-gray-900 rtl:hover:-translate-x-1 dark:text-gray-400 dark:hover:bg-gray-800/60 dark:hover:text-white',
            ]"
          >
            <LazyVIcon
              key="persons-fill"
              name="persons-icon"
              alt="persons"
              class="h-5 w-5 shrink-0 transition-transform group-hover:scale-110"
            />
            <span>{{ t("customers") }}</span>
          </nuxt-link-locale>

          <!-- Route 2: Reports -->
          <nuxt-link-locale
            to="/reports"
            @click="emit('update:modelValue', false)"
            :class="[
              'group flex items-center gap-3 rounded-2xl px-4 py-3 text-xs font-bold transition-all duration-200',
              isReportsActive
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                : 'text-gray-600 hover:translate-x-1 hover:bg-gray-100 hover:text-gray-900 rtl:hover:-translate-x-1 dark:text-gray-400 dark:hover:bg-gray-800/60 dark:hover:text-white',
            ]"
          >
            <LazyVIcon
              key="reports-fill"
              name="reports-solid-icon"
              alt="reports"
              class="h-5 w-5 shrink-0 transition-transform group-hover:scale-110"
            />
            <span>{{ t("reports") }}</span>
          </nuxt-link-locale>
        </nav>
      </div>

      <!-- Bottom: User Card & Logout Button -->
      <div
        class="shrink-0 border-t border-gray-100 p-4 dark:border-gray-800 space-y-3"
      >
        <!-- User Profile Pill: opens the profile page -->
        <nuxt-link-locale
          to="/profile"
          :aria-label="t('profile')"
          :class="[
            'group flex items-center gap-3 rounded-2xl p-3 outline-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-indigo-500',
            isProfileActive
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
              : 'bg-gray-50/80 hover:bg-gray-100 dark:bg-gray-800/40 dark:hover:bg-gray-800/70',
          ]"
          @click="emit('update:modelValue', false)"
        >
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-500 text-xs font-extrabold text-white shadow-md shadow-indigo-600/20 transition-transform duration-200 group-hover:scale-105"
          >
            <img
              v-if="auth.avatarUrl"
              :src="auth.avatarUrl"
              alt=""
              class="h-full w-full object-cover"
            />
            <span v-else>{{ userInitials }}</span>
          </div>
          <div class="min-w-0 flex-1 text-start">
            <p
              :class="[
                'truncate text-xs font-extrabold capitalize leading-tight',
                isProfileActive ? 'text-white' : 'text-gray-900 dark:text-white',
              ]"
            >
              {{ userName }}
            </p>
            <p
              :class="[
                'truncate text-[11px]',
                isProfileActive ? 'text-indigo-100' : 'text-gray-500 dark:text-gray-400',
              ]"
            >
              {{ userEmail }}
            </p>
          </div>
          <!-- Chevron hints that the card is clickable; flips in RTL -->
          <svg
            :class="[
              'h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5',
              isProfileActive ? 'text-indigo-100' : 'text-gray-400',
            ]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </nuxt-link-locale>

        <!-- Logout Button in the bottom of sidebar -->
        <LazyVButton
          variant="danger-soft"
          size="md"
          icon="logout-outline-icon"
          block
          @click="handleLogout"
        >
          {{ t("logout") }}
        </LazyVButton>
      </div>
    </aside>
  </div>
</template>

<script lang="ts" setup>
const { t } = useI18n();
const route = useRoute();
const localePath = useLocalePath();

const auth = useAuthStore();

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
  }>(),
  {
    modelValue: false,
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

const userName = computed(() => auth.user?.name);
const userEmail = computed(() => auth.user?.email);

const userInitials = computed(() => {
  // There is no signed-in user while logging out or after the session ends.
  const name = (userName.value ?? "").trim();
  if (!name) return "AA";
  const parts = name.split(/\s+/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
});

const isCustomersActive = computed(() => {
  const path = route.path;
  return (
    path === "/" ||
    path === "/ar" ||
    path === "/en" ||
    path === "/ar/" ||
    path === "/en/"
  );
});

const isProfileActive = computed(() => route.path.includes("profile"));

const isReportsActive = computed(() => {
  return route.path.includes("reports");
});

const handleLogout = async () => {
  try {
    await auth.logout();
  } catch {
    useToast().add({ type: "error", message: t("logout_failed") });
    return;
  }
  await navigateTo(localePath("/auth"));
};
</script>

<style scoped>
.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity 0.3s ease;
}

.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}
</style>