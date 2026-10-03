<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        @click.self="emit('close')"
      >
        <Transition name="scale">
          <div
            v-if="isOpen"
            role="dialog"
            aria-modal="true"
            :aria-labelledby="dialogTitleId"
            class="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 text-center shadow-2xl transition-all duration-200 dark:bg-[#1e1f2b] dark:text-white"
          >

            <!-- Danger Warning Icon -->
            <div
              class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 shadow-md shadow-red-500/10"
            >
              <LazyVIcon
                name="delete-icon"
                alt="delete"
                class="h-7 w-7 text-red-600 dark:text-red-400"
              />
            </div>

            <!-- Title -->
            <h3
              :id="dialogTitleId"
              class="mt-4 text-xl font-extrabold text-gray-900 dark:text-white"
            >
              {{ title }}
            </h3>

            <!-- Message / Item Name -->
            <div class="mt-2 text-sm text-gray-500 dark:text-gray-400">
              <slot>
                <p>
                  Are you sure you want to delete
                  <span
                    v-if="itemName"
                    class="font-bold text-gray-800 dark:text-gray-200"
                  >
                    "{{ itemName }}"</span
                  >?
                </p>
                <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  {{ description }}
                </p>
              </slot>
            </div>

            <!-- Action Buttons -->
            <div class="mt-6 grid grid-cols-2 gap-3">
              <LazyVButton
                variant="secondary"
                size="md"
                :disabled="isLoading"
                @click="emit('close')"
              >
                {{ cancelLabel }}
              </LazyVButton>
              <LazyVButton
                variant="danger"
                size="md"
                :loading="isLoading"
                @click="emit('confirm')"
              >
                {{ confirmLabel }}
              </LazyVButton>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts" setup>
const props = withDefaults(
  defineProps<{
    isOpen: boolean;
    title?: string;
    itemName?: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isLoading?: boolean;
  }>(),
  {
    title: "Delete Customer",
    itemName: undefined,
    description:
      "This action cannot be undone and will permanently remove this record.",
    confirmLabel: "Delete",
    cancelLabel: "Cancel",
    isLoading: false,
  }
);

const emit = defineEmits<{
  (e: "close"): void;
  (e: "confirm"): void;
}>();

const dialogTitleId = `v-del-title-${Math.random().toString(36).slice(2, 7)}`;
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.scale-enter-active,
.scale-leave-active {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.scale-enter-from,
.scale-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(4px);
}
</style>