<script setup lang="ts">
import { withBase } from 'ufo'

const props = defineProps({
  src: {
    type: String,
    default: ''
  },
  alt: {
    type: String,
    default: ''
  },
  width: {
    type: [String, Number],
    default: undefined
  },
  height: {
    type: [String, Number],
    default: undefined
  }
})

const refinedSrc = computed(() => {
  if (props.src?.startsWith('/') && !props.src.startsWith('//')) {
    const _base = withBase(props.src, useRuntimeConfig().app.baseURL)
    if (_base !== props.src) {
      return _base
    }
  }
  return props.src
})

const isNoir = ref(true)
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

function toggleNoir() {
  isNoir.value = !isNoir.value
}
</script>

<template>
  <figure class="prose-img-cartridge my-8 rounded-lg overflow-hidden shadow-sm" style="border: 1px solid var(--ui-border); background: var(--ui-bg);">
    <!-- Cartridge Header -->
    <div class="cartridge-header flex items-center justify-between px-3 py-2" style="border-bottom: 1px solid var(--ui-border); background: var(--ui-bg-muted);">
      <div class="flex items-center gap-2 overflow-hidden">
        <UIcon name="i-lucide-image" class="w-4 h-4 text-gray-400" />
        <span class="text-xs font-mono text-gray-500 uppercase truncate select-none" :title="props.alt">
          {{ props.alt || 'IMAGE.IMG' }}
        </span>
      </div>
      
      <button 
        @click="toggleNoir"
        class="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border transition-all duration-200 select-none flex items-center gap-1.5"
        :class="isNoir 
          ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-900 hover:bg-violet-500/20' 
          : 'bg-gray-200 dark:bg-gray-800 text-gray-500 border-gray-300 dark:border-gray-700 hover:bg-gray-300 dark:hover:bg-gray-700'"
      >
        <div class="w-1.5 h-1.5 rounded-full" :class="isNoir ? 'bg-violet-500 animate-pulse' : 'bg-gray-400'" />
        {{ isNoir ? 'FILTER: ON' : 'FILTER: OFF' }}
      </button>
    </div>

    <!-- Image Container -->
    <div class="relative group content-center" :class="{ 'noir-active': isNoir }">
      <img 
        :src="refinedSrc" 
        :alt="props.alt" 
        :width="props.width" 
        :height="props.height"
        class="block w-full h-auto transition-all duration-500 ease-in-out"
        :class="{ 'noir-filter': isNoir }"
        loading="lazy"
      />
      
      <!-- Overlays (Only when Noir is active) -->
      <template v-if="isNoir">
        <div class="scanlines absolute inset-0 z-10 opacity-80 pointer-events-none" :class="{ 'scanlines-dark': isDark }" />
        <div class="accent-tint absolute inset-0 z-20 opacity-40 dark:opacity-60 pointer-events-none" :class="{ 'accent-tint-dark': isDark }" />
        <div class="vignette absolute inset-0 z-30 opacity-0 group-hover:opacity-60 transition-opacity duration-300 pointer-events-none" />
      </template>
    </div>
  </figure>
</template>

<style scoped>
/* Reuse styles consistent with NoirImage */

/* 1. Base Filter - CSS-only, no SVG dependency */
.noir-filter {
  filter: grayscale(100%) sepia(20%) hue-rotate(200deg) saturate(150%) contrast(1.15) brightness(1);
  will-change: transform, filter;
}

/* Other effects moved to global main.css */
</style>
