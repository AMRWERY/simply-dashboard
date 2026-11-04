/**
 * Customer profile link (usually Facebook). Shared by the form and the server,
 * like phone.ts, so they cannot disagree.
 */

const FACEBOOK_HOST = /^(?:[\w-]+\.)*(?:facebook\.com|fb\.com|fb\.me)$/i;

/** Absolute http(s) URL for a pasted link ("facebook.com/x" gets https://), or "" if it is not one. */
export const normalizeLink = (value: string): string => {
  const raw = value.trim();
  if (!raw || /\s/.test(raw)) return "";
  const withScheme = /^[a-z][a-z\d+.-]*:/i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    return url.hostname.includes(".") ? url.toString() : "";
  } catch {
    return "";
  }
};

/** The Facebook URL to open for this value, or "" when it is not a Facebook link. */
export const facebookUrl = (value: string | null | undefined): string => {
  const url = normalizeLink(value ?? "");
  if (!url) return "";
  return FACEBOOK_HOST.test(new URL(url).hostname) ? url : "";
};

export const isValidLink = (value: string): boolean => normalizeLink(value) !== "";
