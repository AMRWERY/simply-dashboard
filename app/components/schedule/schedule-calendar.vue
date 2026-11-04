<template>
  <section
    class="overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-sm dark:border-gray-800/80 dark:bg-[#1e1f2b]"
  >
    <!-- Weekday headers -->
    <div
      class="grid grid-cols-7 border-b border-gray-100 bg-gray-50/70 dark:border-gray-800 dark:bg-gray-800/30"
    >
      <p
        v-for="d in headerDays"
        :key="d.getDay()"
        class="px-1 py-2.5 text-center text-[11px] font-bold tracking-wide text-gray-500 uppercase dark:text-gray-400"
      >
        {{ weekdayName(d, locale) }}
      </p>
    </div>

    <!-- Days -->
    <div class="grid grid-cols-7">
      <button
        v-for="d in days"
        :key="dateKey(d)"
        type="button"
        :aria-label="formatDayLong(d, locale)"
        :class="[
          'group flex flex-col items-stretch gap-1 border-b border-e border-gray-100 p-1.5 text-start transition-colors duration-150 hover:bg-indigo-50/60 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none dark:border-gray-800 dark:hover:bg-indigo-950/20 sm:p-2',
          view === 'week' ? 'min-h-[14rem]' : 'min-h-[5.5rem] sm:min-h-[7.5rem]',
          view === 'month' && d.getMonth() !== anchor.getMonth()
            ? 'bg-gray-50/50 dark:bg-gray-900/20'
            : '',
        ]"
        @click="emit('select', d)"
      >
        <span
          :class="[
            'flex h-6 w-6 items-center justify-center self-start rounded-full text-xs font-bold',
            isToday(d)
              ? 'bg-indigo-600 text-white'
              : view === 'month' && d.getMonth() !== anchor.getMonth()
                ? 'text-gray-300 dark:text-gray-600'
                : 'text-gray-700 dark:text-gray-300',
          ]"
        >
          {{ d.getDate() }}
        </span>

        <!-- Wide screens: the events themselves -->
        <ul class="hidden min-w-0 flex-1 flex-col gap-1 sm:flex">
          <li
            v-for="event in visibleEvents(d)"
            :key="event.id"
            :class="[
              'flex min-w-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-bold',
              CHIPS[scheduleStatus(event, now)],
            ]"
          >
            <span dir="ltr" class="shrink-0">{{ formatTime(event.at, locale) }}</span>
            <span class="truncate">{{ event.customer.name }}</span>
          </li>
          <li
            v-if="hiddenCount(d)"
            class="px-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-300"
          >
            {{ t("more_events", { count: hiddenCount(d) }) }}
          </li>
        </ul>

        <!-- Phones: too narrow for names, so just how many -->
        <span
          v-if="eventsOn(d).length"
          class="mx-auto mt-auto rounded-full bg-indigo-600 px-1.5 py-0.5 text-[10px] font-extrabold text-white sm:hidden"
        >
          {{ eventsOn(d).length }}
        </span>
      </button>
    </div>
  </section>
</template>

<script lang="ts" setup>
import type { CalendarEvent } from "~/utils/calendar";

const { locale, t } = useI18n();

const props = defineProps<{
  view: "week" | "month";
  /** Any date inside the week or month being shown. */
  anchor: Date;
  events: Map<string, CalendarEvent[]>;
}>();

const emit = defineEmits<{
  (e: "select", day: Date): void;
}>();

// Re-evaluated every 30s so an entry turns "overdue" without a refresh.
const now = useNowEvery(30_000);

const days = computed(() =>
  props.view === "month"
    ? monthDays(props.anchor, locale.value)
    : weekDays(props.anchor, locale.value),
);
const headerDays = computed(() => weekDays(props.anchor, locale.value));

const todayKey = computed(() => dateKey(now.value));
const isToday = (d: Date) => dateKey(d) === todayKey.value;

// A month cell is small, so it shows a few events and counts the rest;
// a week cell is tall enough for a whole day.
const MONTH_LIMIT = 3;
const eventsOn = (d: Date) => props.events.get(dateKey(d)) ?? [];
const visibleEvents = (d: Date) =>
  props.view === "month" ? eventsOn(d).slice(0, MONTH_LIMIT) : eventsOn(d);
const hiddenCount = (d: Date) =>
  props.view === "month" ? Math.max(0, eventsOn(d).length - MONTH_LIMIT) : 0;

const CHIPS = {
  done: "bg-emerald-100 text-emerald-700 line-through decoration-emerald-700/40 dark:bg-emerald-950/60 dark:text-emerald-300",
  overdue: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300",
  upcoming: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300",
};
</script>
