<template>
  <LazyVButton
    variant="soft"
    size="sm"
    :aria-label="`Switch to ${nextLocale.name}`"
    @click="switchLocale"
    class="!rounded-full px-4 py-2"
  >
    <!-- Flag emoji + locale name -->
    <Transition name="locale-swap" mode="out-in">
      <span :key="locale" class="flex items-center gap-2">
        <span class="text-base leading-none">{{ nextLocale.flag }}</span>
        <LazyVIcon name="g-translate-icon" alt="translate" class="h-4 w-4" />
      </span>
    </Transition>
  </LazyVButton>
</template>

<script lang="ts" setup>
import type { LocaleMeta } from "~/types/shared/VToggleLocale";

const { locale, setLocale, locales } = useI18n();
const localePath = useLocalePath();
const router = useRouter();

const { visible: overlayVisible } = useLocaleOverlay();

const localeMeta: Record<string, LocaleMeta> = {
  en: { code: "en", flag: "EN", name: "English", label: "EN", dir: "ltr" },
  ar: { code: "ar", flag: "ع", name: "العربية", label: "ع", dir: "rtl" },
};

// The locale we'll switch TO when the button is clicked
const nextLocale = computed<LocaleMeta>(() => {
  const next = (locales.value as { code: string }[]).find(
    (l) => l.code !== locale.value
  );
  return localeMeta[next?.code ?? "en"] ?? localeMeta["en"];
});

const OVERLAY_FADE_MS = 250;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function switchLocale() {
  if (overlayVisible.value) return;
  const target = nextLocale.value.code;

  // Cover the screen first so the language/direction flip happens unseen
  overlayVisible.value = true;
  await wait(OVERLAY_FADE_MS);
  try {
    await applyLocale(target);
  } finally {
    await wait(150);
    overlayVisible.value = false;
  }
}

async function applyLocale(target: string) {
  // 1. Update @nuxtjs/i18n (handles cookie + URL prefix)
  await setLocale(target);

  // 2. Sync html attributes immediately
  document.documentElement.lang = target;
  document.documentElement.dir = nextLocale.value.dir === "rtl" ? "ltr" : "rtl";
  // Note: dir above is the CURRENT nextLocale dir before switching, so we use target:
  document.documentElement.dir = target === "ar" ? "rtl" : "ltr";

  // 3. Persist to localStorage so locale.client.ts plugin picks it up on reload
  localStorage.setItem("locale", target);

  // 4. Navigate to the same page in the new locale
  const current = router.currentRoute.value;
  const newPath = localePath(current.path, target);
  if (newPath !== current.fullPath) {
    await router.push(newPath);
  }
}
</script>

<style scoped>
.locale-swap-enter-active,
.locale-swap-leave-active {
  transition: all 0.2s ease;
}

.locale-swap-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.locale-swap-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>