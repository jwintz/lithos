import { defineNuxtModule, createResolver, addServerHandler } from '@nuxt/kit'
import { writeFile, mkdir } from 'fs/promises'
import { join, dirname } from 'path'
import { extractedLinks, permalinkMap } from './obsidian-transform'

/**
 * Obsidian Graph Module
 *
 * Uses extracted links from obsidian-transform to build a graph.json
 * file for client-side visualization.
 *
 * Graph structure:
 * {
 *   nodes: [{ id, title, path, tags, folder }],
 *   edges: [{ source, target }]
 * }
 */

export interface GraphNode {
  id: string
  title: string
  path: string
  tags: string[]
  folder: string
  isTag?: boolean
}

export interface GraphEdge {
  source: string
  target: string
}

export interface Graph {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export default defineNuxtModule({
  meta: {
    name: 'obsidian-graph',
    configKey: 'obsidianGraph'
  },

  defaults: {
    enabled: true,
    outputPath: 'public/graph.json'
  },

  setup(options, nuxt) {
    if (!options.enabled) return

    const resolver = createResolver(import.meta.url)

    // Build the graph during content processing
    const graph: Graph = {
      nodes: [],
      edges: []
    }

    // Map of normalized name -> URL path for link resolution
    const pathMap = new Map<string, string>()

    // Normalize a name to a path-like string
    function normalizeName(name: string): string {
      return name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
    }

    /**
     * Convert filesystem/content path to URL path
     * e.g., "/Users/.../content/1.getting-started/2.introduction.md" -> "/getting-started/introduction"
     * or "1.getting-started/2.introduction" -> "/getting-started/introduction"
     */
    function toUrlPath(filePath: string): string {
      // Extract just the content-relative path
      let contentPath = filePath

      // Remove absolute path prefix if present
      const contentIndex = filePath.indexOf('/content/')
      if (contentIndex !== -1) {
        contentPath = filePath.slice(contentIndex + '/content'.length)
      }

      // Also handle .nuxt/content-assets path
      const assetsIndex = filePath.indexOf('/content-assets/')
      if (assetsIndex !== -1) {
        contentPath = filePath.slice(assetsIndex + '/content-assets'.length)
      }

      // Remove .md extension (including shadow .md for assets)
      contentPath = contentPath.replace(/\.md$/, '')

      // Remove numeric prefixes from each path segment (e.g., "1.getting-started" -> "getting-started")
      const segments = contentPath.split('/').filter(Boolean)
      const cleanSegments = segments.map(seg => seg.replace(/^\d+\./, ''))

      // Build final URL path
      return '/' + cleanSegments.join('/').toLowerCase()
    }

    // Hook: Process each file to build graph nodes
    // In Nuxt Content v3, the hook receives the file object directly
    nuxt.hook('content:file:afterParse', (ctx: any) => {
      // Nuxt Content v3 passes { file, content, collection }
      const content = ctx.content || ctx
      const fileInfo = ctx.file || {}
      
      // Get extension from file info or content
      const ext = fileInfo.extension || content.extension || content._extension || ''
      
      // Only process markdown files
      if (ext !== '.md' && ext !== 'md') return

      // Get path from content (the parsed document)
      const urlPath = content.path || content._path || ''
      if (!urlPath) return
      
      // Get raw file path for mapping
      const rawPath = fileInfo.path || content.id || urlPath

      // Get title from frontmatter, falling back to cleaned filename
      let title = ''
      if (content.title) {
        title = content.title
      } else if (content.meta?.title) {
        title = content.meta.title
      } else {
        // Extract filename and clean it
        const filename = urlPath.split('/').pop() || ''
        // Remove numeric prefix and convert to title case
        title = filename
          .replace(/^\d+\./, '')
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (c: string) => c.toUpperCase())
      }

      // Get tags
      const tags = content.tags || content.meta?.tags || []

      // Extract folder from URL path
      const pathParts = urlPath.split('/').filter(Boolean)
      const folder = pathParts.length > 1 ? pathParts[0] : 'root'

      // Create node with URL path as ID (avoid duplicates)
      const existingNode = graph.nodes.find(n => n.id === urlPath)
      if (!existingNode) {
        const node: GraphNode = {
          id: urlPath,
          title,
          path: urlPath,
          tags: Array.isArray(tags) ? tags : [],
          folder: folder
        }
        graph.nodes.push(node)
      }

      // Map URL path to itself
      pathMap.set(urlPath, urlPath)

      // Map by normalized title
      pathMap.set(normalizeName(title), urlPath)

      // Map by filename (without numeric prefix)
      const filename = rawPath.split('/').pop()?.replace(/\.md$/, '').replace(/^\d+\./, '') || ''
      if (filename) {
        pathMap.set(normalizeName(filename), urlPath)
      }

      // Map by full relative path (folder/name)
      // e.g., "getting-started/introduction" -> "/getting-started/introduction"
      const relativePath = urlPath.startsWith('/') ? urlPath.slice(1) : urlPath
      if (relativePath) {
        pathMap.set(normalizeName(relativePath), urlPath)
      }

      // Also map the raw file path to URL path for edge resolution
      pathMap.set(rawPath, urlPath)

      // Map aliases
      const aliases = content.aliases || content.meta?.aliases || []
      if (Array.isArray(aliases)) {
        aliases.forEach((alias: string) => {
          pathMap.set(normalizeName(alias), urlPath)
        })
      }
    })

    // Function to build and write graph
    async function buildGraph() {
      // Small delay to ensure content module has processed all files
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Clear edges and tag nodes from previous builds (document nodes persist from afterParse hook)
      graph.edges = []
      graph.nodes = graph.nodes.filter(n => !n.isTag)

      console.log(`[obsidian-graph] Building graph... (${graph.nodes.length} nodes registered, ${extractedLinks.size} files with links)`)

      // Use links extracted by obsidian-transform module
      for (const [rawSourcePath, linkTargets] of extractedLinks) {
        // Convert source path to URL path
        const sourceUrlPath = pathMap.get(rawSourcePath) || toUrlPath(rawSourcePath)

        for (const linkTarget of linkTargets) {
          const normalizedTarget = normalizeName(linkTarget)

          // Try to find target URL path
          let targetUrlPath = pathMap.get(normalizedTarget)
          
          // Fallback: Check permalinkMap from obsidian-transform
          if (!targetUrlPath) {
             const mappedRawPath = permalinkMap.get(linkTarget.toLowerCase())
             if (mappedRawPath) {
                 targetUrlPath = pathMap.get(mappedRawPath) || toUrlPath(mappedRawPath)
             }
          }

          // Also try partial path matching if still not found
          if (!targetUrlPath) {
            for (const [key, urlPath] of pathMap) {
              if (urlPath.endsWith(`/${normalizedTarget}`) ||
                  key.includes(normalizedTarget)) {
                targetUrlPath = urlPath
                break
              }
            }
          }

          if (targetUrlPath && targetUrlPath !== sourceUrlPath) {
            // Avoid duplicate edges
            const exists = graph.edges.some(
              e => e.source === sourceUrlPath && e.target === targetUrlPath
            )
            if (!exists) {
              graph.edges.push({
                source: sourceUrlPath,
                target: targetUrlPath
              })
            }
          }
        }
      }

      // Create tag nodes and document-to-tag edges
      const tagSet = new Set<string>()
      for (const node of graph.nodes) {
        if (node.tags && Array.isArray(node.tags) && node.tags.length > 0) {
          for (const tag of node.tags) {
            const tagStr = typeof tag === 'string' ? tag : String(tag)
            if (!tagStr) continue
            tagSet.add(tagStr)
            const tagPath = `tags/${tagStr.toLowerCase()}`
            graph.edges.push({ source: node.path, target: tagPath })
          }
        }
      }
      for (const tag of tagSet) {
        const tagPath = `tags/${tag.toLowerCase()}`
        graph.nodes.push({
          id: tagPath,
          title: `#${tag}`,
          path: tagPath,
          tags: [],
          folder: 'tags',
          isTag: true
        })
      }

      // Filter edges to only include those where both source and target nodes exist
      const nodeIds = new Set(graph.nodes.map(n => n.id))
      const validEdges = graph.edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target))
      const invalidEdgeCount = graph.edges.length - validEdges.length
      if (invalidEdgeCount > 0) {
        console.log(`[obsidian-graph] Filtered out ${invalidEdgeCount} edges with missing nodes`)
      }
      graph.edges = validEdges

      // Write graph to public folder
      const outputPath = join(nuxt.options.rootDir, options.outputPath)
      await mkdir(dirname(outputPath), { recursive: true })
      await writeFile(outputPath, JSON.stringify(graph, null, 2))

      console.log(`[obsidian-graph] Generated graph with ${graph.nodes.length} nodes and ${graph.edges.length} edges`)
    }

    // Hook: Call buildGraph on ready (dev) and build:done (generate)
    nuxt.hook('ready', () => buildGraph())
    nuxt.hook('build:done', () => buildGraph())

    // Add API route for runtime graph access
    addServerHandler({
      route: '/api/graph',
      handler: resolver.resolve('./runtime/graph-handler.ts')
    })
  }
})
