<template>
  <div
    aria-hidden="true"
    class="skeleton rounded-lg bg-gray-200 dark:bg-gray-700/60"
  />
</template>

<style scoped>
.skeleton {
  position: relative;
  overflow: hidden;
}

.skeleton::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(
    90deg,
    transparent,
    rgb(255 255 255 / 0.55),
    transparent
  );
  animation: shimmer 1.4s infinite;
}

:global(.dark) .skeleton::after {
  background: linear-gradient(
    90deg,
    transparent,
    rgb(255 255 255 / 0.08),
    transparent
  );
}

:global([dir="rtl"]) .skeleton::after {
  animation-direction: reverse;
}

@keyframes shimmer {
  to {
    transform: translateX(100%);
  }
}
</style>