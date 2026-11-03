/**
 * POST /api/auth/login — { email, password }.
 * Signs in on the server; the module writes the session cookies onto this
 * response. Returns the token claims so the client can show the user
 * immediately without calling Supabase itself.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: unknown; password?: unknown }>(event);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || email.length > 254 || !password || password.length > 72) {
    httpError(400, "invalid_credentials", "Invalid credentials");
  }

  const client = await dbFor(event);
  const { data, error } = await client.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    // A fetch failure is not a wrong password: say so, so the UI can too.
    if (error?.name === "AuthRetryableFetchError") {
      httpError(502, "upstream_unreachable", "Auth service unreachable");
    }
    httpError(401, "invalid_credentials", "Invalid credentials");
  }
  return { claims: jwtClaims(data.session.access_token) };
});
