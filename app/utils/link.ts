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

/** Facebook paths that are not a person or page, so there is nobody to message. */
const NOT_A_PROFILE = new Set([
  "groups", "pages", "watch", "share", "sharer", "sharer.php", "story.php",
  "permalink.php", "photo", "photo.php", "events", "login", "marketplace", "gaming",
]);

/**
 * The m.me chat link for a Facebook profile link (username, profile.php?id=, or
 * people/Name/id). Other Facebook links come back unchanged; "" when the value
 * is not a Facebook link at all.
 */
export const messengerUrl = (value: string | null | undefined): string => {
  const normalized = normalizeLink(value ?? "");
  if (!normalized) return "";
  const url = new URL(normalized);
  if (/^(?:www\.)?(?:m\.me|messenger\.com)$/i.test(url.hostname)) return normalized;
  if (!FACEBOOK_HOST.test(url.hostname)) return "";

  const [first = "", second = "", third = ""] = url.pathname.split("/").filter(Boolean);
  let id = first;
  if (first === "profile.php") id = url.searchParams.get("id") ?? "";
  else if (first === "people") id = third || second;
  else if (NOT_A_PROFILE.has(first.toLowerCase())) id = "";

  // Share links (facebook.com/share/...) and the like carry no username or id to
  // chat with, so the icon opens the Facebook link itself.
  return /^[\w.-]+$/.test(id) ? `https://m.me/${id}` : normalized;
};

export const isValidLink = (value: string): boolean => normalizeLink(value) !== "";
