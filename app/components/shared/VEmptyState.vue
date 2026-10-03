<template>
  <div
    class="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-white p-12 text-center transition-colors duration-200 dark:border-gray-800 dark:bg-[#1e1f2b]"
  >
    <!-- Icon Area -->
    <slot name="icon">
      <div
        :class="[
          'flex h-16 w-16 items-center justify-center rounded-full',
          iconBgClass,
        ]"
      >
        <LazyVIcon
          v-if="icon"
          :name="icon"
          :alt="title || 'empty state'"
          :class="iconClass"
        />
      </div>
    </slot>

    <!-- Title -->
    <slot name="title">
      <h3
        v-if="title"
        class="mt-4 text-base font-bold text-gray-900 dark:text-white"
      >
        {{ title }}
      </h3>
    </slot>

    <!-- Description -->
    <slot name="description">
      <p
        v-if="description"
        class="mt-1 max-w-sm text-xs text-gray-500 dark:text-gray-400"
      >
        {{ description }}
      </p>
    </slot>

    <!-- Action Slot / Default Button -->
    <slot name="action">
      <LazyVButton
        v-if="actionLabel"
        size="sm"
        class="mt-4"
        @click="emit('action')"
      >
        {{ actionLabel }}
      </LazyVButton>
    </slot>
  </div>
</template>

<script lang="ts" setup>
withDefaults(
  defineProps<{
    /** VIcon filename without extension */
    icon?: string;
    /** Header title */
    title?: string;
    /** Subtitle description */
    description?: string;
    /** Text for primary action button */
    actionLabel?: string;
    /** CSS class for the icon */
    iconClass?: string;
    /** CSS class for the icon circular background */
    iconBgClass?: string;
  }>(),
  {
    icon: "search-icon",
    title: "No data found",
    description: undefined,
    actionLabel: undefined,
    iconClass: "h-8 w-8 text-indigo-600 dark:text-indigo-400",
    iconBgClass:
      "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400",
  }
);

const emit = defineEmits<{
  (e: "action"): void;
}>();
</script>