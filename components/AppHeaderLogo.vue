<script setup lang="ts">
import { withBase } from 'ufo'

/**
 * AppHeaderLogo - Custom header logo for Lithos
 *
 * Overrides Docus default. Features:
 * - Light/dark theme aware (CSS filter inversion)
 * - Blink effect on hover (swaps to blink variant)
 * - Randomized idle blink: single or double, in [0-20]sec random intervals
 */

const config = useRuntimeConfig()
const baseURL = config.app.baseURL || '/'

const siteTitle = computed(() => {
  // Priority: siteName (from vault config) > vaultName (folder name) > 'Lithos'
  const name = (config.public.siteName as string) || (config.public.vaultName as string) || 'Lithos'
  return name.charAt(0).toUpperCase() + name.slice(1)
})

// Use computed for reactive base URL resolution
const defaultLogoPath = computed(() => withBase('/logo.svg', baseURL))
const defaultBlinkPath = computed(() => withBase('/logo-blink.svg', baseURL))
const rawLogoPath = computed(() => withBase('/_raw/logo.svg', baseURL))
const rawBlinkPath = computed(() => withBase('/_raw/logo-blink.svg', baseURL))

const useRawLogo = ref(true) // Try raw first, fallback to public
const isFallback = ref(false)
const isBlinking = ref(false)
let blinkTimer: ReturnType<typeof setTimeout> | null = null
let hoverActive = false

const logoSrc = computed(() => {
  if (isFallback.value) return defaultLogoPath.value
  return useRawLogo.value ? rawLogoPath.value : defaultLogoPath.value
})

const blinkSrc = computed(() => {
  if (isFallback.value) return defaultLogoPath.value // No blink if fallback
  return useRawLogo.value ? rawBlinkPath.value : defaultBlinkPath.value
})

const currentSrc = computed(() => isBlinking.value ? blinkSrc.value : logoSrc.value)

function onLogoError() {
  // If raw logo fails, try public logo
  if (useRawLogo.value) {
    useRawLogo.value = false
  } else if (!isFallback.value) {
    // If public logo also fails, mark as fallback (disable blinking)
    isFallback.value = true
  }
  isBlinking.value = false
}

// Single blink: 150ms
function singleBlink() {
  isBlinking.value = true
  setTimeout(() => {
    isBlinking.value = false
  }, 150)
}

// Double blink: blink, pause, blink
function doubleBlink() {
  isBlinking.value = true
  setTimeout(() => {
    isBlinking.value = false
    setTimeout(() => {
      isBlinking.value = true
      setTimeout(() => {
        isBlinking.value = false
      }, 150)
    }, 200)
  }, 150)
}

function scheduleBlink() {
  if (isFallback.value) return // Don't blink if fallback
  
  // Random delay between 0 and 20 seconds
  const delay = Math.random() * 20000
  
  blinkTimer = setTimeout(() => {
    if (!hoverActive && !isFallback.value) {
      // 30% chance of double blink, 70% single blink
      if (Math.random() < 0.3) {
        doubleBlink()
      } else {
        singleBlink()
      }
    }
    // Schedule next blink
    scheduleBlink()
  }, delay)
}

function onMouseEnter() {
  hoverActive = true
  if (!isFallback.value) {
    isBlinking.value = true
  }
}

function onMouseLeave() {
  hoverActive = false
  isBlinking.value = false
}

onMounted(() => {
  // Start random blinking schedule
  scheduleBlink()
})

onUnmounted(() => {
  if (blinkTimer) clearTimeout(blinkTimer)
})
</script>

<template>
  <div
    class="header-logo cursor-pointer"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <ClientOnly>
      <img
        :src="currentSrc"
        @error="onLogoError"
        alt="Lithos"
        class="logo-img"
      />
      <template #fallback>
        <img
          :src="defaultLogoPath"
          alt="Lithos"
          class="logo-img"
        />
      </template>
    </ClientOnly>
    <span class="logo-text">{{ siteTitle }}</span>
  </div>
</template>

<style scoped>
.header-logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: inherit;
}

.logo-img {
  height: 28px;
  width: auto;
  /* Dark source image: invert for dark backgrounds */
  filter: none;
  transition: filter 0.2s ease;
}

/* Light mode: logo is dark, show as-is */
:root:not(.dark) .logo-img {
  filter: none;
}

/* Dark mode: invert the dark logo to appear light */
.dark .logo-img {
  filter: invert(1) hue-rotate(180deg);
}

.logo-text {
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}
</style>
