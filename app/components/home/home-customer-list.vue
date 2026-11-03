<template>
  <section>
    <TransitionGroup
      v-if="customers.length > 0"
      name="card"
      tag="div"
      class="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
    >
      <lazy-home-customer-card
        v-for="(customer, index) in customers"
        :key="customer.id"
        :style="{ '--i': index }"
        :customer="customer"
        :status-styles="statusStyles"
        @view="emit('view', $event)"
        @edit="emit('edit', $event)"
        @delete="emit('delete', $event)"
        @schedule="(scheduleId, done) => emit('schedule', customer.id, scheduleId, done)"
      />
    </TransitionGroup>

    <!-- Empty State -->
    <Transition name="empty" appear>
      <LazyVEmptyState
        v-if="customers.length === 0"
        :icon="isDatabaseEmpty ? 'persons-icon' : 'search-icon'"
        :title="isDatabaseEmpty ? t('add_new_customers') : t('no_customers_found')"
        :description="
          isDatabaseEmpty ? undefined : t('no_customers_found_description')
        "
        :action-label="isDatabaseEmpty ? undefined : t('reset_filters')"
        @action="emit('reset')"
      />
    </Transition>
  </section>
</template>

<script lang="ts" setup>
import type { Customer, Status } from "~/types/home";

const { t } = useI18n();

const props = defineProps<{
  /** The customers to show (already filtered and paginated). */
  customers: Customer[];
  /** How many customers exist in total, ignoring search and filters. */
  totalCustomers: number;
  statusStyles: Record<Status, { label: string; class: string }>;
}>();

// No customers at all (vs. a search/filter that matched none).
const isDatabaseEmpty = computed(() => props.totalCustomers === 0);

const emit = defineEmits<{
  (e: "view", customer: Customer): void;
  (e: "edit", customer: Customer): void;
  (e: "delete", id: string): void;
  (e: "schedule", customerId: string, scheduleId: string, done: boolean): void;
  (e: "reset"): void;
}>();
</script>

<style scoped>
/* Cards rise in with a short stagger (index via --i) and fade out quickly */
.card-enter-active {
  transition:
    opacity 0.35s ease,
    transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: calc(var(--i, 0) * 45ms);
}

.card-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.card-enter-from {
  opacity: 0;
  transform: translateY(14px) scale(0.97);
}

.card-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.empty-enter-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.empty-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
</style>