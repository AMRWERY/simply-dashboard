<template>
  <section
    class="fade-up relative flex flex-col justify-between gap-6 overflow-hidden rounded-3xl border border-indigo-100 bg-linear-to-br from-indigo-50 via-white to-amber-50 p-6 text-indigo-950 shadow-xl shadow-indigo-200/50 sm:flex-row dark:border-transparent dark:bg-[#151733] dark:bg-none dark:text-white dark:shadow-indigo-950/20 sm:items-center sm:p-8"
  >
    <!-- Background decorative glow -->
    <div
      class="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl"
    />
    <div
      class="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl"
    />

    <div class="relative flex items-center gap-5">
      <div
        class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-950/40"
      >
        <LazyVIcon
          key="add"
          name="persons-icon"
          alt="add"
          class="h-8 w-8 shrink-0 text-white"
        />
      </div>
      <div>
        <div class="flex flex-wrap items-center gap-3">
          <h1 class="text-2xl font-extrabold tracking-tight">Customers</h1>
          <span
            class="rounded-full bg-amber-400/90 px-3 py-0.5 text-xs font-bold text-amber-950"
          >
            {{ totalCustomers }} Customers
          </span>
        </div>
        <p class="mt-1 text-sm text-indigo-900/70 dark:text-indigo-200/80">
          Manage accounts and active communication across your organization
        </p>
      </div>
    </div>

    <div class="relative flex flex-wrap items-center gap-3">
      <!-- Add Customer button -->
      <LazyVButton icon="plus-icon" @click="emit('add')">
        Add Customer
      </LazyVButton>
    </div>
  </section>
</template>

<script lang="ts" setup>
defineProps<{
  totalCustomers: number;
}>();

const emit = defineEmits<{
  (e: "add"): void;
}>();
</script>