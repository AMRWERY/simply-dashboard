<template>
  <div class="space-y-6">
    <!-- Hero Banner -->
    <lazy-home-hero
      :total-customers="customers.length"
      @add="openCreateModal"
    />

    <!-- Earnings summary (all customers, not affected by filters) -->
    <lazy-home-earnings
      v-if="!isLoading"
      :customers="customers"
      :payments="payments"
    />

    <!-- Toolbar: Search & Filters -->
    <lazy-home-toolbar
      v-model:search-query="searchQuery"
      v-model:active-filter="activeFilter"
      :filters="computedFilters"
    />

    <!-- Customer Cards Grid & Empty State -->
    <home-customer-skeleton v-if="isLoading" />
    
    <lazy-home-customer-list
      v-else
      :customers="paginatedCustomers"
      :total-customers="customers.length"
      :status-styles="statusStyles"
      @view="openDetails"
      @edit="openEditModal"
      @delete="promptDeleteCustomer"
      @schedule="toggleSchedule"
      @reset="resetFilters"
    />

    <!-- Customer Details Dialog -->
    <lazy-home-customer-details
      :is-open="isDetailsOpen"
      :customer="detailsCustomer"
      :status-styles="statusStyles"
      @close="closeDetails"
      @edit="editFromDetails"
    />

    <!-- Pagination: only when results exceed one page -->
    <LazyVPagination
      v-if="visibleCustomers.length > PAGE_SIZE"
      v-model="currentPage"
      :total="visibleCustomers.length"
      :page-size="PAGE_SIZE"
    />

    <!-- Modal Dialog (using VInput & VSelectInput) -->
    <lazy-home-customer-modal
      :is-open="isModalOpen"
      :saving="isSaving"
      :editing-customer="selectedCustomer"
      :status-options="statusOptions"
      @close="closeModal"
      @save="handleSaveCustomer"
    />

    <!-- Delete Confirmation Dialog -->
    <LazyVDeleteDialog
      :is-open="isDeleteDialogOpen"
      :item-name="customerToDelete?.name"
      :is-loading="isDeleting"
      @close="closeDeleteDialog"
      @confirm="confirmDeleteCustomer"
    />
  </div>
</template>

<script lang="ts" setup>
import type {
  Status,
  Customer,
  CustomerInput,
  Filter,
} from "~/types/home";
import type { SelectOption } from "~/types/shared/VSelectInput";

const { t } = useI18n();

const statusOptions = computed<SelectOption[]>(() => [
  { label: t("active"), value: "active", badgeClass: "bg-emerald-500" },
  { label: t("new"), value: "new", badgeClass: "bg-amber-500" },
  { label: t("follow_up"), value: "follow-up", badgeClass: "bg-orange-500" },
]);

const customerStore = useCustomerStore();
const { add: addToast } = useToast();

// A request that never completes (offline, blocked by an extension) gets its
// own, longer message instead of the generic "could not save".
const failureToast = (e: unknown, fallbackKey: string) =>
  isNetworkError(e)
    ? { type: "error" as const, message: t("network_error"), duration: 9000 }
    : { type: "error" as const, message: t(fallbackKey) };
const customers = computed(() => customerStore.items);
const isLoading = ref(true);

const paymentStore = usePaymentStore();
const payments = computed(() => paymentStore.items);
// Payments are recorded by the database when a customer's paid amount changes,
// so reload them after anything that can change it. A failure here only leaves
// the earnings tile stale; it must never break the customer list.
const refreshPayments = () =>
  paymentStore.fetchAll().catch((e) => console.error("[payments] load failed", e));

onMounted(async () => {
  const loadingPayments = refreshPayments();
  try {
    await customerStore.fetchAll();
  } catch (e) {
    console.error("[customers] load failed", e);
    addToast(failureToast(e, "customers_load_failed"));
  } finally {
    isLoading.value = false;
  }
  await loadingPayments;
});

const searchQuery = ref("");
const activeFilter = ref("all");

const statusStyles = computed<Record<Status, { label: string; class: string }>>(
  () => ({
    active: {
      label: t("active"),
      class:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
    },
    new: {
      label: t("new"),
      class:
        "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
    },
    "follow-up": {
      label: t("follow_up"),
      class:
        "bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300",
    },
  }),
);

const computedFilters = computed<Filter[]>(() => {
  const activeCount = customers.value.filter(
    (c) => c.status === "active"
  ).length;
  const newCount = customers.value.filter((c) => c.status === "new").length;
  const followUpCount = customers.value.filter(
    (c) => c.status === "follow-up"
  ).length;

  return [
    { key: "all", label: t("all"), count: customers.value.length },
    { key: "active", label: t("active"), count: activeCount },
    { key: "new", label: t("new"), count: newCount },
    { key: "follow-up", label: t("follow_up"), count: followUpCount },
  ];
});

const visibleCustomers = computed(() => {
  let list = customers.value;

  if (activeFilter.value !== "all") {
    list = list.filter((c) => c.status === activeFilter.value);
  }

  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return list;

  return list.filter(
    (c) =>
      c.name.toLowerCase().includes(query) ||
      (c.link ?? "").toLowerCase().includes(query) ||
      (c.city ?? "").toLowerCase().includes(query) ||
      c.phone.replace(/\s/g, "").includes(query.replace(/\s/g, ""))
  );
});

const PAGE_SIZE = 8;
const currentPage = ref(1);

const paginatedCustomers = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE;
  return visibleCustomers.value.slice(start, start + PAGE_SIZE);
});

// Back to page 1 when the result set changes via search/filter
watch([searchQuery, activeFilter], () => {
  currentPage.value = 1;
});

// Clamp when items are removed (e.g. deleting the last card on the last page)
watch(
  () => visibleCustomers.value.length,
  (len) => {
    const maxPage = Math.max(1, Math.ceil(len / PAGE_SIZE));
    if (currentPage.value > maxPage) currentPage.value = maxPage;
  }
);

const resetFilters = () => {
  searchQuery.value = "";
  activeFilter.value = "all";
};

// Delete Dialog State & Handlers
const isDeleteDialogOpen = ref(false);
const customerToDelete = ref<Customer | null>(null);
const isDeleting = ref(false);

// Ignore dismiss attempts while a delete is in flight so the dialog and
// its target can't change under the pending request.
const closeDeleteDialog = () => {
  if (!isDeleting.value) isDeleteDialogOpen.value = false;
};

const promptDeleteCustomer = (id: string) => {
  const target = customers.value.find((c) => c.id === id);
  if (target) {
    customerToDelete.value = target;
    isDeleteDialogOpen.value = true;
  }
};

const confirmDeleteCustomer = async () => {
  const target = customerToDelete.value;
  if (!target || isDeleting.value) return;
  isDeleting.value = true;
  try {
    await customerStore.remove(target.id);
    addToast({
      type: "success",
      message: t("customer_deleted", { name: target.name }),
    });
    refreshPayments(); // their payments go with them
  } catch (e) {
    console.error("[customers] delete failed", e);
    addToast(failureToast(e, "customer_delete_failed"));
  } finally {
    isDeleting.value = false;
    isDeleteDialogOpen.value = false;
    customerToDelete.value = null;
  }
};

// Details Dialog State & Handlers
const isDetailsOpen = ref(false);
// Kept as an id and looked up in the store, so the open dialog reflects
// changes such as marking a date done (a stored object would go stale).
const detailsCustomerId = ref<string | null>(null);
const detailsCustomer = computed(
  () => customers.value.find((c) => c.id === detailsCustomerId.value) ?? null,
);

const openDetails = (customer: Customer) => {
  detailsCustomerId.value = customer.id;
  isDetailsOpen.value = true;
};

// Mark one scheduled date done (or undo it) from the card or the details dialog.
const toggleSchedule = async (
  customerId: string,
  scheduleId: string,
  done: boolean,
) => {
  try {
    await customerStore.setScheduleDone(customerId, scheduleId, done);
    if (done) addToast({ type: "success", message: t("schedule_marked_done") });
  } catch (e) {
    console.error("[customers] schedule update failed", e);
    addToast(failureToast(e, "schedule_update_failed"));
  }
};

const closeDetails = () => {
  isDetailsOpen.value = false;
};

const editFromDetails = (customer: Customer) => {
  closeDetails();
  openEditModal(customer);
};

// Modal & Form State
const isModalOpen = ref(false);
const selectedCustomer = ref<Customer | null>(null);

const openCreateModal = () => {
  selectedCustomer.value = null;
  isModalOpen.value = true;
};

const openEditModal = (customer: Customer) => {
  selectedCustomer.value = customer;
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  selectedCustomer.value = null;
};

const isSaving = ref(false);

const handleSaveCustomer = async (data: CustomerInput) => {
  isSaving.value = true;
  try {
    if (selectedCustomer.value) {
      await customerStore.update(selectedCustomer.value.id, data);
      addToast({ type: "success", message: t("customer_updated") });
    } else {
      await customerStore.create(data);
      addToast({ type: "success", message: t("customer_added") });
    }
    closeModal();
    refreshPayments(); // a changed paid amount is a new payment entry
  } catch (e) {
    // Keep the modal open so the user's input isn't lost.
    console.error("[customers] save failed", e);
    addToast(failureToast(e, "customer_save_failed"));
  } finally {
    isSaving.value = false;
  }
};

definePageMeta({
  layout: "dashboard",
  middleware: "auth",
});

useSeoPage({
  title: () => t("home_page"),
  description: () => t("customers_hero_description"),
  private: true,
});
</script>