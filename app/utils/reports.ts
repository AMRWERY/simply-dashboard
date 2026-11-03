import type { Customer, Status } from "~/types/home";

/** Customers who still owe money, largest balance first. */
export function topDebtors(customers: Customer[], limit = 5) {
  return customers
    .map((customer) => ({ customer, remaining: remainingAmount(customer) }))
    .filter((row) => row.remaining > 0)
    .sort((a, b) => b.remaining - a.remaining)
    .slice(0, limit);
}

export function statusBreakdown(customers: Customer[]): Record<Status, number> {
  const counts: Record<Status, number> = { active: 0, new: 0, "follow-up": 0 };
  for (const c of customers) counts[c.status] += 1;
  return counts;
}

/** New customers per calendar month for the last `months` months (oldest first). */
export function monthlyGrowth(
  customers: Customer[],
  locale: string,
  months = 6,
  now = new Date(),
) {
  const fmt = new Intl.DateTimeFormat(
    locale === "ar" ? "ar-EG-u-nu-latn" : "en-US",
    { month: "short" },
  );
  const buckets = Array.from({ length: months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    return {
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: fmt.format(d),
      count: 0,
    };
  });
  const byKey = new Map(buckets.map((b) => [b.key, b]));
  for (const c of customers) {
    const d = new Date(c.createdAt);
    byKey.get(`${d.getFullYear()}-${d.getMonth()}`)!.count += 1;
  }
  return buckets;
}

/** Cities by customer count (case-insensitive); customers without a city are skipped. */
export function cityBreakdown(customers: Customer[], limit = 5) {
  const groups = new Map<string, { city: string; count: number }>();
  for (const c of customers) {
    const city = c.city?.trim();
    if (!city) continue;
    const key = city.toLowerCase();
    const group = groups.get(key);
    if (group) group.count += 1;
    else groups.set(key, { city, count: 1 });
  }
  return [...groups.values()].sort((a, b) => b.count - a.count).slice(0, limit);
}

/** Collected ÷ billed as a 0–100 percentage (0 when nothing is billed). */
export function collectionRate(billed: number, earned: number): number {
  return billed > 0 ? Math.min(100, Math.round((earned / billed) * 100)) : 0;
}
