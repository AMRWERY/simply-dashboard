/**
 * Make Arabic the default language for first-time visitors, whatever their
 * browser's Accept-Language is.
 *
 * @nuxtjs/i18n redirects the bare root ("/") using its cookie first and the
 * browser's Accept-Language second, so an English browser with no cookie ends
 * up on "/en". For a visitor with no language cookie yet, redirect "/" to "/ar"
 * ourselves and set the cookie. Visitors who already have the cookie (set by
 * this middleware or by the language toggle) are left to the module, so a
 * saved choice is still honoured, and explicit "/en/..." links are untouched.
 */
const COOKIE = "i18n_redirected";

export default defineEventHandler((event) => {
  const url = getRequestURL(event);
  if (url.pathname !== "/") return;

  const cookies = event.node.req.headers.cookie || "";
  if (new RegExp(`(?:^|;\s*)${COOKIE}=`).test(cookies)) return;

  setCookie(event, COOKIE, "ar", {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  });
  return sendRedirect(event, `/ar${url.search}`, 302);
});
