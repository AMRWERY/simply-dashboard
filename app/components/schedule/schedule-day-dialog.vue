<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isOpen && day"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        @click.self="emit('close')"
      >
        <div
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          class="day-panel relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl dark:bg-[#1e1f2b] dark:text-white"
        >
          <h3
            :id="titleId"
            class="text-lg font-extrabold text-gray-900 dark:text-white"
          >
            {{ formatDayLong(day, locale) }}
          </h3>
          <p class="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">
            {{ t("events_count", { count: events.length }) }}
          </p>

          <p
            v-if="!events.length"
            class="mt-6 rounded-2xl bg-gray-50/80 px-4 py-8 text-center text-sm font-medium text-gray-500 dark:bg-gray-800/40 dark:text-gray-400"
          >
            {{ t("no_events_day") }}
          </p>

          <ul v-else class="mt-5 space-y-2">
            <li
              v-for="event in events"
              :key="event.id"
              class="flex items-center gap-3 rounded-2xl bg-gray-50/80 px-3 py-2.5 dark:bg-gray-800/40"
            >
              <span
                dir="ltr"
                :class="[
                  'w-[4.5rem] shrink-0 text-xs font-extrabold',
                  event.done
                    ? 'text-gray-400 line-through dark:text-gray-500'
                    : 'text-gray-800 dark:text-gray-100',
                ]"
              >
                {{ formatTime(event.at, locale) }}
              </span>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-bold text-gray-900 dark:text-white">
                  {{ event.customer.name }}
                </p>
                <p
                  dir="ltr"
                  class="truncate text-start text-xs text-gray-500 dark:text-gray-400"
                >
                  {{ event.customer.phone }}
                </p>
              </div>
              <span
                :class="[
                  'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold',
                  PILLS[scheduleStatus(event, now)],
                ]"
              >
                {{ t(scheduleStatus(event, now)) }}
              </span>
            </li>
          </ul>

          <div class="mt-6">
            <LazyVButton variant="secondary" size="md" block @click="emit('close')">
              {{ t("close") }}
            </LazyVButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts" setup>
import type { CalendarEvent } from "~/utils/calendar";

const { locale, t } = useI18n();

const props = defineProps<{
  isOpen: boolean;
  day: Date | null;
  events: CalendarEvent[];
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

onKeyStroke("Escape", () => {
  if (props.isOpen) emit("close");
});

const now = useNowEvery(30_000);
const titleId = `schedule-day-${Math.random().toString(36).slice(2, 7)}`;

const PILLS = {
  done: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
  overdue: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300",
  upcoming: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300",
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.day-panel {
  transition:
    transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.2s ease;
}

.fade-enter-from .day-panel,
.fade-leave-to .day-panel {
  transform: translateY(12px) scale(0.97);
  opacity: 0;
}
</style>
