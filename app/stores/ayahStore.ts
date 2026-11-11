export interface Ayah {
  arabic: string;
  audio?: string;
  translation?: string;
  numberInSurah: number;
  surahName: string;
  surahEnglishName: string;
}

/** The Ayah shown in a dialog once each time the app is opened (not on every navigation). */
export const useAyahStore = defineStore("ayah", () => {
  const ayah = ref<Ayah | null>(null);
  const api = useApi();
  let requested = false;

  /** Fetch one Ayah from our server (once per page load). A failure just means no dialog. */
  const load = async (lang: string) => {
    if (requested) return;
    requested = true;
    try {
      ayah.value = await api<Ayah>("/api/ayah", { query: { lang } });
    } catch {
      /* offline or the Quran API is down: skip the dialog */
    }
  };

  const close = () => {
    ayah.value = null;
  };

  return { ayah, load, close };
});
