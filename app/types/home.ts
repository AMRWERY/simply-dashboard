export type Status = "active" | "new" | "follow-up";

/** One scheduled date and time for a customer. */
export interface ScheduleEntry {
  id: string;
  /** ISO timestamp (UTC); shown in the visitor's local time. */
  at: string;
  done: boolean;
  /** ISO timestamp it was marked done, or null. */
  doneAt: string | null;
}

/** A schedule row being edited in the form (date and time as the inputs hold them). */
export interface ScheduleDraft {
  /** Local-only key for the list. */
  key: string;
  /** Present for entries that already exist. */
  id?: string;
  /** Local date, YYYY-MM-DD. */
  date: string;
  /** Local time, HH:mm. */
  time: string;
  done: boolean;
}

/** A schedule entry as sent to the server (id is absent for new ones). */
export interface ScheduleInput {
  id?: string;
  at: string;
  done: boolean;
}

export interface Customer {
  id: string;
  name: string;
  initials: string;
  status: Status;
  city: string | null;
  phone: string;
  email: string | null;
  avatarClass: string;
  /** ISO timestamp the customer was created. */
  createdAt: string;
  /** Public URL of the uploaded photo; initials are shown when null. */
  imageUrl: string | null;
  /** Total the customer must pay. */
  amountDue: number;
  /** Part of amountDue already paid. Remaining = amountDue - amountPaid. */
  amountPaid: number;
  /** Scheduled dates and times, earliest first. */
  schedules: ScheduleEntry[];
}

/** Money received from a customer on a given date (negative = a downward correction). */
export interface Payment {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  /** ISO timestamp. */
  paidAt: string;
}

export interface CustomerInput {
  name: string;
  phone: string;
  email?: string;
  city?: string;
  status?: Status;
  amountDue?: number;
  amountPaid?: number;
  /** The full list of scheduled dates; entries not listed are removed. */
  schedules?: ScheduleInput[];
  /** New photo to upload (JPG/PNG/WebP, max 2 MB). */
  imageFile?: File | null;
  /** Remove the current photo (ignored when imageFile is set). */
  removeImage?: boolean;
}

export interface Filter {
  /** Stable identity: "all" or a Status. */
  key: string;
  label: string;
  count: number;
}
