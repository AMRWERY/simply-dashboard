/** The file's path inside a bucket, taken from its public URL (any ?query is ignored). */
export const storagePath = (
  url: string | null | undefined,
  bucket: string,
): string | null => {
  const rest = url?.split(`/${bucket}/`)[1];
  return rest ? decodeURIComponent(rest.split("?")[0]!) : null;
};

/**
 * Uploads a customer's photo to a fixed path, `<owner>/<customer>.<ext>`, with
 * upsert, so replacing the photo overwrites that same file instead of adding a
 * new one. The returned URL carries a version query so browsers and the CDN
 * never keep showing the old picture at the unchanged address.
 */
export const uploadCustomerImage = async (
  db: Db,
  ownerId: string,
  customerId: string,
  file: Buffer,
  image: { type: string; ext: string },
) => {
  const path = `${ownerId}/${customerId}.${image.ext}`;
  const { error } = await db.storage.from(CUSTOMER_IMAGES).upload(path, file, {
    contentType: image.type,
    cacheControl: "31536000",
    upsert: true,
  });
  if (error) storageError(error);

  const { publicUrl } = db.storage.from(CUSTOMER_IMAGES).getPublicUrl(path).data;
  return { path, url: `${publicUrl}?v=${Date.now()}` };
};

/**
 * Deletes files from a bucket. Never throws (the caller has usually already
 * changed the database), but logs and reports a failure instead of hiding it,
 * so a file that could not be removed is visible in the server log.
 */
export const removeFiles = async (
  db: Db,
  bucket: string,
  paths: string[],
): Promise<boolean> => {
  if (!paths.length) return true;
  const { data, error } = await db.storage.from(bucket).remove(paths);
  if (error || (data?.length ?? 0) < paths.length) {
    console.error("[api] could not remove stored file(s)", { bucket, paths, error });
    return false;
  }
  return true;
};
