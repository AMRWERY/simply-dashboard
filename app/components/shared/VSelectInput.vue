<template>
  <div ref="containerRef" class="relative flex flex-col gap-1.5">
    <!-- Label row -->
    <div
      v-if="label || $slots['label-end']"
      class="flex items-center justify-between"
    >
      <label
        v-if="label"
        :for="selectId"
        class="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300"
      >
        {{ label }}
        <slot name="label-icon" />
      </label>

      <slot name="label-end" />
    </div>

    <!-- Select trigger button -->
    <div class="relative">
      <LazyVButton
        :id="selectId"
        variant="ghost"
        :disabled="disabled"
        :aria-haspopup="'listbox'"
        :aria-expanded="isOpen"
        block
        @click="toggleDropdown"
        @keydown.esc="closeDropdown"
        class="!justify-between !font-normal !rounded-2xl border !px-4 text-start transition outline-none active:!scale-100"
        :class="[
          compact ? '!py-2.5 !text-xs' : '!py-3.5 !text-sm',
          disabled
            ? 'cursor-not-allowed opacity-50 bg-gray-100 dark:bg-gray-800'
            : 'cursor-pointer bg-indigo-50/60 dark:bg-white/5',
          errorMessage
            ? '!border-red-400 focus:!border-red-400 focus:ring-4 focus:ring-red-100 dark:focus:ring-red-500/20'
            : isOpen
            ? '!border-indigo-500 ring-4 ring-indigo-100 dark:!border-indigo-400 dark:ring-indigo-500/20'
            : '!border-transparent hover:!border-gray-300 focus:!border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:!border-gray-700/60 dark:hover:!border-gray-600 dark:focus:!border-indigo-400 dark:focus:ring-indigo-500/20',
        ]"
      >
        <!-- Selected value display -->
        <div class="flex items-center gap-2 truncate">
          <!-- Optional badge / pill if present -->
          <span
            v-if="selectedOption?.badgeClass"
            :class="[
              'inline-block h-2.5 w-2.5 rounded-full shrink-0',
              selectedOption.badgeClass,
            ]"
          />

          <!-- Label -->
          <span
            :class="[
              'truncate',
              selectedOption
                ? 'font-medium text-gray-900 dark:text-white'
                : 'text-gray-400 dark:text-gray-500',
            ]"
          >
            {{ selectedOption ? selectedOption.label : placeholder }}
          </span>
        </div>

        <!-- Chevron Icon -->
        <template #trailing-icon>
          <span
            class="pointer-events-none ms-2 flex items-center text-gray-400 transition-transform duration-200 dark:text-gray-400"
            :class="{ 'rotate-180 text-indigo-600 dark:text-indigo-400': isOpen }"
          >
            <svg
              class="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </span>
        </template>
      </LazyVButton>

      <!-- Dropdown Menu -->
      <Transition :name="openUpward ? 'dropdown-up' : 'dropdown'">
        <ul
          v-if="isOpen"
          role="listbox"
          :aria-activedescendant="
            selectedOption
              ? `${selectId}-opt-${selectedOption.value}`
              : undefined
          "
          class="absolute z-50 max-h-60 w-full overflow-y-auto rounded-2xl border border-gray-100 bg-white p-1.5 shadow-2xl shadow-indigo-950/15 backdrop-blur-xl dark:border-gray-800 dark:bg-[#1e1f2b]"
          :class="openUpward ? 'bottom-full mb-2' : 'top-full mt-2'"
        >
          <li
            v-for="opt in normalizedOptions"
            :key="opt.value"
            :id="`${selectId}-opt-${opt.value}`"
            role="option"
            :aria-selected="currentValue === opt.value"
            :class="[
              'flex cursor-pointer items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition duration-150',
              opt.disabled
                ? 'cursor-not-allowed opacity-40'
                : currentValue === opt.value
                ? 'bg-indigo-50 font-bold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800/80 dark:hover:text-white',
            ]"
            @click="selectOption(opt)"
          >
            <div class="flex items-center gap-2.5 truncate">
              <!-- Optional badge indicator -->
              <span
                v-if="opt.badgeClass"
                :class="[
                  'inline-block h-2.5 w-2.5 rounded-full shrink-0',
                  opt.badgeClass,
                ]"
              />
              <span class="truncate">{{ opt.label }}</span>
            </div>

            <!-- Checkmark for selected item -->
            <svg
              v-if="currentValue === opt.value"
              class="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </li>
        </ul>
      </Transition>
    </div>

    <!-- Error message -->
    <Transition name="field-error">
      <p
        v-if="errorMessage"
        role="alert"
        class="flex items-center gap-1.5 text-xs font-semibold text-red-500 dark:text-red-400"
      >
        {{ errorMessage }}
      </p>
    </Transition>

    <!-- Hint text -->
    <p
      v-if="hint && !errorMessage"
      class="text-xs text-gray-400 dark:text-gray-500"
    >
      {{ hint }}
    </p>
  </div>
</template>

<script lang="ts" setup>
import type { SelectOption } from "~/types/shared/VSelectInput";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | null;
    name?: string;
    label?: string;
    placeholder?: string;
    options: (string | number | SelectOption)[];
    disabled?: boolean;
    hint?: string;
    rules?:
      | string
      | ((v: unknown) => boolean | string)
      | Record<string, unknown>;
    /** Compact height variant */
    compact?: boolean;
  }>(),
  {
    modelValue: null,
    name: undefined,
    label: undefined,
    placeholder: "Select option",
    disabled: false,
    hint: undefined,
    rules: undefined,
    compact: false,
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string | number): void;
  (e: "change", value: string | number): void;
}>();

const containerRef = ref<HTMLElement | null>(null);
const isOpen = ref(false);

const selectId = computed(() =>
  props.name
    ? `v-select-${props.name}`
    : `v-select-${Math.random().toString(36).slice(2, 7)}`
);

// Normalize options to SelectOption[]
const normalizedOptions = computed<SelectOption[]>(() => {
  return props.options.map((opt) => {
    if (typeof opt === "object" && opt !== null) {
      return opt as SelectOption;
    }
    return {
      label: String(opt),
      value: opt,
    };
  });
});

// Vee-validate integration if `name` is provided
const veeField = props.name
  ? useField<string | number>(() => props.name!, props.rules, {
      syncVModel: true,
    })
  : null;

const currentValue = computed(() => {
  if (veeField) {
    return veeField.value.value ?? props.modelValue;
  }
  return props.modelValue;
});

const errorMessage = computed(() => {
  return veeField?.errorMessage.value;
});

const selectedOption = computed(() => {
  return normalizedOptions.value.find(
    (opt) => opt.value === currentValue.value
  );
});

const openUpward = ref(false);

const toggleDropdown = () => {
  if (props.disabled) return;
  if (!isOpen.value && containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    openUpward.value = spaceBelow < 180 && rect.top > spaceBelow;
  }
  isOpen.value = !isOpen.value;
};

const closeDropdown = () => {
  isOpen.value = false;
};

const selectOption = (opt: SelectOption) => {
  if (opt.disabled) return;

  if (veeField) {
    veeField.setValue(opt.value);
  }
  emit("update:modelValue", opt.value);
  emit("change", opt.value);
  closeDropdown();
};

// Close dropdown when clicked outside
onClickOutside(containerRef, () => {
  closeDropdown();
});
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}

.dropdown-up-enter-active,
.dropdown-up-leave-active {
  transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}

.dropdown-up-enter-from,
.dropdown-up-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.98);
}

.field-error-enter-active,
.field-error-leave-active {
  transition: all 0.2s ease;
}

.field-error-enter-from,
.field-error-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>