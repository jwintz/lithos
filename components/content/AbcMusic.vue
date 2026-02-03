<script setup lang="ts">
/**
 * AbcMusic Component
 *
 * Renders ABC notation using abcjs.
 * Code is passed as base64-encoded string to avoid escaping issues.
 */

const props = defineProps<{
  code: string  // Base64 encoded ABC notation
  visualOptions?: any
}>()

const containerRef = ref<HTMLElement>()
let abcjs: any = null
const renderError = ref<string | null>(null)

// Decode the base64 ABC content
const decodedCode = computed(() => {
  if (!props.code) {
    console.warn('[AbcMusic] No code prop received')
    return ''
  }
  try {
    // Handle both base64 and plain text (for backward compatibility)
    if (props.code.match(/^[A-Za-z0-9+/=]+$/)) {
      const decoded = atob(props.code)
      console.log('[AbcMusic] Decoded ABC:', decoded.substring(0, 100))
      return decoded
    }
    console.log('[AbcMusic] Using plain text code')
    return props.code
  } catch (e) {
    console.warn('[AbcMusic] Failed to decode base64:', e)
    return props.code
  }
})

onMounted(async () => {
  console.log('[AbcMusic] Component mounted, code prop:', props.code?.substring(0, 50))
  if (import.meta.client) {
    try {
      const abcjsModule = await import('abcjs')
      abcjs = abcjsModule.default || abcjsModule
      console.log('[AbcMusic] abcjs loaded:', !!abcjs)
      render()
    } catch (e) {
      console.error('[AbcMusic] Failed to load abcjs:', e)
      renderError.value = `Failed to load abcjs: ${e}`
    }
  }
})

// Re-render when code changes
watch(decodedCode, () => {
  if (abcjs) render()
})

function render() {
  if (!containerRef.value || !abcjs || !decodedCode.value) {
    console.warn('[AbcMusic] Cannot render - missing:', {
      container: !!containerRef.value,
      abcjs: !!abcjs,
      code: !!decodedCode.value
    })
    return
  }

  // Default options for responsive layout
  const options = {
    responsive: 'resize',
    add_classes: true,
    ...props.visualOptions
  }

  try {
    // Render to SVG
    console.log('[AbcMusic] Rendering ABC notation...')
    abcjs.renderAbc(containerRef.value, decodedCode.value, options)
    console.log('[AbcMusic] Render complete')
  } catch (e) {
    console.error('[AbcMusic] Render failed:', e)
    renderError.value = `Render failed: ${e}`
  }
}
</script>

<template>
  <div class="abc-music-container">
    <div v-if="renderError" class="abc-error">{{ renderError }}</div>
    <div v-else-if="!code" class="abc-error">No ABC notation provided</div>
    <div ref="containerRef" class="abc-paper"></div>
  </div>
</template>

<style scoped>
.abc-music-container {
  margin: 1.5rem 0;
  padding: 1rem;
  background: var(--ui-bg);
  border-radius: 0.5rem;
  border: 1px solid var(--ui-border);
  overflow-x: auto;
}

/* Ensure SVG scales correctly */
.abc-paper :deep(svg) {
  width: 100%;
  height: auto;
}

/* ABCJS uses filled paths for note heads and stroked paths for stems/lines.
   Only override fill color, let stroke remain as default (none or inherit). */
.abc-paper :deep(svg path) {
  fill: var(--ui-text);
}

.abc-paper :deep(svg line) {
  stroke: var(--ui-text);
}

/* Text elements (tempo, dynamics, etc.) */
.abc-paper :deep(svg text) {
  fill: var(--ui-text) !important;
}

.abc-error {
  color: var(--color-red-500);
  padding: 0.5rem;
  font-size: 0.875rem;
}
</style>
