export interface ScheduleInput {
  id?: string;
  at: string;
  done: boolean;
}

/** Selects a customer together with its schedules (PostgREST embedded resource). */
export const CUSTOMER_SELECT =
  "*, schedules:customer_schedules(id, scheduled_at, done, done_at)";

const MAX_SCHEDULES = 50;
const MIN_YEAR = 2000;
const MAX_YEAR = 2100;

/**
 * Validates the `schedules` form field (a JSON array of { id?, at, done }) so
 * the rules hold whatever client sends it. Times are normalised to ISO/UTC.
 */
export const parseSchedules = (raw: string | undefined): ScheduleInput[] => {
  if (!raw) return [];

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return httpError(400, "invalid_schedules", "Invalid schedules");
  }
  if (!Array.isArray(data) || data.length > MAX_SCHEDULES) {
    return httpError(400, "invalid_schedules", "Invalid schedules");
  }

  return data.map((item) => {
    const entry = (item ?? {}) as { id?: unknown; at?: unknown; done?: unknown };
    const date = typeof entry.at === "string" ? new Date(entry.at) : null;
    if (
      !date ||
      Number.isNaN(date.getTime()) ||
      date.getUTCFullYear() < MIN_YEAR ||
      date.getUTCFullYear() > MAX_YEAR
    ) {
      return httpError(400, "invalid_schedule_date", "Invalid schedule date");
    }
    return {
      id: typeof entry.id === "string" && isUuid(entry.id) ? entry.id : undefined,
      at: date.toISOString(),
      done: entry.done === true,
    };
  });
};

/**
 * Makes the customer's stored schedules match `entries`: entries that are no
 * longer listed are deleted, listed ones that exist are updated (keeping their
 * original "done at" time unless the done state changed), and the rest are
 * inserted. An id that doesn't belong to this customer is treated as new.
 */
export const syncSchedules = async (
  db: Db,
  customerId: string,
  entries: ScheduleInput[],
) => {
  const { data: existing, error: findError } = await db
    .from("customer_schedules")
    .select("id, done")
    .eq("customer_id", customerId);
  if (findError) dbError(findError);

  const known = new Map(existing.map((row) => [row.id, row.done]));
  const isKnown = (e: ScheduleInput) => !!e.id && known.has(e.id);

  const kept = new Set(entries.filter(isKnown).map((e) => e.id!));
  const removeIds = [...known.keys()].filter((id) => !kept.has(id));
  if (removeIds.length) {
    const { error } = await db
      .from("customer_schedules")
      .delete()
      .in("id", removeIds);
    if (error) dbError(error);
  }

  const now = new Date().toISOString();

  for (const e of entries.filter(isKnown)) {
    const patch: { scheduled_at: string; done: boolean; done_at?: string | null } = {
      scheduled_at: e.at,
      done: e.done,
    };
    if (e.done && !known.get(e.id!)) patch.done_at = now;
    else if (!e.done) patch.done_at = null;

    const { error } = await db
      .from("customer_schedules")
      .update(patch)
      .eq("id", e.id!)
      .eq("customer_id", customerId);
    if (error) dbError(error);
  }

  const fresh = entries.filter((e) => !isKnown(e));
  if (fresh.length) {
    const { error } = await db.from("customer_schedules").insert(
      fresh.map((e) => ({
        customer_id: customerId,
        scheduled_at: e.at,
        done: e.done,
        done_at: e.done ? now : null,
      })),
    );
    if (error) dbError(error);
  }
};

/** One customer with its schedules, or a 404 (also if it isn't the caller's). */
export const loadCustomer = async (db: Db, id: string) => {
  const { data, error } = await db
    .from("customers")
    .select(CUSTOMER_SELECT)
    .eq("id", id)
    .single();
  if (error) dbError(error);
  return data;
};
