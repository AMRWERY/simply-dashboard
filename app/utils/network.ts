/**
 * True when a request never completed (offline, DNS/connection blocked, or a
 * browser extension / ad blocker intercepting it) as opposed to the server
 * answering with an error. The browser reports these as "Failed to fetch"
 * (Chrome), "NetworkError ..." (Firefox) or "Load failed" (Safari); Supabase
 * passes that text along inside its own error object.
 */
export function isNetworkError(e: unknown): boolean {
  if (e instanceof TypeError) return true;
  const message = String((e as { message?: unknown } | null)?.message ?? "");
  return /failed to fetch|networkerror|load failed|network request failed/i.test(
    message,
  );
}
