<template>
  <section
    style="--d: 180ms"
    class="fade-up break-inside-avoid rounded-3xl border border-gray-100 bg-white p-6 shadow-sm shadow-indigo-900/5 dark:border-gray-800 dark:bg-[#1e1f2b] dark:shadow-none"
  >
    <h3 class="text-base font-extrabold text-gray-900 dark:text-white">
      {{ t("customers_by_status") }}
    </h3>

    <div class="mt-5 flex flex-col items-center gap-5">
      <div class="relative h-44 w-44">
        <Doughnut :data="chartData" :options="chartOptions" />
        <!-- Total in the middle -->
        <div
          class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
        >
          <span
            class="text-3xl font-extrabold text-gray-900 tabular-nums dark:text-white"
            >{{ total }}</span
          >
          <span class="text-xs font-bold text-gray-500 dark:text-gray-400">{{
            t("total")
          }}</span>
        </div>
      </div>

      <ul class="w-full space-y-1">
        <li
          v-for="seg in segments"
          :key="seg.status"
          class="-mx-2 flex cursor-default items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/40"
        >
          <span
            class="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-300"
          >
            <span
              class="h-3 w-3 rounded-full"
              :style="{ backgroundColor: seg.color }"
            />
            {{ seg.label }}
          </span>
          <span class="font-extrabold text-gray-900 tabular-nums dark:text-white">
            {{ seg.count }}
            <span class="ms-1 text-xs font-semibold text-gray-400"
              >{{ seg.percent }}%</span
            >
          </span>
        </li>
      </ul>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { Doughnut } from "vue-chartjs";
import type { ChartData, ChartOptions } from "chart.js";
import type { Customer, Status } from "~/types/home";

const props = defineProps<{ customers: Customer[] }>();

const { t } = useI18n();
const { colors, tooltip } = useChartTheme();

const total = computed(() => props.customers.length);

const meta = computed<Record<Status, { key: string; color: string }>>(() => ({
  active: { key: "active", color: colors.value.emerald },
  new: { key: "new", color: colors.value.amber },
  "follow-up": { key: "follow_up", color: colors.value.orange },
}));

const segments = computed(() => {
  const counts = statusBreakdown(props.customers);
  return (Object.keys(meta.value) as Status[]).map((status) => ({
    status,
    label: t(meta.value[status].key),
    color: meta.value[status].color,
    count: counts[status],
    percent: total.value ? Math.round((counts[status] / total.value) * 100) : 0,
  }));
});

// With no customers, show a single neutral ring instead of an empty canvas.
const chartData = computed<ChartData<"doughnut">>(() =>
  total.value
    ? {
        labels: segments.value.map((s) => s.label),
        datasets: [
          {
            data: segments.value.map((s) => s.count),
            backgroundColor: segments.value.map((s) => s.color),
            borderWidth: 0,
            hoverOffset: 8,
          },
        ],
      }
    : {
        labels: [],
        datasets: [
          { data: [1], backgroundColor: [colors.value.track], borderWidth: 0 },
        ],
      },
);

const chartOptions = computed<ChartOptions<"doughnut">>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: "74%",
  animation: { animateRotate: true, duration: 1000, easing: "easeOutQuart" },
  plugins: {
    legend: { display: false },
    tooltip: {
      ...tooltip.value,
      enabled: total.value > 0,
      callbacks: {
        label: (ctx) => {
          const count = Number(ctx.raw);
          const pct = total.value ? Math.round((count / total.value) * 100) : 0;
          return `${ctx.label}: ${count} (${pct}%)`;
        },
      },
    },
  },
}));
</script>
