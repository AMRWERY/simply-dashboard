<template>
  <section class="grid grid-cols-1 gap-4 sm:grid-cols-3">
    <div
      v-for="tile in tiles"
      :key="tile.label"
      class="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm shadow-indigo-900/5 dark:border-gray-800 dark:bg-[#1e1f2b]"
    >
      <p class="text-xs font-bold text-gray-500 dark:text-gray-400">
        {{ tile.label }}
      </p>
      <p
        dir="ltr"
        :class="['mt-2 text-2xl font-extrabold', tile.valueClass]"
      >
        {{ money(tile.value) }}
      </p>
    </div>
  </section>
</template>

<script lang="ts" setup>
import type { Customer } from "~/types/home";

const props = defineProps<{ customers: Customer[] }>();

const { locale } = useI18n();
const money = (amount: number) => formatMoney(amount, locale.value);

const totals = computed(() => summarizeEarnings(props.customers));

const tiles = computed(() => [
  {
    label: "Total earnings",
    value: totals.value.earned,
    valueClass: "text-emerald-600 dark:text-emerald-400",
  },
  {
    label: "Outstanding",
    value: totals.value.outstanding,
    valueClass: "text-amber-600 dark:text-amber-400",
  },
  {
    label: "Total billed",
    value: totals.value.billed,
    valueClass: "text-gray-900 dark:text-white",
  },
]);
</script>
