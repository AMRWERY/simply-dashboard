/** GET /api/customers — the signed-in user's customers (with schedules), newest first. */
export default defineEventHandler(async (event) => {
  await requireUser(event);
  const db = await dbFor(event);

  const { data, error } = await db
    .from("customers")
    .select(CUSTOMER_SELECT)
    .order("created_at", { ascending: false });
  if (error) dbError(error);
  return data;
});
