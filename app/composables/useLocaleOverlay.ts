/** Shared visibility state for the full-screen overlay shown while switching locale. */
export function useLocaleOverlay() {
  const visible = useState("locale-overlay", () => false);
  return { visible };
}
