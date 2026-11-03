<template>
  <section
    style="--d: 120ms"
    class="fade-up break-inside-avoid rounded-3xl border border-gray-100 bg-white p-6 shadow-sm shadow-indigo-900/5 dark:border-gray-800 dark:bg-[#1e1f2b] dark:shadow-none"
  >
    <h3 class="text-base font-extrabold text-gray-900 dark:text-white">
      {{ t("top_debtors") }}
    </h3>
    <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
      {{ t("top_debtors_description") }}
    </p>

    <p
      v-if="!debtors.length"
      class="mt-8 rounded-2xl bg-emerald-50 py-8 text-center text-sm font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
    >
      {{ t("no_debts") }}
    </p>

    <TransitionGroup
      v-else
      name="row"
      tag="ul"
      class="mt-5 divide-y divide-dashed divide-gray-100 dark:divide-gray-800"
    >
      <li
        v-for="(row, i) in debtors"
        :key="row.customer.id"
        :style="{ '--i': i }"
        class="flex items-center gap-3 py-3"
      >
        <span
          class="w-5 shrink-0 text-center text-xs font-extrabold text-gray-400"
          >{{ i + 1 }}</span
        >

        <div
          :class="[
            'flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl text-xs font-extrabold',
            row.customer.avatarClass,
          ]"
        >
          <img
            v-if="row.customer.imageUrl"
            :src="row.customer.imageUrl"
            :alt="row.customer.name"
            loading="lazy"
            class="h-full w-full object-cover"
          />
          <template v-else>{{ row.customer.initials }}</template>
        </div>

        <div class="min-w-0 flex-1">
          <p
            class="truncate text-sm font-bold text-gray-900 dark:text-white"
          >
            {{ row.customer.name }}
          </p>
          <!-- Paid share of what they were billed -->
          <div
            class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-amber-100 dark:bg-amber-950/50"
          >
            <div
              class="h-full rounded-full bg-emerald-500 transition-[width] duration-1000 ease-out"
              :style="{ width: mounted ? `${paidShare(row.customer)}%` : '0%' }"
            />
          </div>
        </div>

        <span
          dir="ltr"
          class="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-extrabold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
        >
          {{ money(row.remaining) }}
        </span>

        <a
          :href="`tel:${row.customer.phone.replace(/\s/g, '')}`"
          class="no-print shrink-0 rounded-xl bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 transition-colors hover:bg-indigo-100 print:hidden dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-900/50"
        >
          {{ t("call") }}
        </a>
      </li>
    </TransitionGroup>
  </section>
</template>

<script lang="ts" setup>
import type { Customer } from "~/types/home";

const props = defineProps<{ customers: Customer[] }>();

const { locale, t } = useI18n();
const money = (n: number) => formatMoney(n, locale.value);
const mounted = useMounted();

const debtors = computed(() => topDebtors(props.customers, 5));

const paidShare = (c: Customer) =>
  c.amountDue > 0 ? Math.min(100, (c.amountPaid / c.amountDue) * 100) : 0;
</script>

<style scoped>
.row-enter-active {
  transition:
    opacity 0.35s ease,
    transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: calc(var(--i, 0) * 60ms);
}
.row-leave-active {
  transition: opacity 0.15s ease;
}
.row-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}
.row-leave-to {
  opacity: 0;
}
</style>
