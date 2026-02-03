/**
 * Graph API Endpoint
 *
 * Dynamically generates the knowledge graph by:
 * 1. Querying docs collection for nodes
 * 2. Reading raw markdown files to extract wikilinks for edges
 */
import { readdir, readFile } from 'fs/promises'
import { join, resolve } from 'path'

interface GraphNode {
  id: string
  title: string
  path: string
  tags: string[]
  folder: string
  isTag?: boolean
}

interface GraphEdge {
  source: string
  target: string
}

interface Graph {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

const WIKILINK_REGEX = /\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
}

function shouldExclude(path: string): boolean {
  if (path.includes('/.obsidian')) return true
  if (path.endsWith('/.navigation')) return true
  if (path.includes('/.trash')) return true
  return false
}

function extractWikilinks(content: string): string[] {
  const targets: string[] = []
  let match
  const regex = new RegExp(WIKILINK_REGEX.source, 'g')
  while ((match = regex.exec(content)) !== null) {
    targets.push(match[1].trim())
  }
  return targets
}

async function findMdFiles(dir: string, files: string[] = []): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          await findMdFiles(fullPath, files)
        }
      } else if (entry.name.endsWith('.md')) {
        files.push(fullPath)
      }
    }
  } catch (err) {
    // Directory doesn't exist or not readable
  }
  return files
}

function filePathToUrlPath(filePath: string, vaultPath: string): string {
  // Get relative path from vault
  let relativePath = filePath.replace(vaultPath, '')
  
  // Remove .md extension
  relativePath = relativePath.replace(/\.md$/, '')
  
  // Remove numeric prefixes from each segment and lowercase
  const segments = relativePath.split('/').filter(Boolean)
  const cleanSegments = segments.map(s => s.replace(/^\d+\./, '').toLowerCase())
  
  return '/' + cleanSegments.join('/')
}

export default defineEventHandler(async (event) => {
  try {
    // Query docs for nodes
    const docs = await queryCollection(event, 'docs').all()

    const graph: Graph = { nodes: [], edges: [] }
    const pathMap = new Map<string, string>()

    // Build nodes
    for (const doc of docs) {
      if (!doc.path) continue
      if (shouldExclude(doc.path)) continue

      const urlPath = doc.path

      let title = doc.title
      if (!title) {
        const filename = urlPath.split('/').pop() || ''
        title = filename.replace(/^\d+\./, '').replace(/-/g, ' ')
          .replace(/\b\w/g, (c: string) => c.toUpperCase())
      }

      const pathParts = urlPath.split('/').filter(Boolean)
      const folder = pathParts.length > 1 ? pathParts[0] : 'root'
      // Check both top-level and meta for tags (Nuxt Content v3 stores frontmatter in meta)
      const docAny = doc as any
      const tags = Array.isArray(docAny.tags) ? docAny.tags 
        : Array.isArray(docAny.meta?.tags) ? docAny.meta.tags 
        : []

      graph.nodes.push({ id: urlPath, title, path: urlPath, tags, folder, isTag: false })

      // Build path map
      pathMap.set(urlPath, urlPath)
      pathMap.set(normalizeName(title), urlPath)
      const filename = urlPath.split('/').pop() || ''
      if (filename) pathMap.set(normalizeName(filename), urlPath)
    }

    // Create tag nodes and edges from document tags
    const tagSet = new Set<string>()
    for (const node of graph.nodes) {
      if (node.tags && Array.isArray(node.tags) && node.tags.length > 0) {
        for (const tag of node.tags) {
          // Ensure tag is a string
          const tagStr = typeof tag === 'string' ? tag : String(tag)
          if (!tagStr) continue
          tagSet.add(tagStr)
          // Add edge from document to tag
          const tagPath = `tags/${tagStr.toLowerCase()}`
          graph.edges.push({ source: node.path, target: tagPath })
        }
      }
    }
    
    // Create tag nodes
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

    // Read raw markdown files to extract wikilinks
    // Use 'content' directory (which may be symlinked to the actual vault)
    const contentPath = resolve(process.cwd(), 'content')
    const mdFiles = await findMdFiles(contentPath)

    for (const filePath of mdFiles) {
      try {
        const content = await readFile(filePath, 'utf-8')
        const wikilinks = extractWikilinks(content)

        if (wikilinks.length === 0) continue

        const sourceUrlPath = filePathToUrlPath(filePath, contentPath)
        
        // Skip if source not in our nodes
        if (!graph.nodes.some(n => n.path === sourceUrlPath)) continue

        for (const target of wikilinks) {
          const normalizedTarget = normalizeName(target)

          // Try to find target
          let targetUrlPath = pathMap.get(normalizedTarget)

          if (!targetUrlPath) {
            for (const [key, path] of pathMap) {
              if (path.endsWith(`/${normalizedTarget}`) || key.includes(normalizedTarget)) {
                targetUrlPath = path
                break
              }
            }
          }

          if (targetUrlPath && targetUrlPath !== sourceUrlPath) {
            const exists = graph.edges.some(
              e => e.source === sourceUrlPath && e.target === targetUrlPath
            )
            if (!exists) {
              graph.edges.push({ source: sourceUrlPath, target: targetUrlPath })
            }
          }
        }
      } catch (err) {
        // Skip files that can't be read
      }
    }

    return graph
  } catch (error: any) {
    console.error('[api/graph] Error:', error?.message)
    return { nodes: [], edges: [] }
  }
})
