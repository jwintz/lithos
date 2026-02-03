<script setup lang="ts">
/**
 * Global Graph Page
 * 
 * Full-viewport interactive knowledge graph visualization.
 */

definePageMeta({
  layout: 'landing',
})

useSeoMeta({
  title: 'Knowledge Graph',
  description: 'Interactive visualization of all notes and their connections'
})

// Use shared graph data
const { graph, isLoading } = useGraphData()

// UI state
const searchQuery = ref('')
const showLabels = ref(true)
const showArrows = ref(false)
const nodeSize = ref(4)
const linkWidth = ref(1)

// Container ref for dynamic sizing
const containerRef = ref<HTMLElement>()
const graphWidth = ref(800)
const graphHeight = ref(600)

// Update dimensions on resize
function updateDimensions() {
  if (containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect()
    graphWidth.value = Math.floor(rect.width)
    graphHeight.value = Math.floor(rect.height)
  }
}

onMounted(() => {
  updateDimensions()
  window.addEventListener('resize', updateDimensions)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateDimensions)
})

// Filtered graph based on search
const filteredGraph = computed(() => {
  if (!graph.value) return { nodes: [], links: [] }
  
  let nodes = graph.value.nodes
  
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    nodes = nodes.filter(n =>
      n.title?.toLowerCase().includes(q) ||
      n.tags?.some((t: string) => t.toLowerCase().includes(q)) ||
      n.folder?.toLowerCase().includes(q) ||
      n.path?.toLowerCase().includes(q)
    )
  }
  
  const nodeIds = new Set(nodes.map(n => n.id))
  const links = (graph.value.edges || []).filter((e: any) =>
    nodeIds.has(e.source) && nodeIds.has(e.target)
  )
  
  return { nodes, links }
})

// Handle node click - navigate to the page
function handleNodeClick(node: any) {
  navigateTo(node.path)
}
</script>

<template>
  <div class="graph-page">
    <!-- Toolbar - uses UContainer like UHeader -->
    <div class="graph-toolbar">
      <UContainer class="toolbar-container">
        <div class="toolbar-left">
          <UButton
            to="/"
            color="neutral"
            variant="ghost"
            leading-icon="i-lucide-arrow-left"
          >
            Back
          </UButton>
        </div>
        
        <div class="toolbar-center">
          <h1 class="toolbar-title">Knowledge Graph</h1>
          <UBadge color="neutral" variant="subtle">
            {{ filteredGraph.nodes.length }} nodes
          </UBadge>
          <UBadge color="neutral" variant="subtle">
            {{ filteredGraph.links.length }} links
          </UBadge>
        </div>
        
        <div class="toolbar-right">
          <UInput
            v-model="searchQuery"
            icon="i-lucide-search"
            placeholder="Filter..."
            class="toolbar-search"
          />
        </div>
      </UContainer>
    </div>
    
    <!-- Graph viewport -->
    <div ref="containerRef" class="graph-viewport">
      <div v-if="isLoading" class="graph-loading">
        <UIcon name="i-lucide-loader-2" class="animate-spin" />
        <span>Loading graph...</span>
      </div>
      
      <ClientOnly v-else>
        <ForceGraph
          :nodes="filteredGraph.nodes"
          :links="filteredGraph.links"
          :width="graphWidth"
          :height="graphHeight"
          :node-size="nodeSize"
          :link-width="linkWidth"
          :show-labels="showLabels"
          :show-arrows="showArrows"
          :auto-zoom="true"
          :warmup-ticks="80"
          :cooldown-time="3000"
          background-color="transparent"
          @node-click="handleNodeClick"
        />
        <template #fallback>
          <div class="graph-loading">
            <UIcon name="i-lucide-loader-2" class="animate-spin" />
            <span>Initializing...</span>
          </div>
        </template>
      </ClientOnly>
      
      <!-- Controls overlay -->
      <div class="graph-controls">
        <UCard :ui="{ body: 'p-3' }">
          <div class="controls-grid">
            <div class="control-item">
              <span class="control-label">Labels</span>
              <USwitch v-model="showLabels" />
            </div>
            
            <div class="control-item">
              <span class="control-label">Arrows</span>
              <USwitch v-model="showArrows" />
            </div>
            
            <USeparator class="col-span-2" />
            
            <div class="control-item col-span-2">
              <span class="control-label">Node size</span>
              <USlider v-model="nodeSize" :min="2" :max="10" :step="1" class="flex-1" />
            </div>
            
            <div class="control-item col-span-2">
              <span class="control-label">Link width</span>
              <USlider v-model="linkWidth" :min="0.5" :max="3" :step="0.5" class="flex-1" />
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

<style scoped>
.graph-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - var(--header-height, 64px) - var(--footer-height, 57px));
}

.graph-toolbar {
  border-bottom: 1px solid var(--ui-border);
  background: var(--ui-bg);
  flex-shrink: 0;
}

.toolbar-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
}

.toolbar-left {
  display: flex;
  align-items: center;
}

.toolbar-center {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.toolbar-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.toolbar-right {
  display: flex;
  align-items: center;
}

.toolbar-search {
  width: 180px;
}

.graph-viewport {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: var(--ui-bg);
}

.graph-loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: var(--ui-text-muted);
  font-size: 0.875rem;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.graph-controls {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  z-index: 10;
  min-width: 180px;
}

.controls-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  align-items: center;
}

.control-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.control-item.col-span-2 {
  grid-column: span 2;
}

.control-label {
  font-size: 0.75rem;
  color: var(--ui-text-muted);
  white-space: nowrap;
}

/* Responsive */
@media (max-width: 640px) {
  .toolbar-container {
    flex-direction: column;
    height: auto;
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
    gap: 0.5rem;
  }
  
  .toolbar-center {
    order: -1;
  }
  
  .toolbar-search {
    width: 100%;
  }
  
  .graph-controls {
    left: 1rem;
    right: 1rem;
    min-width: auto;
  }
}
</style>
