/**
 * Reactive current Date that updates every `ms` milliseconds.
 *
 * VueUse's `useNow` updates on every animation frame (about 60 times a second)
 * unless it is given a scheduler, which is far more than a clock or an
 * "is this overdue yet?" check needs. The timer only starts in the browser, so
 * server rendering never leaves an interval running.
 */
export const useNowEvery = (ms: number) =>
  useNow({
    scheduler: (cb) => useIntervalFn(cb, ms, { immediate: import.meta.client }),
  });
