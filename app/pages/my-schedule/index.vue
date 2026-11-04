<template>
  <div class="space-y-6">
    <!-- Header banner -->
    <section
      class="fade-up relative flex flex-col justify-between gap-6 overflow-hidden rounded-3xl bg-[#151733] p-6 text-white shadow-xl shadow-indigo-950/20 sm:flex-row sm:items-center sm:p-8"
    >
      <div
        class="pointer-events-none absolute -top-20 -end-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl"
      />
      <div class="relative flex items-center gap-5">
        <div
          class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-950/40"
        >
          <svg
            class="h-7 w-7 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
          </svg>
        </div>
        <div>
          <h1 class="text-2xl font-extrabold tracking-tight">
            {{ t("my_schedule") }}
          </h1>
          <p class="mt-1 text-sm text-indigo-200/80">
            {{ t("my_schedule_description") }}
          </p>
        </div>
      </div>
    </section>

    <ClientOnly>
      <!-- Controls: period navigation and the week / month switch -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <button
            type="button"
            :aria-label="t(view === 'month' ? 'previous_month' : 'previous_week')"
            :title="t(view === 'month' ? 'previous_month' : 'previous_week')"
            class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-white text-gray-700 shadow-sm ring-1 ring-gray-200 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95 dark:bg-[#1e1f2b] dark:text-gray-200 dark:ring-gray-700"
            @click="step(-1)"
          >
            <svg class="h-4 w-4 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            :aria-label="t(view === 'month' ? 'next_month' : 'next_week')"
            :title="t(view === 'month' ? 'next_month' : 'next_week')"
            class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-white text-gray-700 shadow-sm ring-1 ring-gray-200 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95 dark:bg-[#1e1f2b] dark:text-gray-200 dark:ring-gray-700"
            @click="step(1)"
          >
            <svg class="h-4 w-4 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
          <button
            type="button"
            class="h-9 cursor-pointer rounded-xl bg-white px-3.5 text-xs font-bold text-gray-700 shadow-sm ring-1 ring-gray-200 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95 dark:bg-[#1e1f2b] dark:text-gray-200 dark:ring-gray-700"
            @click="anchor = new Date()"
          >
            {{ t("today") }}
          </button>
          <h2 class="ms-2 text-base font-extrabold text-gray-900 dark:text-white">
            {{ title }}
          </h2>
        </div>

        <div
          role="group"
          class="flex rounded-xl bg-gray-100 p-1 dark:bg-gray-800/60"
        >
          <button
            v-for="option in VIEWS"
            :key="option"
            type="button"
            :aria-pressed="view === option"
            :class="[
              'cursor-pointer rounded-lg px-4 py-1.5 text-xs font-bold transition-all duration-200',
              view === option
                ? 'bg-white text-indigo-600 shadow-sm dark:bg-[#1e1f2b] dark:text-indigo-300'
                : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white',
            ]"
            @click="view = option"
          >
            {{ t(option) }}
          </button>
        </div>
      </div>

      <schedule-calendar
        :view="view"
        :anchor="anchor"
        :events="events"
        @select="openDay"
      />

      <schedule-day-dialog
        :is-open="selectedDay !== null"
        :day="selectedDay"
        :events="selectedEvents"
        @close="selectedDay = null"
      />

      <template #fallback>
        <div
          class="h-96 animate-pulse rounded-3xl bg-gray-100 dark:bg-gray-800/40"
          role="status"
          :aria-label="t('loading_customers')"
        />
      </template>
    </ClientOnly>
  </div>
</template>

<script lang="ts" setup>
const { locale, t } = useI18n();

const customerStore = useCustomerStore();
const { add: addToast } = useToast();

onMounted(async () => {
  // The customer store is empty when landing here directly; load it once.
  if (customerStore.items.length) return;
  try {
    await customerStore.fetchAll();
  } catch (e) {
    console.error("[my-schedule] load failed", e);
    addToast(
      isNetworkError(e)
        ? { type: "error", message: t("network_error"), duration: 9000 }
        : { type: "error", message: t("customers_load_failed") },
    );
  }
});

const VIEWS = ["week", "month"] as const;
const view = ref<(typeof VIEWS)[number]>("month");
const anchor = ref(new Date());

const events = computed(() => eventsByDay(customerStore.items));
const title = computed(() => rangeTitle(view.value, anchor.value, locale.value));

const step = (direction: 1 | -1) => {
  anchor.value =
    view.value === "month"
      ? shiftMonth(anchor.value, direction)
      : shiftWeek(anchor.value, direction);
};

// The open day is held as a date and its events looked up again, so the
// dialog follows the data if the store is reloaded while it is open.
const selectedDay = ref<Date | null>(null);
const selectedEvents = computed(() =>
  selectedDay.value ? (events.value.get(dateKey(selectedDay.value)) ?? []) : [],
);
const openDay = (day: Date) => {
  selectedDay.value = day;
};

definePageMeta({
  layout: "dashboard",
  middleware: "auth",
});

useSeoPage({
  title: () => t("my_schedule"),
  description: () => t("my_schedule_description"),
  private: true,
});
</script>