/**
 * PATCH /api/customers/:id — multipart form like create; `schedules` is the
 * full list, so entries missing from it are deleted.
 *
 * Photo: a new `image` overwrites this customer's stored file in place (same
 * path), `removeImage=true` deletes it. A file left at a different path (an
 * older upload, or a changed extension such as .jpg -> .png) is removed once
 * the row has been saved, so the bucket never ends up with two copies.
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const id = routeId(event);
  const db = await dbFor(event);

  const { fields, file } = await readForm(event);
  const payload = parseCustomer(fields);
  // Absent field = leave the schedules alone (an empty list means delete all).
  const schedules =
    fields.schedules === undefined ? null : parseSchedules(fields.schedules);
  const image = file ? checkImage(file) : null;

  // Also proves the row exists and belongs to this user (row-level security).
  const { data: previous, error: findError } = await db
    .from("customers")
    .select("image_url")
    .eq("id", id)
    .single();
  if (findError) dbError(findError);
  const oldPath = storagePath(previous.image_url, CUSTOMER_IMAGES);

  let newPath: string | null = null;
  let imagePatch: { image_url?: string | null } = {};
  if (file && image) {
    const uploaded = await uploadCustomerImage(db, user.sub, id, file, image);
    newPath = uploaded.path;
    imagePatch = { image_url: uploaded.url };
  } else if (fields.removeImage === "true") {
    imagePatch = { image_url: null };
  }

  const { error } = await db
    .from("customers")
    .update({ ...payload, ...imagePatch, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    // A brand-new file at a new path is undone; an in-place overwrite is not.
    if (newPath && newPath !== oldPath) await removeFiles(db, CUSTOMER_IMAGES, [newPath]);
    dbError(error);
  }

  if (schedules) await syncSchedules(db, id, schedules);

  if ("image_url" in imagePatch && oldPath && oldPath !== newPath) {
    await removeFiles(db, CUSTOMER_IMAGES, [oldPath]);
  }
  return loadCustomer(db, id);
});
