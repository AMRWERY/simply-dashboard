/**
 * GET /api/payments — every payment recorded for the signed-in user's
 * customers (newest first), with the customer's name. Entries are written by
 * a database trigger when a customer's paid amount changes, never by the app.
 */
export default defineEventHandler(async (event) => {
  await requireUser(event);
  const db = await dbFor(event);

  const { data, error } = await db
    .from("customer_payments")
    .select("id, customer_id, amount, paid_at, customer:customers(name)")
    .order("paid_at", { ascending: false });
  if (error) dbError(error);
  return data;
});
