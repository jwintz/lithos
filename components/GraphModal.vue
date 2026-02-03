<script setup lang="ts">
/**
 * GraphModal Component
 * 
 * Uses NuxtUI UModal for proper styling and accessibility.
 * Features:
 * - Local/Global toggle with SEPARATE settings
 * - Filter options (local: depth/direction/tags/attachments, global: orphans/tags/attachments/search)
 * - Display options (labels, arrows, text fade threshold)
 * - Physics sliders (node size, link width)
 */

interface GraphNode {
  id: string
  title: string
  path: string
  tags: string[]
  folder: string
  isAttachment?: boolean
}

interface GraphLink {
  source: string
  target: string
}

interface Graph {
  nodes: GraphNode[]
  links: GraphLink[]
}

const props = defineProps<{
  currentPath?: string
}>()

const isOpen = defineModel<boolean>('open', { default: false })

// View mode: local or global
const viewMode = ref<'local' | 'global'>('local')

// Separate settings for local and global views
const localSettings = reactive({
  // Filters
  includeOutgoing: true,
  includeIncoming: true,
  includeNeighbors: false,
  includeTags: true,
  includeAttachments: true,
  depth: 1,
  // Display
  showLabels: true,
  showArrows: false,
  textFadeThreshold: 1.0,
  nodeSize: 4,
  linkWidth: 1,
})

const globalSettings = reactive({
  // Filters
  includeOrphans: true,
  includeTags: true,
  includeAttachments: true,
  searchQuery: '',
  // Display
  showLabels: true,
  showArrows: false,
  textFadeThreshold: 1.0,
  nodeSize: 4,
  linkWidth: 1,
})

// Use shared graph data (cached, lazy-loaded)
const { graph } = useGraphData()

// Build local subgraph with BFS
// Matches the sidebar implementation in useLocalGraph for consistency
function getLocalSubgraph(centerPath: string, depth: number) {
  if (!graph.value) return { nodes: [], links: [] }

  const visitedNodes = new Set<string>([centerPath])
  const nodeDepths = new Map<string, number>([[centerPath, 0]])
  const resultLinks: GraphLink[] = []
  const addedLinks = new Set<string>()

  const queue: { id: string; d: number }[] = [{ id: centerPath, d: 0 }]

  while (queue.length > 0) {
    const { id: currentId, d: currentDepth } = queue.shift()!

    if (currentDepth >= depth) continue

    for (const edge of graph.value.edges || []) {
      // Skip tag edges if tags are disabled
      if (!localSettings.includeTags) {
        if (edge.source.startsWith('tags/') || edge.target.startsWith('tags/')) {
          continue
        }
      }

      let neighborId: string | null = null
      let isOutgoing = false

      if (edge.source === currentId) {
        neighborId = edge.target
        isOutgoing = true
      } else if (edge.target === currentId) {
        neighborId = edge.source
        isOutgoing = false
      }

      if (!neighborId) continue
      if (isOutgoing && !localSettings.includeOutgoing) continue
      if (!isOutgoing && !localSettings.includeIncoming) continue

      // Only process unvisited neighbors - this ensures we only add traversal edges
      if (!visitedNodes.has(neighborId)) {
        visitedNodes.add(neighborId)
        nodeDepths.set(neighborId, currentDepth + 1)
        queue.push({ id: neighborId, d: currentDepth + 1 })
        
        // Add edge (this is a direct traversal edge)
        const linkKey = `${edge.source}->${edge.target}`
        if (!addedLinks.has(linkKey)) {
          addedLinks.add(linkKey)
          resultLinks.push(edge)
        }
      }
    }
  }

  // If neighbor links are enabled, add edges between nodes at the same depth
  if (localSettings.includeNeighbors) {
    for (const edge of graph.value.edges || []) {
      if (!visitedNodes.has(edge.source) || !visitedNodes.has(edge.target)) continue
      
      if (!localSettings.includeTags) {
        if (edge.source.startsWith('tags/') || edge.target.startsWith('tags/')) {
          continue
        }
      }

      const linkKey = `${edge.source}->${edge.target}`
      if (addedLinks.has(linkKey)) continue

      const sourceDepth = nodeDepths.get(edge.source) ?? -1
      const targetDepth = nodeDepths.get(edge.target) ?? -1

      // Neighbor link = same depth nodes connected
      if (sourceDepth === targetDepth && sourceDepth >= 0) {
        addedLinks.add(linkKey)
        resultLinks.push(edge)
      }
    }
  }
  
  let resultNodes = (graph.value.nodes || []).filter(n => visitedNodes.has(n.id))
  
  // Filter tags nodes if disabled
  if (!localSettings.includeTags) {
    resultNodes = resultNodes.filter(n => !n.path?.startsWith('tags/'))
  }
  
  // Filter attachments if disabled
  if (!localSettings.includeAttachments) {
    resultNodes = resultNodes.filter(n => !n.isAttachment && !n.path?.match(/\.(png|jpg|jpeg|gif|webp|pdf|svg)$/i))
  }
  
  // Re-filter links to only include remaining nodes
  const finalNodeIds = new Set(resultNodes.map(n => n.id))
  const finalLinks = resultLinks.filter(l => finalNodeIds.has(l.source) && finalNodeIds.has(l.target))
  
  return { nodes: resultNodes, links: finalLinks }
}

// Computed filtered graph
const filteredGraph = computed(() => {
  if (!graph.value) return { nodes: [], links: [] }
  
  if (viewMode.value === 'local' && props.currentPath) {
    return getLocalSubgraph(props.currentPath, localSettings.depth)
  }
  
  // Global view
  let nodes = [...(graph.value.nodes || [])]
  let edges = [...(graph.value.edges || [])]
  
  // Filter tags nodes if disabled
  if (!globalSettings.includeTags) {
    nodes = nodes.filter(n => !n.path?.startsWith('tags/'))
  }
  
  // Filter attachments if disabled
  if (!globalSettings.includeAttachments) {
    nodes = nodes.filter(n => !n.isAttachment && !n.path?.match(/\.(png|jpg|jpeg|gif|webp|pdf|svg)$/i))
  }
  
  // Filter orphans
  if (!globalSettings.includeOrphans) {
    const connectedNodes = new Set<string>()
    edges.forEach(e => {
      connectedNodes.add(e.source)
      connectedNodes.add(e.target)
    })
    nodes = nodes.filter(n => connectedNodes.has(n.id))
  }
  
  // Search filter
  if (globalSettings.searchQuery) {
    const q = globalSettings.searchQuery.toLowerCase()
    nodes = nodes.filter(n => {
      if (q.startsWith('path:')) {
        return n.path?.toLowerCase().includes(q.slice(5).trim())
      }
      if (q.startsWith('tag:')) {
        return n.tags?.some(t => t.toLowerCase().includes(q.slice(4).trim()))
      }
      return n.title?.toLowerCase().includes(q) || n.path?.toLowerCase().includes(q)
    })
  }
  
  const nodeIds = new Set(nodes.map(n => n.id))
  edges = edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target))
  
  return { nodes, links: edges }
})

// Handle node click
function handleNodeClick(node: GraphNode) {
  navigateTo(node.path)
  isOpen.value = false
}

// Reset settings
function resetSettings() {
  if (viewMode.value === 'local') {
    Object.assign(localSettings, {
      includeOutgoing: true,
      includeIncoming: true,
      includeNeighbors: false,
      includeTags: true,
      includeAttachments: true,
      depth: 1,
      showLabels: true,
      showArrows: false,
      textFadeThreshold: 1.0,
      nodeSize: 4,
      linkWidth: 1,
    })
  } else {
    Object.assign(globalSettings, {
      includeOrphans: true,
      includeTags: true,
      includeAttachments: true,
      searchQuery: '',
      showLabels: true,
      showArrows: false,
      textFadeThreshold: 1.0,
      nodeSize: 4,
      linkWidth: 1,
    })
  }
  // Re-center after reset (debounced to avoid competing zooms)
  nextTick(() => scheduleZoomToFit(600))
}

// Toggle items for segmented control
const viewItems = [
  { label: 'Local', value: 'local', icon: 'i-lucide-share-2' },
  { label: 'Global', value: 'global', icon: 'i-lucide-globe' }
]

// Ref to ForceGraph component
const graphRef = ref<{ zoomToFit: () => void } | null>(null)

// Graph container ref and dimensions
const graphContainerRef = ref<HTMLElement | null>(null)
const graphDimensions = reactive({ width: 800, height: 500 })

// Update dimensions
function updateDimensions() {
  if (graphContainerRef.value) {
    const rect = graphContainerRef.value.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) {
      graphDimensions.width = Math.floor(rect.width)
      graphDimensions.height = Math.floor(rect.height)
    }
  }
}

// Single debounced zoom — prevents competing zoom animations
let zoomTimer: ReturnType<typeof setTimeout> | null = null

function scheduleZoomToFit(delay = 800) {
  if (zoomTimer) clearTimeout(zoomTimer)
  zoomTimer = setTimeout(() => {
    graphRef.value?.zoomToFit()
    zoomTimer = null
  }, delay)
}

// Watch isOpen to initialize when modal opens
watch(isOpen, (open) => {
  if (open) {
    nextTick(() => {
      setTimeout(updateDimensions, 100)
    })
  } else {
    if (zoomTimer) { clearTimeout(zoomTimer); zoomTimer = null }
  }
})

// Watch viewMode changes to re-center graph
watch(viewMode, () => {
  nextTick(updateDimensions)
})

// ResizeObserver for container
let resizeObserver: ResizeObserver | null = null

watch(graphContainerRef, (el) => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
  if (el && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      updateDimensions()
    })
    resizeObserver.observe(el)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :ui="{ 
      content: 'w-[75vw] max-w-[75vw] p-0'
    }"
  >
    <template #content>
      <div class="graph-modal-layout">
        <!-- Header -->
        <div class="flex items-center gap-4 px-4 py-3 border-b border-default">
          <div class="inline-flex rounded-md border border-default overflow-hidden">
            <UButton
              v-for="(item, idx) in viewItems"
              :key="item.value"
              :icon="item.icon"
              :label="item.label"
              :color="viewMode === item.value ? 'primary' : 'neutral'"
              :variant="viewMode === item.value ? 'solid' : 'soft'"
              size="sm"
              :class="[
                'rounded-none',
                idx > 0 ? 'border-l border-default' : ''
              ]"
              :ui="{ rounded: 'rounded-none' }"
              @click="viewMode = item.value as 'local' | 'global'"
            />
          </div>
          
          <div class="flex-1" />
          
          <UButton
            icon="i-lucide-rotate-ccw"
            color="neutral"
            variant="ghost"
            size="sm"
            title="Reset settings"
            @click="resetSettings"
          />
          
          <UButton
            icon="i-lucide-x"
            color="neutral"
            variant="ghost"
            size="sm"
            @click="isOpen = false"
          />
        </div>
        
        <!-- Content -->
        <div class="flex flex-1 min-h-0">
          <!-- Options Panel -->
          <div class="w-64 shrink-0 border-r border-default bg-muted overflow-y-auto p-4 space-y-4">
            <!-- Local View Options -->
            <template v-if="viewMode === 'local'">
              <div class="space-y-2">
                <h4 class="text-xs font-semibold text-muted uppercase tracking-wide">Filters</h4>
                <UCheckbox v-model="localSettings.includeOutgoing" label="Outgoing links" />
                <UCheckbox v-model="localSettings.includeIncoming" label="Incoming links" />
                <UCheckbox v-model="localSettings.includeNeighbors" label="Neighbor links" />
                <UCheckbox v-model="localSettings.includeTags" label="Tags" />
                <UCheckbox v-model="localSettings.includeAttachments" label="Attachments" />
              </div>
              
              <div class="space-y-2">
                <h4 class="text-xs font-semibold text-muted uppercase tracking-wide">Depth</h4>
                <div class="flex items-center gap-2">
                  <USlider v-model="localSettings.depth" :min="1" :max="5" :step="1" class="flex-1" />
                  <span class="text-xs text-muted font-mono w-4">{{ localSettings.depth }}</span>
                </div>
              </div>
            </template>
            
            <!-- Global View Options -->
            <template v-else>
              <div class="space-y-2">
                <h4 class="text-xs font-semibold text-muted uppercase tracking-wide">Search</h4>
                <UInput
                  v-model="globalSettings.searchQuery"
                  placeholder="Filter nodes..."
                  size="sm"
                  icon="i-lucide-search"
                  :ui="{ base: 'w-full' }"
                />
                <p class="text-xs text-muted">Use path: or tag: prefix</p>
              </div>
              
              <div class="space-y-2">
                <h4 class="text-xs font-semibold text-muted uppercase tracking-wide">Filters</h4>
                <UCheckbox v-model="globalSettings.includeOrphans" label="Show orphans" />
                <UCheckbox v-model="globalSettings.includeTags" label="Tags" />
                <UCheckbox v-model="globalSettings.includeAttachments" label="Attachments" />
              </div>
            </template>
            
            <!-- Display Options (shared) -->
            <div class="space-y-2">
              <h4 class="text-xs font-semibold text-muted uppercase tracking-wide">Display</h4>
              
              <!-- Local display options -->
              <template v-if="viewMode === 'local'">
                <UCheckbox v-model="localSettings.showLabels" label="Show labels" />
                <UCheckbox v-model="localSettings.showArrows" label="Show arrows" />
                
                <div class="space-y-1">
                  <label class="text-xs text-default">Text fade threshold</label>
                  <div class="flex items-center gap-2">
                    <USlider v-model="localSettings.textFadeThreshold" :min="0" :max="3" :step="0.1" class="flex-1" />
                    <span class="text-xs text-muted font-mono w-6">{{ localSettings.textFadeThreshold.toFixed(1) }}</span>
                  </div>
                </div>
                
                <div class="space-y-1">
                  <label class="text-xs text-default">Node size</label>
                  <div class="flex items-center gap-2">
                    <USlider v-model="localSettings.nodeSize" :min="2" :max="10" :step="1" class="flex-1" />
                    <span class="text-xs text-muted font-mono w-4">{{ localSettings.nodeSize }}</span>
                  </div>
                </div>
                
                <div class="space-y-1">
                  <label class="text-xs text-default">Link width</label>
                  <div class="flex items-center gap-2">
                    <USlider v-model="localSettings.linkWidth" :min="0.5" :max="3" :step="0.5" class="flex-1" />
                    <span class="text-xs text-muted font-mono w-6">{{ localSettings.linkWidth.toFixed(1) }}</span>
                  </div>
                </div>
              </template>
              
              <!-- Global display options -->
              <template v-else>
                <UCheckbox v-model="globalSettings.showLabels" label="Show labels" />
                <UCheckbox v-model="globalSettings.showArrows" label="Show arrows" />
                
                <div class="space-y-1">
                  <label class="text-xs text-default">Text fade threshold</label>
                  <div class="flex items-center gap-2">
                    <USlider v-model="globalSettings.textFadeThreshold" :min="0" :max="3" :step="0.1" class="flex-1" />
                    <span class="text-xs text-muted font-mono w-6">{{ globalSettings.textFadeThreshold.toFixed(1) }}</span>
                  </div>
                </div>
                
                <div class="space-y-1">
                  <label class="text-xs text-default">Node size</label>
                  <div class="flex items-center gap-2">
                    <USlider v-model="globalSettings.nodeSize" :min="2" :max="10" :step="1" class="flex-1" />
                    <span class="text-xs text-muted font-mono w-4">{{ globalSettings.nodeSize }}</span>
                  </div>
                </div>
                
                <div class="space-y-1">
                  <label class="text-xs text-default">Link width</label>
                  <div class="flex items-center gap-2">
                    <USlider v-model="globalSettings.linkWidth" :min="0.5" :max="3" :step="0.5" class="flex-1" />
                    <span class="text-xs text-muted font-mono w-6">{{ globalSettings.linkWidth.toFixed(1) }}</span>
                  </div>
                </div>
              </template>
            </div>
          </div>
          
          <!-- Graph Area -->
          <div ref="graphContainerRef" class="flex-1 bg-default relative min-h-0">
            <ClientOnly>
              <ForceGraph
                ref="graphRef"
                :nodes="filteredGraph.nodes"
                :links="filteredGraph.links"
                :width="graphDimensions.width"
                :height="graphDimensions.height"
                :highlight-path="currentPath"
                :node-size="viewMode === 'local' ? localSettings.nodeSize : globalSettings.nodeSize"
                :link-width="viewMode === 'local' ? localSettings.linkWidth : globalSettings.linkWidth"
                :show-labels="viewMode === 'local' ? localSettings.showLabels : globalSettings.showLabels"
                :show-arrows="viewMode === 'local' ? localSettings.showArrows : globalSettings.showArrows"
                :text-fade-threshold="viewMode === 'local' ? localSettings.textFadeThreshold : globalSettings.textFadeThreshold"
                :warmup-ticks="150"
                :cooldown-time="1500"
                :auto-zoom="true"
                background-color="transparent"
                @node-click="handleNodeClick"
              />
              <template #fallback>
                <div class="flex items-center justify-center h-full">
                  <UIcon name="i-lucide-loader-2" class="animate-spin text-muted size-6" />
                </div>
              </template>
            </ClientOnly>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="flex items-center gap-4 px-4 py-2 border-t border-default bg-muted text-xs text-muted">
          <span>{{ filteredGraph.nodes.length }} nodes</span>
          <span>{{ filteredGraph.links.length }} links</span>
        </div>
      </div>
    </template>
  </UModal>
</template>

<style scoped>
.graph-modal-layout {
  display: flex;
  flex-direction: column;
  height: 80vh;
  min-height: 500px;
  max-height: 900px;
}
</style>
