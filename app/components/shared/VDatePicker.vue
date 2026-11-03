<template>
  <div
    ref="rootRef"
    class="relative w-full select-none"
    @keydown.esc="open = false"
  >
    <!-- Trigger: shows the chosen date(s); the calendar opens from it -->
    <button
      type="button"
      :aria-expanded="open"
      aria-haspopup="dialog"
      :aria-label="label ?? t('select_dates')"
      class="flex w-full cursor-pointer items-center justify-between gap-2 rounded-2xl border border-transparent bg-indigo-50/60 px-3 py-2.5 text-xs font-bold outline-none transition hover:border-indigo-200 focus-visible:border-indigo-400 focus-visible:ring-4 focus-visible:ring-indigo-100 dark:bg-white/5 dark:hover:border-indigo-500/40 dark:focus-visible:ring-indigo-500/20"
      @click="open = !open"
    >
      <span class="flex min-w-0 items-center gap-2">
        <svg
          class="h-4 w-4 shrink-0 text-indigo-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path
            d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
          />
        </svg>
        <span
          dir="auto"
          :class="[
            'truncate',
            summary
              ? 'text-gray-800 dark:text-white'
              : 'font-semibold text-gray-400 dark:text-gray-500',
          ]"
          >{{ summary || (label ?? t("select_dates")) }}</span
        >
      </span>
      <span class="flex shrink-0 items-center gap-2">
        <span
          v-if="multiple && selected.length"
          class="rounded-full bg-indigo-600 px-2 py-0.5 text-[11px] font-extrabold text-white"
          >{{ selected.length }}</span
        >
        <svg
          class="h-3.5 w-3.5 text-gray-400 transition-transform duration-200"
          :class="open ? 'rotate-180' : ''"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </span>
    </button>

    <!-- The calendar sits in the page flow (not floating), so a scrolling form never clips it -->
    <Transition name="panel">
      <div
        v-if="open"
        class="mt-2 w-full rounded-2xl border border-gray-100 bg-white p-3 shadow-lg shadow-indigo-900/5 dark:border-gray-800 dark:bg-[#1e1f2b]"
        role="group"
        :aria-label="label ?? t('select_dates')"
      >
        <!-- Month header -->
        <div class="mb-2 flex items-center justify-between gap-2">
          <button
            type="button"
            :class="navButton"
            :aria-label="t('previous_month')"
            @click="go(-1)"
          >
            <svg
              :class="chevron"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>

          <Transition :name="`title-${direction}`" mode="out-in">
            <span
              :key="monthKey"
              class="text-sm font-extrabold text-gray-900 dark:text-white"
              aria-live="polite"
              >{{ monthLabel }}</span
            >
          </Transition>

          <button
            type="button"
            :class="navButton"
            :aria-label="t('next_month')"
            @click="go(1)"
          >
            <svg
              :class="chevron"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>

        <!-- Weekday names -->
        <div
          class="grid grid-cols-7 text-center text-[11px] font-bold text-gray-400 dark:text-gray-500"
          aria-hidden="true"
        >
          <span v-for="name in weekdays" :key="name" class="py-1">{{
            name
          }}</span>
        </div>

        <!-- Days: the grid fades when the month changes -->
        <Transition :name="`days-${direction}`" mode="out-in">
          <div :key="monthKey" class="mt-1 grid grid-cols-7 gap-y-1">
            <button
              v-for="cell in cells"
              :key="cell.iso"
              type="button"
              :disabled="cell.disabled"
              :aria-pressed="cell.selected"
              :aria-label="cell.label"
              :aria-current="cell.isToday ? 'date' : undefined"
              :class="[
                'mx-auto flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 active:scale-90',
                cell.selected
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : cell.disabled
                    ? 'cursor-not-allowed text-gray-300 opacity-50 dark:text-gray-600'
                    : cell.inMonth
                      ? 'cursor-pointer text-gray-800 hover:bg-indigo-50 dark:text-gray-100 dark:hover:bg-indigo-950/40'
                      : 'cursor-pointer text-gray-300 hover:bg-gray-50 dark:text-gray-600 dark:hover:bg-gray-800/40',
                cell.isToday && !cell.selected
                  ? 'ring-2 ring-indigo-300 dark:ring-indigo-500/50'
                  : '',
              ]"
              @click="pick(cell)"
            >
              {{ cell.day }}
            </button>
          </div>
        </Transition>

        <!-- Footer -->
        <div
          class="mt-2 flex items-center justify-between gap-2 border-t border-dashed border-gray-100 pt-2 text-xs dark:border-gray-800"
        >
          <button
            type="button"
            class="cursor-pointer rounded-lg px-2 py-1 font-bold text-indigo-600 transition-colors hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
            @click="goToday"
          >
            {{ t("today") }}
          </button>
          <span
            v-if="multiple"
            class="font-bold text-gray-500 dark:text-gray-400"
          >
            {{ t("dates_selected", { count: selected.length }) }}
          </span>
          <button
            v-if="multiple"
            type="button"
            :disabled="!selected.length"
            class="cursor-pointer rounded-lg px-2 py-1 font-bold text-gray-500 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-800"
            @click="emit('update:modelValue', [])"
          >
            {{ t("clear") }}
          </button>
        </div>

        <button
          type="button"
          class="mt-2 w-full cursor-pointer rounded-xl bg-indigo-600 py-1.5 text-xs font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 active:scale-95"
          @click="open = false"
        >
          {{ t("ok") }}
        </button>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
/**
 * Date picker that opens from a button. The value is a list of local dates as
 * `YYYY-MM-DD`. With `multiple` (the default) clicking a date toggles it and
 * the calendar stays open; otherwise the clicked date replaces the selection
 * and the calendar closes.
 */

const { locale, t } = useI18n();

const props = withDefaults(
  defineProps<{
    modelValue: string[];
    multiple?: boolean;
    /** Earliest selectable date (`YYYY-MM-DD`); earlier days are disabled. */
    min?: string;
    /** Latest selectable date (`YYYY-MM-DD`). */
    max?: string;
    /** 0 = Sunday … 6 = Saturday. Defaults to Saturday for Arabic, Sunday otherwise. */
    weekStartsOn?: number;
    label?: string;
  }>(),
  {
    multiple: true,
    min: undefined,
    max: undefined,
    weekStartsOn: undefined,
    label: undefined,
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string[]): void;
}>();

const rootRef = ref<HTMLElement | null>(null);
const open = ref(false);
onClickOutside(rootRef, () => {
  open.value = false;
});

const intl = computed(() =>
  locale.value === "ar" ? "ar-EG-u-nu-latn" : "en-US",
);

const navButton =
  "flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl text-gray-500 transition-all duration-200 hover:bg-gray-100 hover:text-gray-900 active:scale-90 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white";
// The arrows point the way the page reads, so they flip in Arabic.
const chevron = "h-4 w-4 rtl:rotate-180";

const pad = (n: number) => String(n).padStart(2, "0");
const isoOf = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const selected = computed(() => [...props.modelValue].sort());
const selectedSet = computed(() => new Set(props.modelValue));

// Which month is on screen; starts at the first selected date, else today.
const initial = props.modelValue.length
  ? new Date(`${[...props.modelValue].sort()[0]}T00:00`)
  : new Date();
const viewYear = ref(initial.getFullYear());
const viewMonth = ref(initial.getMonth());
const direction = ref<"next" | "prev">("next");
const monthKey = computed(() => `${viewYear.value}-${viewMonth.value}`);

const monthLabel = computed(() =>
  new Intl.DateTimeFormat(intl.value, {
    month: "long",
    year: "numeric",
  }).format(new Date(viewYear.value, viewMonth.value, 1)),
);

const first = computed(
  () => props.weekStartsOn ?? (locale.value === "ar" ? 6 : 0),
);

const weekdays = computed(() =>
  Array.from({ length: 7 }, (_, i) =>
    // 1 Jan 2023 was a Sunday.
    new Intl.DateTimeFormat(intl.value, { weekday: "short" }).format(
      new Date(2023, 0, 1 + ((first.value + i) % 7)),
    ),
  ),
);

// What the button shows: one date in full, several as a short list ("Nov 5, Nov 8 +1").
const summary = computed(() => {
  const dates = selected.value;
  const format = (iso: string, options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(intl.value, options).format(
      new Date(`${iso}T00:00`),
    );
  if (dates.length === 0) return "";
  if (dates.length === 1) {
    return format(dates[0]!, {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  const separator = locale.value === "ar" ? "، " : ", ";
  const shown = dates
    .slice(0, 3)
    .map((d) => format(d, { day: "numeric", month: "short" }))
    .join(separator);
  return dates.length > 3 ? `${shown} +${dates.length - 3}` : shown;
});

const todayIso = isoOf(new Date());

const cells = computed(() => {
  const firstOfMonth = new Date(viewYear.value, viewMonth.value, 1);
  const offset = (firstOfMonth.getDay() - first.value + 7) % 7;
  const label = new Intl.DateTimeFormat(intl.value, { dateStyle: "full" });
  // Always six rows, so the calendar never changes height between months.
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(viewYear.value, viewMonth.value, 1 - offset + i);
    const iso = isoOf(d);
    return {
      iso,
      day: d.getDate(),
      inMonth: d.getMonth() === viewMonth.value,
      isToday: iso === todayIso,
      selected: selectedSet.value.has(iso),
      disabled:
        (!!props.min && iso < props.min) || (!!props.max && iso > props.max),
      label: label.format(d),
    };
  });
});

const go = (delta: number) => {
  direction.value = delta > 0 ? "next" : "prev";
  const d = new Date(viewYear.value, viewMonth.value + delta, 1);
  viewYear.value = d.getFullYear();
  viewMonth.value = d.getMonth();
};

const goToday = () => {
  const now = new Date();
  direction.value =
    now.getFullYear() * 12 + now.getMonth() >=
    viewYear.value * 12 + viewMonth.value
      ? "next"
      : "prev";
  viewYear.value = now.getFullYear();
  viewMonth.value = now.getMonth();
};

const pick = (cell: { iso: string; inMonth: boolean }) => {
  if (!props.multiple) {
    emit("update:modelValue", [cell.iso]);
    open.value = false; // a single date is a finished choice
  } else if (selectedSet.value.has(cell.iso)) {
    emit(
      "update:modelValue",
      selected.value.filter((d) => d !== cell.iso),
    );
  } else {
    emit("update:modelValue", [...selected.value, cell.iso].sort());
  }
  // Picking a greyed-out day of a neighbouring month brings that month into view.
  if (!cell.inMonth) {
    const d = new Date(`${cell.iso}T00:00`);
    direction.value =
      d > new Date(viewYear.value, viewMonth.value, 1) ? "next" : "prev";
    viewYear.value = d.getFullYear();
    viewMonth.value = d.getMonth();
  }
};
</script>

<style scoped>
.panel-enter-active,
.panel-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.panel-enter-from,
.panel-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* Opacity and a small vertical nudge only: nothing sideways, so RTL needs no special case. */
.days-next-enter-active,
.days-next-leave-active,
.days-prev-enter-active,
.days-prev-leave-active,
.title-next-enter-active,
.title-next-leave-active,
.title-prev-enter-active,
.title-prev-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.days-next-enter-from,
.title-next-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.days-next-leave-to,
.title-next-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.days-prev-enter-from,
.title-prev-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}

.days-prev-leave-to,
.title-prev-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
