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
          <span class="ms-auto flex items-center gap-2">
          <a
            v-if="facebookUrl(customer.link)"
            :href="facebookUrl(customer.link)"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="t('open_facebook')"
            :title="t('open_facebook')"
            class="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#1877F2] text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-90"
            @click.stop
          >
            <svg class="h-4.5 w-4.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.69.24 2.69.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.88v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z"/>
            </svg>
          </a>
          <a
            v-if="whatsapp"
            :href="whatsapp"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="t('whatsapp_chat')"
            :title="t('whatsapp_chat')"
            class="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#25D366] text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-90"
          >
            <svg class="h-4.5 w-4.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35zM12.05 21.8h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88zM20.52 3.45A11.8 11.8 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.17-3.48-8.41z"/>
            </svg>
          </a>
          </span>
        </p>
        <!-- Non-Facebook links have no icon, so they stay as plain text -->
        <p
          v-if="customer.link && !facebookUrl(customer.link)"
          class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"
        >
          <span class="font-bold text-gray-700 dark:text-gray-300">
            {{ t("link") }}:
          </span>
          <span dir="ltr" class="truncate font-medium select-all">{{
            customer.link
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

      <!-- Schedule: how many dates, how many are done, and any of them can be ticked off -->
      <div
        v-if="total"
        :class="['mt-4 rounded-2xl text-xs transition-colors duration-300', tone.box]"
      >
        <div class="p-3">
          <!-- Row 1: what it is, how many, and the expand toggle -->
          <div class="flex items-center gap-2.5">
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

            <p class="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-1 font-bold">
              <span>{{ t("schedule") }}</span>
              <span class="rounded-full bg-white/70 px-2 py-0.5 font-extrabold dark:bg-white/10">
                {{ t("schedule_progress", { done: doneCount, total }) }}
              </span>
              <span
                v-if="overdueCount"
                class="rounded-full bg-red-600 px-2 py-0.5 font-extrabold text-white"
              >
                {{ t("overdue_count", { count: overdueCount }) }}
              </span>
            </p>

            <button
              type="button"
              data-schedule-toggle
              :aria-expanded="expanded"
              :aria-label="expanded ? t('hide_all_dates') : t('show_all_dates')"
              :title="expanded ? t('hide_all_dates') : t('show_all_dates')"
              class="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-all duration-200 hover:bg-white/70 active:scale-90 dark:hover:bg-white/10"
              @click="expanded = !expanded"
            >
              <svg
                class="h-4 w-4 transition-transform duration-300"
                :class="expanded ? 'rotate-180' : ''"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
          </div>

          <!-- Row 2: the next date in full, with its quick action -->
          <div class="mt-2 flex items-center justify-between gap-2">
            <p v-if="next" dir="auto" class="min-w-0 flex-1 truncate font-medium opacity-80">
              {{ t("next") }} · {{ formatSchedule(next.at, locale) }}
            </p>
            <p v-else class="font-medium opacity-80">{{ t("all_done") }}</p>

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

        <!-- Every date: the grid-rows trick animates the height open and shut -->
        <div
          class="grid transition-[grid-template-rows] duration-300 ease-out"
          :class="expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
        >
          <div class="overflow-hidden">
            <ul class="space-y-1.5 px-3 pb-3" :inert="!expanded">
              <li
                v-for="entry in weekSchedules"
                :key="entry.id"
                class="flex items-center justify-between gap-2 rounded-xl bg-white/70 px-2.5 py-2 dark:bg-white/5"
              >
                <div class="min-w-0">
                  <p
                    dir="auto"
                    :class="[
                      'truncate font-bold',
                      entry.done ? 'text-gray-400 line-through dark:text-gray-500' : '',
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
                    {{ t(scheduleStatus(entry, now)) }}
                  </span>
                </div>
                <button
                  type="button"
                  :class="[
                    'shrink-0 cursor-pointer rounded-xl px-2.5 py-1.5 font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95',
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
        </div>
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
const whatsapp = computed(() => whatsappUrl(props.customer.phone));

// Re-evaluated every 30s so an entry turns "overdue" without a refresh.
const now = useNowEvery(30_000);
// The card only deals with this week's dates; the details dialog has the rest.
const weekSchedules = computed(() =>
  weekEntries(props.customer.schedules, locale.value, now.value),
);
const next = computed(() => nextOpenEntry(weekSchedules.value));
const total = computed(() => weekSchedules.value.length);
const doneCount = computed(() => total.value - openCount(weekSchedules.value));
const overdueCount = computed(
  () =>
    weekSchedules.value.filter((e) => scheduleStatus(e, now.value) === "overdue")
      .length,
);
// Whether the full list of dates is open (collapsed by default to keep cards compact).
const expanded = ref(false);

const PILLS = {
  done: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
  overdue: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300",
  upcoming: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300",
};
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