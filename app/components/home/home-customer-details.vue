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
          class="details-panel relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-2xl dark:bg-[#1e1f2b] dark:text-white"
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
              class="flex items-center justify-between gap-4 py-2.5"
            >
              <dt class="font-bold text-gray-700 dark:text-gray-300">
                {{ row.label }}
              </dt>
              <dd
                dir="ltr"
                class="truncate font-medium text-gray-500 select-all dark:text-gray-400"
              >
                {{ row.value }}
              </dd>
            </div>
          </dl>

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
    { label: t("email"), value: c.email || "—" },
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