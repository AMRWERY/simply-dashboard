<template>
  <Transition name="locale-overlay">
    <div
      v-if="visible"
      class="fixed inset-0 z-[9999] flex items-center justify-center bg-indigo-950/70 backdrop-blur-md"
      role="status"
      aria-live="polite"
    >
      <span
        class="h-12 w-12 animate-spin rounded-full border-4 border-white/30 border-t-amber-400"
      />
    </div>
  </Transition>
</template>

<script lang="ts" setup>
const { visible } = useLocaleOverlay();
</script>

<style scoped>
.locale-overlay-enter-active,
.locale-overlay-leave-active {
  transition: opacity 0.25s ease;
}
.locale-overlay-enter-from,
.locale-overlay-leave-to {
  opacity: 0;
}
</style>
