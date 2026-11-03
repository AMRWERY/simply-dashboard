<template>
  <div class="space-y-6">
    <!-- Header banner -->
    <section
      class="relative flex flex-col justify-between gap-6 overflow-hidden rounded-3xl bg-[#151733] p-6 text-white shadow-xl shadow-indigo-950/20 sm:flex-row sm:items-center sm:p-8"
    >
      <div
        class="pointer-events-none absolute -top-20 -end-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl"
      />
      <div
        class="pointer-events-none absolute -bottom-20 -start-20 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl"
      />

      <div class="relative flex items-center gap-5">
        <div
          class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-950/40"
        >
          <svg
            class="h-7 w-7 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          >
            <path d="M3 3v18h18" />
            <path d="M8 17V9M13 17V5M18 17v-7" />
          </svg>
        </div>
        <div>
          <h1 class="text-2xl font-extrabold tracking-tight">
            {{ t("reports_analytics") }}
          </h1>
          <p class="mt-1 text-sm text-indigo-200/80">
            {{ t("reports_analytics_description") }}
          </p>
        </div>
      </div>
    </section>

    <!-- Placeholder analytics cards -->
    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <div
        class="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm shadow-indigo-900/5 dark:border-gray-800 dark:bg-[#1e1f2b]"
      >
        <p class="text-xs font-bold text-gray-500 dark:text-gray-400">
          {{ t("total_revenue") }}
        </p>
        <p
          dir="ltr"
          class="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white"
        >
          {{ formatMoney(totals.earned, locale) }}
        </p>
        <p class="mt-2 text-xs font-semibold text-amber-600">
          {{
            t("outstanding_amount", {
              amount: formatMoney(totals.outstanding, locale),
            })
          }}
        </p>
      </div>
      <div
        class="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm shadow-indigo-900/5 dark:border-gray-800 dark:bg-[#1e1f2b]"
      >
        <p class="text-xs font-bold text-gray-500 dark:text-gray-400">
          {{ t("active_customers") }}
        </p>
        <p class="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white">
          128
        </p>
        <p class="mt-2 text-xs font-semibold text-indigo-600">
          {{ t("active_right_now", { count: 5 }) }}
        </p>
      </div>
      <div
        class="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm shadow-indigo-900/5 dark:border-gray-800 dark:bg-[#1e1f2b]"
      >
        <p class="text-xs font-bold text-gray-500 dark:text-gray-400">
          {{ t("tasks_completed") }}
        </p>
        <p class="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white">
          94%
        </p>
        <p class="mt-2 text-xs font-semibold text-emerald-600">
          {{ t("on_schedule") }}
        </p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const { locale, t } = useI18n();

const customerStore = useCustomerStore();

const totals = computed(() => summarizeEarnings(customerStore.items));

// The store is empty when landing here directly; load it once.
onMounted(async () => {
  if (!customerStore.items.length) {
    try {
      await customerStore.fetchAll();
    } catch (e) {
      console.error("[reports] load failed", e);
    }
  }
});

definePageMeta({
  layout: "dashboard",
  middleware: "auth",
});

useSeoPage({
  title: () => t("reports_page"),
  description: () => t("reports_analytics_description"),
  private: true,
});
</script>