/**
 * Shared Graph Data Composable
 *
 * Provides a cached, shared graph data fetch that is reused
 * across LocalGraph and BacklinksList components to avoid
 * duplicate API calls.
 */

interface GraphNode {
  id: string
  title: string
  path: string
  tags: string[]
  folder: string
  isTag?: boolean
}

interface GraphLink {
  source: string
  target: string
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphLink[]
}

/**
 * Use shared graph data with caching.
 * The data is fetched once and shared across all components.
 */
export function useGraphData() {
  // Use useFetch for simpler client-side fetching with SSG
  const { data: graphValue, status, error, refresh } = useFetch<GraphData>('/graph.json', {
    key: 'graph-data',
    server: false, // Client-side only for SSG compatibility
    default: () => ({ nodes: [], edges: [] }),
    onResponseError({ error: err }) {
      console.warn('[useGraphData] Failed to load graph.json:', err?.message)
    }
  })

  // Normalize data ref to non-nullable for consumers
  const graph = computed(() => graphValue.value || { nodes: [], edges: [] })

  return {
    graph,
    status,
    error,
    refresh,
    isLoading: computed(() => status.value === 'pending')
  }
}

/**
 * Get local subgraph for a given path (within depth hops).
 * Excludes tag nodes by default.
 */
export function useLocalGraph(path: Ref<string> | string, depth = 1) {
  const { graph, isLoading } = useGraphData()
  const pathRef = isRef(path) ? path : ref(path)

  const localGraph = computed(() => {
    if (!graph.value || !pathRef.value || !graph.value.nodes.length) {
      return { nodes: [], links: [] }
    }

    const centerPath = pathRef.value
    const visitedNodes = new Set<string>([centerPath])
    const resultLinks: GraphLink[] = []

    // BFS to find connected nodes within depth
    const queue: { id: string; d: number }[] = [{ id: centerPath, d: 0 }]

    while (queue.length > 0) {
      const { id: currentId, d: currentDepth } = queue.shift()!

      if (currentDepth >= depth) continue

      for (const edge of graph.value.edges || []) {
        // Skip tag edges
        if (edge.source.startsWith('tags/') || edge.target.startsWith('tags/')) {
          continue
        }

        let neighborId: string | null = null
        if (edge.source === currentId && !visitedNodes.has(edge.target)) {
          neighborId = edge.target
          resultLinks.push(edge)
        } else if (edge.target === currentId && !visitedNodes.has(edge.source)) {
          neighborId = edge.source
          resultLinks.push(edge)
        }

        if (neighborId && !visitedNodes.has(neighborId)) {
          visitedNodes.add(neighborId)
          queue.push({ id: neighborId, d: currentDepth + 1 })
        }
      }
    }

    // Filter out tag nodes
    const resultNodes = (graph.value.nodes || []).filter(n =>
      visitedNodes.has(n.id) && !n.isTag && !n.path?.startsWith('tags/')
    )

    return { nodes: resultNodes, links: resultLinks }
  })

  return { localGraph, isLoading }
}

/**
 * Get backlinks for a given path (notes that link TO this page).
 */
export function useBacklinks(path: Ref<string> | string) {
  const { graph, isLoading } = useGraphData()
  const pathRef = isRef(path) ? path : ref(path)

  const backlinks = computed(() => {
    if (!graph.value || !pathRef.value) return []

    // Find edges where target is current page
    const incomingEdges = graph.value.edges.filter(e => e.target === pathRef.value)

    // Get source nodes (excluding tag nodes)
    return incomingEdges
      .map(e => graph.value!.nodes.find(n => n.id === e.source))
      .filter((n): n is GraphNode => n !== undefined && !n.isTag)
  })

  return { backlinks, isLoading }
}
