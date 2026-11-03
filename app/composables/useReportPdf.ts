import type { Customer } from "~/types/home";

/**
 * Builds and downloads the customer report PDF (see utils/reportPdf.ts).
 * jsPDF and the autotable plugin are loaded on demand, only when exporting.
 */
export const useReportPdf = () => {
  const { locale, t } = useI18n();
  const baseURL = useRuntimeConfig().app.baseURL;
  const isExporting = ref(false);

  const exportReport = async (customers: Customer[], filename: string) => {
    if (isExporting.value) return;
    isExporting.value = true;
    try {
      const doc = await buildReportPdf({
        customers,
        locale: locale.value,
        t: (key, named) => t(key, named ?? {}),
        baseURL,
      });
      doc.save(filename);
    } finally {
      isExporting.value = false;
    }
  };

  return { isExporting, exportReport };
};
