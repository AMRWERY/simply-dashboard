<template>
  <section
    style="--d: 0ms"
    class="fade-up relative isolate flex flex-col gap-6 overflow-hidden rounded-3xl border border-white/60 p-6 shadow-lg shadow-indigo-900/5 sm:flex-row sm:items-center sm:justify-between sm:p-7 dark:border-white/5 dark:shadow-none"
  >
    <!-- Backgrounds: every period is stacked, only the active one is visible,
         so the colour cross-fades instead of snapping -->
    <div
      v-for="p in PERIODS"
      :key="p"
      :class="[
        'absolute inset-0 -z-20 transition-opacity duration-1000',
        themes[p].bg,
        p === period ? 'opacity-100' : 'opacity-0',
      ]"
    />

    <!-- Big faded icon in the corner -->
    <Transition name="ghost" mode="out-in">
      <svg
        :key="period"
        :class="[
          'pointer-events-none absolute -end-6 -top-8 -z-10 h-48 w-48 opacity-[0.12]',
          theme.icon,
        ]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path v-for="d in icons[period]" :key="d" :d="d" />
      </svg>
    </Transition>

    <!-- Greeting -->
    <div class="flex items-center gap-4 sm:gap-5">
      <div class="relative shrink-0">
        <!-- Glow -->
        <div
          :class="[
            'absolute inset-0 rounded-3xl blur-xl transition-colors duration-1000',
            theme.glow,
          ]"
        />
        <div
          class="relative flex h-16 w-16 items-center justify-center rounded-3xl bg-white/80 shadow-md ring-1 ring-black/5 backdrop-blur dark:bg-white/10 dark:ring-white/10"
        >
          <Transition name="icon" mode="out-in">
            <span :key="period" class="flex">
              <svg
                :class="['h-8 w-8', theme.icon, theme.motion]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path v-for="d in icons[period]" :key="d" :d="d" />
              </svg>
            </span>
          </Transition>
        </div>
      </div>

      <div class="min-w-0">
        <Transition name="text" mode="out-in">
          <h2
            :key="headline"
            class="truncate text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl dark:text-white"
          >
            {{ headline }}
          </h2>
        </Transition>

        <Transition name="text" mode="out-in">
          <p
            :key="dateText"
            class="mt-1 text-sm font-semibold text-gray-600 dark:text-gray-300"
          >
            {{ dateText }}
          </p>
        </Transition>
      </div>
    </div>

    <!-- Live clock: only the digits that changed roll -->
    <div
      dir="ltr"
      class="flex cursor-default items-baseline self-start rounded-2xl bg-white/70 px-5 py-3 text-4xl font-extrabold text-gray-900 tabular-nums shadow-sm ring-1 ring-black/5 backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/90 hover:shadow-md sm:self-auto dark:bg-white/10 dark:text-white dark:ring-white/10 dark:hover:bg-white/15"
      role="timer"
      :aria-label="timeLabel"
    >
      <template v-for="(part, i) in timeParts" :key="`${part.type}-${i}`">
        <span
          v-if="part.type === 'literal'"
          class="mx-0.5 opacity-40"
          aria-hidden="true"
          >{{ part.value }}</span
        >
        <span
          v-else-if="part.type === 'dayPeriod'"
          :class="['ms-2 text-sm font-bold', theme.icon]"
          >{{ part.value }}</span
        >
        <span v-else class="relative inline-block overflow-hidden">
          <Transition name="digit" mode="out-in">
            <span :key="part.value" class="inline-block">{{ part.value }}</span>
          </Transition>
        </span>
      </template>
    </div>
  </section>
</template>

<script lang="ts" setup>
import type { DayPeriod } from "~/composables/useGreeting";

const PERIODS: DayPeriod[] = ["morning", "afternoon", "evening", "night"];

const auth = useAuthStore();
const { locale } = useI18n();
const { period, greeting, timeParts, dateText } = useGreeting();

const name = computed(() => {
  const n = auth.user?.name?.trim();
  return n ? n.charAt(0).toUpperCase() + n.slice(1) : "";
});

// "Good morning, Amr" / "صباح الخير، Amr"
const headline = computed(() =>
  name.value
    ? `${greeting.value}${locale.value === "ar" ? "،" : ","} ${name.value}`
    : greeting.value,
);

const timeLabel = computed(() => timeParts.value.map((p) => p.value).join(""));

// Stroke paths per period (shared by the badge and the faded corner icon).
const icons: Record<DayPeriod, string[]> = {
  morning: [
    "M17 18a5 5 0 0 0-10 0",
    "M12 2v7",
    "M4.2 10.2l1.4 1.4",
    "M1 18h2",
    "M21 18h2",
    "M18.4 11.6l1.4-1.4",
    "M23 22H1",
    "m8 6 4-4 4 4",
  ],
  afternoon: [
    "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
    "M12 2v2",
    "M12 20v2",
    "M4.9 4.9l1.4 1.4",
    "M17.7 17.7l1.4 1.4",
    "M2 12h2",
    "M20 12h2",
    "M4.9 19.1l1.4-1.4",
    "M17.7 6.3l1.4-1.4",
  ],
  evening: [
    "M17 18a5 5 0 0 0-10 0",
    "M12 9V2",
    "M4.2 10.2l1.4 1.4",
    "M1 18h2",
    "M21 18h2",
    "M18.4 11.6l1.4-1.4",
    "M23 22H1",
    "m16 5-4 4-4-4",
  ],
  night: ["M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z", "M19 3v4", "M17 5h4"],
};

const themes: Record<
  DayPeriod,
  { bg: string; icon: string; glow: string; motion: string }
> = {
  morning: {
    bg: "bg-linear-to-br from-amber-100 via-orange-50 to-white dark:from-amber-950/60 dark:via-[#1e1f2b] dark:to-[#1e1f2b]",
    icon: "text-amber-500 dark:text-amber-400",
    glow: "bg-amber-300/60 dark:bg-amber-500/25",
    motion: "icon-rise",
  },
  afternoon: {
    bg: "bg-linear-to-br from-sky-100 via-cyan-50 to-white dark:from-sky-950/60 dark:via-[#1e1f2b] dark:to-[#1e1f2b]",
    icon: "text-sky-500 dark:text-sky-400",
    glow: "bg-sky-300/60 dark:bg-sky-500/25",
    motion: "icon-spin",
  },
  evening: {
    bg: "bg-linear-to-br from-orange-100 via-rose-50 to-white dark:from-orange-950/60 dark:via-[#1e1f2b] dark:to-[#1e1f2b]",
    icon: "text-orange-500 dark:text-orange-400",
    glow: "bg-orange-300/60 dark:bg-orange-500/25",
    motion: "icon-rise",
  },
  night: {
    bg: "bg-linear-to-br from-indigo-200 via-violet-100 to-white dark:from-indigo-950/80 dark:via-[#1e1f2b] dark:to-[#1e1f2b]",
    icon: "text-indigo-500 dark:text-indigo-300",
    glow: "bg-indigo-300/60 dark:bg-indigo-500/30",
    motion: "icon-float",
  },
};

const theme = computed(() => themes[period.value]);
</script>

<style scoped>
/* Badge icon swaps with a quick turn */
.icon-enter-active,
.icon-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.icon-enter-from {
  opacity: 0;
  transform: rotate(-60deg) scale(0.5);
}
.icon-leave-to {
  opacity: 0;
  transform: rotate(60deg) scale(0.5);
}

/* Corner icon drifts in/out */
.ghost-enter-active,
.ghost-leave-active {
  transition:
    opacity 0.6s ease,
    transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}
.ghost-enter-from,
.ghost-leave-to {
  opacity: 0;
  transform: translateY(14px) rotate(-8deg) scale(0.9);
}

/* Greeting and date slide through */
.text-enter-active,
.text-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.text-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.text-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Digits roll upward like a counter */
.digit-enter-active,
.digit-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.digit-enter-from {
  opacity: 0;
  transform: translateY(70%);
}
.digit-leave-to {
  opacity: 0;
  transform: translateY(-70%);
}

/* Gentle idle motion per period */
.icon-spin {
  animation: spin 14s linear infinite;
}
.icon-float {
  animation: float 3.2s ease-in-out infinite;
}
.icon-rise {
  animation: rise 3.2s ease-in-out infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@keyframes float {
  50% {
    transform: translateY(-3px) rotate(-6deg);
  }
}
@keyframes rise {
  50% {
    transform: translateY(-2px);
  }
}
</style>
