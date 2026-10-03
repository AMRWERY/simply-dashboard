<template>
  <component
    :is="componentTag"
    :to="to ? localePath(to) : undefined"
    :type="isLink ? undefined : type"
    :disabled="isDisabled"
    :aria-disabled="isDisabled"
    :aria-busy="loading"
    class="relative inline-flex items-center justify-center font-bold transition-all duration-200 select-none outline-none focus-visible:ring-4 focus-visible:ring-indigo-300 dark:focus-visible:ring-indigo-700 active:scale-[0.98]"
    :class="[
      variantClasses[variant],
      sizeClasses[size],
      block ? 'w-full' : '',
      isDisabled ? 'cursor-not-allowed opacity-50 active:scale-100' : 'cursor-pointer',
      loading ? 'pointer-events-none' : '',
    ]"
    v-bind="$attrs"
  >
    <!-- Loading Spinner -->
    <span
      v-if="loading"
      class="inline-block shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
      :class="spinnerSizeClasses[size]"
    />

    <!-- Leading Icon -->
    <slot v-else name="icon">
      <LazyVIcon
        v-if="icon"
        :name="icon"
        :class="['shrink-0', iconSizeClasses[size], iconClass]"
      />
    </slot>

    <!-- Default Label Slot -->
    <span v-if="$slots.default" :class="{ 'opacity-90': loading }">
      <slot />
    </span>

    <!-- Trailing Icon -->
    <slot name="trailing-icon">
      <LazyVIcon
        v-if="trailingIcon && !loading"
        :name="trailingIcon"
        :class="['shrink-0', iconSizeClasses[size], iconClass]"
      />
    </slot>
  </component>
</template>

<script lang="ts" setup>
import type { RouteLocationRaw } from "vue-router";
import type { ButtonVariant, ButtonSize } from "~/types/shared/VButton";

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariant;
    size?: ButtonSize;
    type?: "button" | "submit" | "reset";
    loading?: boolean;
    disabled?: boolean;
    icon?: string;
    trailingIcon?: string;
    iconClass?: string;
    block?: boolean;
    to?: RouteLocationRaw;
  }>(),
  {
    variant: "primary",
    size: "md",
    type: "button",
    loading: false,
    disabled: false,
    icon: undefined,
    trailingIcon: undefined,
    iconClass: undefined,
    block: false,
    to: undefined,
  }
);

const localePath = useLocalePath();

const isLink = computed(() => !!props.to);
const componentTag = computed(() => (isLink.value ? "NuxtLink" : "button"));
const isDisabled = computed(() => props.disabled || props.loading);

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 dark:shadow-indigo-950/40",
  secondary:
    "border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:bg-gray-800",
  outline:
    "border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-400 dark:text-indigo-400 dark:hover:bg-indigo-950/40",
  soft: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-900/50",
  danger:
    "bg-red-600 text-white shadow-lg shadow-red-600/30 hover:bg-red-700 dark:shadow-red-950/40",
  "danger-soft":
    "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20",
  ghost:
    "bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "py-2 px-3 text-xs rounded-xl gap-1.5",
  md: "py-2.5 px-4 text-xs font-bold rounded-2xl gap-2",
  lg: "py-3.5 px-5 text-sm font-bold rounded-2xl gap-2",
  icon: "h-8 w-8 rounded-full p-0 flex items-center justify-center",
  "icon-sm": "h-7 w-7 rounded-lg p-0 flex items-center justify-center",
  "icon-md": "h-10 w-10 rounded-2xl p-0 flex items-center justify-center",
};

const iconSizeClasses: Record<ButtonSize, string> = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
  icon: "h-4 w-4",
  "icon-sm": "h-3.5 w-3.5",
  "icon-md": "h-5 w-5",
};

const spinnerSizeClasses: Record<ButtonSize, string> = {
  sm: "h-3 w-3",
  md: "h-3.5 w-3.5",
  lg: "h-4 w-4",
  icon: "h-3.5 w-3.5",
  "icon-sm": "h-3 w-3",
  "icon-md": "h-4 w-4",
};
</script>