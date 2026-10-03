<template>
  <div>
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
        'fixed inset-y-0 start-0 z-40 flex h-screen w-64 flex-col justify-between border-e border-gray-200/80 bg-white transition-transform duration-300 dark:border-gray-800/80 dark:bg-[#1e1f2b] md:translate-x-0',
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
              <span
                class="ms-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400"
              >
                CRM
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
            Menu
          </p>

          <!-- Route 1: Customers -->
          <nuxt-link-locale
            to="/"
            @click="emit('update:modelValue', false)"
            :class="[
              'group flex items-center gap-3 rounded-2xl px-4 py-3 text-xs font-bold transition-all duration-200',
              isCustomersActive
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/60 dark:hover:text-white',
            ]"
          >
            <LazyVIcon
              key="persons-fill"
              name="persons-icon"
              alt="persons"
              class="h-5 w-5 shrink-0 transition-transform group-hover:scale-110"
            />
            <span>Customers</span>
          </nuxt-link-locale>

          <!-- Route 2: Reports -->
          <!-- <nuxt-link-locale
            to="/reports"
            @click="emit('update:modelValue', false)"
            :class="[
              'group flex items-center gap-3 rounded-2xl px-4 py-3 text-xs font-bold transition-all duration-200',
              isReportsActive
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/60 dark:hover:text-white',
            ]"
          >
            <LazyVIcon
              key="reports-fill"
              name="reports-solid-icon"
              alt="reports"
              class="h-5 w-5 shrink-0 transition-transform group-hover:scale-110"
            />
            <span>Reports</span>
          </nuxt-link-locale> -->
        </nav>
      </div>

      <!-- Bottom: User Card & Logout Button -->
      <div
        class="shrink-0 border-t border-gray-100 p-4 dark:border-gray-800 space-y-3"
      >
        <!-- User Profile Pill -->
        <div
          class="flex items-center gap-3 rounded-2xl bg-gray-50/80 p-3 dark:bg-gray-800/40"
        >
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-500 text-xs font-extrabold text-white shadow-md shadow-indigo-600/20"
          >
            {{ userInitials }}
          </div>
          <div class="min-w-0 flex-1 text-start">
            <p
              class="truncate text-xs font-extrabold text-gray-900 dark:text-white leading-tight"
            >
              {{ userName }}
            </p>
            <p class="truncate text-[11px] text-gray-500 dark:text-gray-400">
              {{ userEmail }}
            </p>
          </div>
        </div>

        <!-- Logout Button in the bottom of sidebar -->
        <LazyVButton
          variant="danger-soft"
          size="md"
          icon="logout-outline-icon"
          block
          @click="handleLogout"
        >
          Logout
        </LazyVButton>
      </div>
    </aside>
  </div>
</template>

<script lang="ts" setup>
const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
  }>(),
  {
    modelValue: false,
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

const auth = useAuthStore();
const localePath = useLocalePath();
const route = useRoute();

const userName = computed(() => auth.user?.name || "Ahmed Al-Ashraf");
const userEmail = computed(() => auth.user?.email || "ahmed@crm.sa");

const userInitials = computed(() => {
  const name = userName.value.trim();
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

const isReportsActive = computed(() => {
  return route.path.includes("reports");
});

const handleLogout = async () => {
  auth.logout();
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
