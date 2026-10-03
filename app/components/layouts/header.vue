<template>
  <header
    class="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-gray-200/80 bg-white/80 px-4 backdrop-blur-md transition-colors duration-200 dark:border-gray-800/80 dark:bg-[#1e1f2b]/80 sm:px-6 lg:px-8"
  >
    <!-- Start: Mobile Menu Toggle -->
    <div class="flex items-center gap-3">
      <LazyVButton
        variant="secondary"
        size="icon-md"
        icon="menu-solid-icon"
        aria-label="Toggle mobile menu"
        class="md:hidden"
        @click="emit('toggle-menu')"
      />

      <slot name="start" />
    </div>

    <!-- End: Locales & Themes on Header -->
    <div class="flex items-center gap-2.5 sm:gap-3">
      <slot name="end" />

      <!-- Locale Switcher -->
      <LazyVToggleLocale />

      <!-- Theme Switcher -->
      <LazyVToggleTheme />
    </div>
  </header>
</template>

<script lang="ts" setup>
const emit = defineEmits<{
  (e: "toggle-menu"): void;
}>();
</script>