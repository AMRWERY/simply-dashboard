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

/** A sensible starting point for a new entry: today, at the next full hour. */
export const defaultParts = (now = new Date()) => {
  const d = new Date(now);
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return toLocalParts(d.toISOString());
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

/** A blank row for the form, pre-filled with a sensible date and time. */
export const newDraft = (): ScheduleDraft => ({
  key: `draft-${++draftCounter}`,
  ...defaultParts(),
  done: false,
});

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
