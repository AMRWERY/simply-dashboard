export type DayPeriod = "morning" | "afternoon" | "evening" | "night";

/** 05–11 morning, 12–16 afternoon, 17–20 evening, 21–04 night. */
export function getDayPeriod(hour: number): DayPeriod {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

/**
 * Time-of-day greeting plus a live clock and today's date, in the active
 * locale (Western digits in both languages, like the money formatting).
 */
export function useGreeting() {
  const { locale, t } = useI18n();
  // Ticks every second and pauses itself when the component unmounts.
  const now = useNow({ interval: 1000 });

  const intlLocale = computed(() =>
    locale.value === "ar" ? "ar-EG-u-nu-latn" : "en-US",
  );

  const period = computed(() => getDayPeriod(now.value.getHours()));
  const greeting = computed(() => t(`greeting_${period.value}`));

  /** Clock split into parts so each digit group can animate on its own. */
  const timeParts = computed(() =>
    new Intl.DateTimeFormat(intlLocale.value, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).formatToParts(now.value),
  );

  const dateText = computed(() =>
    new Intl.DateTimeFormat(intlLocale.value, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(now.value),
  );

  return { now, period, greeting, timeParts, dateText };
}
