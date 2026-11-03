<template>
  <Teleport to="body">
    <!-- Bottom-end corner: right in English, left in Arabic. Newest on the bottom. -->
    <div
      aria-live="polite"
      aria-atomic="true"
      class="pointer-events-none fixed inset-x-4 bottom-4 z-[9999] sm:inset-x-auto sm:end-6 sm:bottom-6 sm:w-96"
    >
      <TransitionGroup
        name="toast"
        tag="div"
        class="flex flex-col-reverse gap-3"
      >
        <div
          v-for="toast in toasts"
          :key="toast.id"
          role="alert"
          class="pointer-events-auto group relative flex items-start gap-3 overflow-hidden rounded-2xl border border-gray-100 border-s-4 bg-white py-3.5 ps-4 pe-3 shadow-xl shadow-black/10 transition-shadow duration-200 hover:shadow-2xl dark:border-gray-800 dark:bg-[#1e1f2b] dark:shadow-black/40"
          :class="variantClasses[toast.type].accent"
        >
          <!-- Icon -->
          <span
            class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            :class="variantClasses[toast.type].icon"
          >
            <LazyVIcon
              v-if="toast.type === 'error' || toast.type === 'warning'"
              name="error-circle-icon"
              alt="error"
              class="h-5 w-5"
            />

            <LazyVIcon
              v-else-if="toast.type === 'success'"
              name="success-standard-line-icon"
              alt="success"
              class="h-5 w-5"
            />

            <LazyVIcon v-else name="info-icon" alt="info" class="h-5 w-5" />
          </span>

          <!-- Message -->
          <p
            class="min-w-0 flex-1 py-1.5 text-sm leading-snug font-semibold text-gray-800 dark:text-gray-100"
          >
            {{ toast.message }}
          </p>

          <!-- Close button -->
          <button
            type="button"
            :aria-label="t('close_notification')"
            class="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition-all duration-200 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700/60 dark:hover:text-gray-200"
            @click="remove(toast.id)"
          >
            <LazyVIcon name="close-icon" alt="close" class="h-4 w-4" />
          </button>

          <!-- Auto-dismiss progress bar -->
          <div
            v-if="toast.duration && toast.duration > 0"
            class="absolute bottom-0 start-0 h-1 rounded-full opacity-70"
            :class="variantClasses[toast.type].bar"
            :style="{
              width: `${toast.progress}%`,
              transition: 'width 100ms linear',
            }"
          />
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script lang="ts" setup>
import type { ToastItem, ToastOptions, ToastType } from "~/types/shared/VToast";

const { t } = useI18n();

const toasts = ref<ToastItem[]>([]);
let _nextId = 0;

// The type only colours the accent edge, the icon tile and the progress bar;
// the card itself stays neutral so it reads well in light and dark mode.
const variantClasses: Record<
  ToastType,
  { accent: string; icon: string; bar: string }
> = {
  error: {
    accent: "border-s-red-500",
    icon: "bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400",
    bar: "bg-red-500",
  },
  success: {
    accent: "border-s-emerald-500",
    icon: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400",
    bar: "bg-emerald-500",
  },
  warning: {
    accent: "border-s-amber-500",
    icon: "bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400",
    bar: "bg-amber-500",
  },
  info: {
    accent: "border-s-indigo-500",
    icon: "bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400",
    bar: "bg-indigo-500",
  },
};

function add(options: ToastOptions) {
  const id = ++_nextId;
  const duration = options.duration ?? 4000;

  const item: ToastItem = reactive({
    id,
    message: options.message,
    type: options.type ?? "info",
    duration,
    progress: 100,
    _timer: undefined,
  });

  toasts.value.unshift(item);

  if (duration > 0) {
    const step = 100 / (duration / 100);
    item._timer = setInterval(() => {
      item.progress = Math.max(0, item.progress - step);
      if (item.progress <= 0) remove(id);
    }, 100);
  }
}

function remove(id: number) {
  const idx = toasts.value.findIndex((t) => t.id === id);
  if (idx === -1) return;
  const item = toasts.value[idx];
  if (item._timer) clearInterval(item._timer);
  toasts.value.splice(idx, 1);
}

/** Expose API for use via template ref or a useToast composable */
defineExpose({ add, remove });
</script>

<style scoped>
/* Rise from the bottom edge (no sideways motion, so it works in RTL too) */
.toast-enter-active {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-leave-active {
  position: absolute;
  inset-inline: 0;
  transition: all 0.2s ease-in;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(24px) scale(0.96);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.96);
}

.toast-move {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
