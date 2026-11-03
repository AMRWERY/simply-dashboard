/** GET /api/customers — the signed-in user's customers, newest first. */
export default defineEventHandler(async (event) => {
  await requireUser(event);
  const db = await dbFor(event);

  const { data, error } = await db
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) dbError(error);
  return data;
});
