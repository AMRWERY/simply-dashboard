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

    <ul v-else class="mt-5 space-y-4">
      <li
        v-for="(row, i) in cities"
        :key="row.city"
        class="group -mx-2 rounded-xl px-2 py-1.5 transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/40"
      >
        <div class="mb-1.5 flex items-center justify-between gap-3 text-sm">
          <span
            class="flex min-w-0 items-center gap-2 font-bold text-gray-800 dark:text-gray-200"
          >
            <span
              class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-[11px] font-extrabold text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300"
              >{{ i + 1 }}</span
            >
            <span class="truncate">{{ row.city }}</span>
          </span>
          <span class="shrink-0 font-extrabold text-gray-900 tabular-nums dark:text-white">{{
            row.count
          }}</span>
        </div>
        <div
          class="h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"
        >
          <div
            class="h-full rounded-full bg-linear-to-r from-indigo-500 to-violet-400 transition-[width,filter] duration-1000 ease-out group-hover:brightness-110"
            :style="{
              width: mounted ? `${(row.count / max) * 100}%` : '0%',
              transitionDelay: `${i * 90}ms`,
            }"
          />
        </div>
      </li>
    </ul>
  </section>
</template>

<script lang="ts" setup>
import type { Customer } from "~/types/home";

const props = defineProps<{ customers: Customer[] }>();

const { t } = useI18n();
const mounted = useMounted();

const cities = computed(() => cityBreakdown(props.customers, 5));
const max = computed(() => Math.max(1, ...cities.value.map((c) => c.count)));
</script>
