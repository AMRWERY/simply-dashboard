export type Status = "active" | "new" | "follow-up";

export interface Customer {
  id: string;
  name: string;
  initials: string;
  status: Status;
  city: string | null;
  phone: string;
  email: string | null;
  avatarClass: string;
  /** Total the customer must pay. */
  amountDue: number;
  /** Part of amountDue already paid. Remaining = amountDue - amountPaid. */
  amountPaid: number;
}

export interface CustomerInput {
  name: string;
  phone: string;
  email?: string;
  city?: string;
  status?: Status;
  amountDue?: number;
  amountPaid?: number;
}

export interface Filter {
  label: string;
  count: number;
}
