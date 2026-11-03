import type { ScheduleDraft, ScheduleEntry, ScheduleInput } from "~/types/home";

export type ScheduleStatus = "done" | "overdue" | "upcoming";

const pad = (n: number) => String(n).padStart(2, "0");

/** ISO timestamp -> the date and time inputs' values, in the visitor's local time. */
export const toLocalParts = (iso: string) => {
  const d = new Date(iso);
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
};

/** Local date + time input values -> ISO timestamp, or null if either is missing/invalid. */
export const fromLocalParts = (date: string, time: string): string | null => {
  if (!date || !time) return null;
  const d = new Date(`${date}T${time}`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

/** Done wins; otherwise a past time that isn't done yet is overdue. */
export const scheduleStatus = (
  entry: Pick<ScheduleEntry, "at" | "done">,
  now = new Date(),
): ScheduleStatus => {
  if (entry.done) return "done";
  return new Date(entry.at).getTime() < now.getTime() ? "overdue" : "upcoming";
};

/** The entry that needs attention next: the earliest one not done yet. */
export const nextOpenEntry = (schedules: ScheduleEntry[]) =>
  schedules.find((s) => !s.done) ?? null;

export const openCount = (schedules: ScheduleEntry[]) =>
  schedules.filter((s) => !s.done).length;

/** e.g. "Tue, Nov 5 · 3:30 PM" in the active language, Western digits. */
export const formatSchedule = (iso: string, locale: string): string => {
  const intl = locale === "ar" ? "ar-EG-u-nu-latn" : "en-US";
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat(intl, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(d);
  const time = new Intl.DateTimeFormat(intl, {
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
  return `${date} · ${time}`;
};

let draftCounter = 0;

/** Time given to a newly picked date (the last row's time when there is one). */
export const DEFAULT_TIME = "09:00";

/** The distinct dates the rows cover, earliest first (what the calendar shows as selected). */
export const draftDates = (drafts: ScheduleDraft[]): string[] =>
  [...new Set(drafts.map((d) => d.date))].sort();

/**
 * Makes the rows match the dates chosen on the calendar: rows for dates that
 * were deselected are dropped, and each newly picked date gets a row. Rows that
 * stay keep their time and done state; the result is ordered by date.
 */
export const applyDateSelection = (
  drafts: ScheduleDraft[],
  dates: string[],
): ScheduleDraft[] => {
  const wanted = new Set(dates);
  const kept = drafts.filter((d) => wanted.has(d.date));
  const have = new Set(kept.map((d) => d.date));
  const time = drafts.at(-1)?.time ?? DEFAULT_TIME;
  const added = dates
    .filter((date) => !have.has(date))
    .map(
      (date): ScheduleDraft => ({
        key: `draft-${++draftCounter}`,
        date,
        time,
        done: false,
      }),
    );
  // Array.sort is stable, so rows on the same date keep the order they had.
  return [...kept, ...added].sort((a, b) => a.date.localeCompare(b.date));
};

/** Adds a second row on the same date as `key`, an hour later (a day can have several times). */
export const addTimeOnSameDate = (
  drafts: ScheduleDraft[],
  key: string,
): ScheduleDraft[] => {
  const index = drafts.findIndex((d) => d.key === key);
  const source = drafts[index];
  if (!source) return drafts;
  const [h = 9, m = 0] = source.time.split(":").map(Number);
  const copy: ScheduleDraft = {
    key: `draft-${++draftCounter}`,
    date: source.date,
    time: `${pad(Math.min(23, h + 1))}:${pad(m)}`,
    done: false,
  };
  return [...drafts.slice(0, index + 1), copy, ...drafts.slice(index + 1)];
};

/** Existing schedule entries -> editable rows. */
export const draftsFromEntries = (entries: ScheduleEntry[]): ScheduleDraft[] =>
  entries.map((entry) => ({
    key: `draft-${++draftCounter}`,
    id: entry.id,
    ...toLocalParts(entry.at),
    done: entry.done,
  }));

/** Editable rows -> what the server expects, or null if any row is incomplete. */
export const draftsToInput = (drafts: ScheduleDraft[]): ScheduleInput[] | null => {
  const out: ScheduleInput[] = [];
  for (const draft of drafts) {
    const at = fromLocalParts(draft.date, draft.time);
    if (!at) return null;
    out.push({ id: draft.id, at, done: draft.done });
  }
  return out;
};
