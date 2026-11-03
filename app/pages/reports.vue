<template>
  <div class="space-y-6">
    <!-- Header banner -->
    <section
      class="fade-up relative flex flex-col justify-between gap-6 overflow-hidden rounded-3xl bg-[#151733] p-6 text-white shadow-xl shadow-indigo-950/20 sm:flex-row sm:items-center sm:p-8"
    >
      <div
        class="pointer-events-none absolute -top-20 -end-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl"
      />
      <div
        class="pointer-events-none absolute -bottom-20 -start-20 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl"
      />

      <div class="relative flex items-center gap-5">
        <div
          class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-950/40"
        >
          <svg
            class="h-7 w-7 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          >
            <path d="M3 3v18h18" />
            <path d="M8 17V9M13 17V5M18 17v-7" />
          </svg>
        </div>
        <div>
          <h1 class="text-2xl font-extrabold tracking-tight">
            {{ t("reports_analytics") }}
          </h1>
          <p class="mt-1 text-sm text-indigo-200/80">
            {{ t("reports_analytics_description") }}
          </p>
          <!-- Only shows on the exported PDF -->
          <p
            data-pdf-only
            class="mt-2 hidden text-xs font-semibold text-indigo-200/70 print:block"
          >
            {{ t("generated_on", { date: generatedOn }) }}
          </p>
        </div>
      </div>

      <LazyVButton
        class="relative print:hidden"
        :loading="isExporting"
        @click="exportPdf"
      >
        {{ isExporting ? t("exporting_pdf") : t("export_pdf") }}
      </LazyVButton>
    </section>

    <!-- 1. Money summary -->
    <reports-summary :customers="customers" />

    <!-- 2 + 3. Who owes you, and the status split -->
    <div class="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <reports-top-debtors :customers="customers" class="lg:col-span-2" />
      <reports-status-donut :customers="customers" />
    </div>

    <!-- 4 + 5. Growth and cities -->
    <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <reports-growth :customers="customers" />
      <reports-cities :customers="customers" />
    </div>
  </div>
</template>

<script lang="ts" setup>
const { locale, t } = useI18n();

const customerStore = useCustomerStore();
const customers = computed(() => customerStore.items);

// The store is empty when landing here directly; load it once.
onMounted(async () => {
  if (!customerStore.items.length) {
    try {
      await customerStore.fetchAll();
    } catch (e) {
      console.error("[reports] load failed", e);
    }
  }
});

const generatedOn = computed(() =>
  new Intl.DateTimeFormat(locale.value === "ar" ? "ar-EG-u-nu-latn" : "en-US", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date()),
);

const { isExporting, exportReport } = useReportPdf();
const { add: addToast } = useToast();

const exportPdf = async () => {
  const day = new Date().toISOString().slice(0, 10);
  try {
    await exportReport(customers.value, `customers-report-${day}.pdf`);
  } catch (e) {
    console.error("[reports] pdf export failed", e);
    addToast({ type: "error", message: t("report_export_failed") });
  }
};

definePageMeta({
  layout: "dashboard",
  middleware: "auth",
});

useSeoPage({
  title: () => t("reports_page"),
  description: () => t("reports_analytics_description"),
  private: true,
});
</script>
