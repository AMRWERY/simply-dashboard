/**
 * Phone numbers: exactly 11 digits, starting with 01. Shared by the form and
 * the server (Nuxt auto-imports `shared/utils` in both), so they cannot disagree.
 */

/** Digits only: Arabic-Indic digits become 0-9, spaces and dashes are dropped. */
export const normalizePhone = (value: string): string =>
  value
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\s-]/g, "");

export const isValidPhone = (value: string): boolean =>
  /^01\d{9}$/.test(normalizePhone(value));
