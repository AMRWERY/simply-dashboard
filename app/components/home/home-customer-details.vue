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
                  :aria-label="t('open_messenger')"
                  :title="t('open_messenger')"
                  class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#0A7CFF] text-white transition-transform hover:-translate-y-0.5"
                >
<svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 2C6.48 2 2 6.14 2 11.25c0 2.9 1.45 5.48 3.72 7.17V22l3.4-1.87c.93.26 1.9.4 2.88.4 5.52 0 10-4.14 10-9.28S17.52 2 12 2z"/>
                    <path fill="#0A7CFF" d="M5.5 14.6l4.4-5.8 3.1 2.9 4.5-2.9-4.4 5.8-3.1-2.9z"/>
            </svg>
                </a>
                <template v-else>{{ row.value }}</template>
                <a
                  v-if="row.whatsapp"
                  :href="row.whatsapp"
                  target="_blank"
                  rel="noopener noreferrer"
                  :aria-label="t('whatsapp_chat')"
                  :title="t('whatsapp_chat')"
                  class="ms-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#25D366] align-middle text-white transition-transform hover:-translate-y-0.5"
                >
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35zM12.05 21.8h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88zM20.52 3.45A11.8 11.8 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.17-3.48-8.41z"/>
                  </svg>
                </a>
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
                <p
                  dir="auto"
                  :class="[
                    'min-w-0 truncate text-xs font-bold',
                    entry.done
                      ? 'text-gray-400 line-through dark:text-gray-500'
                      : 'text-gray-800 dark:text-gray-100',
                  ]"
                >
                  {{ formatSchedule(entry.at, locale) }}
                </p>
                <span
                  :class="[
                    'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold',
                    PILLS[scheduleStatus(entry, now)],
                  ]"
                >
                  {{ t(scheduleStatus(entry, now)) }}
                </span>
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
    { label: t("phone"), value: c.phone || "—", whatsapp: whatsappUrl(c.phone ?? "") },
    {
      label: t("link"),
      value: c.link || "—",
      href: messengerUrl(c.link) || undefined,
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