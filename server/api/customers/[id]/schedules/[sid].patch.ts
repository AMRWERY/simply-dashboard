/**
 * PATCH /api/customers/:id/schedules/:sid — { done: boolean }.
 * Marks one scheduled date done (or undoes it) without touching the rest of
 * the customer. Row-level security keeps it to the caller's own schedules.
 */
export default defineEventHandler(async (event) => {
  await requireUser(event);
  const customerId = routeId(event);
  const scheduleId = routeId(event, "sid");

  const body = await readBody<{ done?: unknown }>(event);
  if (typeof body?.done !== "boolean") httpError(400, "invalid_done", "Invalid value");

  const db = await dbFor(event);
  const { data, error } = await db
    .from("customer_schedules")
    .update({
      done: body.done,
      done_at: body.done ? new Date().toISOString() : null,
    })
    .eq("id", scheduleId)
    .eq("customer_id", customerId)
    .select("id, scheduled_at, done, done_at")
    .single();
  if (error) dbError(error);
  return data;
});
