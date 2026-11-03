<template>
  <section
    style="--d: 160ms"
    class="fade-up break-inside-avoid rounded-3xl border border-gray-100 bg-white p-6 shadow-sm shadow-indigo-900/5 dark:border-gray-800 dark:bg-[#1e1f2b] dark:shadow-none"
  >
    <h3 class="text-base font-extrabold text-gray-900 dark:text-white">
      {{ t("monthly_earnings") }}
    </h3>
    <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
      {{ t("monthly_earnings_description") }}
    </p>

    <p
      v-if="!months.length"
      class="mt-6 rounded-2xl bg-gray-50 py-8 text-center text-sm font-bold text-gray-500 dark:bg-gray-800/40 dark:text-gray-400"
    >
      {{ t("no_payments_yet") }}
    </p>

    <div v-else class="mt-4 overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-xs font-bold text-gray-500 dark:text-gray-400">
            <th class="py-2 pe-3 text-start font-bold">{{ t("month") }}</th>
            <th class="hidden px-3 py-2 text-end font-bold sm:table-cell">
              {{ t("customers") }}
            </th>
            <th class="px-3 py-2 text-end font-bold">{{ t("payments") }}</th>
            <th class="py-2 ps-3 text-end font-bold">{{ t("total_earnings") }}</th>
          </tr>
        </thead>

        <tbody class="divide-y divide-dashed divide-gray-100 dark:divide-gray-800">
          <!-- The whole row is clickable; the button inside makes it reachable by keyboard -->
          <tr
            v-for="m in months"
            :key="m.key"
            class="group cursor-pointer transition-colors duration-200 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/20"
            @click="emit('select', m)"
          >
            <td class="py-3 pe-3">
              <button
                type="button"
                class="flex w-full cursor-pointer flex-col items-start gap-1.5 text-start outline-none focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-indigo-400"
                :aria-label="t('view_month_details', { month: label(m) })"
              >
                <span class="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
                  {{ label(m) }}
                  <span
                    v-if="m.key === currentKey"
                    class="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                  >
                    {{ t("this_month") }}
                  </span>
                </span>
                <!-- Share of the best month, so the table scans like a chart -->
                <span class="block h-1.5 w-24 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <span
                    class="block h-full rounded-full bg-linear-to-r from-indigo-500 to-violet-400 transition-[width] duration-1000 ease-out"
                    :style="{ width: mounted ? `${share(m)}%` : '0%' }"
                  />
                </span>
              </button>
            </td>
            <td class="hidden px-3 py-3 text-end font-semibold text-gray-500 tabular-nums sm:table-cell dark:text-gray-400">
              {{ m.customers }}
            </td>
            <td class="px-3 py-3 text-end font-semibold text-gray-500 tabular-nums dark:text-gray-400">
              {{ m.count }}
            </td>
            <td
              dir="ltr"
              :class="['py-3 ps-3 text-end font-extrabold tabular-nums', tone(m.total)]"
            >
              {{ money(m.total) }}
            </td>
          </tr>
        </tbody>

        <tfoot>
          <tr class="border-t-2 border-gray-100 text-sm font-extrabold dark:border-gray-800">
            <td class="py-3 pe-3 text-gray-900 dark:text-white">{{ t("all_time") }}</td>
            <td class="hidden px-3 py-3 sm:table-cell" />
            <td class="px-3 py-3 text-end text-gray-500 tabular-nums dark:text-gray-400">
              {{ totalCount }}
            </td>
            <td
              dir="ltr"
              :class="['py-3 ps-3 text-end tabular-nums', tone(totalEarned)]"
            >
              {{ money(totalEarned) }}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  </section>
</template>

<script lang="ts" setup>
import type { Payment } from "~/types/home";

const props = defineProps<{ payments: Payment[] }>();
const emit = defineEmits<{
  (e: "select", month: MonthEarnings): void;
}>();

const { locale, t } = useI18n();
const money = (amount: number) => formatMoney(amount, locale.value);
const mounted = useMounted();

// Re-evaluated every minute so "This month" moves on when the month changes.
const now = useNowEvery(60_000);
const currentKey = computed(() => monthKeyOf(now.value));

const months = computed(() => monthlyEarnings(props.payments, now.value));
const label = (m: MonthEarnings) => monthLabel(m.year, m.month, locale.value);

const best = computed(() => Math.max(1, ...months.value.map((m) => m.total)));
const share = (m: MonthEarnings) =>
  m.total > 0 ? Math.max(4, (m.total / best.value) * 100) : 0;

const totalEarned = computed(() =>
  Math.round(months.value.reduce((sum, m) => sum + m.total, 0) * 100) / 100,
);
const totalCount = computed(() => months.value.reduce((sum, m) => sum + m.count, 0));

// Green for money in, red if corrections outweighed it, grey for an empty month.
const tone = (total: number) =>
  total > 0
    ? "text-emerald-600 dark:text-emerald-400"
    : total < 0
      ? "text-red-600 dark:text-red-400"
      : "text-gray-400 dark:text-gray-500";
</script>
