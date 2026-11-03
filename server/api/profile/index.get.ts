/** GET /api/profile — the signed-in user's account details and avatar. */
export default defineEventHandler(async (event) => {
  const db = await dbFor(event);

  const { data, error } = await db.auth.getUser();
  const user = data?.user;
  if (error || !user) httpError(401, "unauthorized", "Unauthorized");

  const { data: profile } = await db
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const email = user.email ?? "";
  const meta = (user.user_metadata ?? {}) as { name?: string };
  return {
    id: user.id,
    email,
    name: meta.name || email.split("@")[0] || "",
    avatarUrl: profile?.avatar_url ?? null,
    createdAt: user.created_at ?? null,
    lastSignInAt: user.last_sign_in_at ?? null,
    verified: !!user.email_confirmed_at,
    provider: String(user.app_metadata?.provider ?? "email"),
  };
});
