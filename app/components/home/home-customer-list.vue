<template>
  <section>
    <TransitionGroup
      v-if="customers.length > 0"
      name="card"
      tag="div"
      class="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
    >
      <lazy-home-customer-card
        v-for="(customer, index) in customers"
        :key="customer.id"
        :style="{ '--i': index }"
        :customer="customer"
        :status-styles="statusStyles"
        @edit="emit('edit', $event)"
        @delete="emit('delete', $event)"
      />
    </TransitionGroup>

    <!-- Empty State -->
    <Transition name="empty" appear>
      <LazyVEmptyState
        v-if="customers.length === 0"
        icon="search-icon"
        title="No customers found"
        description="Try adjusting your search query or switching filters."
        action-label="Reset filters"
        @action="emit('reset')"
      />
    </Transition>
  </section>
</template>

<script lang="ts" setup>
import type { Customer, Status } from "~/types/home";

defineProps<{
  customers: Customer[];
  statusStyles: Record<Status, { label: string; class: string }>;
}>();

const emit = defineEmits<{
  (e: "edit", customer: Customer): void;
  (e: "delete", id: number): void;
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