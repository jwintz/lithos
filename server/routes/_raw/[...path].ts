import { defineEventHandler, createError, sendStream, setResponseHeader } from 'h3'
import { join, extname } from 'path'
import { createReadStream, existsSync, statSync } from 'fs'
import { minimatch } from 'minimatch'

/**
 * Middleware to serve raw vault files at /_raw/**
 * Respects .lithosignore patterns from runtime config
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const vaultPath = config.vaultPath as string | undefined

  const ignorePatterns = config.ignorePatterns || []
  
  // Get the file path from the route
  const path = event.path?.replace(/^\/_raw\//, '') || ''
  
  if (!path) {
    throw createError({ statusCode: 400, statusMessage: 'No path provided' })
  }
  
  // Security: prevent directory traversal
  const normalizedPath = path.replace(/\.\./g, '').replace(/\/\//g, '/')
  
  // Check against ignore patterns
  for (const pattern of ignorePatterns) {
    if (minimatch(normalizedPath, pattern, { matchBase: true })) {
      throw createError({ statusCode: 404, statusMessage: 'Not found' })
    }
  }
  
  // Find file in vault or content directory
  const candidates = [
    vaultPath ? join(vaultPath, normalizedPath) : null,
    join(process.cwd(), 'content', normalizedPath),
    join(process.cwd(), 'vault', normalizedPath)
  ].filter(Boolean) as string[]
  
  let filePath: string | null = null
  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isFile()) {
      filePath = candidate
      break
    }
  }
  
  if (!filePath) {
    throw createError({ statusCode: 404, statusMessage: 'File not found' })
  }
  
  // Set content type based on extension
  const ext = extname(filePath).toLowerCase()
  const mimeTypes: Record<string, string> = {
    '.md': 'text/markdown; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
    '.json': 'application/json',
    '.yaml': 'text/yaml',
    '.yml': 'text/yaml',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.bmp': 'image/bmp',
    '.js': 'application/javascript',
    '.ts': 'text/typescript',
    '.html': 'text/html'
  }
  
  setResponseHeader(event, 'Content-Type', mimeTypes[ext] || 'text/plain; charset=utf-8')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=3600')
  
  return sendStream(event, createReadStream(filePath))
})
