/** Shared state for the full-screen overlay shown while switching locale. */
export const useLocaleOverlay = () => {
  const visible = useState("locale-overlay", () => false);
  /** Locale we're switching TO ("en" | "ar"), so the overlay can point at it. */
  const target = useState<"en" | "ar">("locale-overlay-target", () => "ar");
  return { visible, target };
};
