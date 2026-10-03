/**
 * Make Arabic the default language for first-time visitors, whatever their
 * browser's Accept-Language is.
 *
 * @nuxtjs/i18n decides the root ("/") redirect on the server from its cookie
 * first and the Accept-Language header second. A visitor with no cookie would
 * therefore get "/en" from an English browser. This middleware runs before the
 * renderer and gives such visitors the "ar" cookie, so the module redirects to
 * "/ar". The language toggle (setLocale) overwrites the cookie, so a visitor's
 * own choice is remembered and still wins.
 */
const COOKIE = "i18n_redirected";

export default defineEventHandler((event) => {
  // Only page requests; skip assets and API-style paths.
  const path = event.path.split("?")[0] ?? "";
  if (path.startsWith("/_nuxt") || path.startsWith("/__nuxt") || path.startsWith("/api") || /\.[a-z0-9]+$/i.test(path)) {
    return;
  }
  if (getCookie(event, COOKIE)) return;

  setCookie(event, COOKIE, "ar", {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  });
  // The renderer reads cookies from the request, so make the new one visible.
  const existing = event.node.req.headers.cookie;
  event.node.req.headers.cookie = existing ? `${existing}; ${COOKIE}=ar` : `${COOKIE}=ar`;
});
