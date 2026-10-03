<template>
  <div
    class="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
    role="status"
    aria-label="Loading customers"
  >
    <article
      v-for="n in count"
      :key="n"
      class="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm shadow-indigo-900/5 dark:border-gray-800 dark:bg-[#1e1f2b] dark:shadow-none"
    >
      <!-- Header: avatar, name/city, status pill -->
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-center gap-3">
          <LazyVSkeleton class="h-12 w-12 !rounded-2xl" />
          <div class="space-y-2">
            <LazyVSkeleton class="h-4 w-32" />
            <LazyVSkeleton class="h-3 w-20" />
          </div>
        </div>
        <LazyVSkeleton class="h-6 w-16 !rounded-full" />
      </div>

      <!-- Contact rows -->
      <div
        class="mt-4 space-y-3 border-t border-dashed border-gray-100 pt-4 dark:border-gray-800"
      >
        <LazyVSkeleton class="h-3.5 w-3/4" />
        <LazyVSkeleton class="h-3.5 w-full" />
      </div>

      <!-- Actions -->
      <div class="mt-5 grid grid-cols-2 gap-2.5">
        <LazyVSkeleton class="h-11 !rounded-xl" />
        <LazyVSkeleton class="h-11 !rounded-xl" />
      </div>
    </article>
  </div>
</template>

<script lang="ts" setup>
withDefaults(defineProps<{ count?: number }>(), { count: 6 });
</script>
