<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <LazyVToast ref="toastRef" />

    <LazyVLocaleOverlay />
  </div>
</template>

<script lang="ts" setup>
const { register } = useToast();

// Render lang/dir on <html> from the active locale (SSR included) so RTL
// survives a refresh instead of being applied only after hydration.
const { locale } = useI18n();

const toastRef = useTemplateRef("toastRef");

onMounted(() => register(toastRef.value));

useHead({
  htmlAttrs: {
    lang: computed(() => locale.value),
    dir: computed(() => (locale.value === "ar" ? "rtl" : "ltr")),
  },
});
</script>

<style>
.page-enter-active,
.page-leave-active {
  transition: all 0.4s;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
  filter: blur(1rem);
}

.layout-enter-active,
.layout-leave-active {
  transition: all 0.4s;
}

.layout-enter-from,
.layout-leave-to {
  filter: grayscale(1);
}
</style>