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

    <div class="mt-5 h-52">
      <Bar :data="chartData" :options="chartOptions" />
    </div>
  </section>
</template>

<script lang="ts" setup>
import { Bar } from "vue-chartjs";
import type { ChartData, ChartOptions } from "chart.js";
import type { Customer } from "~/types/home";

const props = defineProps<{ customers: Customer[] }>();

const { locale, t } = useI18n();
const { colors, tooltip } = useChartTheme();

const months = computed(() => monthlyGrowth(props.customers, locale.value, 6));

// The latest month is the strong colour; earlier months are soft.
const chartData = computed<ChartData<"bar">>(() => ({
  labels: months.value.map((m) => m.label),
  datasets: [
    {
      data: months.value.map((m) => m.count),
      backgroundColor: months.value.map((_, i) =>
        i === months.value.length - 1 ? colors.value.indigo : colors.value.indigoSoft,
      ),
      hoverBackgroundColor: colors.value.indigo,
      borderRadius: 10,
      borderSkipped: false,
      maxBarThickness: 44,
    },
  ],
}));

const chartOptions = computed<ChartOptions<"bar">>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 900, easing: "easeOutQuart" },
  interaction: { mode: "index", intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      ...tooltip.value,
      callbacks: {
        title: (items) => items[0]?.label ?? "",
        label: (ctx) => t("new_customers_count", { count: Number(ctx.raw) }),
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: { color: colors.value.text },
    },
    y: {
      beginAtZero: true,
      border: { display: false },
      grid: { color: colors.value.grid },
      ticks: { color: colors.value.text, precision: 0, maxTicksLimit: 5 },
    },
  },
}));
</script>
