/**
 * Make Arabic the default language for first-time visitors, whatever their
 * browser language is. @nuxtjs/i18n looks at its cookie before the browser's
 * language, so seed the cookie with "ar" when it is missing. The language
 * toggle (setLocale) overwrites it, so a visitor's choice is remembered.
 */
export default defineNuxtPlugin({
  name: "i18n-default-locale",
  enforce: "pre",
  setup() {
    const cookie = useCookie<string | null>("i18n_redirected", {
      default: () => null,
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      path: "/",
    });
    if (!cookie.value) cookie.value = "ar";
  },
});
