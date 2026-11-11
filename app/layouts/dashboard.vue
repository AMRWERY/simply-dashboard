<template>
  <div
    class="flex min-h-screen bg-[#f4f4f8] font-sans text-gray-900 transition-colors duration-200 dark:bg-[#17181f] dark:text-gray-100"
  >
    <!-- Sidebar Component -->
    <Sidebar v-model="isMobileMenuOpen" />

    <!-- Main Content Area -->
    <div class="flex flex-1 flex-col min-w-0 md:ps-64 print:ps-0">
      <!-- Header Component -->
      <Header @toggle-menu="isMobileMenuOpen = !isMobileMenuOpen" />

      <!-- Page Slot Container -->
      <main
        class="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-8 sm:px-6 lg:px-8"
      >
        <!-- Greeting + live date/time on every page (client-only: depends on
             the visitor's clock, so it can't be server-rendered) -->
        <ClientOnly>
          <lazy-home-greeting class="print:hidden" />
          <template #fallback>
            <div
              class="h-[124px] rounded-3xl bg-white/60 dark:bg-[#1e1f2b]/60"
            />
          </template>
        </ClientOnly>

        <slot />
      </main>

      <!-- A random Ayah with its recitation, once each time the app is opened -->
      <ClientOnly>
        <lazy-home-ayah-dialog />
      </ClientOnly>
    </div>
  </div>
</template>

<script lang="ts" setup>
const isMobileMenuOpen = ref(false);

// Load the avatar before first render (SSR) so it doesn't flash initials.
const auth = useAuthStore();
await useAsyncData("profile", async () => {
  await auth.fetchProfile();
  return true;
});
</script>