/**
 * GET /api/ayah — one random Ayah (with its recitation) for the "opened the app"
 * dialog. ?lang=en adds the English translation.
 */
export default defineEventHandler(async (event) => {
  await requireUser(event);
  const { lang } = getQuery(event);
  setHeader(event, "Cache-Control", "no-store"); // a new random Ayah every time
  try {
    return await fetchRandomAyah(lang === "en");
  } catch {
    httpError(502, "ayah_unavailable", "Ayah unavailable");
  }
});
