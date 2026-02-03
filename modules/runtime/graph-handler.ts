import { defineEventHandler } from 'h3'
import { readFile } from 'fs/promises'
import { join } from 'path'

/**
 * API handler for serving the graph data at runtime
 * Returns static graph.json file, client falls back to dynamic generation
 */
export default defineEventHandler(async (event) => {
  try {
    const graphPath = join(process.cwd(), 'public/graph.json')
    const graphData = await readFile(graphPath, 'utf-8')
    const parsed = JSON.parse(graphData)
    if (parsed.nodes && parsed.nodes.length > 0) {
      return parsed
    }
  } catch (error) {
    // File not available, return empty and let client generate
  }

  // Return empty - client will fallback to dynamic generation
  return { nodes: [], edges: [] }
})
