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

      <!-- Payment: shown only when the customer owes something -->
      <div
        v-if="customer.amountDue > 0"
        class="mt-4 space-y-1.5 rounded-2xl bg-gray-50/80 p-3 text-xs dark:bg-gray-800/40"
      >
        <p class="flex items-center justify-between gap-2">
          <span class="font-bold text-gray-700 dark:text-gray-300">
            Amount due
          </span>
          <span dir="ltr" class="font-medium text-gray-700 dark:text-gray-300">
            {{ money(customer.amountDue) }}
          </span>
        </p>
        <p class="flex items-center justify-between gap-2">
          <span class="font-bold text-gray-700 dark:text-gray-300">Paid</span>
          <span dir="ltr" class="font-medium text-emerald-600 dark:text-emerald-400">
            {{ money(customer.amountPaid) }}
          </span>
        </p>
        <p
          class="flex items-center justify-between gap-2 border-t border-dashed border-gray-200 pt-1.5 dark:border-gray-700"
        >
          <span class="font-bold text-gray-700 dark:text-gray-300">
            Remaining
          </span>
          <span
            v-if="remaining > 0"
            dir="ltr"
            class="rounded-full bg-amber-100 px-2.5 py-0.5 font-extrabold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
          >
            {{ money(remaining) }}
          </span>
          <span
            v-else
            class="rounded-full bg-emerald-100 px-2.5 py-0.5 font-extrabold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
          >
            Fully paid
          </span>
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

const props = defineProps<{
  customer: Customer;
  statusStyles: Record<Status, { label: string; class: string }>;
}>();

const { locale } = useI18n();
const money = (amount: number) => formatMoney(amount, locale.value);
const remaining = computed(() => remainingAmount(props.customer));

const emit = defineEmits<{
  (e: "edit", customer: Customer): void;
  (e: "delete", id: string): void;
}>();
</script>
