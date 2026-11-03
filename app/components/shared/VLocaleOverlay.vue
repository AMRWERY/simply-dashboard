<template>
  <Transition name="locale-overlay">
    <div
      v-if="visible"
      class="fixed inset-0 z-[9999] flex items-center justify-center bg-indigo-950/60 p-4 backdrop-blur-md"
      role="status"
      aria-live="polite"
    >
      <div
        class="overlay-card relative w-full max-w-xs overflow-hidden rounded-3xl border border-white/20 bg-white/90 p-8 text-center shadow-2xl shadow-indigo-950/40 dark:border-white/10 dark:bg-[#1e1f2b]/90"
      >
        <!-- Soft glow behind the badge -->
        <div
          class="pointer-events-none absolute -top-12 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-indigo-500/25 blur-3xl"
        />

        <!-- Language badge: both glyphs cross-fade on a loop -->
        <div
          class="relative mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-linear-to-br from-indigo-600 to-indigo-500 shadow-lg shadow-indigo-600/30"
        >
          <span class="glyph glyph-a text-2xl font-extrabold text-white">
            {{ glyphs.from }}
          </span>
          <span class="glyph glyph-b text-3xl font-extrabold text-amber-300">
            {{ glyphs.to }}
          </span>
          <span
            class="ring pointer-events-none absolute inset-0 rounded-3xl border-2 border-indigo-400/60"
          />
        </div>

        <!-- Bilingual message: readable before the switch has landed -->
        <p class="relative mt-6 text-base font-extrabold text-gray-900 dark:text-white">
          {{ message.primary }}
        </p>
        <p class="relative mt-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
          {{ message.secondary }}
        </p>

        <!-- Indeterminate progress bar -->
        <div
          class="relative mt-6 h-1.5 overflow-hidden rounded-full bg-indigo-100 dark:bg-indigo-950/60"
        >
          <span
            class="bar absolute inset-y-0 w-1/3 rounded-full bg-linear-to-r from-indigo-500 to-amber-400"
          />
        </div>
      </div>
    </div>
  </Transition>
</template>

<script lang="ts" setup>
const { visible, target } = useLocaleOverlay();

const glyphFor = { en: "EN", ar: "ع" } as const;

// Pointing from the language being left to the one being entered.
const glyphs = computed(() => ({
  from: glyphFor[target.value === "ar" ? "en" : "ar"],
  to: glyphFor[target.value],
}));

// Hard-coded on purpose: the target language's messages may not be loaded yet.
const messages = {
  en: "Switching language…",
  ar: "جارٍ تغيير اللغة…",
} as const;

const message = computed(() => ({
  primary: messages[target.value],
  secondary: messages[target.value === "ar" ? "en" : "ar"],
}));
</script>

<style scoped>
.locale-overlay-enter-active,
.locale-overlay-leave-active {
  transition: opacity 0.25s ease;
}
.locale-overlay-enter-active .overlay-card,
.locale-overlay-leave-active .overlay-card {
  transition:
    transform 0.3s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.25s ease;
}
.locale-overlay-enter-from,
.locale-overlay-leave-to {
  opacity: 0;
}
.locale-overlay-enter-from .overlay-card,
.locale-overlay-leave-to .overlay-card {
  opacity: 0;
  transform: scale(0.92) translateY(10px);
}

.glyph {
  position: absolute;
  animation: glyph-swap 1.2s ease-in-out infinite;
}
.glyph-b {
  animation-delay: -0.6s;
}
@keyframes glyph-swap {
  0%,
  100% {
    opacity: 0;
    transform: scale(0.6) rotate(-20deg);
  }
  25%,
  50% {
    opacity: 1;
    transform: scale(1) rotate(0);
  }
  75% {
    opacity: 0;
    transform: scale(0.6) rotate(20deg);
  }
}

.ring {
  animation: ring-pulse 1.2s ease-out infinite;
}
@keyframes ring-pulse {
  from {
    opacity: 0.8;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(1.35);
  }
}

.bar {
  animation: bar-slide 1.1s ease-in-out infinite;
}
@keyframes bar-slide {
  from {
    inset-inline-start: -35%;
  }
  to {
    inset-inline-start: 102%;
  }
}
</style>
