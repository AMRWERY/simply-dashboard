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
  /** ISO timestamp the customer was created. */
  createdAt: string;
  /** Public URL of the uploaded photo; initials are shown when null. */
  imageUrl: string | null;
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
