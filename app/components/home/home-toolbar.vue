<template>
  <div
    style="--d: 80ms"
    class="fade-up flex flex-col gap-4 rounded-3xl bg-white p-4 shadow-sm shadow-indigo-900/5 transition-colors duration-200 dark:bg-[#1e1f2b] dark:shadow-none sm:p-5 lg:flex-row lg:items-center lg:justify-between"
  >
    <!-- Search Input -->
    <div class="relative flex-1 lg:max-w-md">
      <input
        :value="searchQuery"
        @input="
          emit('update:searchQuery', ($event.target as HTMLInputElement).value)
        "
        type="search"
        :placeholder="t('search_customers_placeholder')"
        class="w-full rounded-2xl border border-gray-200 bg-gray-50/80 py-3 ps-11 pe-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 dark:border-gray-700 dark:bg-gray-800/60 dark:text-white dark:focus:border-indigo-400 dark:focus:bg-gray-800 dark:focus:ring-indigo-950"
      />
      <span
        class="pointer-events-none absolute inset-y-0 start-4 flex items-center text-gray-400"
      >
        <LazyVIcon
          name="search-icon"
          alt="search"
          class="h-5 w-5 text-gray-400"
        />
      </span>
    </div>
  </div>
</template>

<script lang="ts" setup>
const { t } = useI18n();

defineProps<{
  searchQuery: string;
}>();

const emit = defineEmits<{
  (e: "update:searchQuery", value: string): void;
}>();
</script>