<template>
  <article
    class="group relative flex flex-col justify-between rounded-3xl border border-gray-100 bg-white p-5 shadow-sm shadow-indigo-900/5 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-900/10 dark:border-gray-800 dark:bg-[#1e1f2b] dark:shadow-none"
  >
    <div>
      <!-- Header Row -->
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-center gap-3">
          <div
            :class="[
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-extrabold shadow-sm',
              customer.avatarClass,
            ]"
          >
            {{ customer.initials }}
          </div>
          <div>
            <h2 class="text-base font-extrabold text-gray-900 dark:text-white">
              {{ customer.name }}
            </h2>
            <p
              v-if="customer.city"
              class="mt-0.5 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400"
            >
              <LazyVIcon
                key="location"
                name="location-icon"
                alt="location"
                class="h-3.5 w-3.5 shrink-0 text-indigo-500"
              />
              {{ customer.city }}
            </p>
          </div>
        </div>

        <span
          :class="[
            'rounded-full px-3 py-1 text-[11px] font-bold',
            statusStyles[customer.status]?.class || 'bg-gray-100 text-gray-700',
          ]"
        >
          {{ statusStyles[customer.status]?.label || customer.status }}
        </span>
      </div>

      <!-- Contact info -->
      <div
        class="mt-4 space-y-2 border-t border-dashed border-gray-100 pt-4 dark:border-gray-800"
      >
        <p
          class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"
        >
          <LazyVIcon
            key="phone"
            name="phone-icon"
            alt="Phone"
            class="h-5 w-5 shrink-0 text-indigo-500"
          />
          <span class="font-bold text-gray-700 dark:text-gray-300">
            Phone:
          </span>
          <span dir="ltr" class="font-medium select-all">{{
            customer.phone
          }}</span>
        </p>
        <p
          v-if="customer.email"
          class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"
        >
          <LazyVIcon
            key="email"
            name="email-icon-ii"
            alt="email"
            class="h-5 w-5 shrink-0 text-indigo-500"
          />
          <span class="font-bold text-gray-700 dark:text-gray-300">
            Email:
          </span>
          <span dir="ltr" class="truncate font-medium select-all">{{
            customer.email
          }}</span>
        </p>
      </div>
    </div>

    <!-- Actions -->
    <div class="mt-5 grid grid-cols-2 gap-2.5">
      <LazyVButton
        variant="soft"
        size="sm"
        icon="edit-icon"
        block
        @click="emit('edit', customer)"
      >
        Update
      </LazyVButton>
      <LazyVButton
        variant="danger-soft"
        size="sm"
        icon="delete-icon"
        block
        @click="emit('delete', customer.id)"
      >
        Delete
      </LazyVButton>
    </div>
  </article>
</template>

<script lang="ts" setup>
import type { Customer, Status } from "~/types/home";

defineProps<{
  customer: Customer;
  statusStyles: Record<Status, { label: string; class: string }>;
}>();

const emit = defineEmits<{
  (e: "edit", customer: Customer): void;
  (e: "delete", id: string): void;
}>();
</script>
