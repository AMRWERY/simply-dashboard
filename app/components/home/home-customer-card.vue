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
              'flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-sm font-extrabold shadow-sm transition-transform duration-200 group-hover:scale-110',
              customer.avatarClass,
            ]"
          >
            <img
              v-if="customer.imageUrl"
              :src="customer.imageUrl"
              :alt="customer.name"
              loading="lazy"
              class="h-full w-full object-cover opacity-0 transition-opacity duration-300"
              @load="
                ($event.target as HTMLImageElement).classList.remove(
                  'opacity-0',
                )
              "
            />
            <template v-else>{{ customer.initials }}</template>
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
            {{ t("phone") }}:
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
            {{ t("email") }}:
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
            {{ t("amount_due") }}
          </span>
          <span dir="ltr" class="font-medium text-gray-700 dark:text-gray-300">
            {{ money(customer.amountDue) }}
          </span>
        </p>
        <p class="flex items-center justify-between gap-2">
          <span class="font-bold text-gray-700 dark:text-gray-300">{{
            t("paid")
          }}</span>
          <span
            dir="ltr"
            class="font-medium text-emerald-600 dark:text-emerald-400"
          >
            {{ money(customer.amountPaid) }}
          </span>
        </p>
        <p
          class="flex items-center justify-between gap-2 border-t border-dashed border-gray-200 pt-1.5 dark:border-gray-700"
        >
          <span class="font-bold text-gray-700 dark:text-gray-300">
            {{ t("remaining") }}
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
            {{ t("fully_paid") }}
          </span>
        </p>
      </div>

      <!-- Schedule: the next date that still needs attention -->
      <div
        v-if="customer.schedules.length"
        :class="[
          'mt-4 flex items-center gap-2.5 rounded-2xl p-3 text-xs transition-colors duration-300',
          tone.box,
        ]"
      >
        <span
          :class="['flex h-8 w-8 shrink-0 items-center justify-center rounded-xl', tone.icon]"
        >
          <svg
            class="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path v-if="next" d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
            <path v-else d="m5 13 4 4L19 7" />
          </svg>
        </span>
        <div class="min-w-0 flex-1">
          <p class="flex flex-wrap items-center gap-x-2 font-bold">
            <span>{{ next ? t(status) : t("all_done") }}</span>
            <span v-if="openLeft > 1" class="font-semibold opacity-70">
              {{ t("more_dates", { count: openLeft - 1 }) }}
            </span>
          </p>
          <p v-if="next" dir="auto" class="mt-0.5 truncate font-medium opacity-80">
            {{ formatSchedule(next.at, locale) }}
          </p>
        </div>
        <button
          v-if="next"
          type="button"
          class="shrink-0 cursor-pointer rounded-xl px-2.5 py-1.5 font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95"
          :class="tone.button"
          @click="emit('schedule', next.id, true)"
        >
          {{ t("mark_done") }}
        </button>
      </div>
    </div>

    <!-- Actions -->
    <div class="mt-5 grid grid-cols-2 gap-2.5">
      <LazyVButton
        variant="secondary"
        size="sm"
        icon="eye-open-icon"
        block
        class="col-span-2"
        @click="emit('view', customer)"
      >
        {{ t("view_details") }}
      </LazyVButton>
      <LazyVButton
        variant="soft"
        size="sm"
        block
        @click="emit('edit', customer)"
      >
        {{ t("update") }}
      </LazyVButton>
      <LazyVButton
        variant="danger-soft"
        size="sm"
        block
        @click="emit('delete', customer.id)"
      >
        {{ t("delete") }}
      </LazyVButton>
    </div>
  </article>
</template>

<script lang="ts" setup>
import type { Customer, Status } from "~/types/home";

const { locale, t } = useI18n();

const props = defineProps<{
  customer: Customer;
  statusStyles: Record<Status, { label: string; class: string }>;
}>();

const money = (amount: number) => formatMoney(amount, locale.value);

const remaining = computed(() => remainingAmount(props.customer));

// Re-evaluated every 30s so an entry turns "overdue" without a refresh.
const now = useNowEvery(30_000);
const next = computed(() => nextOpenEntry(props.customer.schedules));
const openLeft = computed(() => openCount(props.customer.schedules));
const status = computed(() => (next.value ? scheduleStatus(next.value, now.value) : "done"));

const TONES = {
  overdue: {
    box: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300",
    icon: "bg-red-100 dark:bg-red-950/60",
    button: "bg-red-600 text-white hover:bg-red-700",
  },
  upcoming: {
    box: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300",
    icon: "bg-indigo-100 dark:bg-indigo-950/60",
    button: "bg-indigo-600 text-white hover:bg-indigo-700",
  },
  done: {
    box: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
    icon: "bg-emerald-100 dark:bg-emerald-950/60",
    button: "bg-emerald-600 text-white hover:bg-emerald-700",
  },
};
const tone = computed(() => TONES[status.value]);

const emit = defineEmits<{
  (e: "view", customer: Customer): void;
  (e: "edit", customer: Customer): void;
  (e: "delete", id: string): void;
  (e: "schedule", scheduleId: string, done: boolean): void;
}>();
</script>