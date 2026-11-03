<template>
  <section
    style="--d: 240ms"
    class="fade-up break-inside-avoid rounded-3xl border border-gray-100 bg-white p-6 shadow-sm shadow-indigo-900/5 dark:border-gray-800 dark:bg-[#1e1f2b] dark:shadow-none"
  >
    <h3 class="text-base font-extrabold text-gray-900 dark:text-white">
      {{ t("customer_growth") }}
    </h3>
    <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
      {{ t("customer_growth_description") }}
    </p>

    <!-- Bars grow from the baseline; the latest month is highlighted -->
    <div class="mt-6 flex h-44 items-end justify-between gap-2 sm:gap-3">
      <div
        v-for="(m, i) in months"
        :key="m.key"
        class="group flex h-full flex-1 flex-col items-center justify-end gap-2"
        :title="t('new_customers_count', { count: m.count })"
      >
        <span
          class="text-xs font-extrabold text-gray-700 tabular-nums transition-opacity duration-500 dark:text-gray-300"
          :class="mounted ? 'opacity-100' : 'opacity-0'"
          :style="{ transitionDelay: `${600 + i * 80}ms` }"
          >{{ m.count }}</span
        >
        <div class="flex w-full flex-1 items-end">
          <div
            :class="[
              'w-full rounded-t-xl transition-all duration-1000 ease-out group-hover:brightness-110',
              i === months.length - 1
                ? 'bg-linear-to-t from-indigo-600 to-indigo-400'
                : 'bg-linear-to-t from-indigo-300 to-indigo-200 dark:from-indigo-800 dark:to-indigo-700',
            ]"
            :style="{
              height: mounted ? `${barHeight(m.count)}%` : '0%',
              transitionDelay: `${i * 80}ms`,
            }"
          />
        </div>
        <span class="text-[11px] font-bold text-gray-500 dark:text-gray-400">{{
          m.label
        }}</span>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import type { Customer } from "~/types/home";

const props = defineProps<{ customers: Customer[] }>();

const { locale, t } = useI18n();
const mounted = useMounted();

const months = computed(() => monthlyGrowth(props.customers, locale.value, 6));
const max = computed(() => Math.max(1, ...months.value.map((m) => m.count)));

// Empty months keep a thin stub so the chart still reads as a chart.
const barHeight = (count: number) =>
  count === 0 ? 3 : Math.max(8, (count / max.value) * 100);
</script>
