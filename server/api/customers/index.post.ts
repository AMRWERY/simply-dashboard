import { randomUUID } from "node:crypto";

/**
 * POST /api/customers — multipart form: the customer fields plus an optional
 * `image` file. The photo is uploaded first, and removed again if the row
 * can't be saved, so no orphan files are left behind.
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const db = await dbFor(event);

  const { fields, file } = await readForm(event);
  const payload = parseCustomer(fields);
  const image = file ? checkImage(file) : null;

  let uploadedPath: string | null = null;
  let imageUrl: string | null = null;
  if (file && image) {
    uploadedPath = `${user.sub}/${randomUUID()}.${image.ext}`;
    const { error } = await db.storage
      .from(CUSTOMER_IMAGES)
      .upload(uploadedPath, file, {
        contentType: image.type,
        cacheControl: "31536000",
      });
    if (error) storageError(error);
    imageUrl = db.storage.from(CUSTOMER_IMAGES).getPublicUrl(uploadedPath).data
      .publicUrl;
  }

  const { data, error } = await db
    .from("customers")
    .insert({ ...payload, image_url: imageUrl })
    .select()
    .single();
  if (error) {
    if (uploadedPath) await db.storage.from(CUSTOMER_IMAGES).remove([uploadedPath]);
    dbError(error);
  }
  return data;
});
