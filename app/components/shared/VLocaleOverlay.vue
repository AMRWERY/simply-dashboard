<template>
  <Transition name="locale-overlay">
    <div
      v-if="visible"
      class="fixed inset-0 z-[9999] flex items-center justify-center bg-[#f4f4f8]/85 p-4 backdrop-blur-xl dark:bg-[#17181f]/85"
      role="status"
      aria-live="polite"
      aria-busy="true"
      :lang="target"
      :dir="info.dir"
    >
      <div class="overlay-content flex flex-col items-center text-center">
        <!-- Target language inside an indeterminate progress ring -->
        <div class="relative flex h-28 w-28 items-center justify-center">
          <svg
            class="absolute inset-0 h-full w-full -rotate-90"
            viewBox="0 0 100 100"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="50"
              cy="50"
              r="44"
              stroke-width="5"
              class="stroke-indigo-200 dark:stroke-indigo-950"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              stroke-width="5"
              stroke-linecap="round"
              class="ring-arc stroke-indigo-600 dark:stroke-indigo-400"
            />
          </svg>

          <!-- Glyph re-mounts (and pops) each time the target changes -->
          <span
            :key="target"
            class="glyph text-4xl font-extrabold text-indigo-700 dark:text-indigo-300"
          >
            {{ info.glyph }}
          </span>
        </div>

        <p class="mt-6 text-xl font-extrabold text-gray-900 dark:text-white">
          {{ info.name }}
        </p>
        <p class="mt-1 text-sm font-semibold text-gray-500 dark:text-gray-400">
          {{ info.message }}
        </p>
      </div>
    </div>
  </Transition>
</template>

<script lang="ts" setup>
const { visible, target } = useLocaleOverlay();

// Hard-coded on purpose: it must read in the target language before that
// language's messages have loaded, so it can't come from the locale files.
const targets = {
  en: { glyph: "EN", name: "English", message: "Switching language…", dir: "ltr" },
  ar: { glyph: "ع", name: "العربية", message: "جارٍ تغيير اللغة…", dir: "rtl" },
} as const;

const info = computed(() => targets[target.value]);

// Stop the page scrolling behind the overlay.
watch(visible, (open) => {
  if (!import.meta.client) return;
  document.documentElement.style.overflow = open ? "hidden" : "";
});
onBeforeUnmount(() => {
  if (import.meta.client) document.documentElement.style.overflow = "";
});
</script>

<style scoped>
.locale-overlay-enter-active,
.locale-overlay-leave-active {
  transition: opacity 0.2s ease;
}
.locale-overlay-enter-active .overlay-content,
.locale-overlay-leave-active .overlay-content {
  transition:
    transform 0.3s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.2s ease;
}
.locale-overlay-enter-from,
.locale-overlay-leave-to {
  opacity: 0;
}
.locale-overlay-enter-from .overlay-content,
.locale-overlay-leave-to .overlay-content {
  opacity: 0;
  transform: scale(0.94) translateY(8px);
}

.glyph {
  animation: glyph-pop 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
}
@keyframes glyph-pop {
  from {
    opacity: 0;
    transform: scale(0.6);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

/* A growing/shrinking arc that also rotates: reads as "working" without a % */
.ring-arc {
  stroke-dasharray: 276;
  transform-origin: 50% 50%;
  animation:
    ring-dash 1.4s ease-in-out infinite,
    ring-spin 1.4s linear infinite;
}
@keyframes ring-dash {
  0% {
    stroke-dashoffset: 250;
  }
  50% {
    stroke-dashoffset: 70;
  }
  100% {
    stroke-dashoffset: 250;
  }
}
@keyframes ring-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
