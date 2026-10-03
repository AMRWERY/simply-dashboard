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
      :editing-customer="selectedCustomer"
      :status-options="statusOptions"
      @close="closeModal"
      @save="handleSaveCustomer"
    />

    <!-- Delete Confirmation Dialog -->
    <LazyVDeleteDialog
      :is-open="isDeleteDialogOpen"
      :item-name="customerToDelete?.name"
      @close="isDeleteDialogOpen = false"
      @confirm="confirmDeleteCustomer"
    />
  </div>
</template>

<script lang="ts" setup>
import type { Status, Customer, Filter } from "~/types/home";
import type { SelectOption } from "~/types/shared/VSelectInput";

const statusOptions: SelectOption[] = [
  { label: "Active", value: "active", badgeClass: "bg-emerald-500" },
  { label: "New", value: "new", badgeClass: "bg-amber-500" },
  { label: "Follow Up", value: "follow-up", badgeClass: "bg-orange-500" },
];

// Stand-in for the API response; replace fetchCustomers with the real request
const seedCustomers: Customer[] = [
  {
    id: 1,
    name: "Sara Al-Mansoori",
    initials: "SA",
    status: "active",
    city: "Riyadh",
    phone: "+966 50 123 4567",
    email: "sara.almansoori@example.com",
    avatarClass:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
  },
  {
    id: 2,
    name: "Omar Al-Kindi",
    initials: "OK",
    status: "new",
    city: "Dubai",
    phone: "+971 52 987 6543",
    email: "omar.alkindi@example.com",
    avatarClass:
      "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
  },
  {
    id: 3,
    name: "Fatima Al-Sharif",
    initials: "FA",
    status: "active",
    city: "Jeddah",
    phone: "+966 55 432 1098",
    email: "fatima.alsharif@example.com",
    avatarClass:
      "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-400",
  },
  {
    id: 4,
    name: "Khaled Al-Otaibi",
    initials: "KO",
    status: "follow-up",
    city: "Kuwait City",
    phone: "+965 99 876 5432",
    email: "khaled.alotaibi@example.com",
    avatarClass:
      "bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400",
  },
  {
    id: 5,
    name: "Maryam Al-Hashemi",
    initials: "MA",
    status: "active",
    city: "Doha",
    phone: "+974 33 210 9876",
    email: "maryam.alhashemi@example.com",
    avatarClass:
      "bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-400",
  },
];

const customers = ref<Customer[]>([]);
const isLoading = ref(true);

const fetchCustomers = () =>
  new Promise<Customer[]>((resolve) =>
    setTimeout(() => resolve(seedCustomers), 1200)
  );

onMounted(async () => {
  try {
    customers.value = await fetchCustomers();
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
      c.email.toLowerCase().includes(query) ||
      c.city.toLowerCase().includes(query) ||
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

const promptDeleteCustomer = (id: number) => {
  const target = customers.value.find((c) => c.id === id);
  if (target) {
    customerToDelete.value = target;
    isDeleteDialogOpen.value = true;
  }
};

const confirmDeleteCustomer = () => {
  if (customerToDelete.value) {
    const name = customerToDelete.value.name;
    customers.value = customers.value.filter(
      (c) => c.id !== customerToDelete.value!.id
    );
    addToast({
      type: "success",
      message: `Customer "${name}" deleted successfully`,
    });
  }
  isDeleteDialogOpen.value = false;
  customerToDelete.value = null;
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

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const handleSaveCustomer = (data: {
  name: string;
  email: string;
  phone: string;
  city: string;
  status: Status;
}) => {
  if (selectedCustomer.value) {
    const idx = customers.value.findIndex(
      (c) => c.id === selectedCustomer.value!.id
    );
    if (idx !== -1) {
      customers.value[idx] = {
        ...customers.value[idx]!,
        ...data,
        initials: getInitials(data.name),
      };
      addToast({ type: "success", message: "Customer updated successfully" });
    }
  } else {
    const colors = [
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400",
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
      "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
      "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-400",
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)]!;

    customers.value.unshift({
      id: Date.now(),
      name: data.name,
      initials: getInitials(data.name),
      status: data.status,
      city: data.city,
      phone: data.phone,
      email: data.email,
      avatarClass: randomColor,
    });
    addToast({ type: "success", message: "Customer added successfully" });
  }

  closeModal();
};

definePageMeta({
  layout: "dashboard",
  middleware: "auth",
});
</script>