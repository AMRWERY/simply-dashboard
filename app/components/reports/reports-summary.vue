<template>
  <section class="grid grid-cols-1 gap-4 sm:grid-cols-2">
    <div
      v-for="(tile, i) in tiles"
      :key="tile.label"
      :style="{ '--d': `${i * 70}ms` }"
      class="fade-up group min-w-0 break-inside-avoid rounded-3xl border border-gray-100 bg-white p-5 shadow-sm shadow-indigo-900/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-900/10 dark:border-gray-800 dark:bg-[#1e1f2b] dark:shadow-none"
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
]);
</script>
