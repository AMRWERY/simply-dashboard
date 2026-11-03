import type { Database } from "~/types/database.types";
import type { Customer, CustomerInput } from "~/types/home";

const roundMoney = (n: number | undefined) => Math.round((n ?? 0) * 100) / 100;
const IMAGE_BUCKET = "customer-images";

export const useCustomerStore = defineStore("customers", () => {
  const supabase = useSupabaseClient<Database>();
  const supabaseUser = useSupabaseUser();
  const items = ref<Customer[]>([]);

  function toPayload(input: CustomerInput) {
    return {
      name: input.name.trim(),
      phone: input.phone.trim(),
      email: input.email?.trim() || null,
      city: input.city?.trim() || null,
      status: input.status ?? "new",
      amount_due: roundMoney(input.amountDue),
      amount_paid: roundMoney(input.amountPaid),
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

  const bucket = () => supabase.storage.from(IMAGE_BUCKET);

  /** Throws Error("invalid-type" | "too-large") for client-side rejections. */
  async function uploadImage(file: File) {
    const uid = supabaseUser.value?.sub;
    if (!uid) throw new Error("not-authenticated");
    const contentType = resolveImageType(file);
    const ext = CUSTOMER_IMAGE_TYPES[contentType];
    if (!ext) throw new Error("invalid-type");
    if (file.size > CUSTOMER_IMAGE_MAX_BYTES) throw new Error("too-large");

    // Unique name avoids stale caches when a photo is replaced.
    const path = `${uid}/${crypto.randomUUID()}.${ext}`;
    const { error } = await bucket().upload(path, file, {
      contentType,
      cacheControl: "31536000",
    });
    if (error) throw error;
    return { path, url: bucket().getPublicUrl(path).data.publicUrl };
  }

  const pathFromUrl = (url: string | null | undefined) =>
    url?.split(`/${IMAGE_BUCKET}/`)[1];

  async function create(input: CustomerInput) {
    const uploaded = input.imageFile ? await uploadImage(input.imageFile) : null;
    const { data, error } = await supabase
      .from("customers")
      .insert({ ...toPayload(input), image_url: uploaded?.url ?? null })
      .select()
      .single();
    if (error) {
      if (uploaded) await bucket().remove([uploaded.path]); // no orphan file
      throw error;
    }
    items.value.unshift(toCustomer(data));
  }

  async function update(id: string, input: CustomerInput) {
    const previous = items.value.find((c) => c.id === id)?.imageUrl ?? null;
    const uploaded = input.imageFile ? await uploadImage(input.imageFile) : null;
    const imagePatch = uploaded
      ? { image_url: uploaded.url }
      : input.removeImage
        ? { image_url: null }
        : {};

    // .single() errors when no row matched (missing or not owned).
    const { data, error } = await supabase
      .from("customers")
      .update({
        ...toPayload(input),
        ...imagePatch,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();
    if (error) {
      if (uploaded) await bucket().remove([uploaded.path]);
      throw error;
    }
    const idx = items.value.findIndex((c) => c.id === id);
    if (idx !== -1) items.value[idx] = toCustomer(data);

    const oldPath = "image_url" in imagePatch ? pathFromUrl(previous) : null;
    if (oldPath) await bucket().remove([oldPath]);
  }

  async function remove(id: string) {
    const imageUrl = items.value.find((c) => c.id === id)?.imageUrl;
    const { data, error } = await supabase
      .from("customers")
      .delete()
      .eq("id", id)
      .select("id");
    if (error) throw error;
    if (!data.length) throw new Error("customer-not-found");
    items.value = items.value.filter((c) => c.id !== id);
    const path = pathFromUrl(imageUrl);
    if (path) await bucket().remove([path]);
  }

  /** Drop cached rows, e.g. on logout so the next user never sees them. */
  function reset() {
    items.value = [];
  }

  return { items, fetchAll, create, update, remove, reset };
});
