import type { Database } from "~/types/database.types";
import type { Customer, CustomerInput } from "~/types/home";

export const useCustomerStore = defineStore("customers", () => {
  const supabase = useSupabaseClient<Database>();
  const items = ref<Customer[]>([]);

  function toPayload(input: CustomerInput) {
    return {
      name: input.name.trim(),
      phone: input.phone.trim(),
      email: input.email?.trim() || null,
      city: input.city?.trim() || null,
      status: input.status ?? "new",
    };
  }

  async function fetchAll() {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    items.value = data.map(toCustomer);
  }

  async function create(input: CustomerInput) {
    const { data, error } = await supabase
      .from("customers")
      .insert(toPayload(input))
      .select()
      .single();
    if (error) throw error;
    items.value.unshift(toCustomer(data));
  }

  async function update(id: string, input: CustomerInput) {
    // .single() errors when no row matched (missing or not owned).
    const { data, error } = await supabase
      .from("customers")
      .update({ ...toPayload(input), updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    const idx = items.value.findIndex((c) => c.id === id);
    if (idx !== -1) items.value[idx] = toCustomer(data);
  }

  async function remove(id: string) {
    const { data, error } = await supabase
      .from("customers")
      .delete()
      .eq("id", id)
      .select("id");
    if (error) throw error;
    if (!data.length) throw new Error("customer-not-found");
    items.value = items.value.filter((c) => c.id !== id);
  }

  return { items, fetchAll, create, update, remove };
});
