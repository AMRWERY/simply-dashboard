/**
 * POST /api/profile/avatar — multipart form with an `image` file.
 * Uploads to the user's own folder, points their profile at it, then removes
 * the previous file. A failed profile update removes the new upload again.
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const db = await dbFor(event);

  const { file } = await readForm(event);
  if (!file) httpError(400, "image_required", "Image required");
  const image = checkImage(file);

  const bucket = db.storage.from(AVATARS);
  const path = `${user.sub}/avatar-${Date.now()}.${image.ext}`;

  const { error: uploadError } = await bucket.upload(path, file, {
    contentType: image.type,
    cacheControl: "31536000",
  });
  if (uploadError) storageError(uploadError);

  const avatarUrl = bucket.getPublicUrl(path).data.publicUrl;

  // Read the previous file from the database, not from the client, so the
  // right file is deleted even if another tab changed it.
  const { data: current } = await db
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.sub)
    .maybeSingle();

  const { data: updated, error: updateError } = await db
    .from("profiles")
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq("id", user.sub)
    .select("id");
  // An update matching no row (missing profile / RLS) gives no error.
  if (updateError || !updated?.length) {
    await bucket.remove([path]);
    if (updateError) dbError(updateError);
    httpError(404, "profile_not_found", "Profile not found");
  }

  const previous = current?.avatar_url?.split(`/${AVATARS}/`)[1];
  if (previous) await bucket.remove([previous]);
  return { avatarUrl };
});
