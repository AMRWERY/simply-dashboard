import type { CustomerRow } from "~/utils/customer";
import type { Customer, CustomerInput } from "~/types/home";

/**
 * Customers state. The data lives behind our own server routes
 * (server/api/customers), which talk to Supabase; this store never does.
 * Writes are multipart so an optional photo travels with the fields.
 */
export const useCustomerStore = defineStore("customers", () => {
  const items = ref<Customer[]>([]);
  const api = useRequestFetch();

  const toFormData = (input: CustomerInput) => {
    const form = new FormData();
    form.append("name", input.name);
    form.append("phone", input.phone);
    form.append("email", input.email ?? "");
    form.append("city", input.city ?? "");
    form.append("status", input.status ?? "new");
    form.append("amountDue", String(input.amountDue ?? ""));
    form.append("amountPaid", String(input.amountPaid ?? 0));
    if (input.removeImage) form.append("removeImage", "true");
    if (input.imageFile) form.append("image", input.imageFile);
    return form;
  };

  const fetchAll = async () => {
    const rows = await api<CustomerRow[]>("/api/customers");
    items.value = rows.map(toCustomer);
  };

  const create = async (input: CustomerInput) => {
    const row = await api<CustomerRow>("/api/customers", {
      method: "POST",
      body: toFormData(input),
    });
    items.value.unshift(toCustomer(row));
  };

  const update = async (id: string, input: CustomerInput) => {
    const row = await api<CustomerRow>(`/api/customers/${id}`, {
      method: "PATCH",
      body: toFormData(input),
    });
    const idx = items.value.findIndex((c) => c.id === id);
    if (idx !== -1) items.value[idx] = toCustomer(row);
  };

  const remove = async (id: string) => {
    await api(`/api/customers/${id}`, { method: "DELETE" });
    items.value = items.value.filter((c) => c.id !== id);
  };

  /** Drop cached rows, e.g. on logout so the next user never sees them. */
  const reset = () => {
    items.value = [];
  };

  return { items, fetchAll, create, update, remove, reset };
});
