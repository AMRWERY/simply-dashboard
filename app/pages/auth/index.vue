<template>
  <div>
    <login-card />
  </div>
</template>

<script lang="ts" setup>
// const { t } = useI18n();

definePageMeta({
  layout: "auth",
  middleware: "guest",
});

useSeoPage({
  title: () => "Sign In",
  description: () => "Sign In",
  private: true,
});
</script>