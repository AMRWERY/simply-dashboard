<template>
  <section
    style="--d: 300ms"
    class="fade-up break-inside-avoid rounded-3xl border border-gray-100 bg-white p-6 shadow-sm shadow-indigo-900/5 dark:border-gray-800 dark:bg-[#1e1f2b] dark:shadow-none"
  >
    <h3 class="text-base font-extrabold text-gray-900 dark:text-white">
      {{ t("customers_by_city") }}
    </h3>
    <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
      {{ t("customers_by_city_description") }}
    </p>

    <p
      v-if="!cities.length"
      class="mt-8 rounded-2xl bg-gray-50 py-8 text-center text-sm font-bold text-gray-500 dark:bg-gray-800/40 dark:text-gray-400"
    >
      {{ t("no_city_data") }}
    </p>

    <!-- Height grows with the number of cities so bars keep a steady thickness -->
    <div v-else class="mt-5" :style="{ height: `${cities.length * 44 + 28}px` }">
      <Bar :data="chartData" :options="chartOptions" />
    </div>
  </section>
</template>

<script lang="ts" setup>
import { Bar } from "vue-chartjs";
import type { ChartData, ChartOptions } from "chart.js";
import type { Customer } from "~/types/home";

const props = defineProps<{ customers: Customer[] }>();

const { t } = useI18n();
const { isRtl, colors, tooltip } = useChartTheme();

const cities = computed(() => cityBreakdown(props.customers, 5));

const chartData = computed<ChartData<"bar">>(() => ({
  labels: cities.value.map((c) => c.city),
  datasets: [
    {
      data: cities.value.map((c) => c.count),
      backgroundColor: colors.value.indigo,
      hoverBackgroundColor: colors.value.violet,
      borderRadius: 8,
      borderSkipped: false,
      barThickness: 18,
    },
  ],
}));

const chartOptions = computed<ChartOptions<"bar">>(() => ({
  indexAxis: "y",
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 900, easing: "easeOutQuart" },
  interaction: { mode: "nearest", axis: "y", intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      ...tooltip.value,
      callbacks: {
        title: (items) => items[0]?.label ?? "",
        label: (ctx) => t("total_customers", { count: Number(ctx.raw) }),
      },
    },
  },
  scales: {
    x: {
      beginAtZero: true,
      // Arabic reads right to left, so the bars grow from the right edge.
      reverse: isRtl.value,
      border: { display: false },
      grid: { color: colors.value.grid },
      ticks: { color: colors.value.text, precision: 0, maxTicksLimit: 5 },
    },
    y: {
      position: isRtl.value ? "right" : "left",
      border: { display: false },
      grid: { display: false },
      ticks: { color: colors.value.text },
    },
  },
}));
</script>
