<template>
  <section class="grid grid-cols-1 gap-4 sm:grid-cols-2">
    <div
      v-for="(tile, i) in tiles"
      :key="tile.label"
      :style="{ '--d': `${120 + i * 80}ms` }"
      class="fade-up group flex items-center gap-4 md:max-xl:flex-col md:max-xl:items-start rounded-3xl border border-gray-100 bg-white p-5 shadow-sm shadow-indigo-900/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-900/10 dark:border-gray-800 dark:bg-[#1e1f2b] dark:shadow-none"
    >
      <div
        :class="[
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-110',
          tile.iconClass,
        ]"
      >
        <svg
          class="h-6 w-6"
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
      <div class="min-w-0">
        <p class="text-xs font-bold text-gray-500 dark:text-gray-400">
          {{ tile.label }}
        </p>
        <p
          dir="ltr"
          :class="[
            'mt-1 truncate text-2xl font-extrabold tabular-nums',
            tile.valueClass,
          ]"
        >
          {{ money(tile.shown) }}
        </p>
        <p
          v-if="tile.caption"
          class="mt-0.5 truncate text-[11px] font-semibold text-gray-400 dark:text-gray-500"
        >
          {{ tile.caption }}
        </p>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import type { Customer, Payment } from "~/types/home";

const props = defineProps<{
  customers: Customer[];
  /** The payment history; the first tile shows only the current calendar month of it. */
  payments: Payment[];
}>();

const { locale, t } = useI18n();
const money = (amount: number) => formatMoney(amount, locale.value);

const totals = computed(() => summarizeEarnings(props.customers));

// Checked every minute, so on the 1st the tile moves on to the new month (and starts at 0).
const now = useNowEvery(60_000);
const monthEarned = useCountUp(
  computed(() => earningsInMonth(props.payments, now.value)),
);
const monthName = computed(() =>
  monthLabel(now.value.getFullYear(), now.value.getMonth(), locale.value),
);
const outstanding = useCountUp(computed(() => totals.value.outstanding));
const billed = useCountUp(computed(() => totals.value.billed));

const tiles = computed(() => [
  {
    label: t("earnings_this_month"),
    shown: monthEarned.value,
    caption: monthName.value,
    valueClass: "text-emerald-600 dark:text-emerald-400",
    iconClass:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400",
    icon: "M3 17l6-6 4 4 8-8M15 7h6v6",
  },
  {
    label: t("outstanding"),
    shown: outstanding.value,
    valueClass: "text-amber-600 dark:text-amber-400",
    iconClass:
      "bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400",
    icon: "M12 6v6l4 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
]);
</script>
