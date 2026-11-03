/**
 * DELETE /api/customers/:id — removes the customer (its schedules go with it)
 * and its photo from storage. `imageRemoved` is false if the file could not be
 * deleted; the reason is in the server log.
 */
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

  const path = storagePath(existing.image_url, CUSTOMER_IMAGES);
  const imageRemoved = path ? await removeFiles(db, CUSTOMER_IMAGES, [path]) : true;
  return { ok: true, imageRemoved };
});
