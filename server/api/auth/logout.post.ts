/** POST /api/auth/logout — ends this browser's session and clears its cookies. */
export default defineEventHandler(async (event) => {
  const client = await dbFor(event);
  try {
    // "local": end only this browser's session, not the user's other devices.
    await client.auth.signOut({ scope: "local" });
  } catch (e) {
    console.error("[api] sign-out failed", e);
  }
  // Always drop the cookies, even if the call above could not reach Supabase.
  clearSessionCookies(event);
  return { ok: true };
});
