<template>
  <div>
    <div class="mb-1 text-sm font-bold text-gray-800 dark:text-gray-200">
      {{ t("schedule") }}
    </div>
    <p class="mb-2 text-xs text-gray-500 dark:text-gray-400">
      {{ t("schedule_pick_dates") }}
    </p>

    <!-- Pick any number of dates -->
    <VDatePicker
      :model-value="dates"
      multiple
      @update:model-value="selectDates"
    />

    <!-- One row per picked date, each with its own time -->
    <TransitionGroup
      v-if="modelValue.length"
      name="row"
      tag="ul"
      class="mt-3 space-y-2"
    >
      <li
        v-for="row in modelValue"
        :key="row.key"
        class="rounded-2xl border border-gray-100 p-2 dark:border-gray-800"
      >
        <div class="mb-2 flex items-center justify-between gap-2 px-1">
          <span
            dir="auto"
            class="truncate text-xs font-extrabold text-gray-800 dark:text-gray-100"
          >
            {{ dateLabel(row.date) }}
          </span>
          <div class="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              :aria-label="t('add_time_same_date')"
              :title="t('add_time_same_date')"
              class="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 transition-all duration-200 hover:scale-110 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-900/50"
              @click="
                emit(
                  'update:modelValue',
                  addTimeOnSameDate(modelValue, row.key),
                )
              "
            >
              <LazyVIcon name="plus-icon" alt="" class="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              :aria-label="t('remove_date_time')"
              :title="t('remove_date_time')"
              class="flex h-7 w-7 items-center justify-center rounded-full bg-red-50 text-red-600 transition-all duration-200 hover:scale-110 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
              @click="remove(row.key)"
            >
              <LazyVIcon name="close-icon" alt="" class="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <VTimePicker
          :model-value="row.time"
          :label="t('schedule_time')"
          @update:model-value="patch(row.key, { time: $event })"
        />
      </li>
    </TransitionGroup>
  </div>
</template>

<script lang="ts" setup>
import type { ScheduleDraft } from "~/types/home";

const { locale, t } = useI18n();

const props = defineProps<{ modelValue: ScheduleDraft[] }>();
const emit = defineEmits<{
  (e: "update:modelValue", value: ScheduleDraft[]): void;
}>();

// The calendar's selection is derived from the rows, so they can't drift apart.
const dates = computed(() => draftDates(props.modelValue));

const selectDates = (next: string[]) =>
  emit("update:modelValue", applyDateSelection(props.modelValue, next));

const remove = (key: string) =>
  emit(
    "update:modelValue",
    props.modelValue.filter((row) => row.key !== key),
  );

const patch = (key: string, change: Partial<ScheduleDraft>) =>
  emit(
    "update:modelValue",
    props.modelValue.map((row) =>
      row.key === key ? { ...row, ...change } : row,
    ),
  );

const dateLabel = (date: string) =>
  new Intl.DateTimeFormat(locale.value === "ar" ? "ar-EG-u-nu-latn" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T00:00`));

// Same three states as everywhere else: done, overdue (past, not done), upcoming.
const badge = (row: ScheduleDraft) => {
  const status = scheduleStatus({
    at: fromLocalParts(row.date, row.time) ?? new Date().toISOString(),
    done: row.done,
  });
  return {
    done: {
      label: t("done"),
      class:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
    },
    overdue: {
      label: t("overdue"),
      class: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300",
    },
    upcoming: {
      label: t("upcoming"),
      class:
        "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300",
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
  transform: translateY(8px);
}
</style>