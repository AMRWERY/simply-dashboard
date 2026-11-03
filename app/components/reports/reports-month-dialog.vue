<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isOpen && month"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        @click.self="emit('close')"
      >
        <div
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          class="month-panel relative max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl dark:bg-[#1e1f2b] dark:text-white"
        >
          <!-- Header -->
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-xs font-bold text-gray-500 dark:text-gray-400">
                {{ t("monthly_earnings") }}
              </p>
              <h3
                :id="titleId"
                class="mt-0.5 truncate text-xl font-extrabold text-gray-900 dark:text-white"
              >
                {{ title }}
              </h3>
            </div>
            <button
              type="button"
              :aria-label="t('close')"
              class="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-gray-500 transition-all duration-200 hover:bg-gray-100 active:scale-90 dark:text-gray-400 dark:hover:bg-gray-800"
              @click="emit('close')"
            >
              <LazyVIcon name="close-icon" alt="" class="h-4 w-4" />
            </button>
          </div>

          <!-- Totals -->
          <div class="mt-4 grid grid-cols-3 gap-2">
            <div
              v-for="stat in stats"
              :key="stat.label"
              class="min-w-0 rounded-2xl bg-gray-50/80 px-3 py-2.5 dark:bg-gray-800/40"
            >
              <p class="truncate text-[11px] font-bold text-gray-500 dark:text-gray-400">
                {{ stat.label }}
              </p>
              <p
                dir="ltr"
                :class="['mt-0.5 truncate text-sm font-extrabold tabular-nums sm:text-base', stat.class]"
              >
                {{ stat.value }}
              </p>
            </div>
          </div>

          <p
            v-if="!month.payments.length"
            class="mt-5 rounded-2xl bg-gray-50 py-8 text-center text-sm font-bold text-gray-500 dark:bg-gray-800/40 dark:text-gray-400"
          >
            {{ t("no_payments_this_month") }}
          </p>

          <template v-else>
            <!-- Who paid -->
            <h4 class="mt-5 mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">
              {{ t("by_customer") }}
            </h4>
            <ul class="space-y-1.5">
              <li
                v-for="row in byCustomer"
                :key="row.customerId"
                class="flex items-center justify-between gap-3 rounded-xl bg-gray-50/80 px-3 py-2 text-sm transition-colors duration-200 hover:bg-gray-100 dark:bg-gray-800/40 dark:hover:bg-gray-800/70"
              >
                <span dir="auto" class="min-w-0 truncate font-bold text-gray-800 dark:text-gray-100">
                  {{ row.name || "—" }}
                </span>
                <span dir="ltr" :class="['shrink-0 font-extrabold tabular-nums', tone(row.total)]">
                  {{ money(row.total) }}
                </span>
              </li>
            </ul>

            <!-- Every entry, newest first -->
            <h4 class="mt-5 mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">
              {{ t("payments") }}
            </h4>
            <ul class="divide-y divide-dashed divide-gray-100 dark:divide-gray-800">
              <li
                v-for="p in month.payments"
                :key="p.id"
                class="flex items-center justify-between gap-3 py-2.5 text-sm"
              >
                <div class="min-w-0">
                  <p dir="auto" class="truncate font-bold text-gray-800 dark:text-gray-100">
                    {{ p.customerName || "—" }}
                  </p>
                  <p class="mt-0.5 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    {{ when(p.paidAt) }}
                    <span
                      v-if="p.amount < 0"
                      class="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700 dark:bg-red-950/60 dark:text-red-300"
                    >
                      {{ t("correction") }}
                    </span>
                  </p>
                </div>
                <span dir="ltr" :class="['shrink-0 font-extrabold tabular-nums', tone(p.amount)]">
                  {{ money(p.amount) }}
                </span>
              </li>
            </ul>
            <p class="mt-3 text-[11px] leading-relaxed text-gray-400 dark:text-gray-500">
              {{ t("payments_note") }}
            </p>
          </template>

          <LazyVButton variant="secondary" size="md" block class="mt-5" @click="emit('close')">
            {{ t("close") }}
          </LazyVButton>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts" setup>
const props = defineProps<{
  isOpen: boolean;
  month: MonthEarnings | null;
}>();

const emit = defineEmits<{ (e: "close"): void }>();

const { locale, t } = useI18n();
const money = (amount: number) => formatMoney(amount, locale.value);
const titleId = `v-month-dialog-${Math.random().toString(36).slice(2, 7)}`;

onKeyStroke("Escape", () => {
  if (props.isOpen) emit("close");
});

const title = computed(() =>
  props.month ? monthLabel(props.month.year, props.month.month, locale.value) : "",
);
const byCustomer = computed(() => customerTotals(props.month?.payments ?? []));

const tone = (total: number) =>
  total > 0
    ? "text-emerald-600 dark:text-emerald-400"
    : total < 0
      ? "text-red-600 dark:text-red-400"
      : "text-gray-500 dark:text-gray-400";

const stats = computed(() => [
  {
    label: t("total_earnings"),
    value: money(props.month?.total ?? 0),
    class: tone(props.month?.total ?? 0),
  },
  { label: t("payments"), value: String(props.month?.count ?? 0), class: "text-gray-900 dark:text-white" },
  { label: t("customers"), value: String(props.month?.customers ?? 0), class: "text-gray-900 dark:text-white" },
]);

const when = (iso: string) =>
  new Intl.DateTimeFormat(locale.value === "ar" ? "ar-EG-u-nu-latn" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.month-panel {
  transition:
    transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.2s ease;
}
.fade-enter-from .month-panel,
.fade-leave-to .month-panel {
  opacity: 0;
  transform: scale(0.95) translateY(8px);
}
</style>
