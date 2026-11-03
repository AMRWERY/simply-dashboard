import type { Payment } from "~/types/home";

/** A payment as the server returns it (see GET /api/payments). */
export interface PaymentRow {
  id: string;
  customer_id: string;
  amount: number | string;
  paid_at: string;
  customer: { name: string } | null;
}

export const toPayment = (row: PaymentRow): Payment => ({
  id: row.id,
  customerId: row.customer_id,
  customerName: row.customer?.name ?? "",
  amount: Number(row.amount),
  paidAt: row.paid_at,
});

/** One calendar month of earnings. */
export interface MonthEarnings {
  /** "YYYY-MM", in the visitor's local time. */
  key: string;
  year: number;
  /** 0-11 */
  month: number;
  /** Net money received that month (corrections subtract). */
  total: number;
  /** Number of payment entries. */
  count: number;
  /** Distinct customers who paid. */
  customers: number;
  /** The month's entries, newest first. */
  payments: Payment[];
}

const pad = (n: number) => String(n).padStart(2, "0");
const round2 = (n: number) => Math.round(n * 100) / 100;

/** "YYYY-MM" of a date in local time, so months follow the visitor's calendar. */
export const monthKeyOf = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

/** Net earnings in the calendar month that contains `at`. Starts again at 0 every month. */
export const earningsInMonth = (payments: Payment[], at: Date): number => {
  const key = monthKeyOf(at);
  return round2(
    payments
      .filter((p) => monthKeyOf(new Date(p.paidAt)) === key)
      .reduce((sum, p) => sum + p.amount, 0),
  );
};

/**
 * One row per calendar month from the first payment through the current month,
 * newest first. Months with no payments are included (as 0) so the table has no
 * gaps. Returns [] when nothing has been paid yet.
 */
export const monthlyEarnings = (
  payments: Payment[],
  now = new Date(),
): MonthEarnings[] => {
  if (!payments.length) return [];

  const byKey = new Map<string, Payment[]>();
  let earliest = now;
  let latest = now;
  for (const payment of payments) {
    const date = new Date(payment.paidAt);
    const key = monthKeyOf(date);
    byKey.set(key, [...(byKey.get(key) ?? []), payment]);
    if (date < earliest) earliest = date;
    if (date > latest) latest = date;
  }

  const rows: MonthEarnings[] = [];
  const cursor = new Date(latest.getFullYear(), latest.getMonth(), 1);
  const stop = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
  while (cursor >= stop) {
    const key = monthKeyOf(cursor);
    const entries = (byKey.get(key) ?? [])
      .slice()
      .sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());
    rows.push({
      key,
      year: cursor.getFullYear(),
      month: cursor.getMonth(),
      total: round2(entries.reduce((sum, p) => sum + p.amount, 0)),
      count: entries.length,
      customers: new Set(entries.map((p) => p.customerId)).size,
      payments: entries,
    });
    cursor.setMonth(cursor.getMonth() - 1);
  }
  return rows;
};

/** Net totals per customer within one month, largest first (for the detail dialog). */
export const customerTotals = (payments: Payment[]) => {
  const totals = new Map<string, { customerId: string; name: string; total: number }>();
  for (const p of payments) {
    const entry = totals.get(p.customerId) ?? {
      customerId: p.customerId,
      name: p.customerName,
      total: 0,
    };
    entry.total = round2(entry.total + p.amount);
    totals.set(p.customerId, entry);
  }
  return [...totals.values()].sort((a, b) => b.total - a.total);
};

/** "November 2026" in the active language, Western digits. */
export const monthLabel = (year: number, month: number, locale: string): string =>
  new Intl.DateTimeFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month, 1));
