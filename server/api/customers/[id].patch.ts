import { randomUUID } from "node:crypto";

const imagePath = (url: string | null | undefined) =>
  url?.split(`/${CUSTOMER_IMAGES}/`)[1];

/**
 * PATCH /api/customers/:id — multipart form like create. A new `image`
 * replaces the photo; `removeImage=true` clears it. The previous file is
 * deleted only after the row has been saved.
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const id = routeId(event);
  const db = await dbFor(event);

  const { fields, file } = await readForm(event);
  const payload = parseCustomer(fields);
  const image = file ? checkImage(file) : null;

  // Also proves the row exists and belongs to this user (row-level security).
  const { data: previous, error: findError } = await db
    .from("customers")
    .select("image_url")
    .eq("id", id)
    .single();
  if (findError) dbError(findError);

  let uploadedPath: string | null = null;
  let imagePatch: { image_url?: string | null } = {};
  if (file && image) {
    uploadedPath = `${user.sub}/${randomUUID()}.${image.ext}`;
    const { error } = await db.storage
      .from(CUSTOMER_IMAGES)
      .upload(uploadedPath, file, {
        contentType: image.type,
        cacheControl: "31536000",
      });
    if (error) storageError(error);
    imagePatch = {
      image_url: db.storage.from(CUSTOMER_IMAGES).getPublicUrl(uploadedPath).data
        .publicUrl,
    };
  } else if (fields.removeImage === "true") {
    imagePatch = { image_url: null };
  }

  const { data, error } = await db
    .from("customers")
    .update({ ...payload, ...imagePatch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) {
    if (uploadedPath) await db.storage.from(CUSTOMER_IMAGES).remove([uploadedPath]);
    dbError(error);
  }

  const old = "image_url" in imagePatch ? imagePath(previous.image_url) : null;
  if (old) await db.storage.from(CUSTOMER_IMAGES).remove([old]);
  return data;
});
