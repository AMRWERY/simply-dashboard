/**
 * POST /api/auth/password — { currentPassword, newPassword }.
 * Re-checks the current password first (a hijacked open session alone must not
 * be enough to take over the account), changes it, then ends the session so
 * the user signs in again with the new one.
 */
export default defineEventHandler(async (event) => {
  const claims = await requireUser(event);
  const email = typeof claims.email === "string" ? claims.email : "";

  const body = await readBody<{ currentPassword?: unknown; newPassword?: unknown }>(event);
  const current = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const next = typeof body?.newPassword === "string" ? body.newPassword : "";

  if (!email || !current) httpError(400, "current_password_required");
  if (next.length < 8 || next.length > 72) httpError(400, "invalid_new_password");
  if (next === current) httpError(400, "same_password");

  const client = await dbFor(event);

  const { error: verifyError } = await client.auth.signInWithPassword({
    email,
    password: current,
  });
  if (verifyError) {
    if (verifyError.name === "AuthRetryableFetchError") {
      httpError(502, "upstream_unreachable", "Auth service unreachable");
    }
    httpError(400, "current_password_incorrect");
  }

  const { error } = await client.auth.updateUser({ password: next });
  if (error) {
    console.error("[api] password update failed", error);
    httpError(400, "password_update_failed");
  }

  try {
    await client.auth.signOut({ scope: "local" });
  } catch (e) {
    console.error("[api] sign-out after password change failed", e);
  }
  clearSessionCookies(event);
  return { ok: true };
});
