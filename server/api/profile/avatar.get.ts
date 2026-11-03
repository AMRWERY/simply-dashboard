/**
 * GET /api/profile/avatar — just the avatar URL. Runs on every page load (the
 * layout shows it in the sidebar), so it avoids the heavier account lookup in
 * /api/profile and only checks the session token locally.
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const db = await dbFor(event);

  const { data, error } = await db
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.sub)
    .maybeSingle();
  if (error) dbError(error);
  return { avatarUrl: data?.avatar_url ?? null };
});
