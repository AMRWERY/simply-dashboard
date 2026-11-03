import { randomUUID } from "node:crypto";

/**
 * POST /api/customers — multipart form: the customer fields, a JSON `schedules`
 * list, and an optional `image` file. The customer's id is chosen here so the
 * photo can be stored at `<owner>/<id>.<ext>`; if the row can't be saved, the
 * photo is removed again so no orphan file is left behind.
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const db = await dbFor(event);

  const { fields, file } = await readForm(event);
  const payload = parseCustomer(fields);
  const schedules = parseSchedules(fields.schedules);
  const image = file ? checkImage(file) : null;

  const id = randomUUID();
  let uploadedPath: string | null = null;
  let imageUrl: string | null = null;
  if (file && image) {
    const uploaded = await uploadCustomerImage(db, user.sub, id, file, image);
    uploadedPath = uploaded.path;
    imageUrl = uploaded.url;
  }

  const { data, error } = await db
    .from("customers")
    .insert({ id, ...payload, image_url: imageUrl })
    .select()
    .single();
  if (error) {
    if (uploadedPath) await removeFiles(db, CUSTOMER_IMAGES, [uploadedPath]);
    dbError(error);
  }

  // Schedules live in their own table; if saving them fails, undo the customer
  // (and its photo) so a half-saved record is never left behind.
  try {
    await syncSchedules(db, data.id, schedules);
  } catch (e) {
    await db.from("customers").delete().eq("id", data.id);
    if (uploadedPath) await removeFiles(db, CUSTOMER_IMAGES, [uploadedPath]);
    throw e;
  }
  return loadCustomer(db, data.id);
});
