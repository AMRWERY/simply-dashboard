import type { H3Event } from "h3";
import { serverSupabaseClient, serverSupabaseUser } from "#supabase/server";
import type { Database } from "../../app/types/database.types";

export const CUSTOMER_IMAGES = "customer-images";
export const AVATARS = "avatars";

/**
 * Supabase client acting as the signed-in user (their JWT from the session
 * cookies), so row-level security and storage policies still apply.
 */
export const dbFor = (event: H3Event) =>
  serverSupabaseClient<Database>(event);

/** The signed-in user's claims, or a 401. */
export const requireUser = async (event: H3Event) => {
  let claims: Awaited<ReturnType<typeof serverSupabaseUser>> = null;
  try {
    claims = await serverSupabaseUser(event);
  } catch {
    claims = null;
  }
  if (!claims?.sub) httpError(401, "unauthorized", "Unauthorized");
  return claims;
};

/** Removes the Supabase session cookies even if the sign-out call failed. */
export const clearSessionCookies = (event: H3Event) => {
  const prefix = useRuntimeConfig(event).public.supabase.cookiePrefix as string;
  for (const name of Object.keys(parseCookies(event))) {
    if (name.startsWith(prefix)) deleteCookie(event, name, { path: "/" });
  }
};
