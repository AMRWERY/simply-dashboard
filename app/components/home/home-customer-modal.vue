<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        @click.self="emit('close')"
      >
        <div
          class="modal-panel relative flex max-h-[85vh] w-full max-w-md flex-col rounded-3xl bg-white p-5 shadow-2xl dark:bg-[#1e1f2b] dark:text-white sm:p-6"
        >
          <!-- Modal Header -->
          <div
            class="flex shrink-0 items-center justify-center border-b border-gray-100 pb-3 dark:border-gray-800"
          >
            <h2 class="text-base font-extrabold sm:text-lg">
              {{ editingCustomer ? "Update Customer" : "Add New Customer" }}
            </h2>
          </div>

          <!-- Form using VInput and VSelectInput (1 input per row, compact height) -->
          <Form
            @submit="handleSubmit"
            class="mt-3.5 flex min-h-0 flex-1 flex-col"
          >
            <!-- Scrollable fields -->
            <div
              class="-mx-1 min-h-0 flex-1 space-y-2.5 overflow-y-auto px-1 pb-1"
            >
              <!-- Customer Name -->
              <LazyVInput
                v-model="form.name"
                name="name"
                label="Customer Name"
                placeholder="e.g. Sultan Al-Ghamdi"
                rules="required"
                compact
              />

              <!-- Email -->
              <LazyVInput
                v-model="form.email"
                name="email"
                label="Email"
                type="email"
                placeholder="example@example.com"
                rules="email"
                dir="ltr"
                compact
              />

              <!-- Phone -->
              <LazyVInput
                v-model="form.phone"
                name="phone"
                label="Phone"
                type="tel"
                placeholder="+20 102 000 0000"
                rules="required"
                dir="ltr"
                compact
              />

              <!-- City -->
              <LazyVInput
                v-model="form.city"
                label="City"
                placeholder="Cairo, Alexandria, etc."
                compact
              />

              <!-- Amount due -->
              <LazyVInput
                v-model="form.amountDue"
                name="amountDue"
                label="Amount due (EGP)"
                type="number"
                placeholder="0"
                :rules="validateAmount"
                dir="ltr"
                compact
              />

              <!-- Amount paid so far -->
              <LazyVInput
                v-model="form.amountPaid"
                name="amountPaid"
                label="Amount paid so far (EGP)"
                type="number"
                placeholder="0"
                hint="The remaining amount is calculated automatically"
                :rules="validatePaid"
                dir="ltr"
                compact
              />

              <!-- Status -->
              <LazyVSelectInput
                v-model="form.status"
                label="Status"
                :options="statusOptions"
                compact
              />
            </div>

            <!-- Actions (always visible) -->
            <div class="mt-3 flex shrink-0 justify-end gap-2.5 pt-2">
              <LazyVButton variant="secondary" size="sm" @click="emit('close')">
                Cancel
              </LazyVButton>

              <LazyVButton
                type="submit"
                variant="primary"
                size="sm"
                :loading="saving"
              >
                {{ editingCustomer ? "Save Changes" : "Create Customer" }}
              </LazyVButton>
            </div>
          </Form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts" setup>
import type { Customer, CustomerInput, Status } from "~/types/home";
import type { SelectOption } from "~/types/shared/VSelectInput";

const props = defineProps<{
  isOpen: boolean;
  editingCustomer: Customer | null;
  statusOptions: SelectOption[];
  saving?: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "save", data: CustomerInput): void;
}>();

const emptyForm = () => ({
  name: "",
  email: "",
  phone: "",
  city: "",
  status: "new" as Status,
  // Kept as strings (what the inputs hold); converted to numbers on submit.
  amountDue: "",
  amountPaid: "",
});

const form = ref(emptyForm());

const toAmount = (v: unknown): number =>
  v === "" || v == null ? 0 : Number(v);

// Blank is allowed (means 0); otherwise a non-negative number.
const validateAmount = (v: unknown): boolean | string => {
  if (v === "" || v == null) return true;
  const n = Number(v);
  if (!Number.isFinite(n)) return "Enter a valid number";
  if (n < 0) return "Amount can't be negative";
  return true;
};

const validatePaid = (v: unknown): boolean | string => {
  const base = validateAmount(v);
  if (base !== true) return base;
  if (toAmount(v) > toAmount(form.value.amountDue)) {
    return "Paid amount can't be more than the amount due";
  }
  return true;
};

watch(
  () => props.editingCustomer,
  (customer) => {
    if (customer) {
      form.value = {
        name: customer.name,
        email: customer.email ?? "",
        phone: customer.phone,
        city: customer.city ?? "",
        status: customer.status,
        amountDue: customer.amountDue ? String(customer.amountDue) : "",
        amountPaid: customer.amountPaid ? String(customer.amountPaid) : "",
      };
    } else {
      form.value = emptyForm();
    }
  },
  { immediate: true },
);

watch(
  () => props.isOpen,
  (open) => {
    if (open && !props.editingCustomer) {
      form.value = emptyForm();
    }
  },
);

const handleSubmit = () => {
  const { amountDue, amountPaid, ...rest } = form.value;
  emit("save", {
    ...rest,
    amountDue: toAmount(amountDue),
    amountPaid: toAmount(amountPaid),
  });
};
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .modal-panel,
.modal-leave-active .modal-panel {
  transition:
    transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-panel,
.modal-leave-to .modal-panel {
  opacity: 0;
  transform: scale(0.95) translateY(8px);
}
</style>
