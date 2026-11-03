/**
 * Tweens a number toward `target` (ease-out) whenever it changes.
 * Client-only; on the server and with reduced motion it jumps straight there.
 */
export const useCountUp = (target: Ref<number> | ComputedRef<number>, duration = 700) => {
  const display = ref(target.value);
  let frame = 0;

  const reduced = () =>
    import.meta.client &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const animate = (from: number, to: number) => {
    cancelAnimationFrame(frame);
    if (!import.meta.client || reduced() || from === to) {
      display.value = to;
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      display.value = from + (to - from) * eased;
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  };

  // First paint counts up from 0 so the numbers "arrive".
  onMounted(() => {
    display.value = 0;
    animate(0, target.value);
  });
  watch(target, (to) => animate(display.value, to));
  onBeforeUnmount(() => cancelAnimationFrame(frame));

  return display;
};
