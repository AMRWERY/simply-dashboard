export type Status = "active" | "new" | "follow-up";

export interface Customer {
  id: number;
  name: string;
  initials: string;
  status: Status;
  city: string;
  phone: string;
  email: string;
  avatarClass: string;
}

export interface Filter {
  label: string;
  count: number;
}
