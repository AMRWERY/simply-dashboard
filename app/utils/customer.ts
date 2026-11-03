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

export const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0]! + parts[1][0]!).toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase();
};

/** Same id -> same colour, so the avatar doesn't change between reloads. */
export const avatarClassFor = (id: string): string => {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_CLASSES[hash % AVATAR_CLASSES.length]!;
};

export const CUSTOMER_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const IMAGE_EXT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};
export const CUSTOMER_IMAGE_MAX_BYTES = 2 * 1024 * 1024;

// Some browsers report an empty file.type: fall back to the extension.
export const resolveImageType = (file: File): string => {
  return (
    file.type ||
    IMAGE_EXT_TYPES[file.name.split(".").pop()?.toLowerCase() ?? ""] ||
    ""
  );
};

/** Returns an i18n key for the problem, or null when the file is acceptable. */
export const validateCustomerImage = (
  file: File,
): "invalid_image_type" | "image_too_large" | null => {
  if (!CUSTOMER_IMAGE_TYPES[resolveImageType(file)]) return "invalid_image_type";
  if (file.size > CUSTOMER_IMAGE_MAX_BYTES) return "image_too_large";
  return null;
};

export const toCustomer = (row: CustomerRow): Customer => {
  return {
    id: row.id,
    name: row.name,
    initials: getInitials(row.name),
    status: row.status,
    city: row.city,
    phone: row.phone,
    email: row.email,
    avatarClass: avatarClassFor(row.id),
    imageUrl: row.image_url,
    createdAt: row.created_at,
    amountDue: Number(row.amount_due),
    amountPaid: Number(row.amount_paid),
  };
};

/** Money owed but not yet paid, never negative, rounded to cents. */
export const remainingAmount = (customer: Pick<Customer, "amountDue" | "amountPaid">): number => {
  return Math.max(0, Math.round((customer.amountDue - customer.amountPaid) * 100) / 100);
};

/** Totals across customers: billed, collected (earnings) and still owed. */
export const summarizeEarnings = (customers: Customer[]) => {
  const round = (n: number) => Math.round(n * 100) / 100;
  const billed = round(customers.reduce((s, c) => s + c.amountDue, 0));
  const earned = round(customers.reduce((s, c) => s + c.amountPaid, 0));
  const outstanding = round(
    customers.reduce((s, c) => s + remainingAmount(c), 0),
  );
  return { billed, earned, outstanding };
};

/** Format an amount in EGP. Western digits in both languages. */
export const formatMoney = (amount: number, locale: string): string => {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-EG", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};
