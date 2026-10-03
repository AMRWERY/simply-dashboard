<template>
  <div class="space-y-6">
    <!-- Hero Banner -->
    <lazy-home-hero
      :total-customers="customers.length"
      @add="openCreateModal"
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
      :status-styles="statusStyles"
      @edit="openEditModal"
      @delete="promptDeleteCustomer"
      @reset="resetFilters"
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

const statusOptions: SelectOption[] = [
  { label: "Active", value: "active", badgeClass: "bg-emerald-500" },
  { label: "New", value: "new", badgeClass: "bg-amber-500" },
  { label: "Follow Up", value: "follow-up", badgeClass: "bg-orange-500" },
];

const customerStore = useCustomerStore();
const { add: addToast } = useToast();
const customers = computed(() => customerStore.items);
const isLoading = ref(true);

onMounted(async () => {
  try {
    await customerStore.fetchAll();
  } catch {
    addToast({ type: "error", message: "Could not load customers, try again" });
  } finally {
    isLoading.value = false;
  }
});

const searchQuery = ref("");
const activeFilter = ref("All");

const statusStyles: Record<Status, { label: string; class: string }> = {
  active: {
    label: "Active",
    class:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
  },
  new: {
    label: "New",
    class:
      "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
  },
  "follow-up": {
    label: "Follow Up",
    class:
      "bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300",
  },
};

const computedFilters = computed<Filter[]>(() => {
  const activeCount = customers.value.filter(
    (c) => c.status === "active"
  ).length;
  const newCount = customers.value.filter((c) => c.status === "new").length;
  const followUpCount = customers.value.filter(
    (c) => c.status === "follow-up"
  ).length;

  return [
    { label: "All", count: customers.value.length },
    { label: "Active", count: activeCount },
    { label: "New", count: newCount },
    { label: "Follow Up", count: followUpCount },
  ];
});

const visibleCustomers = computed(() => {
  let list = customers.value;

  if (activeFilter.value === "Active") {
    list = list.filter((c) => c.status === "active");
  } else if (activeFilter.value === "New") {
    list = list.filter((c) => c.status === "new");
  } else if (activeFilter.value === "Follow Up") {
    list = list.filter((c) => c.status === "follow-up");
  }

  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return list;

  return list.filter(
    (c) =>
      c.name.toLowerCase().includes(query) ||
      (c.email ?? "").toLowerCase().includes(query) ||
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
  activeFilter.value = "All";
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
      message: `Customer "${target.name}" deleted successfully`,
    });
  } catch {
    addToast({
      type: "error",
      message: "Could not delete the customer, try again",
    });
  } finally {
    isDeleting.value = false;
    isDeleteDialogOpen.value = false;
    customerToDelete.value = null;
  }
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
      addToast({ type: "success", message: "Customer updated successfully" });
    } else {
      await customerStore.create(data);
      addToast({ type: "success", message: "Customer added successfully" });
    }
    closeModal();
  } catch {
    // Keep the modal open so the user's input isn't lost.
    addToast({
      type: "error",
      message: "Could not save the customer, try again",
    });
  } finally {
    isSaving.value = false;
  }
};

definePageMeta({
  layout: "dashboard",
  middleware: "auth",
});
</script>