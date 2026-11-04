// The phone rule lives in app/utils so the form and the server share one definition.
// Nitro only auto-imports server/utils (not app/utils), so import it explicitly.
import { isValidPhone, normalizePhone } from "../../app/utils/phone";
import { isValidLink, normalizeLink } from "../../app/utils/link";

const STATUSES = ["active"] as const;
type Status = (typeof STATUSES)[number];

const amount = (raw: string | undefined, field: string, required: boolean): number => {
  const text = (raw ?? "").trim();
  if (!text) {
    if (required) httpError(400, `${field}_required`, `${field} required`);
    return 0;
  }
  const n = Number(text);
  if (!Number.isFinite(n) || n < 0 || n > 1_000_000_000) {
    httpError(400, `invalid_${field}`, `Invalid ${field}`);
  }
  return Math.round(n * 100) / 100;
};

const text = (
  raw: string | undefined,
  field: string,
  max: number,
  required: boolean,
): string | null => {
  const value = (raw ?? "").trim();
  if (!value) {
    if (required) httpError(400, `${field}_required`, `${field} required`);
    return null;
  }
  if (value.length > max) httpError(400, `invalid_${field}`, `Invalid ${field}`);
  return value;
};

/**
 * Validates and normalises the customer form fields on the server, so the
 * rules hold no matter what client sends them.
 */
export const parseCustomer = (fields: Record<string, string>) => {
  const rawLink = text(fields.link, "link", 300, false);
  if (rawLink && !isValidLink(rawLink)) httpError(400, "invalid_link", "Invalid link");
  const link = rawLink ? normalizeLink(rawLink) : null;

  const status = (fields.status ?? "active") as Status;
  if (!STATUSES.includes(status)) httpError(400, "invalid_status", "Invalid status");

  const amountDue = amount(fields.amountDue, "amount_due", true);
  const amountPaid = amount(fields.amountPaid, "amount_paid", false);
  if (amountPaid > amountDue) {
    httpError(400, "paid_exceeds_due", "Paid exceeds due");
  }

  const phone = text(fields.phone, "phone", 30, true)!;
  if (!isValidPhone(phone)) httpError(400, "invalid_phone", "Invalid phone");

  return {
    name: text(fields.name, "name", 120, true)!,
    phone: normalizePhone(phone),
    link,
    city: text(fields.city, "city", 80, false),
    status,
    amount_due: amountDue,
    amount_paid: amountPaid,
  };
};
