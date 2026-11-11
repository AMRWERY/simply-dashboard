<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="ayah"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        @click.self="close"
      >
        <div
          role="dialog"
          aria-modal="true"
          :aria-label="t('ayah_title')"
          class="relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 text-center shadow-2xl dark:bg-[#1e1f2b] dark:text-white"
        >
          <button
            type="button"
            class="absolute end-3 top-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
            :aria-label="t('close')"
            @click="close"
          >
            <LazyVIcon name="close-icon" class="h-6 w-6" />
          </button>

          <p
            lang="ar"
            dir="rtl"
            class="mt-6 text-2xl font-medium leading-loose text-gray-900 dark:text-white"
          >
            ﴿ {{ ayah.arabic }} ﴾
          </p>

          <!-- Audio player: play/pause, seek bar, elapsed and total time -->
          <div
            v-if="ayah.audio"
            dir="ltr"
            class="mt-6 flex items-center gap-3.5 rounded-2xl bg-gray-100 px-4 py-3 dark:bg-white/5"
          >
            <button
              type="button"
              class="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 outline-none transition-all duration-200 hover:bg-indigo-700 focus-visible:ring-4 focus-visible:ring-indigo-300 active:scale-95 dark:focus-visible:ring-indigo-700"
              :aria-label="playing ? t('pause') : t('play')"
              @click="toggle"
            >
              <LazyVIcon
                :name="playing ? 'pause-icon' : 'play-icon'"
                class="h-5 w-5"
              />
            </button>
            <div class="min-w-0 flex-1">
              <input
                type="range"
                min="0"
                max="100"
                step="0.1"
                :value="progress"
                :style="{ '--p': progress + '%' }"
                :aria-label="t('ayah_seek')"
                class="player-seek"
                @input="seek"
              />
              <div
                class="flex justify-between text-xs tabular-nums text-gray-500 dark:text-gray-400"
              >
                <span>{{ clock(current) }}</span>
                <span>{{ clock(duration) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts" setup>
const { t, locale } = useI18n();
const store = useAyahStore();
const { ayah } = storeToRefs(store);

const playing = ref(false);
const current = ref(0);
const duration = ref(0);
const progress = computed(() =>
  duration.value ? (current.value / duration.value) * 100 : 0,
);
let audio: HTMLAudioElement | undefined;

const clock = (sec: number) =>
  `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;

const stop = () => {
  audio?.pause();
  audio = undefined;
  playing.value = false;
  current.value = 0;
};

const close = () => {
  stop();
  store.close();
};

const ensureAudio = () => {
  if (audio || !ayah.value?.audio) return audio;
  audio = new Audio(ayah.value.audio);
  audio.addEventListener(
    "loadedmetadata",
    () => (duration.value = audio?.duration ?? 0),
  );
  audio.addEventListener(
    "timeupdate",
    () => (current.value = audio?.currentTime ?? 0),
  );
  audio.addEventListener("pause", () => (playing.value = false));
  audio.addEventListener("play", () => (playing.value = true));
  audio.addEventListener("ended", () => {
    playing.value = false;
    current.value = 0;
  });
  audio.addEventListener("error", stop);
  return audio;
};

const toggle = () => {
  const el = ensureAudio();
  if (!el) return;
  if (!el.paused) return el.pause();
  el.play().catch(stop);
};

const seek = (ev: Event) => {
  const el = ensureAudio();
  if (!el || !duration.value) return;
  el.currentTime =
    (Number((ev.target as HTMLInputElement).value) / 100) * duration.value;
  current.value = el.currentTime;
};

const onKey = (ev: KeyboardEvent) => ev.key === "Escape" && close();

// Once per app open: the store fetches a random Ayah through /api/ayah.
onMounted(async () => {
  await store.load(locale.value);
  if (ayah.value) window.addEventListener("keydown", onKey);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKey);
  stop();
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.player-seek {
  width: 100%;
  height: 20px;
  margin: 0;
  background: transparent;
  appearance: none;
  cursor: pointer;
}
.player-seek::-webkit-slider-runnable-track {
  height: 6px;
  border-radius: 999px;
  background: linear-gradient(
    to right,
    #4f46e5 var(--p),
    rgb(156 163 175 / 0.35) var(--p)
  );
}
.player-seek::-moz-range-track {
  height: 6px;
  border-radius: 999px;
  background: linear-gradient(
    to right,
    #4f46e5 var(--p),
    rgb(156 163 175 / 0.35) var(--p)
  );
}
.player-seek::-webkit-slider-thumb {
  appearance: none;
  width: 14px;
  height: 14px;
  margin-top: -4px;
  border-radius: 50%;
  background: #4f46e5;
}
.player-seek::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border: 0;
  border-radius: 50%;
  background: #4f46e5;
}
</style>
