import type { H3Event } from "h3";

export const IMAGE_MAX_BYTES = 2 * 1024 * 1024;

/** Throws an h3 error whose `data.code` the client can switch on. */
// The explicit `=> never` type on the variable (not just on the arrow) is what
// lets TypeScript treat calls like `if (!x) httpError(...)` as ending the branch.
export const httpError: (
  status: number,
  code: string,
  message?: string,
) => never = (status, code, message = code) => {
  throw createError({ statusCode: status, statusMessage: message, data: { code } });
};

/**
 * Maps a Postgres / PostgREST error to an HTTP error without leaking internals
 * (details go to the server log only).
 */
export const dbError: (
  e: { code?: string; message?: string } | null | undefined,
) => never = (e) => {
  console.error("[api] database error", e);
  const code = e?.code;
  if (code === "PGRST116") httpError(404, "not_found", "Not found"); // no row (missing or not yours)
  if (code === "42501") httpError(403, "forbidden", "Forbidden"); // blocked by RLS
  if (code && /^2[23]/.test(code)) httpError(400, "invalid_data", "Invalid data"); // constraint / type
  httpError(500, "server_error", "Request failed");
};

export const storageError: (e: unknown) => never = (e) => {
  console.error("[api] storage error", e);
  httpError(500, "upload_failed", "Upload failed");
};

/** Identify an image by its first bytes, never by the client-declared type. */
export const sniffImage = (buf: Buffer): { type: string; ext: string } | null => {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { type: "image/jpeg", ext: "jpg" };
  }
  if (
    buf.length > 8 &&
    buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return { type: "image/png", ext: "png" };
  }
  if (
    buf.length > 12 &&
    buf.subarray(0, 4).toString("ascii") === "RIFF" &&
    buf.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return { type: "image/webp", ext: "webp" };
  }
  return null;
};

/** Validates an uploaded image and returns its real type, or throws 400. */
export const checkImage = (data: Buffer): { type: string; ext: string } => {
  if (data.length > IMAGE_MAX_BYTES) httpError(400, "image_too_large", "Image too large");
  const image = sniffImage(data);
  if (!image) httpError(400, "invalid_image_type", "Unsupported image type");
  return image;
};

/** Reads a multipart form: text fields plus at most one file (the `image`). */
export const readForm = async (event: H3Event) => {
  const parts = (await readMultipartFormData(event)) ?? [];
  const fields: Record<string, string> = {};
  let file: Buffer | null = null;
  for (const part of parts) {
    if (!part.name) continue;
    if (part.filename !== undefined) {
      if (part.data.length) file = part.data;
    } else {
      fields[part.name] = part.data.toString("utf8");
    }
  }
  return { fields, file };
};

/** Claims from a JWT we have just received from Supabase (not for verifying). */
export const jwtClaims = (token: string): Record<string, unknown> => {
  const payload = token.split(".")[1] ?? "";
  return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (value: string): boolean => UUID.test(value);

/** A UUID route parameter (default `id`), or a 400. */
export const routeId = (event: H3Event, param = "id"): string => {
  const id = getRouterParam(event, param) ?? "";
  if (!isUuid(id)) httpError(400, "invalid_id", "Invalid id");
  return id;
};
