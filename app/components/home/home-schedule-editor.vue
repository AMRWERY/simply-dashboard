<template>
  <div>
    <div class="mb-1.5 flex items-center justify-between gap-2">
      <span class="text-sm font-bold text-gray-800 dark:text-gray-200">
        {{ t("schedule") }}
      </span>
      <button
        type="button"
        class="flex items-center gap-1 rounded-xl bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-900/50"
        @click="addRow"
      >
        <LazyVIcon name="plus-icon" alt="" class="h-3.5 w-3.5" />
        {{ t("add_date_time") }}
      </button>
    </div>

    <p
      v-if="!modelValue.length"
      class="rounded-2xl border border-dashed border-gray-200 px-3 py-4 text-center text-xs text-gray-400 dark:border-gray-700 dark:text-gray-500"
    >
      {{ t("schedule_empty_hint") }}
    </p>

    <TransitionGroup v-else name="row" tag="ul" class="space-y-2">
      <li
        v-for="row in modelValue"
        :key="row.key"
        class="rounded-2xl border border-gray-100 p-2 dark:border-gray-800"
      >
        <div class="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
          <input
            type="date"
            dir="ltr"
            :value="row.date"
            :aria-label="t('schedule_date')"
            :class="inputClass"
            @input="patch(row.key, { date: ($event.target as HTMLInputElement).value })"
          />
          <input
            type="time"
            dir="ltr"
            :value="row.time"
            :aria-label="t('schedule_time')"
            :class="inputClass"
            @input="patch(row.key, { time: ($event.target as HTMLInputElement).value })"
          />
          <button
            type="button"
            :aria-label="t('remove_date_time')"
            :title="t('remove_date_time')"
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 transition-all duration-200 hover:scale-110 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
            @click="remove(row.key)"
          >
            <LazyVIcon name="close-icon" alt="" class="h-3.5 w-3.5" />
          </button>
        </div>

        <!-- Done toggle + live status -->
        <div class="mt-2 flex items-center justify-between gap-2 px-1">
          <label
            class="flex cursor-pointer items-center gap-2 text-xs font-bold text-gray-600 select-none dark:text-gray-300"
          >
            <input
              type="checkbox"
              class="h-4 w-4 cursor-pointer rounded accent-emerald-600"
              :checked="row.done"
              @change="patch(row.key, { done: ($event.target as HTMLInputElement).checked })"
            />
            {{ t("mark_done") }}
          </label>
          <span
            :class="['rounded-full px-2.5 py-0.5 text-[11px] font-bold', badge(row).class]"
          >
            {{ badge(row).label }}
          </span>
        </div>
      </li>
    </TransitionGroup>
  </div>
</template>

<script lang="ts" setup>
import type { ScheduleDraft } from "~/types/home";

const props = defineProps<{ modelValue: ScheduleDraft[] }>();
const emit = defineEmits<{
  (e: "update:modelValue", value: ScheduleDraft[]): void;
}>();

const { t } = useI18n();

const inputClass =
  "w-full rounded-2xl border border-transparent bg-indigo-50/60 px-3 py-2 text-xs text-gray-800 outline-none transition hover:border-indigo-200 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 dark:bg-white/5 dark:text-white dark:hover:border-indigo-500/40 dark:focus:bg-white/10 dark:focus:ring-indigo-500/20";

const addRow = () => emit("update:modelValue", [...props.modelValue, newDraft()]);

const remove = (key: string) =>
  emit(
    "update:modelValue",
    props.modelValue.filter((row) => row.key !== key),
  );

const patch = (key: string, change: Partial<ScheduleDraft>) =>
  emit(
    "update:modelValue",
    props.modelValue.map((row) => (row.key === key ? { ...row, ...change } : row)),
  );

// Same three states as everywhere else: done, overdue (past, not done), upcoming.
const badge = (row: ScheduleDraft) => {
  const status = scheduleStatus({
    at: fromLocalParts(row.date, row.time) ?? new Date().toISOString(),
    done: row.done,
  });
  return {
    done: {
      label: t("done"),
      class: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
    },
    overdue: {
      label: t("overdue"),
      class: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300",
    },
    upcoming: {
      label: t("upcoming"),
      class: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300",
    },
  }[status];
};
</script>

<style scoped>
.row-enter-active,
.row-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.row-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}
.row-leave-to {
  opacity: 0;
  transform: translateX(12px);
}
</style>
