import type { Database } from "~/types/database.types";
import type { Customer } from "~/types/home";

export type CustomerRow = Database["public"]["Tables"]["customers"]["Row"];

const AVATAR_CLASSES = [
  "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
  "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
  "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-400",
  "bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400",
  "bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-400",
];

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0]! + parts[1][0]!).toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase();
}

/** Same id -> same colour, so the avatar doesn't change between reloads. */
export function avatarClassFor(id: string): string {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_CLASSES[hash % AVATAR_CLASSES.length]!;
}

export function toCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    name: row.name,
    initials: getInitials(row.name),
    status: row.status,
    city: row.city,
    phone: row.phone,
    email: row.email,
    avatarClass: avatarClassFor(row.id),
  };
}
