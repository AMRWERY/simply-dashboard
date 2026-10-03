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
}

export interface CustomerInput {
  name: string;
  phone: string;
  email?: string;
  city?: string;
  status?: Status;
}

export interface Filter {
  label: string;
  count: number;
}
