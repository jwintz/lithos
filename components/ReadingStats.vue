<script setup lang="ts">
/**
 * ReadingStats - Reading time and word count panel
 *
 * Simple panel showing estimated reading time and word count.
 * Matches the minigraph panel styling.
 */

declare global {
  interface Window {
    __readingStatsDebug?: boolean
  }
}

const props = defineProps<{
  body: any
  path: string
}>()

// --- Word count and reading time ---

function countWords(node: any): number {
  if (!node) return 0

  // Direct string (text content)
  if (typeof node === 'string') {
    return node.split(/\s+/).filter(Boolean).length
  }

  // Minimark tuple format: ["tag", {attrs}, ...children]
  // This is the format used by Nuxt Content v3
  if (Array.isArray(node)) {
    // Skip first two elements (tag name, attributes)
    // Count words in children (elements 2+)
    let count = 0
    for (let i = 2; i < node.length; i++) {
      count += countWords(node[i])
    }
    return count
  }

  // Text node with value (legacy AST)
  if (node.type === 'text' && typeof node.value === 'string') {
    return node.value.split(/\s+/).filter(Boolean).length
  }

  // Element with text content
  if (typeof node.content === 'string') {
    return node.content.split(/\s+/).filter(Boolean).length
  }

  // Recurse into children array
  if (Array.isArray(node.children)) {
    return node.children.reduce((acc: number, child: any) => acc + countWords(child), 0)
  }

  // Body wrapper with children
  if (node.body && Array.isArray(node.body.children)) {
    return node.body.children.reduce((acc: number, child: any) => acc + countWords(child), 0)
  }

  // Direct children on the node (some formats)
  if (node.value && typeof node.value === 'object') {
    return countWords(node.value)
  }

  return 0
}

const wordCount = computed(() => {
  if (!props.body) return 0

  // Nuxt Content body: { type: 'minimark', value: [...], toc: {...} }
  // Content is in body.value (array of AST nodes)
  if (props.body.value && Array.isArray(props.body.value)) {
    return props.body.value.reduce((acc: number, child: any) => acc + countWords(child), 0)
  }

  // Fallback: { type: 'root', children: [...] }
  if (Array.isArray(props.body.children)) {
    return props.body.children.reduce((acc: number, child: any) => acc + countWords(child), 0)
  }

  return countWords(props.body)
})

const readingTime = computed(() => Math.max(1, Math.ceil(wordCount.value / 200)))
</script>

<template>
  <div class="reading-panel">
    <header class="panel-header">
      <span class="label">Reading</span>
    </header>

    <div class="panel-content">
      <!-- Reading time row -->
      <div class="stat-row">
        <UIcon name="i-lucide-clock" class="stat-icon" />
        <span class="stat-label">Time</span>
        <span class="stat-value">{{ readingTime }} min</span>
      </div>

      <!-- Word count row -->
      <div class="stat-row">
        <UIcon name="i-lucide-text" class="stat-icon" />
        <span class="stat-label">Words</span>
        <span class="stat-value">{{ wordCount.toLocaleString() }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reading-panel {
  margin: 0 0 1rem 0;
  border-radius: 0.5rem;
  overflow: hidden;
  border: 1px solid var(--ui-border);
  background: var(--ui-bg-muted);
  width: 100%;
  box-sizing: border-box;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: var(--lithos-bg-muted);
  border-bottom: 1px solid var(--lithos-border-subtle);
}

.panel-header .label {
  font-family: var(--font-ui, sans-serif);
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--lithos-text-tertiary);
}

.panel-content {
  padding: 0.5rem 0.75rem;
}

.stat-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
  font-size: 0.75rem;
}

.stat-icon {
  width: 0.875rem;
  height: 0.875rem;
  color: var(--ui-text-dimmed);
  flex-shrink: 0;
}

.stat-label {
  flex: 1;
  color: var(--ui-text-muted);
}

.stat-value {
  font-weight: 500;
  color: var(--ui-text-highlighted);
  font-variant-numeric: tabular-nums;
}
</style>
