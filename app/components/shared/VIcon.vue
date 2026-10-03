<template>
  <span
    class="inline-block shrink-0 bg-current"
    :class="[$attrs.class]"
    :style="{
      maskImage: `url('/svg/${name}.svg')`,
      WebkitMaskImage: `url('/svg/${name}.svg')`,
      maskSize: 'contain',
      WebkitMaskSize: 'contain',
      maskRepeat: 'no-repeat',
      WebkitMaskRepeat: 'no-repeat',
      maskPosition: 'center',
      WebkitMaskPosition: 'center',
    }"
    :aria-label="alt ?? name"
    role="img"
  />
</template>

<script lang="ts" setup>
defineOptions({ inheritAttrs: false });

defineProps<{
  /** Filename without extension, e.g. "close-icon" */
  name: string;
  /** Accessible label (defaults to name) */
  alt?: string;
}>();
</script>
