<script setup lang="ts">
/**
 * NoirImage - Landing page image with neo-grotesque noir effects
 *
 * Features:
 * - SVG duotone filter (always uses light variant for consistency)
 * - Scanline overlay
 * - Accent color tint
 * - Vignette effect
 * - 3D perspective transform
 * - Hover reveal animation (triggers on parent card hover)
 */

const props = defineProps<{
  src: string
  darkSrc?: string
  alt?: string
  height?: string
}>()

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

const imageSrc = computed(() => {
  if (isDark.value && props.darkSrc) {
    return props.darkSrc
  }
  return props.src
})

// Default height is 240px for consistent card sizing
const wrapperHeight = computed(() => props.height || '240px')
</script>

<template>
  <div class="noir-card-wrapper" :style="{ height: wrapperHeight }">
    <img
      :src="imageSrc"
      :alt="alt || ''"
      class="noir-image filter-violet-light"
    />
    <div class="scanlines" :class="{ 'scanlines-dark': isDark }"></div>
    <div class="accent-tint" :class="{ 'accent-tint-dark': isDark }"></div>
    <div class="vignette"></div>
  </div>
</template>

<style>
/* --- CARD STRUCTURE --- */
/* Using non-scoped styles to ensure hover works correctly */
.noir-card-wrapper {
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: 0.5rem;
  perspective: 1000px;
  transition: box-shadow 0.3s ease;
}

/* --- IMAGE LAYER --- */
.noir-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  /* Scale up and tilt for 3D effect, flattens on hover */
  transform: scale(1.1) rotateX(4deg) rotateY(2deg);
  transform-origin: center center;
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), filter 0.4s ease;
}

/* SVG Filter - always use light variant for consistency */
.filter-violet-light {
  filter: url('#lithos-duotone-light') contrast(1.15) brightness(1);
}

/* --- SCANLINE OVERLAY --- */
.noir-card-wrapper .scanlines {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 10;
  background: linear-gradient(
    to bottom,
    transparent 50%,
    rgba(0, 0, 0, 0.03) 50%
  );
  background-size: 100% 4px;
  opacity: 0.8;
  transition: opacity 0.3s ease;
}

.noir-card-wrapper .scanlines-dark {
  background: linear-gradient(
    to bottom,
    transparent 50%,
    rgba(255, 255, 255, 0.015) 50%
  );
  background-size: 100% 4px;
}

/* --- ACCENT TINT OVERLAY --- */
.noir-card-wrapper .accent-tint {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 5;
  background: linear-gradient(
    135deg,
    color-mix(in oklch, var(--color-violet-500) 15%, transparent) 0%,
    transparent 50%,
    color-mix(in oklch, var(--color-violet-500) 10%, transparent) 100%
  );
  opacity: 0.5;
  transition: opacity 0.4s ease, background 0.4s ease;
}

.noir-card-wrapper .accent-tint-dark {
  background: linear-gradient(
    135deg,
    color-mix(in oklch, var(--color-violet-600) 20%, transparent) 0%,
    transparent 40%,
    color-mix(in oklch, var(--color-violet-700) 15%, transparent) 100%
  );
  opacity: 0.7;
}

/* --- VIGNETTE --- */
.noir-card-wrapper .vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, transparent 50%, rgba(0, 0, 0, 0.35) 100%);
  z-index: 15;
  pointer-events: none;
  transition: opacity 0.4s ease;
}

/* --- HOVER STATES --- */
/* Target hover on parent UPageCard (has spotlight class) since it captures hover events */
[class*="spotlight"]:hover .noir-card-wrapper {
  box-shadow: 0 8px 30px -10px var(--color-violet-500);
}

[class*="spotlight"]:hover .noir-image {
  transform: scale(1.05) rotateX(0deg) rotateY(0deg);
}

[class*="spotlight"]:hover .scanlines {
  opacity: 0.3;
}

[class*="spotlight"]:hover .accent-tint {
  opacity: 0;
}

[class*="spotlight"]:hover .vignette {
  opacity: 0.5;
}

/* Fallback: Direct hover on wrapper (for standalone usage) */
.noir-card-wrapper:hover {
  box-shadow: 0 8px 30px -10px var(--color-violet-500);
}

.noir-card-wrapper:hover .noir-image {
  transform: scale(1.05) rotateX(0deg) rotateY(0deg);
}

.noir-card-wrapper:hover .scanlines {
  opacity: 0.3;
}

.noir-card-wrapper:hover .accent-tint {
  opacity: 0;
}

.noir-card-wrapper:hover .vignette {
  opacity: 0.5;
}
</style>
