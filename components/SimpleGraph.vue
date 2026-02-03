<script setup lang="ts">
/**
 * SimpleGraph Component
 * 
 * A force-directed graph using Canvas 2D with:
 * - Zoom/pan via mouse wheel and drag on background
 * - Node dragging
 * - Labels drawn directly on canvas
 * - Smooth physics simulation
 */

interface GraphNode {
  id: string
  title: string
  path: string
  tags: string[]
  folder: string
  x?: number
  y?: number
  vx?: number
  vy?: number
  fx?: number | null  // Fixed position (when dragging)
  fy?: number | null
}

interface GraphEdge {
  source: string
  target: string
}

const props = defineProps<{
  nodes: GraphNode[]
  edges: GraphEdge[]
  width?: number
  height?: number
  highlightPath?: string
  interactive?: boolean
  nodeSize?: number
  linkThickness?: number
  centerForce?: number
  repelForce?: number
  linkForce?: number
  linkDistance?: number
  textFadeThreshold?: number
  showArrows?: boolean
}>()

const emit = defineEmits<{
  nodeClick: [node: GraphNode]
}>()

const canvasRef = ref<HTMLCanvasElement>()

// Simulation state
const simulationNodes = ref<GraphNode[]>([])
const hoveredNode = ref<GraphNode | null>(null)
let animationId: number | null = null

// Transform state (zoom/pan)
const transform = ref({ x: 0, y: 0, k: 1 })

// Drag state
const dragState = ref<{
  type: 'none' | 'pan' | 'node'
  startX: number
  startY: number
  node: GraphNode | null
  startTransformX: number
  startTransformY: number
}>({ type: 'none', startX: 0, startY: 0, node: null, startTransformX: 0, startTransformY: 0 })

// Color palette for folders - resolved from CSS variables
let graphColors = {
  nodeDefault: '#8e8e93',
  nodeCurrent: '#30d158',
  tag: '#ec4899',
  folder: {} as Record<string, string>
}

function updateColorsFromCss() {
  const style = getComputedStyle(document.documentElement)
  
  graphColors.nodeDefault = style.getPropertyValue('--lithos-graph-node-default').trim() || graphColors.nodeDefault
  graphColors.nodeCurrent = style.getPropertyValue('--lithos-graph-node-current').trim() || graphColors.nodeCurrent
  graphColors.tag = style.getPropertyValue('--lithos-graph-tag').trim() || graphColors.tag
  
  graphColors.folder = {
    'getting-started': style.getPropertyValue('--lithos-graph-folder-getting-started').trim() || '#10b981',
    'concepts': style.getPropertyValue('--lithos-graph-folder-concepts').trim() || '#8b5cf6',
    'essentials': style.getPropertyValue('--lithos-graph-folder-essentials').trim() || '#f59e0b',
    'ai': style.getPropertyValue('--lithos-graph-folder-ai').trim() || '#3b82f6',
    'journal': style.getPropertyValue('--lithos-graph-folder-journal').trim() || '#ff375f',
    'projects': style.getPropertyValue('--lithos-graph-folder-projects').trim() || '#bf5af2',
    'root': style.getPropertyValue('--lithos-graph-folder-default').trim() || '#6b7280'
  }
}

// Initialize simulation with nodes positioned near center
function initSimulation() {
  const width = props.width || 300
  const height = props.height || 200
  const centerX = width / 2
  const centerY = height / 2
  
  // Position nodes in a small circle around center
  const angleStep = (2 * Math.PI) / Math.max(props.nodes.length, 1)
  const radius = Math.min(width, height) * 0.15
  
  simulationNodes.value = props.nodes.map((node, i) => ({
    ...node,
    x: centerX + Math.cos(i * angleStep) * radius * (0.5 + Math.random() * 0.5),
    y: centerY + Math.sin(i * angleStep) * radius * (0.5 + Math.random() * 0.5),
    vx: 0,
    vy: 0,
    fx: null,
    fy: null
  }))
  
  // Reset transform
  transform.value = { x: 0, y: 0, k: 1 }
  
  // Update colors
  updateColorsFromCss()
}

// Physics simulation step with smooth settling
function simulationStep() {
  const nodes = simulationNodes.value
  const edges = props.edges
  const width = props.width || 300
  const height = props.height || 200
  
  // Parameters - softer defaults for smooth animation
  const repulsion = (props.repelForce ?? 1.0) * 500
  const linkStrength = props.linkForce ?? 0.1
  const linkDist = props.linkDistance ?? 60
  const centerStrength = props.centerForce ?? 0.02
  const damping = 0.85  // Higher = slower settling
  
  // Apply forces
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    
    // Skip if node is being dragged (fixed position)
    if (node.fx !== null && node.fx !== undefined) {
      node.x = node.fx
      node.vx = 0
    }
    if (node.fy !== null && node.fy !== undefined) {
      node.y = node.fy
      node.vy = 0
    }
    if (node.fx !== null || node.fy !== null) continue
    
    let fx = 0, fy = 0
    
    // Repulsion from other nodes (Barnes-Hut approximation could help for large graphs)
    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue
      const other = nodes[j]
      const dx = node.x! - other.x!
      const dy = node.y! - other.y!
      const distSq = dx * dx + dy * dy
      const dist = Math.sqrt(distSq) || 1
      
      // Softer repulsion with minimum distance
      const minDist = 30
      const effectiveDist = Math.max(dist, minDist)
      const force = repulsion / (effectiveDist * effectiveDist)
      fx += (dx / dist) * force
      fy += (dy / dist) * force
    }
    
    // Attraction along edges (spring force)
    for (const edge of edges) {
      let other: GraphNode | undefined
      if (edge.source === node.id) {
        other = nodes.find(n => n.id === edge.target)
      } else if (edge.target === node.id) {
        other = nodes.find(n => n.id === edge.source)
      }
      if (other) {
        const dx = other.x! - node.x!
        const dy = other.y! - node.y!
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const displacement = dist - linkDist
        const force = displacement * linkStrength
        fx += (dx / dist) * force
        fy += (dy / dist) * force
      }
    }
    
    // Center force (gentle pull to center)
    fx += (width / 2 - node.x!) * centerStrength
    fy += (height / 2 - node.y!) * centerStrength
    
    // Update velocity with damping
    node.vx = (node.vx! + fx) * damping
    node.vy = (node.vy! + fy) * damping
    
    // Cap velocity for stability
    const maxVel = 10
    const vel = Math.sqrt(node.vx! * node.vx! + node.vy! * node.vy!)
    if (vel > maxVel) {
      node.vx = (node.vx! / vel) * maxVel
      node.vy = (node.vy! / vel) * maxVel
    }
    
    // Update position
    node.x! += node.vx!
    node.y! += node.vy!
  }
}

// Render the graph
function render() {
  const canvas = canvasRef.value
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  const width = props.width || 300
  const height = props.height || 200
  const nodes = simulationNodes.value
  const edges = props.edges
  const t = transform.value
  
  // Clear canvas (transparent background)
  ctx.clearRect(0, 0, width, height)
  
  // Apply transform
  ctx.save()
  ctx.translate(t.x, t.y)
  ctx.scale(t.k, t.k)
  
  // Draw edges
  ctx.strokeStyle = 'rgba(156, 163, 175, 0.5)'
  ctx.lineWidth = (props.linkThickness ?? 1) * 1 / t.k
  
  for (const edge of edges) {
    const source = nodes.find(n => n.id === edge.source)
    const target = nodes.find(n => n.id === edge.target)
    if (source && target && source.x && target.x) {
      ctx.beginPath()
      ctx.moveTo(source.x, source.y!)
      ctx.lineTo(target.x, target.y!)
      ctx.stroke()
      
      // Draw arrow if enabled
      if (props.showArrows) {
        const dx = target.x - source.x
        const dy = target.y! - source.y!
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > 0) {
          const nodeRadius = 6 * (props.nodeSize ?? 1)
          const arrowLen = 6 / t.k
          const arrowX = target.x - (dx / dist) * (nodeRadius + 2)
          const arrowY = target.y! - (dy / dist) * (nodeRadius + 2)
          const angle = Math.atan2(dy, dx)
          
          ctx.beginPath()
          ctx.moveTo(arrowX, arrowY)
          ctx.lineTo(
            arrowX - arrowLen * Math.cos(angle - 0.4),
            arrowY - arrowLen * Math.sin(angle - 0.4)
          )
          ctx.moveTo(arrowX, arrowY)
          ctx.lineTo(
            arrowX - arrowLen * Math.cos(angle + 0.4),
            arrowY - arrowLen * Math.sin(angle + 0.4)
          )
          ctx.stroke()
        }
      }
    }
  }
  
  // Draw nodes and labels
  const nodeRadius = 6 * (props.nodeSize ?? 1)
  const labelThreshold = props.textFadeThreshold ?? 0.8
  const showLabels = t.k >= labelThreshold * 0.5
  const labelOpacity = Math.min(1, (t.k - labelThreshold * 0.5) / (labelThreshold * 0.5))
  
  for (const node of nodes) {
    if (!node.x || !node.y) continue
    
    const isHighlighted = node.path === props.highlightPath
    const isHovered = hoveredNode.value?.id === node.id
    
    // Get node color
    let fillColor: string
    if (isHighlighted) {
       fillColor = graphColors.nodeCurrent
    } else if (node.tags?.length || node.folder === 'tags') {
       fillColor = graphColors.tag
    } else {
       const folder = node.folder?.replace(/^\d+\./, '') || 'root'
       fillColor = graphColors.folder[folder] || graphColors.nodeDefault
    }
    
    // Draw node circle
    const radius = isHovered ? nodeRadius + 2 : nodeRadius
    ctx.beginPath()
    ctx.arc(node.x, node.y, radius, 0, Math.PI * 2)
    ctx.fillStyle = fillColor
    ctx.fill()
    
    // Highlight border
    if (isHighlighted || isHovered) {
      ctx.strokeStyle = isHighlighted ? '#fff' : 'rgba(255,255,255,0.7)'
      ctx.lineWidth = 2 / t.k
      ctx.stroke()
    }
    
    // Draw label (always visible, opacity based on zoom)
    if (showLabels || isHighlighted || isHovered) {
      const text = node.title || node.id.split('/').pop() || node.id
      const truncated = text.length > 20 ? text.slice(0, 18) + '...' : text
      const fontSize = Math.max(10, 11 / t.k)
      
      ctx.font = `${fontSize}px system-ui, -apple-system, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      
      const opacity = isHighlighted || isHovered ? 1 : Math.max(0.3, labelOpacity)
      
      // Text shadow for readability
      ctx.fillStyle = `rgba(0, 0, 0, ${opacity * 0.5})`
      ctx.fillText(truncated, node.x + 1, node.y + radius + 4)
      
      // Main text
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`
      ctx.fillText(truncated, node.x, node.y + radius + 3)
    }
  }
  
  ctx.restore()
}

// Animation loop
function animate() {
  simulationStep()
  render()
  animationId = requestAnimationFrame(animate)
}

// Convert screen coordinates to graph coordinates
function screenToGraph(screenX: number, screenY: number): { x: number, y: number } {
  const t = transform.value
  return {
    x: (screenX - t.x) / t.k,
    y: (screenY - t.y) / t.k
  }
}

// Find node at position
function findNodeAt(graphX: number, graphY: number): GraphNode | null {
  const nodeRadius = 8 * (props.nodeSize ?? 1)
  for (let i = simulationNodes.value.length - 1; i >= 0; i--) {
    const node = simulationNodes.value[i]
    if (!node.x || !node.y) continue
    const dx = node.x - graphX
    const dy = node.y - graphY
    if (dx * dx + dy * dy < nodeRadius * nodeRadius) {
      return node
    }
  }
  return null
}

// Mouse handlers
function handleMouseDown(e: MouseEvent) {
  if (!props.interactive) return
  
  const canvas = canvasRef.value
  if (!canvas) return
  
  const rect = canvas.getBoundingClientRect()
  const screenX = e.clientX - rect.left
  const screenY = e.clientY - rect.top
  const { x: graphX, y: graphY } = screenToGraph(screenX, screenY)
  
  const node = findNodeAt(graphX, graphY)
  
  if (node) {
    // Start node drag
    dragState.value = {
      type: 'node',
      startX: graphX,
      startY: graphY,
      node: node,
      startTransformX: transform.value.x,
      startTransformY: transform.value.y
    }
    node.fx = node.x
    node.fy = node.y
  } else {
    // Start pan
    dragState.value = {
      type: 'pan',
      startX: screenX,
      startY: screenY,
      node: null,
      startTransformX: transform.value.x,
      startTransformY: transform.value.y
    }
  }
}

function handleMouseMove(e: MouseEvent) {
  if (!props.interactive) return
  
  const canvas = canvasRef.value
  if (!canvas) return
  
  const rect = canvas.getBoundingClientRect()
  const screenX = e.clientX - rect.left
  const screenY = e.clientY - rect.top
  const { x: graphX, y: graphY } = screenToGraph(screenX, screenY)
  
  if (dragState.value.type === 'node' && dragState.value.node) {
    // Drag node
    dragState.value.node.fx = graphX
    dragState.value.node.fy = graphY
    canvas.style.cursor = 'grabbing'
  } else if (dragState.value.type === 'pan') {
    // Pan canvas
    const dx = screenX - dragState.value.startX
    const dy = screenY - dragState.value.startY
    transform.value.x = dragState.value.startTransformX + dx
    transform.value.y = dragState.value.startTransformY + dy
    canvas.style.cursor = 'grabbing'
  } else {
    // Hover detection
    const node = findNodeAt(graphX, graphY)
    hoveredNode.value = node
    canvas.style.cursor = node ? 'pointer' : 'grab'
  }
}

function handleMouseUp(e: MouseEvent) {
  if (dragState.value.type === 'node' && dragState.value.node) {
    // Release node - keep position but allow physics
    dragState.value.node.fx = null
    dragState.value.node.fy = null
  }
  
  dragState.value = { type: 'none', startX: 0, startY: 0, node: null, startTransformX: 0, startTransformY: 0 }
  
  const canvas = canvasRef.value
  if (canvas) {
    canvas.style.cursor = hoveredNode.value ? 'pointer' : 'grab'
  }
}

function handleClick(e: MouseEvent) {
  if (dragState.value.type !== 'none') return
  
  if (hoveredNode.value) {
    emit('nodeClick', hoveredNode.value)
  }
}

function handleWheel(e: WheelEvent) {
  if (!props.interactive) return
  e.preventDefault()
  
  const canvas = canvasRef.value
  if (!canvas) return
  
  const rect = canvas.getBoundingClientRect()
  const screenX = e.clientX - rect.left
  const screenY = e.clientY - rect.top
  
  // Zoom factor
  const delta = -e.deltaY * 0.001
  const factor = Math.exp(delta)
  const newK = Math.max(0.1, Math.min(5, transform.value.k * factor))
  
  // Zoom toward mouse position
  const oldK = transform.value.k
  transform.value.k = newK
  transform.value.x = screenX - (screenX - transform.value.x) * (newK / oldK)
  transform.value.y = screenY - (screenY - transform.value.y) * (newK / oldK)
}

function handleMouseLeave() {
  hoveredNode.value = null
  if (dragState.value.type !== 'none') {
    handleMouseUp(new MouseEvent('mouseup'))
  }
}

// Lifecycle
onMounted(() => {
  initSimulation()
  animate()
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
})

// Watch for data changes
watch(() => [props.nodes, props.edges], () => {
  initSimulation()
}, { deep: true })

// Watch for prop changes that affect rendering
watch(() => [props.nodeSize, props.linkThickness, props.showArrows, props.textFadeThreshold], () => {
  // Just re-render, no simulation reset needed
}, { deep: true })
</script>

<template>
  <div class="simple-graph">
    <canvas
      ref="canvasRef"
      :width="width || 300"
      :height="height || 200"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @click="handleClick"
      @wheel="handleWheel"
      @mouseleave="handleMouseLeave"
    />
  </div>
</template>

<style scoped>
.simple-graph {
  display: block;
  background: var(--ui-bg);
  border-radius: 0.25rem;
  overflow: hidden;
}

.simple-graph canvas {
  display: block;
  cursor: grab;
}
</style>
