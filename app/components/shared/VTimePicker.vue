<template>
  <div ref="rootRef" class="relative" @keydown.esc="open = false">
    <!-- Trigger shows the chosen time in the active language -->
    <button
      type="button"
      :disabled="disabled"
      :aria-expanded="open"
      aria-haspopup="true"
      :aria-label="label ?? t('select_time')"
      class="flex w-full cursor-pointer items-center justify-between gap-2 rounded-2xl border border-transparent bg-indigo-50/60 px-3 py-2 text-xs font-bold text-gray-800 outline-none transition hover:border-indigo-200 focus-visible:border-indigo-400 focus-visible:ring-4 focus-visible:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white/5 dark:text-white dark:hover:border-indigo-500/40 dark:focus-visible:ring-indigo-500/20"
      @click="toggle"
    >
      <span class="flex items-center gap-2">
        <svg
          class="h-4 w-4 text-indigo-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
        <span dir="ltr" class="tabular-nums">{{ display }}</span>
      </span>
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
    </button>

    <!-- The panel sits in the page flow (not floating), so a scrolling form never clips it -->
    <Transition name="panel">
      <div
        v-if="open"
        class="mt-2 rounded-2xl border border-gray-100 bg-white p-2 shadow-lg shadow-indigo-900/5 dark:border-gray-800 dark:bg-[#1e1f2b]"
        role="group"
        :aria-label="label ?? t('select_time')"
      >
        <div class="grid grid-cols-[1fr_1fr_auto] gap-2" dir="ltr">
          <div>
            <p class="mb-1 text-center text-[11px] font-bold text-gray-400">
              {{ t("hour") }}
            </p>
            <ul data-col class="max-h-40 space-y-1 overflow-y-auto pe-1">
              <li v-for="h in hours" :key="h">
                <button
                  type="button"
                  :data-selected="h === hour12"
                  :aria-pressed="h === hour12"
                  :class="[
                    optionClass,
                    h === hour12 ? selectedClass : idleClass,
                  ]"
                  @click="setHour(h)"
                >
                  {{ pad(h) }}
                </button>
              </li>
            </ul>
          </div>

          <div>
            <p class="mb-1 text-center text-[11px] font-bold text-gray-400">
              {{ t("minute") }}
            </p>
            <ul data-col class="max-h-40 space-y-1 overflow-y-auto pe-1">
              <li v-for="m in minutes" :key="m">
                <button
                  type="button"
                  :data-selected="m === minute"
                  :aria-pressed="m === minute"
                  :class="[
                    optionClass,
                    m === minute ? selectedClass : idleClass,
                  ]"
                  @click="setMinute(m)"
                >
                  {{ pad(m) }}
                </button>
              </li>
            </ul>
          </div>

          <div>
            <p
              class="mb-1 text-center text-[11px] text-transparent select-none"
              aria-hidden="true"
            >
              .
            </p>
            <ul class="space-y-1">
              <li v-for="p in periods" :key="p.value">
                <button
                  type="button"
                  :aria-pressed="p.value === period"
                  :class="[
                    optionClass,
                    'px-3',
                    p.value === period ? selectedClass : idleClass,
                  ]"
                  @click="setPeriod(p.value)"
                >
                  {{ p.label }}
                </button>
              </li>
            </ul>
          </div>
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
 * Time of day. The value is a 24-hour `HH:mm` string; the picker shows and
 * edits it as hour / minute / AM-PM in the active language.
 */

const props = withDefaults(
  defineProps<{
    modelValue: string;
    /** Minutes offered in the list (an existing odd minute is kept and shown too). */
    minuteStep?: number;
    disabled?: boolean;
    label?: string;
  }>(),
  { minuteStep: 5, disabled: false, label: undefined },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const { locale, t } = useI18n();
const intl = computed(() =>
  locale.value === "ar" ? "ar-EG-u-nu-latn" : "en-US",
);

const rootRef = ref<HTMLElement | null>(null);
const open = ref(false);
onClickOutside(rootRef, () => {
  open.value = false;
});

const pad = (n: number) => String(n).padStart(2, "0");

// Parse "HH:mm"; anything unusable falls back to 09:00 so the picker always renders.
const parts = computed(() => {
  const [h, m] = props.modelValue.split(":").map(Number);
  return {
    h24: Number.isInteger(h) && h! >= 0 && h! <= 23 ? h! : 9,
    min: Number.isInteger(m) && m! >= 0 && m! <= 59 ? m! : 0,
  };
});

const hour12 = computed(() => parts.value.h24 % 12 || 12);
const minute = computed(() => parts.value.min);
const period = computed<"AM" | "PM">(() =>
  parts.value.h24 < 12 ? "AM" : "PM",
);

const hours = Array.from({ length: 12 }, (_, i) => i + 1);
const minutes = computed(() => {
  const list = new Set<number>();
  for (let m = 0; m < 60; m += props.minuteStep) list.add(m);
  list.add(minute.value);
  return [...list].sort((a, b) => a - b);
});

// "AM"/"PM" as the active language writes them (ص / م in Arabic).
const periods = computed(() => {
  const label = (h: number) =>
    new Intl.DateTimeFormat(intl.value, { hour: "numeric", hour12: true })
      .formatToParts(new Date(2000, 0, 1, h))
      .find((p) => p.type === "dayPeriod")?.value ?? (h < 12 ? "AM" : "PM");
  return [
    { value: "AM" as const, label: label(9) },
    { value: "PM" as const, label: label(21) },
  ];
});

const display = computed(() =>
  new Intl.DateTimeFormat(intl.value, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(2000, 0, 1, parts.value.h24, parts.value.min)),
);

const commit = (h12: number, m: number, p: "AM" | "PM") => {
  const h24 = (h12 % 12) + (p === "PM" ? 12 : 0);
  emit("update:modelValue", `${pad(h24)}:${pad(m)}`);
};

const setHour = (h: number) => commit(h, minute.value, period.value);

const setMinute = (m: number) => commit(hour12.value, m, period.value);

const setPeriod = (p: "AM" | "PM") => commit(hour12.value, minute.value, p);

const optionClass =
  "w-full cursor-pointer rounded-lg py-1.5 text-center text-xs font-bold tabular-nums transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 active:scale-95";
const selectedClass = "bg-indigo-600 text-white shadow-md shadow-indigo-600/30";
const idleClass =
  "text-gray-700 hover:bg-indigo-50 dark:text-gray-200 dark:hover:bg-indigo-950/40";

// When opened, scroll each column so the chosen value is in view.
const toggle = async () => {
  open.value = !open.value;
  if (!open.value) return;
  await nextTick();
  rootRef.value
    ?.querySelectorAll<HTMLElement>("[data-col]")
    .forEach((column) => {
      const chosen = column.querySelector<HTMLElement>(
        '[data-selected="true"]',
      );
      if (chosen) {
        column.scrollTop =
          chosen.offsetTop - column.clientHeight / 2 + chosen.clientHeight / 2;
      }
    });
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
</style>