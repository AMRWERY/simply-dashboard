<template>
  <div class="flex flex-col gap-1.5">
    <!-- Label row: label is at logical START, slot content at logical END.
         flex + justify-between respects dir attribute automatically:
         LTR → label left, slot right | RTL → label right, slot left -->
    <div class="flex items-center justify-between">
      <label
        v-if="label"
        :for="inputId"
        class="flex items-center gap-1.5 text-sm font-bold text-gray-800 dark:text-gray-200"
      >
        {{ label }}
        <slot name="label-icon" />
      </label>

      <slot name="label-end" />
    </div>

    <!-- Input wrapper -->
    <div class="relative">
      <!-- Right-side icon (decorative) -->
      <span
        v-if="icon"
        class="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-400"
      >
        <VIcon :name="icon" class="h-5 w-5" />
      </span>

      <!-- Password toggle button -->
      <button
        v-if="isPassword"
        type="button"
        :aria-label="passwordVisible ? 'Hide password' : 'Show password'"
        class="absolute inset-y-0 right-4 flex items-center text-gray-400 transition hover:text-gray-600 dark:hover:text-gray-300"
        @click="passwordVisible = !passwordVisible"
      >
        <VIcon
          :name="passwordVisible ? 'eye-invisible-icon' : 'eye-open-icon'"
          class="h-5 w-5"
        />
      </button>

      <!-- Input element -->
      <input
        :id="inputId"
        v-bind="$attrs"
        v-model="inputValue"
        :type="resolvedType"
        :placeholder="placeholder"
        :name="fieldName"
        :aria-describedby="errorMessage ? `${inputId}-error` : undefined"
        :aria-invalid="!!errorMessage"
        class="w-full rounded-2xl border bg-indigo-50/60 pl-4 text-gray-800 placeholder-gray-400 outline-none transition dark:bg-white/5 dark:text-white"
        :class="[
          compact ? 'py-2.5 text-xs' : 'py-3.5 text-sm',
          hasRightSlot ? 'pr-12' : 'pr-4',
          errorMessage
            ? 'border-red-400 focus:border-red-400 focus:ring-4 focus:ring-red-100 dark:focus:ring-red-500/20'
            : 'border-transparent focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 dark:focus:bg-white/10 dark:focus:ring-indigo-500/20',
        ]"
        @blur="handleBlur"
        @change="handleChange"
      />
    </div>

    <!-- Error message -->
    <Transition name="field-error">
      <p
        v-if="errorMessage"
        :id="`${inputId}-error`"
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
defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    /** v-model binding */
    modelValue?: string | number | null;
    /** vee-validate field name */
    name?: string;
    /** Label text shown above the input */
    label?: string;
    /** HTML input type. 'password' automatically adds a visibility toggle */
    type?: string;
    /** Placeholder text */
    placeholder?: string;
    /** VIcon name displayed on the right side (decorative) */
    icon?: string;
    /** Helper text shown below the input when there is no error */
    hint?: string;
    /** Validation rules (vee-validate format) */
    rules?:
      | string
      | ((v: unknown) => boolean | string)
      | Record<string, unknown>;
    /** Compact height variant */
    compact?: boolean;
  }>(),
  {
    modelValue: undefined,
    name: undefined,
    label: undefined,
    type: "text",
    placeholder: undefined,
    icon: undefined,
    hint: undefined,
    rules: undefined,
    compact: false,
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "change", event: Event): void;
  (e: "blur", event: FocusEvent): void;
}>();

const randomId = Math.random().toString(36).slice(2, 7);
const fieldName = computed(() => props.name || `v-field-${randomId}`);
const inputId = computed(() => `v-input-${fieldName.value}`);

const isPassword = computed(() => props.type === "password");
const passwordVisible = ref(false);
const resolvedType = computed(() => {
  if (isPassword.value) return passwordVisible.value ? "text" : "password";
  return props.type;
});

// Whether something occupies the right side (determines pr-12 vs pr-4)
const hasRightSlot = computed(() => !!props.icon || isPassword.value);

// vee-validate field
const veeField = props.name
  ? useField<string>(() => props.name!, props.rules, {
      syncVModel: true,
    })
  : null;

const inputValue = computed({
  get() {
    if (veeField) return (veeField.value.value as string) ?? props.modelValue ?? "";
    return (props.modelValue as string) ?? "";
  },
  set(val: string) {
    if (veeField) veeField.setValue(val);
    emit("update:modelValue", val);
  },
});

const errorMessage = computed(() => veeField?.errorMessage.value);

const handleBlur = (e: FocusEvent) => {
  if (veeField) veeField.handleBlur(e);
  emit("blur", e);
};

const handleChange = (e: Event) => {
  if (veeField) veeField.handleChange(e);
  emit("change", e);
};
</script>

<style scoped>
.field-error-enter-active {
  transition: all 0.2s ease;
}

.field-error-leave-active {
  transition: all 0.15s ease;
}

.field-error-enter-from,
.field-error-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>