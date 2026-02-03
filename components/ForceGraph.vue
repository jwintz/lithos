<script setup lang="ts">
/**
 * ForceGraph Component
 * 
 * Force-directed graph visualization matching Obsidian's graph view style.
 * Uses vasturiano/force-graph with tuned physics for natural spread.
 * 
 * Obsidian-like settings (from community research):
 * - Center force: ~0.5-0.7 (compactness)
 * - Repel force: ~10-15 (node repulsion)  
 * - Link force: ~0.8-1.0 (spring strength)
 * - Link distance: ~30-100 (edge length)
 * 
 * Note: Must be wrapped in <ClientOnly> - requires DOM.
 */

// Dynamic import to avoid SSR issues
const ForceGraph = import.meta.client ? (await import('force-graph')).default : null
const d3Force = import.meta.client ? await import('d3-force') : null
const d3ForceCollide = d3Force?.forceCollide ?? null

interface GraphNode {
  id: string
  title?: string
  name?: string
  path?: string
  tags?: string[]
  folder?: string
  isTag?: boolean
  x?: number
  y?: number
  fx?: number
  fy?: number
}

interface GraphLink {
  source: string | GraphNode
  target: string | GraphNode
}

const props = withDefaults(defineProps<{
  nodes: GraphNode[]
  links: GraphLink[]
  width?: number
  height?: number
  highlightPath?: string
  backgroundColor?: string
  nodeSize?: number
  linkWidth?: number
  showLabels?: boolean
  showArrows?: boolean
  textFadeThreshold?: number
  warmupTicks?: number
  cooldownTime?: number
  autoZoom?: boolean
}>(), {
  width: 400,
  height: 300,
  backgroundColor: 'transparent',
  nodeSize: 4,
  linkWidth: 1,
  showLabels: true,
  showArrows: false,
  textFadeThreshold: 1.5,
  warmupTicks: 50,
  cooldownTime: 3000,
  autoZoom: true
})

const emit = defineEmits<{
  nodeClick: [node: GraphNode]
  nodeHover: [node: GraphNode | null]
}>()

const containerRef = ref<HTMLElement>()
let graphInstance: any = null

// Ready state for compact containers - hide until initial zoom is set
const isReady = ref(true) // Start true for autoZoom mode

// Hover state for highlighting
const hoveredNode = ref<GraphNode | null>(null)
const highlightNodes = ref(new Set<string>())
const highlightLinks = ref(new Set<string>())

// Color scheme - consistent identity
// Tags: greenish, regular nodes: accent violet, current: accent with size distinction
const colors = reactive({
  bg: 'transparent',
  nodeDefault: '#a78bfa',                     // Violet (accent)
  nodeCurrent: '#a78bfa',                     // Same accent - distinguished by size/ring
  nodeHover: '#ffffff',                       // White on hover
  nodeTag: '#34d399',                         // Green for tags (emerald-400)
  edge: 'rgba(136, 136, 136, 0.4)',           // Visible gray edges
  edgeHighlight: 'rgba(167, 139, 250, 0.8)', // Highlighted edge
  text: '#e5e5e5'                             // Light gray text
})

function updateColorsFromCss() {
  if (!import.meta.client) return
  
  const style = getComputedStyle(document.documentElement)
  
  const getVar = (name: string, fallback: string) => 
    style.getPropertyValue(name).trim() || fallback
  
  colors.nodeDefault = getVar('--lithos-graph-node-default', colors.nodeDefault)
  colors.nodeCurrent = getVar('--lithos-graph-node-current', colors.nodeCurrent)
  colors.nodeHover = getVar('--lithos-graph-node-hover', colors.nodeHover)
  colors.nodeTag = getVar('--lithos-graph-tag', colors.nodeTag)
  colors.edge = getVar('--lithos-graph-edge', colors.edge)
  colors.edgeHighlight = getVar('--lithos-graph-edge-hover', colors.edgeHighlight)
  colors.text = getVar('--lithos-graph-text', colors.text)
}

function getNodeColor(node: GraphNode): string {
  // Hovered node
  if (hoveredNode.value?.id === node.id) {
    return colors.nodeHover
  }
  
  // Current page
  if (node.path === props.highlightPath) {
    return colors.nodeCurrent
  }
  
  // When hovering, dim non-connected nodes
  if (hoveredNode.value && !highlightNodes.value.has(node.id)) {
    return dimColor(getBaseNodeColor(node), 0.3)
  }
  
  return getBaseNodeColor(node)
}

function getBaseNodeColor(node: GraphNode): string {
  // Tag nodes: greenish
  if (node.isTag || node.folder === 'tags') {
    return colors.nodeTag
  }

  // All regular nodes: accent color
  return colors.nodeDefault
}

function dimColor(color: string, opacity: number): string {
  if (color.startsWith('rgba')) {
    return color.replace(/[\d.]+\)$/, `${opacity})`)
  }
  if (color.startsWith('rgb(')) {
    return color.replace('rgb(', 'rgba(').replace(')', `, ${opacity})`)
  }
  if (color.startsWith('#')) {
    const hex = color.slice(1)
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  }
  return color
}

function getLinkColor(link: any): string {
  const linkKey = `${link.source?.id || link.source}-${link.target?.id || link.target}`
  if (highlightLinks.value.has(linkKey)) {
    return colors.edgeHighlight
  }
  if (hoveredNode.value) {
    return dimColor(colors.edge, 0.15)
  }
  return colors.edge
}

function getLinkWidth(link: any): number {
  const linkKey = `${link.source?.id || link.source}-${link.target?.id || link.target}`
  if (highlightLinks.value.has(linkKey)) {
    return props.linkWidth * 2
  }
  return props.linkWidth
}

function handleNodeHover(node: GraphNode | null) {
  hoveredNode.value = node
  
  highlightNodes.value.clear()
  highlightLinks.value.clear()
  
  if (node) {
    highlightNodes.value.add(node.id)
    
    const graphData = graphInstance?.graphData()
    if (graphData) {
      for (const link of graphData.links) {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id
        const targetId = typeof link.target === 'string' ? link.target : link.target.id
        
        if (sourceId === node.id) {
          highlightNodes.value.add(targetId)
          highlightLinks.value.add(`${sourceId}-${targetId}`)
        } else if (targetId === node.id) {
          highlightNodes.value.add(sourceId)
          highlightLinks.value.add(`${sourceId}-${targetId}`)
        }
      }
    }
  }
  
  emit('nodeHover', node)
  
  if (containerRef.value) {
    containerRef.value.style.cursor = node ? 'pointer' : 'grab'
  }
  
  // Trigger re-render
  if (graphInstance) {
    graphInstance.nodeColor(graphInstance.nodeColor())
    graphInstance.linkColor(graphInstance.linkColor())
    graphInstance.linkWidth(graphInstance.linkWidth())
  }
}

function initGraph() {
  if (!containerRef.value || !ForceGraph) return
  
  updateColorsFromCss()
  
  // For compact containers (no autoZoom), hide until initial layout is ready
  if (!props.autoZoom) {
    isReady.value = false
  }
  
  // Destroy existing instance
  if (graphInstance) {
    graphInstance.pauseAnimation()
    graphInstance = null
    if (containerRef.value) {
      containerRef.value.innerHTML = ''
    }
  }
  
  // Create force-graph instance
  graphInstance = ForceGraph()(containerRef.value)
    .width(props.width)
    .height(props.height)
    .backgroundColor(props.backgroundColor)
    // Node styling
    .nodeRelSize(props.nodeSize)
    .nodeVal((node: GraphNode) => {
      // Current page node is 2x larger
      return node.path === props.highlightPath ? 2 : 1
    })
    .nodeLabel((node: GraphNode) => node.title || node.name || node.id.split('/').pop() || '')
    .nodeColor((node: GraphNode) => getNodeColor(node))
    .nodeCanvasObjectMode(() => 'after')
    .nodeCanvasObject((node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const isCurrent = node.path === props.highlightPath
      const isHovered = hoveredNode.value?.id === node.id

      // Draw ring around current page node (non-color distinction: larger + ring)
      if (isCurrent) {
        const ringRadius = props.nodeSize * 2.2
        ctx.beginPath()
        ctx.arc(node.x!, node.y!, ringRadius, 0, 2 * Math.PI)
        ctx.strokeStyle = dimColor(colors.nodeCurrent, 0.6)
        ctx.lineWidth = 1.5 / globalScale
        ctx.stroke()
      }

      // Draw glow ring around hovered node
      if (isHovered) {
        ctx.beginPath()
        ctx.arc(node.x!, node.y!, props.nodeSize * 2, 0, 2 * Math.PI)
        ctx.fillStyle = dimColor(colors.nodeHover, 0.2)
        ctx.fill()
      }

      if (!props.showLabels) return

      const label = node.title || node.name || node.id.split('/').pop() || ''
      
      // Calculate opacity based on zoom level
      // Labels fade as you zoom out, fully visible when zoomed in
      const fadeStart = props.textFadeThreshold
      const fadeEnd = fadeStart * 0.3
      let opacity = 1
      
      if (globalScale < fadeStart) {
        if (globalScale <= fadeEnd) {
          opacity = 0
        } else {
          opacity = (globalScale - fadeEnd) / (fadeStart - fadeEnd)
        }
      }
      
      // Always show labels for current page, hovered, and connected nodes
      const isImportant = node.path === props.highlightPath || 
                          hoveredNode.value?.id === node.id ||
                          highlightNodes.value.has(node.id)
      
      if (opacity <= 0 && !isImportant) return
      if (isImportant) opacity = Math.max(opacity, 1)
      
      // When hovering, dim labels of non-connected nodes
      if (hoveredNode.value && !highlightNodes.value.has(node.id)) {
        opacity *= 0.3
      }
      
      // Font sizing - scales with zoom but has bounds
      const fontSize = Math.min(Math.max(12 / globalScale, 8), 16)
      
      ctx.font = `400 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      
      const nodeRadius = props.nodeSize * 1.2
      const yOffset = nodeRadius + 2 / globalScale
      
      // Clean text without background (Obsidian style)
      // Use theme-aware text color with opacity
      ctx.fillStyle = dimColor(colors.text, opacity)
      ctx.fillText(label, node.x!, node.y! + yOffset)
    })
    // Link styling - visible edges
    .linkWidth((link: any) => getLinkWidth(link))
    .linkColor((link: any) => getLinkColor(link))
    .linkDirectionalArrowLength(props.showArrows ? 4 : 0)
    .linkDirectionalArrowRelPos(1)
    .linkDirectionalArrowColor(() => colors.edgeHighlight)
    .linkCurvature(0)
    // Physics - scaled by graph size for responsive settling
    .d3AlphaDecay(props.nodes.length > 20 ? 0.02 : props.nodes.length > 5 ? 0.025 : 0.03)
    .d3VelocityDecay(props.nodes.length > 20 ? 0.3 : props.nodes.length > 5 ? 0.35 : 0.4)
    .d3AlphaMin(0.001)
    .warmupTicks(props.nodes.length > 20 ? props.warmupTicks : props.nodes.length > 5 ? 80 : 100)
    .cooldownTime(props.nodes.length > 20 ? props.cooldownTime : props.nodes.length > 5 ? 2000 : 1000)
    // Interactions
    .onNodeClick((node: GraphNode) => {
      emit('nodeClick', node)
    })
    .onNodeHover(handleNodeHover)
    .onNodeDragEnd((node: GraphNode) => {
      node.fx = node.x
      node.fy = node.y
    })
    .onBackgroundClick(() => {
      const graphData = graphInstance?.graphData()
      if (graphData) {
        graphData.nodes.forEach((node: any) => {
          node.fx = undefined
          node.fy = undefined
        })
        graphInstance.graphData(graphData)
      }
    })
    // Zoom-to-fit when physics settles
    .onEngineStop(() => {
      if (!graphInstance) return

      if (!props.autoZoom) {
        // Compact containers: instant zoom, then reveal
        const count = props.nodes.length
        graphInstance.zoomToFit(0, 15)
        const maxZoom = count <= 3 ? 1.5 : count <= 5 ? 2.0 : 3.0
        const currentZoom = graphInstance.zoom()
        if (currentZoom > maxZoom) {
          graphInstance.zoom(maxZoom, 0)
        }
        isReady.value = true
      }
    })
  
  // Configure forces - consistent for both minigraph and modal
  const nodeCount = props.nodes.length

  // Identify orphan nodes (nodes with no edges)
  const connectedNodeIds = new Set<string>()
  for (const link of props.links) {
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id
    const targetId = typeof link.target === 'string' ? link.target : link.target.id
    connectedNodeIds.add(sourceId)
    connectedNodeIds.add(targetId)
  }
  const orphanIds = new Set(props.nodes.filter(n => !connectedNodeIds.has(n.id)).map(n => n.id))

  // Charge (repel force): 
  // - Normal for connected nodes (pushes clusters apart)
  // - Weaker between orphans and connected nodes
  // - Normal between orphans (so they spread out from each other)
  const baseRepel = -60 - Math.min(40, 800 / Math.max(nodeCount, 1))
  graphInstance.d3Force('charge')?.strength((node: GraphNode) => {
    // Orphans have weaker repulsion against the main cluster
    // but will still repel each other normally due to how d3 calculates pairwise forces
    if (orphanIds.has(node.id)) {
      return baseRepel * 0.4
    }
    return baseRepel
  })

  // Link distance and strength: consistent for all edge types
  const baseLinkDistance = 30 + Math.min(30, nodeCount * 0.5)
  graphInstance.d3Force('link')
    ?.distance(baseLinkDistance)
    .strength(0.7)

  // Collision prevention - slightly larger for orphans to spread them out
  if (d3ForceCollide) {
    graphInstance.d3Force('collide', d3ForceCollide((node: GraphNode) => 
      orphanIds.has(node.id) ? props.nodeSize * 3 : props.nodeSize * 1.5
    ))
  }

  // Center force: weakens for larger graphs to prevent clumping
  const centerStrength = Math.max(0.03, 0.15 - nodeCount * 0.002)
  graphInstance.d3Force('center')?.strength(centerStrength)

  // Custom positioning force for orphans: gently pull toward a halo around the graph
  // Uses forceX/forceY with target positions on a circle, plus some randomness
  if (d3Force && orphanIds.size > 0) {
    const orphanArray = Array.from(orphanIds)
    const haloRadius = Math.max(120, Math.sqrt(nodeCount) * 20)
    
    // Assign each orphan an angle on the circle (evenly distributed with jitter)
    const orphanAngles = new Map<string, number>()
    const orphanRadii = new Map<string, number>()
    orphanArray.forEach((id, i) => {
      // Base angle evenly distributed, plus random jitter
      const baseAngle = (2 * Math.PI * i) / orphanArray.length
      const jitter = (Math.random() - 0.5) * (Math.PI / orphanArray.length)
      orphanAngles.set(id, baseAngle + jitter)
      // Random radius variation (0.7x to 1.3x the base radius)
      orphanRadii.set(id, haloRadius * (0.7 + Math.random() * 0.6))
    })
    
    // X force: pull orphans toward their target X position
    const forceX = d3Force.forceX((node: GraphNode) => {
      if (!orphanIds.has(node.id)) return 0
      const angle = orphanAngles.get(node.id) ?? 0
      const radius = orphanRadii.get(node.id) ?? haloRadius
      return Math.cos(angle) * radius
    }).strength((node: GraphNode) => orphanIds.has(node.id) ? 0.05 : 0)
    
    // Y force: pull orphans toward their target Y position
    const forceY = d3Force.forceY((node: GraphNode) => {
      if (!orphanIds.has(node.id)) return 0
      const angle = orphanAngles.get(node.id) ?? 0
      const radius = orphanRadii.get(node.id) ?? haloRadius
      return Math.sin(angle) * radius
    }).strength((node: GraphNode) => orphanIds.has(node.id) ? 0.05 : 0)
    
    graphInstance.d3Force('orphanX', forceX)
    graphInstance.d3Force('orphanY', forceY)
  }
  
  updateGraphData()
}

function updateGraphData() {
  if (!graphInstance) return
  
  const nodes = props.nodes.map(n => ({ 
    ...n, 
    name: n.title || n.id 
  }))
  const links = props.links.map(l => ({ 
    source: typeof l.source === 'string' ? l.source : l.source.id,
    target: typeof l.target === 'string' ? l.target : l.target.id
  }))
  
  graphInstance.graphData({ nodes, links })

  // Zoom to fit after simulation settles
  if (props.autoZoom) {
    // Animated zoom for full containers (modal)
    const delay = Math.min(1500, Math.max(500, nodes.length * 15))
    setTimeout(() => zoomToFit(nodes.length), delay)
  }
  // For compact containers (autoZoom=false), we set initial zoom via onEngineStop
  // during initGraph - no additional zoom needed here
}

function updateSize() {
  if (!graphInstance) return
  graphInstance.width(props.width).height(props.height)
}

function zoomToFit(nodeCount?: number) {
  if (!graphInstance) return

  const count = nodeCount ?? props.nodes.length
  const padding = 40

  // Detect compact containers (sidebar) vs full containers (modal)
  const isCompact = props.width < 300 || props.height < 200

  // Max zoom depends on both node count and container size
  let maxZoom: number
  if (count <= 1) {
    maxZoom = isCompact ? 1.0 : 1.5
  } else if (count <= 3) {
    maxZoom = isCompact ? 1.2 : 2.0
  } else if (count <= 5) {
    maxZoom = isCompact ? 1.5 : 2.5
  } else if (count <= 10) {
    maxZoom = isCompact ? 2.0 : 3.0
  } else {
    maxZoom = 5.0 // Uncapped for large graphs
  }

  graphInstance.zoomToFit(300, padding)

  // Wait for animation to complete (400ms > 300ms animation) before capping
  setTimeout(() => {
    if (!graphInstance) return
    const currentZoom = graphInstance.zoom()
    if (currentZoom > maxZoom) {
      graphInstance.zoom(maxZoom, 200)
    }
  }, 400)
}

defineExpose({ zoomToFit })

onMounted(() => {
  nextTick(() => {
    setTimeout(initGraph, 50)
  })
})

onUnmounted(() => {
  if (graphInstance) {
    graphInstance.pauseAnimation()
    graphInstance = null
  }
})

// Watch for data changes
watch(() => [props.nodes.length, props.links.length], () => {
  if (graphInstance) {
    updateGraphData()
  } else {
    initGraph()
  }
})

watch(() => [props.width, props.height], updateSize)

watch(() => props.highlightPath, () => {
  graphInstance?.nodeColor((node: GraphNode) => getNodeColor(node))
})

watch(() => props.showArrows, (show) => {
  graphInstance?.linkDirectionalArrowLength(show ? 4 : 0)
})

watch(() => props.nodeSize, (size) => {
  graphInstance?.nodeRelSize(size)
})

watch(() => props.linkWidth, () => {
  graphInstance?.linkWidth((link: any) => getLinkWidth(link))
})

watch(() => props.showLabels, () => {
  graphInstance?.nodeCanvasObjectMode(() => props.showLabels ? 'after' : undefined)
})

watch(() => props.textFadeThreshold, () => {
  graphInstance?.nodeCanvasObjectMode(() => props.showLabels ? 'after' : undefined)
})

// Watch for color mode changes (light/dark)
if (import.meta.client) {
  const colorMode = useColorMode()
  watch(() => colorMode.value, () => {
    // Re-read CSS variables when theme changes
    nextTick(() => {
      updateColorsFromCss()
      // Force re-render of nodes
      graphInstance?.nodeCanvasObjectMode(() => props.showLabels ? 'after' : undefined)
    })
  })
}
</script>

<template>
  <div ref="containerRef" class="force-graph-container" :class="{ 'is-ready': isReady }" />
</template>

<style scoped>
.force-graph-container {
  display: block;
  width: 100%;
  height: 100%;
  overflow: hidden;
  max-width: 100%;
  box-sizing: border-box;
}

/* Hide canvas until ready (prevents zoom animation flash) */
.force-graph-container:not(.is-ready) :deep(canvas) {
  opacity: 0;
}

.force-graph-container.is-ready :deep(canvas) {
  opacity: 1;
  transition: opacity 0.3s ease;
}

.force-graph-container :deep(canvas) {
  display: block;
  max-width: 100%;
}
</style>
