<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isOpen && customer"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        @click.self="emit('close')"
      >
        <div
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          class="details-panel relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl dark:bg-[#1e1f2b] dark:text-white"
        >
          <!-- Identity -->
          <div class="flex items-center gap-4">
            <div
              :class="[
                'flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-lg font-extrabold shadow-sm',
                customer.avatarClass,
              ]"
            >
              <img
                v-if="customer.imageUrl"
                :src="customer.imageUrl"
                :alt="customer.name"
                class="h-full w-full object-cover"
              />
              <template v-else>{{ customer.initials }}</template>
            </div>
            <div class="min-w-0">
              <h3
                :id="titleId"
                class="truncate text-xl font-extrabold text-gray-900 dark:text-white"
              >
                {{ customer.name }}
              </h3>
              <span
                :class="[
                  'mt-1 inline-block rounded-full px-3 py-1 text-[11px] font-bold',
                  statusStyles[customer.status]?.class ||
                    'bg-gray-100 text-gray-700',
                ]"
              >
                {{ statusStyles[customer.status]?.label || customer.status }}
              </span>
            </div>
          </div>

          <!-- Details -->
          <dl
            class="mt-6 divide-y divide-dashed divide-gray-100 text-sm dark:divide-gray-800"
          >
            <div
              v-for="row in rows"
              :key="row.label"
              class="-mx-2 flex items-center justify-between gap-4 rounded-lg px-2 py-2.5 transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/40"
            >
              <dt class="font-bold text-gray-700 dark:text-gray-300">
                {{ row.label }}
              </dt>
              <dd
                dir="ltr"
                class="truncate font-medium text-gray-500 select-all dark:text-gray-400"
              >
                <a
                  v-if="row.href"
                  :href="row.href"
                  target="_blank"
                  rel="noopener noreferrer"
                  :aria-label="t('open_facebook')"
                  :title="t('open_facebook')"
                  class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#1877F2] text-white transition-transform hover:-translate-y-0.5"
                >
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.69.24 2.69.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.88v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z"/>
                  </svg>
                </a>
                <template v-else>{{ row.value }}</template>
              </dd>
            </div>
          </dl>

          <!-- Schedule -->
          <div v-if="customer.schedules.length" class="mt-5">
            <h4 class="mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">
              {{ t("schedule") }}
            </h4>
            <ul class="space-y-2">
              <li
                v-for="entry in customer.schedules"
                :key="entry.id"
                class="flex items-center justify-between gap-3 rounded-2xl bg-gray-50/80 px-3 py-2.5 transition-colors duration-200 hover:bg-gray-100 dark:bg-gray-800/40 dark:hover:bg-gray-800/70"
              >
                <div class="min-w-0">
                  <p
                    dir="auto"
                    :class="[
                      'truncate text-xs font-bold',
                      entry.done
                        ? 'text-gray-400 line-through dark:text-gray-500'
                        : 'text-gray-800 dark:text-gray-100',
                    ]"
                  >
                    {{ formatSchedule(entry.at, locale) }}
                  </p>
                  <span
                    :class="[
                      'mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold',
                      PILLS[scheduleStatus(entry, now)],
                    ]"
                  >
                    {{ t(scheduleStatus(entry, now) === "done" ? "done" : scheduleStatus(entry, now)) }}
                  </span>
                </div>
                <button
                  type="button"
                  :class="[
                    'shrink-0 cursor-pointer rounded-xl px-3 py-1.5 text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95',
                    entry.done
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700',
                  ]"
                  @click="emit('schedule', entry.id, !entry.done)"
                >
                  {{ entry.done ? t("undo") : t("mark_done") }}
                </button>
              </li>
            </ul>
          </div>

          <div class="mt-6 grid grid-cols-2 gap-3">
            <LazyVButton variant="secondary" size="md" @click="emit('close')">
              {{ t("close") }}
            </LazyVButton>
            <LazyVButton
              variant="primary"
              size="md"
              @click="emit('edit', customer)"
            >
              {{ t("update") }}
            </LazyVButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts" setup>
import type { Customer, Status } from "~/types/home";

const { locale, t } = useI18n();

const props = defineProps<{
  isOpen: boolean;
  customer: Customer | null;
  statusStyles: Record<Status, { label: string; class: string }>;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "edit", customer: Customer): void;
  (e: "schedule", scheduleId: string, done: boolean): void;
}>();

// Re-evaluated every 30s so an entry turns "overdue" while the dialog is open.
const now = useNowEvery(30_000);

const PILLS = {
  done: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
  overdue: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300",
  upcoming: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300",
};

onKeyStroke("Escape", () => {
  if (props.isOpen) emit("close");
});

const money = (amount: number) => formatMoney(amount, locale.value);

const titleId = `v-customer-details-${Math.random().toString(36).slice(2, 7)}`;

const rows = computed(() => {
  const c = props.customer;
  if (!c) return [];
  return [
    { label: t("phone"), value: c.phone },
    {
      label: t("link"),
      value: c.link || "—",
      href: facebookUrl(c.link) || undefined,
    },
    { label: t("city"), value: c.city || "—" },
    { label: t("amount_due"), value: money(c.amountDue) },
    { label: t("paid"), value: money(c.amountPaid) },
    { label: t("remaining"), value: money(remainingAmount(c)) },
  ];
});
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

.details-panel {
  transition:
    transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.2s ease;
}

.fade-enter-from .details-panel,
.fade-leave-to .details-panel {
  opacity: 0;
  transform: scale(0.95) translateY(8px);
}
</style>