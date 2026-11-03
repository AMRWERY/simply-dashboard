<template>
  <section
    style="--d: 180ms"
    class="fade-up break-inside-avoid rounded-3xl border border-gray-100 bg-white p-6 shadow-sm shadow-indigo-900/5 dark:border-gray-800 dark:bg-[#1e1f2b] dark:shadow-none"
  >
    <h3 class="text-base font-extrabold text-gray-900 dark:text-white">
      {{ t("customers_by_status") }}
    </h3>

    <div class="mt-5 flex flex-col items-center gap-5">
      <div class="relative h-40 w-40">
        <svg class="h-full w-full -rotate-90" viewBox="0 0 100 100" fill="none">
          <!-- Track (also what an empty dataset shows) -->
          <circle
            cx="50"
            cy="50"
            :r="R"
            stroke-width="12"
            class="stroke-gray-100 dark:stroke-gray-800"
          />
          <circle
            v-for="seg in segments"
            :key="seg.status"
            cx="50"
            cy="50"
            :r="R"
            stroke-width="12"
            :class="[
              seg.stroke,
              hovered && hovered !== seg.status ? 'opacity-20' : '',
            ]"
            :stroke-dasharray="`${mounted ? seg.length : 0} ${C}`"
            :stroke-dashoffset="-seg.offset"
            class="transition-[stroke-dasharray,opacity] duration-1000 ease-out"
          />
        </svg>
        <div
          class="absolute inset-0 flex flex-col items-center justify-center"
        >
          <span
            class="text-3xl font-extrabold text-gray-900 tabular-nums dark:text-white"
            >{{ Math.round(totalShown) }}</span
          >
          <span class="text-xs font-bold text-gray-500 dark:text-gray-400">{{
            t("total")
          }}</span>
        </div>
      </div>

      <ul class="w-full space-y-2">
        <li
          v-for="seg in segments"
          :key="seg.status"
          class="-mx-2 flex cursor-default items-center justify-between gap-3 rounded-lg px-2 py-1 text-sm transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/40"
          @mouseenter="hovered = seg.status"
          @mouseleave="hovered = null"
        >
          <span
            class="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-300"
          >
            <span :class="['h-3 w-3 rounded-full', seg.dot]" />
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
import type { Customer, Status } from "~/types/home";

const props = defineProps<{ customers: Customer[] }>();

const { t } = useI18n();
const mounted = useMounted();

/** Legend row being hovered: the other donut segments fade back. */
const hovered = ref<Status | null>(null);

const R = 40;
const C = 2 * Math.PI * R;

const meta: Record<Status, { key: string; stroke: string; dot: string }> = {
  active: {
    key: "active",
    stroke: "stroke-emerald-500",
    dot: "bg-emerald-500",
  },
  new: { key: "new", stroke: "stroke-amber-500", dot: "bg-amber-500" },
  "follow-up": {
    key: "follow_up",
    stroke: "stroke-orange-500",
    dot: "bg-orange-500",
  },
};

const total = computed(() => props.customers.length);
const totalShown = useCountUp(total);

const segments = computed(() => {
  const counts = statusBreakdown(props.customers);
  let offset = 0;
  return (Object.keys(meta) as Status[]).map((status) => {
    const count = counts[status];
    const share = total.value ? count / total.value : 0;
    const seg = {
      status,
      label: t(meta[status].key),
      stroke: meta[status].stroke,
      dot: meta[status].dot,
      count,
      percent: Math.round(share * 100),
      length: share * C,
      offset,
    };
    offset += seg.length;
    return seg;
  });
});
</script>
