/**
 * Singleton dark-mode state shared across the entire app.
 * Reads/writes to localStorage under the key "theme".
 * Applies the "dark" class to <html> on every change.
 */
const _isDark = ref(false);
let _initialized = false;

export function useTheme() {
  if (!_initialized && import.meta.client) {
    _initialized = true;
    const stored = localStorage.getItem("theme");
    _isDark.value =
      stored === "dark" ||
      (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", _isDark.value);
  }

  const isDark = computed(() => _isDark.value);

  function apply(value: boolean) {
    _isDark.value = value;
    document.documentElement.classList.toggle("dark", value);
    localStorage.setItem("theme", value ? "dark" : "light");
  }

  /**
   * Toggles the theme with a circular reveal expanding from the click point
   * (View Transitions API). Falls back to an instant swap when unsupported
   * or when the user prefers reduced motion.
   */
  function toggle(event?: Event) {
    const next = !_isDark.value;
    const doc = document as Document & {
      startViewTransition?: (cb: () => Promise<void> | void) => {
        ready: Promise<void>;
      };
    };

    if (
      !doc.startViewTransition ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      apply(next);
      return;
    }

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    if (event instanceof MouseEvent && (event.clientX || event.clientY)) {
      x = event.clientX;
      y = event.clientY;
    } else if (event?.currentTarget instanceof HTMLElement) {
      const rect = event.currentTarget.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    }
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = doc.startViewTransition(async () => {
      apply(next);
      await nextTick();
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${radius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 550,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    });
  }

  function setDark(value: boolean) {
    _isDark.value = value;
    document.documentElement.classList.toggle("dark", value);
    localStorage.setItem("theme", value ? "dark" : "light");
  }

  return { isDark, toggle, setDark };
}
