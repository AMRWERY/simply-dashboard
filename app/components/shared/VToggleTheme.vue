<template>
  <LazyVButton
    variant="soft"
    size="sm"
    :aria-label="
      isMounted
        ? isDark
          ? 'Switch to light mode'
          : 'Switch to dark mode'
        : 'Toggle theme'
    "
    :aria-pressed="isMounted ? isDark : false"
    @click="toggle($event)"
    class="!rounded-full px-4 py-2"
  >
    <!-- Only rendered client-side to avoid SSR hydration mismatch -->
    <template v-if="isMounted">
      <span class="relative h-4 w-4 overflow-hidden">
        <Transition name="icon-swap" mode="out-in">
          <LazyVIcon
            v-if="isDark"
            key="sun"
            name="sun-fill-icon"
            alt="light mode"
            class="h-4 w-4 text-indigo-300"
          />

          <LazyVIcon
            v-else
            key="moon"
            name="moon-stars-icon"
            alt="dark mode"
            class="h-4 w-4 text-indigo-600"
          />
        </Transition>
      </span>
    </template>
  </LazyVButton>
</template>

<script lang="ts" setup>
const { isDark, toggle } = useTheme();

// Guards against SSR hydration mismatches:
// Server always renders the placeholder; client updates after mount.
const isMounted = ref(false);

onMounted(() => {
  isMounted.value = true;
});
</script>

<style scoped>
.icon-swap-enter-active,
.icon-swap-leave-active,
.label-swap-enter-active,
.label-swap-leave-active {
  transition: all 0.2s ease;
}

.icon-swap-enter-from {
  opacity: 0;
  transform: rotate(-90deg) scale(0.6);
}

.icon-swap-leave-to {
  opacity: 0;
  transform: rotate(90deg) scale(0.6);
}

.label-swap-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.label-swap-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>