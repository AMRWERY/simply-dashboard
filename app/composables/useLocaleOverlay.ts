/** Shared state for the full-screen overlay shown while switching locale. */
export function useLocaleOverlay() {
  const visible = useState("locale-overlay", () => false);
  /** Locale we're switching TO ("en" | "ar"), so the overlay can point at it. */
  const target = useState<"en" | "ar">("locale-overlay-target", () => "ar");
  return { visible, target };
}
