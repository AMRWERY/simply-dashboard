import type { Payment } from "~/types/home";
import type { PaymentRow } from "~/utils/earnings";

/**
 * The payment history behind the earnings numbers. Read-only here: entries are
 * written by a database trigger when a customer's paid amount changes, so after
 * saving or deleting a customer the page calls fetchAll() to pick them up.
 */
export const usePaymentStore = defineStore("payments", () => {
  const items = ref<Payment[]>([]);
  const api = useApi();

  const fetchAll = async () => {
    const rows = await api<PaymentRow[]>("/api/payments");
    items.value = rows.map(toPayment);
  };

  /** Drop cached rows, e.g. on logout so the next user never sees them. */
  const reset = () => {
    items.value = [];
  };

  return { items, fetchAll, reset };
});
