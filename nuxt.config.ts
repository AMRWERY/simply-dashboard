// https://nuxt.com/docs/api/configuration/nuxt-config

import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: [
    "@pinia/nuxt",
    "@vee-validate/nuxt",
    "@nuxtjs/i18n",
    "@vueuse/nuxt",
    "@nuxtjs/supabase",
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  veeValidate: {
    autoImports: true,
  },
  i18n: {
    locales: [
      { code: "en", iso: "en-US", file: "en.json", name: "English" },
      {
        code: "ar",
        iso: "ar-EG",
        file: "ar.json",
        name: "العربية",
        dir: "rtl",
      },
    ],
    restructureDir: "app/config/i18n",
    langDir: "locales",
    defaultLocale: "ar",
    strategy: "prefix",
    lazy: true,
    // The cookie is seeded with "ar" by plugins/i18n-default-locale.ts so the
    // browser's language never overrides the Arabic default; the toggle's
    // choice is stored in the same cookie and used when opening "/".
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: "i18n_redirected",
      fallbackLocale: "ar",
      redirectOn: "root",
    },
  },
  supabase: {
    // Public values (the browser needs them; data is protected by RLS).
    // Env vars win when set, e.g. SUPABASE_URL / SUPABASE_KEY on the host.
    // NEVER put the secret/service-role key here.
    url: process.env.SUPABASE_URL || "https://udywdtvvwuoelvrjsozs.supabase.co",
    key: process.env.SUPABASE_KEY || "sb_publishable_t8KFc2r_xdCEMBrN0OxJoQ_xgskcikO",
    redirect: false,
    cookieOptions: {
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      secure: !import.meta.dev,
    },
  },
  css: ["~/assets/css/main.css"],
  components: [
    {
      path: "components",
      // path: resolve(layerDir, "components"),
      pathPrefix: false,
    },
  ],
  app: {
    head: {
      title: "Simply",
      script: [
        {
          // Apply the saved/system theme before first paint to avoid a light→dark flash
          innerHTML: `(function(){try{var t=localStorage.getItem("theme");var d=t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`,
          tagPosition: "head",
          tagPriority: "critical",
        },
      ],
      noscript: [],
      link: [{}],
      meta: [
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1",
        },
        {
          charset: "utf-8",
        },
      ],
    },
    pageTransition: { name: "page", mode: "out-in" },
    layoutTransition: { name: "layout", mode: "out-in" },
  },
});
