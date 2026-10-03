<template>
  <nav
    v-if="pageCount > 1"
    class="flex flex-col items-center justify-between gap-4 sm:flex-row"
    aria-label="Pagination"
  >
    <p class="text-sm text-gray-500 dark:text-gray-400">
      Showing
      <span class="font-bold text-gray-900 dark:text-white">
        {{ rangeStart }}–{{ rangeEnd }}
      </span>
      of
      <span class="font-bold text-gray-900 dark:text-white">{{ total }}</span>
    </p>

    <ul class="flex items-center gap-1.5">
      <li>
        <button
          type="button"
          :class="[navBtn, 'rtl:rotate-180']"
          :disabled="modelValue === 1"
          aria-label="Previous page"
          @click="go(modelValue - 1)"
        >
          <svg
            viewBox="0 0 24 24"
            class="h-5 w-5"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
      </li>

      <li v-for="(item, i) in items" :key="`${item}-${i}`">
        <span
          v-if="item === ELLIPSIS"
          class="flex h-11 w-8 items-center justify-center text-gray-400"
          aria-hidden="true"
        >
          …
        </span>
        <button
          v-else
          type="button"
          :class="[
            pageBtn,
            item === modelValue
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-gray-700 hover:bg-indigo-50 dark:text-gray-300 dark:hover:bg-indigo-950/40',
          ]"
          :aria-label="`Page ${item}`"
          :aria-current="item === modelValue ? 'page' : undefined"
          @click="go(item as number)"
        >
          {{ item }}
        </button>
      </li>

      <li>
        <button
          type="button"
          :class="[navBtn, 'rtl:rotate-180']"
          :disabled="modelValue === pageCount"
          aria-label="Next page"
          @click="go(modelValue + 1)"
        >
          <svg
            viewBox="0 0 24 24"
            class="h-5 w-5"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </li>
    </ul>
  </nav>
</template>

<script lang="ts" setup>
const ELLIPSIS = "…" as const;

const props = withDefaults(
  defineProps<{
    /** Current page (1-based), use with v-model */
    modelValue: number;
    /** Total number of items */
    total: number;
    pageSize?: number;
    /** Page buttons shown on each side of the current page */
    siblingCount?: number;
  }>(),
  { pageSize: 8, siblingCount: 1 },
);

const emit = defineEmits<{
  (e: "update:modelValue", page: number): void;
}>();

const pageBtn =
  "flex h-11 min-w-11 items-center justify-center rounded-xl px-3 text-sm font-bold transition-all duration-200 outline-none focus-visible:ring-4 focus-visible:ring-indigo-300 dark:focus-visible:ring-indigo-700";
const navBtn =
  "flex h-11 w-11 items-center justify-center rounded-xl text-gray-600 transition-all duration-200 outline-none hover:bg-indigo-50 focus-visible:ring-4 focus-visible:ring-indigo-300 disabled:pointer-events-none disabled:opacity-40 dark:text-gray-300 dark:hover:bg-indigo-950/40 dark:focus-visible:ring-indigo-700";

const pageCount = computed(() =>
  Math.max(1, Math.ceil(props.total / props.pageSize)),
);
const rangeStart = computed(() =>
  props.total === 0 ? 0 : (props.modelValue - 1) * props.pageSize + 1,
);
const rangeEnd = computed(() =>
  Math.min(props.modelValue * props.pageSize, props.total),
);

// First, last, current ± siblings, with ellipses filling the gaps
const items = computed<(number | typeof ELLIPSIS)[]>(() => {
  const last = pageCount.value;
  const current = props.modelValue;
  const pages = new Set<number>([1, last]);
  for (
    let p = current - props.siblingCount;
    p <= current + props.siblingCount;
    p++
  ) {
    if (p >= 1 && p <= last) pages.add(p);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const result: (number | typeof ELLIPSIS)[] = [];
  sorted.forEach((p, i) => {
    const prev = sorted[i - 1];
    if (prev !== undefined) {
      if (p - prev === 2) result.push(prev + 1);
      else if (p - prev > 2) result.push(ELLIPSIS);
    }
    result.push(p);
  });
  return result;
});

function go(page: number) {
  const next = Math.min(Math.max(page, 1), pageCount.value);
  if (next !== props.modelValue) emit("update:modelValue", next);
}
</script>