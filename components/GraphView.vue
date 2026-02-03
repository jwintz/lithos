<script setup lang="ts">
/**
 * GraphView Component
 * 
 * Full-page graph visualization using ForceGraph.
 */

interface GraphNode {
  id: string
  title: string
  path: string
  tags: string[]
  folder: string
}

interface GraphLink {
  source: string
  target: string
}

interface Graph {
  nodes: GraphNode[]
  edges: GraphLink[]
}

// Fetch graph data
const { data: graph } = await useFetch<Graph>('/api/graph', {
  default: () => ({ nodes: [], edges: [] })
})

// Reactive dimensions
const containerRef = ref<HTMLElement>()
const dimensions = reactive({ width: 800, height: 600 })

// Settings
const settings = reactive({
  showLabels: true,
  showArrows: false,
  nodeSize: 4,
  linkWidth: 1,
  searchQuery: ''
})

// Filtered graph
const filteredGraph = computed(() => {
  if (!graph.value) return { nodes: [], links: [] }
  
  let nodes = [...(graph.value.nodes || [])]
  let edges = [...(graph.value.edges || [])]
  
  // Search filter
  if (settings.searchQuery) {
    const q = settings.searchQuery.toLowerCase()
    nodes = nodes.filter(n => 
      n.title?.toLowerCase().includes(q) || 
      n.path?.toLowerCase().includes(q)
    )
    const nodeIds = new Set(nodes.map(n => n.id))
    edges = edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target))
  }
  
  return { nodes, links: edges }
})

// Handle node click
function handleNodeClick(node: GraphNode) {
  navigateTo(node.path)
}

// Update dimensions on mount
onMounted(() => {
  if (containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect()
    dimensions.width = rect.width
    dimensions.height = rect.height
  }
  
  // Resize observer
  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      dimensions.width = entry.contentRect.width
      dimensions.height = entry.contentRect.height
    }
  })
  
  if (containerRef.value) {
    observer.observe(containerRef.value)
  }
  
  onUnmounted(() => observer.disconnect())
})
</script>

<template>
  <div class="graph-view">
    <!-- Toolbar -->
    <div class="flex items-center gap-4 p-3 border-b border-default bg-muted">
      <UInput
        v-model="settings.searchQuery"
        placeholder="Search nodes..."
        icon="i-lucide-search"
        size="sm"
        class="w-64"
      />
      
      <div class="flex-1" />
      
      <UCheckbox v-model="settings.showLabels" label="Labels" />
      <UCheckbox v-model="settings.showArrows" label="Arrows" />
      
      <div class="flex items-center gap-2">
        <span class="text-xs text-muted">Node size</span>
        <USlider v-model="settings.nodeSize" :min="2" :max="10" :step="1" class="w-20" />
      </div>
      
      <span class="text-xs text-muted">
        {{ filteredGraph.nodes.length }} nodes, {{ filteredGraph.links.length }} links
      </span>
    </div>
    
    <!-- Graph -->
    <div ref="containerRef" class="flex-1 min-h-0">
      <ClientOnly>
        <ForceGraph
          :nodes="filteredGraph.nodes"
          :links="filteredGraph.links"
          :width="dimensions.width"
          :height="dimensions.height"
          :node-size="settings.nodeSize"
          :link-width="settings.linkWidth"
          :show-labels="settings.showLabels"
          :show-arrows="settings.showArrows"
          background-color="transparent"
          @node-click="handleNodeClick"
        />
        <template #fallback>
          <div class="h-full flex items-center justify-center">
            <UIcon name="i-lucide-loader-2" class="animate-spin text-muted size-8" />
          </div>
        </template>
      </ClientOnly>
    </div>
  </div>
</template>

<style scoped>
.graph-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--ui-bg);
}
</style>
