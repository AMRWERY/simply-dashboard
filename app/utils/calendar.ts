import type { Customer, ScheduleEntry } from "~/types/home";

/** One scheduled entry together with the customer it belongs to. */
export interface CalendarEvent extends ScheduleEntry {
  customer: Customer;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Local YYYY-MM-DD, the key events are grouped by. */
export const dateKey = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** First day of the week: Saturday for Arabic, Sunday otherwise (matches weekEntries). */
const firstWeekday = (locale: string) => (locale === "ar" ? 6 : 0);

const addDays = (d: Date, days: number): Date => {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  copy.setDate(copy.getDate() + days);
  return copy;
};

/** Midnight of the first day of the week containing `d`. */
export const startOfWeek = (d: Date, locale: string): Date =>
  addDays(d, -((d.getDay() - firstWeekday(locale) + 7) % 7));

/** The seven days of the week containing `d`. */
export const weekDays = (d: Date, locale: string): Date[] => {
  const start = startOfWeek(d, locale);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
};

/** Whole weeks covering the month of `d` (including the days of its neighbours). */
export const monthDays = (d: Date, locale: string): Date[] => {
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const start = startOfWeek(first, locale);
  const end = weekDays(last, locale)[6]!;
  const count = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  return Array.from({ length: count }, (_, i) => addDays(start, i));
};

/** Same day-of-month a month/week later (or earlier), clamped for short months. */
export const shiftMonth = (d: Date, months: number): Date => {
  const target = new Date(d.getFullYear(), d.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(d.getDate(), lastDay));
  return target;
};

export const shiftWeek = (d: Date, weeks: number): Date => addDays(d, weeks * 7);

/** Every schedule entry of every customer, grouped by local day, earliest first. */
export const eventsByDay = (customers: Customer[]): Map<string, CalendarEvent[]> => {
  const map = new Map<string, CalendarEvent[]>();
  for (const customer of customers) {
    for (const entry of customer.schedules) {
      const key = dateKey(new Date(entry.at));
      const list = map.get(key) ?? [];
      list.push({ ...entry, customer });
      map.set(key, list);
    }
  }
  for (const list of map.values()) {
    list.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  }
  return map;
};

const intlLocale = (locale: string) => (locale === "ar" ? "ar-EG-u-nu-latn" : "en-US");

/** Just the time, e.g. "3:30 PM". */
export const formatTime = (iso: string, locale: string): string =>
  new Intl.DateTimeFormat(intlLocale(locale), {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));

/** Short weekday name for a header cell. */
export const weekdayName = (d: Date, locale: string): string =>
  new Intl.DateTimeFormat(intlLocale(locale), { weekday: "short" }).format(d);

/** Title above the grid: "November 2026" or "Nov 1 – 7, 2026". */
export const rangeTitle = (
  view: "week" | "month",
  anchor: Date,
  locale: string,
): string => {
  const intl = intlLocale(locale);
  if (view === "month") {
    return new Intl.DateTimeFormat(intl, { month: "long", year: "numeric" }).format(anchor);
  }
  const days = weekDays(anchor, locale);
  return new Intl.DateTimeFormat(intl, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).formatRange(days[0]!, days[6]!);
};

/** Long date for the day dialog, e.g. "Tuesday, November 3, 2026". */
export const formatDayLong = (d: Date, locale: string): string =>
  new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "full" }).format(d);
