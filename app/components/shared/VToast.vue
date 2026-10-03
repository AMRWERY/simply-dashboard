<template>
  <Teleport to="body">
    <div
      aria-live="polite"
      aria-atomic="true"
      class="pointer-events-none fixed inset-x-0 top-6 z-[9999] flex flex-col items-center gap-3 px-4"
    >
      <TransitionGroup
        name="toast"
        tag="div"
        class="flex w-full max-w-md flex-col items-center gap-3"
      >
        <div
          v-for="toast in toasts"
          :key="toast.id"
          role="alert"
          class="pointer-events-auto relative w-full overflow-hidden rounded-2xl border px-4 py-3.5 shadow-lg shadow-black/5 flex items-center gap-3"
          :class="variantClasses[toast.type].wrapper"
        >
          <!-- Icon badge -->
          <span
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2"
            :class="variantClasses[toast.type].badge"
          >
            <LazyVIcon
              v-if="toast.type === 'error' || toast.type === 'warning'"
              name="error-circle-icon"
              alt="error"
              class="h-4 w-4"
            />

            <LazyVIcon
              v-else-if="toast.type === 'success'"
              name="success-standard-line-icon"
              alt="success"
              class="h-4 w-4"
            />

            <LazyVIcon v-else name="info-icon" alt="info" class="h-4 w-4" />
          </span>

          <!-- Message -->
          <p
            class="flex-1 text-sm font-semibold"
            :class="variantClasses[toast.type].text"
          >
            {{ toast.message }}
          </p>

          <!-- Close button -->
          <button
            type="button"
            aria-label="Close notification"
            class="transition"
            :class="variantClasses[toast.type].close"
            @click="remove(toast.id)"
          >
            <LazyVIcon name="close-icon" alt="close" class="h-5 w-5" />
          </button>

          <!-- Auto-dismiss progress bar -->
          <div
            v-if="toast.duration && toast.duration > 0"
            class="absolute bottom-0 left-0 h-0.5 rounded-full"
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

const toasts = ref<ToastItem[]>([]);
let _nextId = 0;

const variantClasses: Record<
  ToastType,
  { wrapper: string; badge: string; text: string; close: string; bar: string }
> = {
  error: {
    wrapper:
      "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/40",
    badge: "border-red-500 text-red-500",
    text: "text-red-600 dark:text-red-400",
    close: "text-red-400 hover:text-red-600",
    bar: "bg-red-400",
  },
  success: {
    wrapper:
      "border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/40",
    badge: "border-emerald-500 text-emerald-500",
    text: "text-emerald-700 dark:text-emerald-400",
    close: "text-emerald-400 hover:text-emerald-600",
    bar: "bg-emerald-400",
  },
  warning: {
    wrapper:
      "border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/40",
    badge: "border-amber-500 text-amber-500",
    text: "text-amber-700 dark:text-amber-400",
    close: "text-amber-400 hover:text-amber-600",
    bar: "bg-amber-400",
  },
  info: {
    wrapper:
      "border-indigo-200 bg-indigo-50 dark:border-indigo-900/50 dark:bg-indigo-950/40",
    badge: "border-indigo-500 text-indigo-500",
    text: "text-indigo-700 dark:text-indigo-400",
    close: "text-indigo-400 hover:text-indigo-600",
    bar: "bg-indigo-400",
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
.toast-enter-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-leave-active {
  transition: all 0.2s ease-in;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(-12px) scale(0.97);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.97);
}

.toast-move {
  transition: transform 0.25s ease;
}
</style>