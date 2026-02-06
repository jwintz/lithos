<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'

const props = defineProps<{
  modelValue: string
  language?: string
  readOnly?: boolean
  theme?: string
}>()

const emit = defineEmits(['update:modelValue', 'change'])

const editorContainer = ref<HTMLElement | null>(null)
let editorInstance: any = null
let monaco: any = null

const colorMode = useColorMode()
const isLoading = ref(true)
const loadError = ref(false)
const useSimpleEditor = ref(false)

// Compute lines for the simple editor fallback
const lines = computed(() => {
  return props.modelValue.split('\n')
})

// Set up Monaco Environment for bundled workers
// This must be done before Monaco is imported
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.MonacoEnvironment = {
    getWorker(_moduleId: string, label: string) {
      // For bundled Monaco, we can use inline workers
      // Create a minimal worker that handles basic messages
      const workerCode = `
        self.onmessage = function(e) {
          // Handle initialize message
          if (e.data && e.data.type === 'initialize') {
            self.postMessage({ type: 'initialized' });
          }
        };
      `
      const blob = new Blob([workerCode], { type: 'application/javascript' })
      return new Worker(URL.createObjectURL(blob))
    }
  }
}

// Load Monaco dynamically
onMounted(async () => {
  if (!editorContainer.value) return

  try {
    // Dynamic import - Monaco is now bundled locally, not from CDN
    monaco = await import('monaco-editor')
    
    // Register custom themes
    registerLithosThemes()

    // Initialize editor
    editorInstance = monaco.editor.create(editorContainer.value, {
      value: props.modelValue,
      language: props.language || 'markdown',
      theme: getCurrentTheme(),
      readOnly: props.readOnly ?? true,
      automaticLayout: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 14,
      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
      lineNumbers: 'on',
      renderLineHighlight: 'all',
      padding: { top: 16, bottom: 16 },
      wordWrap: 'on',
      // Disable worker-heavy features for better static site compatibility
      quickSuggestions: false,
      suggestOnTriggerCharacters: false,
      parameterHints: { enabled: false },
      formatOnType: false,
      formatOnPaste: false,
      folding: true,
      hover: { enabled: false },
      contextmenu: false,
      codeLens: false
    })

    // Handle content changes (if not read-only)
    editorInstance.onDidChangeModelContent(() => {
      const value = editorInstance.getValue()
      emit('update:modelValue', value)
      emit('change', value)
    })
    
    // Watch for color mode changes
    watch(() => colorMode.value, () => {
      if (editorInstance && monaco) {
        monaco.editor.setTheme(getCurrentTheme())
      }
    })

    isLoading.value = false

  } catch (e) {
    console.error('Failed to load Monaco Editor, using fallback:', e)
    useSimpleEditor.value = true
    loadError.value = true
    isLoading.value = false
  }
})

// Cleanup
onBeforeUnmount(() => {
  if (editorInstance) {
    editorInstance.dispose()
  }
})

// Watch model value updates from parent
watch(() => props.modelValue, (newValue) => {
  if (editorInstance && newValue !== editorInstance.getValue()) {
    editorInstance.setValue(newValue)
  }
})

// Helper to get current theme name based on color mode
function getCurrentTheme() {
  return colorMode.value === 'dark' ? 'lithos-dark' : 'lithos-light'
}

// Register custom themes using CSS variables
function registerLithosThemes() {
  if (!monaco) return
  
  monaco.editor.defineTheme('lithos-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: '', foreground: '18181b', background: 'ffffff' },
      { token: 'comment', foreground: '71717a' },
      { token: 'keyword', foreground: '7c3aed' },
      { token: 'string', foreground: '059669' },
    ],
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#18181b',
      'editorLineNumber.foreground': '#a1a1aa',
      'editor.lineHighlightBackground': '#f4f4f5',
      'editorCursor.foreground': '#7c3aed',
      'editor.selectionBackground': '#ddd6fe',
    }
  })

  monaco.editor.defineTheme('lithos-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '', foreground: 'e4e4e7', background: '18181b' },
      { token: 'comment', foreground: 'a1a1aa' },
      { token: 'keyword', foreground: 'a78bfa' },
      { token: 'string', foreground: '34d399' },
    ],
    colors: {
      'editor.background': '#18181b',
      'editor.foreground': '#e4e4e7',
      'editorLineNumber.foreground': '#52525b',
      'editor.lineHighlightBackground': '#27272a',
      'editorCursor.foreground': '#a78bfa',
      'editor.selectionBackground': '#5b21b6',
    }
  })
}
</script>

<template>
  <div class="monaco-wrapper">
    <!-- Loading state -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner" />
      <span>Loading editor...</span>
    </div>
    
    <!-- Monaco editor container -->
    <div 
      v-show="!isLoading && !useSimpleEditor"
      ref="editorContainer" 
      class="monaco-editor-container"
    />
    
    <!-- Simple code viewer fallback -->
    <div v-if="useSimpleEditor" class="simple-editor">
      <div class="line-numbers">
        <div v-for="(_, i) in lines" :key="i" class="line-number">{{ i + 1 }}</div>
      </div>
      <pre class="code-content"><code>{{ modelValue }}</code></pre>
    </div>
  </div>
</template>

<style scoped>
.monaco-wrapper {
  position: relative;
  width: 100%;
  min-height: 400px;
  border: 1px solid var(--ui-border, #e4e4e7);
  border-radius: 0.5rem;
  overflow: hidden;
  background: var(--ui-bg, #ffffff);
}

.dark .monaco-wrapper {
  border-color: #3f3f46;
  background: #18181b;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  height: 70vh;
  min-height: 400px;
  color: var(--ui-text-muted, #71717a);
}

.loading-spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.monaco-editor-container {
  width: 100%;
  height: 70vh;
  min-height: 400px;
}

/* Simple editor styles for fallback */
.simple-editor {
  display: flex;
  height: 70vh;
  min-height: 400px;
  overflow: auto;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 14px;
  line-height: 1.6;
}

.line-numbers {
  flex-shrink: 0;
  padding: 1rem 0.75rem;
  background: var(--ui-bg-elevated, #f4f4f5);
  color: var(--ui-text-muted, #a1a1aa);
  text-align: right;
  user-select: none;
  border-right: 1px solid var(--ui-border, #e4e4e7);
}

.dark .line-numbers {
  background: #27272a;
  color: #52525b;
  border-color: #3f3f46;
}

.line-number {
  height: 1.6em;
}

.code-content {
  flex: 1;
  margin: 0;
  padding: 1rem;
  overflow-x: auto;
  white-space: pre;
  color: var(--ui-text, #18181b);
}

.dark .code-content {
  color: #e4e4e7;
}
</style>
