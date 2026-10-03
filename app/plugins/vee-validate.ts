import { defineNuxtPlugin } from "nuxt/app";
import { defineRule, configure } from "vee-validate";
import {
  required,
  min,
  max,
  alpha_spaces,
  regex,
  email,
  between,
  numeric,
  length,
  min_value,
  max_value,
  integer,
} from "@vee-validate/rules";
import { localize, setLocale } from "@vee-validate/i18n";
import en from "@vee-validate/i18n/dist/locale/en.json";
import ar from "@vee-validate/i18n/dist/locale/ar.json";

export default defineNuxtPlugin((nuxtApp) => {
  const i18n = nuxtApp.$i18n as any;
  // Define all rules
  defineRule("required", required);

  defineRule("email", email);

  defineRule("min", min);
  defineRule("max", max);
  defineRule("alpha_spaces", alpha_spaces);
  defineRule("regex", regex);
  defineRule("between", between);
  defineRule("numeric", numeric);
  defineRule("length", length);
  defineRule("min_value", min_value);
  defineRule("max_value", max_value);
  defineRule("integer", integer);

  defineRule("confirmed", (value: any, [target]: [any]) => {
    if (value === target) {
      return true;
    }
    // Access i18n through nuxtApp
    const locale = i18n.locale.value;
    return locale === "ar"
      ? "كلمات المرور غير متطابقة"
      : "Passwords must match";
  });

  defineRule("minLength", (value: any, [limit]: [number]) => {
    // The field is empty so it should pass
    if (!value || !value.length) {
      return true;
    }
    if (value.length < limit) {
      const locale = i18n.locale.value;
      return locale === "ar"
        ? `يجب أن يحتوي هذا الحقل على ${limit} حرفًا على الأقل`
        : `This field must be at least ${limit} characters`;
    }
    return true;
  });

  // Configure with localized messages
  configure({
    generateMessage: localize({
      en: {
        ...en,
        messages: {
          ...en.messages,
          required: "{field} is required",
        },
        names: {
          email: "Email",
          password: "Password",
        },
      },
      ar: {
        ...ar,
        messages: {
          ...ar.messages,
          required: "{field} مطلوب",
        },
        names: {
          email: "البريد الإلكتروني",
          password: "كلمة المرور",
        },
      },
    }),
    validateOnBlur: true,
    validateOnChange: false,
    validateOnInput: true,
    validateOnModelUpdate: true,
  });

  // Set initial locale and sync with i18n
  if (import.meta.client) {
    const localeStore = useLocaleStore();
    setLocale(localeStore.locale);

    // Watch for locale changes
    watch(
      () => i18n.locale.value,
      (newLocale) => {
        setLocale(newLocale);
      },
    );
  }
});
