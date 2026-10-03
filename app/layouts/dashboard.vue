<template>
  <div
    class="flex min-h-screen bg-[#f4f4f8] font-sans text-gray-900 transition-colors duration-200 dark:bg-[#17181f] dark:text-gray-100"
  >
    <!-- Sidebar Component -->
    <Sidebar v-model="isMobileMenuOpen" />

    <!-- Main Content Area -->
    <div class="flex flex-1 flex-col min-w-0 md:ps-64">
      <!-- Header Component -->
      <Header @toggle-menu="isMobileMenuOpen = !isMobileMenuOpen" />

      <!-- Page Slot Container -->
      <main class="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <slot />
      </main>
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