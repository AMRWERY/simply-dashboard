const STATUSES = ["active", "new", "follow-up"] as const;
type Status = (typeof STATUSES)[number];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const email = text(fields.email, "email", 254, false);
  if (email && !EMAIL.test(email)) httpError(400, "invalid_email", "Invalid email");

  const status = (fields.status ?? "new") as Status;
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
    email,
    city: text(fields.city, "city", 80, false),
    status,
    amount_due: amountDue,
    amount_paid: amountPaid,
  };
};
