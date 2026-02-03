<script setup lang="ts">
/**
 * LocalGraph Component
 *
 * Displays a compact force-directed graph in the sidebar
 * showing the current page and its connections.
 * Uses shared graph data composable to avoid duplicate API calls.
 */

interface GraphNode {
  id: string
  title: string
  path: string
  tags: string[]
  folder: string
  isTag?: boolean
}

const props = defineProps<{
  path: string
  depth?: number
}>()

// Modal state
const isModalOpen = ref(false)

// Container ref for measuring available width
const containerRef = ref<HTMLElement>()
const graphWidth = ref(180)  // Start with a conservative default

// Measure container width on mount
onMounted(() => {
  nextTick(() => {
    updateGraphWidth()
  })
})

// Update graph width based on container
function updateGraphWidth() {
  if (containerRef.value) {
    // Use getBoundingClientRect for more accurate measurements
    const rect = containerRef.value.getBoundingClientRect()
    // Subtract padding/borders and use a safe margin
    const availableWidth = Math.floor(rect.width) - 2 // 2px for border
    graphWidth.value = Math.max(140, Math.min(availableWidth, 300)) // Cap between 140-300
  }
}

// Re-measure on window resize
if (import.meta.client) {
  const resizeObserver = new ResizeObserver(() => {
    updateGraphWidth()
  })
  
  onMounted(() => {
    if (containerRef.value) {
      resizeObserver.observe(containerRef.value)
    }
  })
  
  onUnmounted(() => {
    resizeObserver.disconnect()
  })
}

// Use shared graph data (cached, lazy-loaded)
const { localGraph, isLoading } = useLocalGraph(toRef(props, 'path'), props.depth ?? 1)

// Handle node click
function handleNodeClick(node: GraphNode) {
  navigateTo(node.path)
}

// Open modal
function openModal() {
  isModalOpen.value = true
}
</script>

<template>
  <div ref="containerRef" class="local-graph-container">
    <header class="local-graph-header">
      <span class="label">Graph</span>
      <button class="expand-btn" title="Open full graph" @click="openModal">
        <UIcon name="i-lucide-maximize-2" />
      </button>
    </header>
    
    <div class="local-graph-canvas">
      <ClientOnly>
        <div v-if="isLoading" class="h-full flex items-center justify-center">
          <UIcon name="i-lucide-loader-2" class="animate-spin text-muted" />
        </div>
        <ForceGraph
          v-else
          :nodes="localGraph.nodes"
          :links="localGraph.links"
          :width="graphWidth"
          :height="Math.min(Math.round(graphWidth * 0.5), 120)"
          :highlight-path="path"
          :node-size="3"
          :link-width="0.5"
          :show-labels="false"
          :warmup-ticks="100"
          :cooldown-time="1000"
          :auto-zoom="false"
          background-color="transparent"
          @node-click="handleNodeClick"
        />
        <template #fallback>
          <div class="h-40 flex items-center justify-center">
            <UIcon name="i-lucide-loader-2" class="animate-spin text-muted" />
          </div>
        </template>
      </ClientOnly>
    </div>

    <!-- Graph Modal -->
    <GraphModal v-model:open="isModalOpen" :current-path="path" />
  </div>
</template>

<style scoped>
.local-graph-container {
  margin: 0 0 1rem 0;
  border-radius: 0.5rem;
  overflow: hidden;
  border: 1px solid var(--ui-border);
  background: var(--ui-bg-muted);
  /* Ensure container respects parent boundaries */
  max-width: 100%;
  box-sizing: border-box;
}

.local-graph-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: var(--lithos-bg-muted);
  border-bottom: 1px solid var(--lithos-border-subtle);
}

.local-graph-header .label {
  font-family: var(--font-ui, sans-serif);
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--lithos-text-tertiary);
}

.expand-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--lithos-text-tertiary);
  transition: color 0.2s;
}

.expand-btn:hover {
  color: var(--lithos-text-primary);
}

.local-graph-canvas {
  aspect-ratio: 2/1;
  width: 100%;
  max-height: 120px;
  overflow: hidden;
}

/* Ensure the canvas doesn't overflow */
.local-graph-canvas :deep(canvas) {
  max-width: 100%;
  height: auto;
}
</style>
