/** DELETE /api/customers/:id — removes the customer and its photo. */
export default defineEventHandler(async (event) => {
  await requireUser(event);
  const id = routeId(event);
  const db = await dbFor(event);

  const { data: existing, error: findError } = await db
    .from("customers")
    .select("image_url")
    .eq("id", id)
    .single();
  if (findError) dbError(findError);

  const { data, error } = await db
    .from("customers")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) dbError(error);
  if (!data.length) httpError(404, "not_found", "Not found");

  const path = existing.image_url?.split(`/${CUSTOMER_IMAGES}/`)[1];
  if (path) await db.storage.from(CUSTOMER_IMAGES).remove([path]);
  return { ok: true };
});
