<template>
  <section class="grid grid-cols-2 gap-4 lg:grid-cols-5">
    <div
      v-for="(tile, i) in tiles"
      :key="tile.label"
      :style="{ '--d': `${i * 70}ms` }"
      class="fade-up group break-inside-avoid rounded-3xl border border-gray-100 bg-white p-5 shadow-sm shadow-indigo-900/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-900/10 dark:border-gray-800 dark:bg-[#1e1f2b] dark:shadow-none"
    >
      <div
        :class="[
          'flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110',
          tile.iconClass,
        ]"
      >
        <svg
          class="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path :d="tile.icon" />
        </svg>
      </div>
      <p class="mt-3 text-xs font-bold text-gray-500 dark:text-gray-400">
        {{ tile.label }}
      </p>
      <p
        dir="ltr"
        :class="[
          'mt-1 truncate text-xl font-extrabold tabular-nums sm:text-2xl',
          tile.valueClass,
        ]"
      >
        {{ tile.text }}
      </p>
    </div>
  </section>
</template>

<script lang="ts" setup>
import type { Customer } from "~/types/home";

const props = defineProps<{ customers: Customer[] }>();

const { locale, t } = useI18n();
const money = (n: number) => formatMoney(n, locale.value);

const totals = computed(() => summarizeEarnings(props.customers));
const rate = computed(() =>
  collectionRate(totals.value.billed, totals.value.earned),
);
const average = computed(() =>
  props.customers.length ? totals.value.billed / props.customers.length : 0,
);

const billed = useCountUp(computed(() => totals.value.billed));
const earned = useCountUp(computed(() => totals.value.earned));
const outstanding = useCountUp(computed(() => totals.value.outstanding));
const rateShown = useCountUp(rate);
const averageShown = useCountUp(average);

const tiles = computed(() => [
  {
    label: t("total_billed"),
    text: money(billed.value),
    valueClass: "text-gray-900 dark:text-white",
    iconClass:
      "bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400",
    icon: "M9 12h6M9 16h6M9 8h6M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z",
  },
  {
    label: t("total_earnings"),
    text: money(earned.value),
    valueClass: "text-emerald-600 dark:text-emerald-400",
    iconClass:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400",
    icon: "M3 17l6-6 4 4 8-8M15 7h6v6",
  },
  {
    label: t("outstanding"),
    text: money(outstanding.value),
    valueClass: "text-amber-600 dark:text-amber-400",
    iconClass:
      "bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400",
    icon: "M12 6v6l4 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    label: t("collection_rate"),
    text: `${Math.round(rateShown.value)}%`,
    valueClass: "text-sky-600 dark:text-sky-400",
    iconClass:
      "bg-sky-100 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400",
    icon: "M19 5L5 19M7.5 6.5a1 1 0 11-2 0 1 1 0 012 0zM18.5 17.5a1 1 0 11-2 0 1 1 0 012 0z",
  },
  {
    label: t("average_per_customer"),
    text: money(averageShown.value),
    valueClass: "text-violet-600 dark:text-violet-400",
    iconClass:
      "bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400",
    icon: "M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8",
  },
]);
</script>
