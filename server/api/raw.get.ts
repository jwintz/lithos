import { defineEventHandler, getQuery, createError } from 'h3'
import { join, resolve, normalize } from 'path'
import { readFile, stat } from 'fs/promises'
import { useRuntimeConfig } from 'nitropack/runtime'

/**
 * API Endpoint: Fetch raw file content
 * 
 * Query params:
 * - path: Relative path to the file (e.g., "1.getting-started/index.md")
 * 
 * Security:
 * - Sanitizes path to prevent directory traversal
 * - Restricts access to 'content' and 'vault' directories
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const relativePath = query.path as string

  if (!relativePath) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Path parameter is required'
    })
  }

  // Security: Prevent directory traversal
  // Normalize and remove leading slashes/dots
  const safePath = normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '')
  
  // Resolve absolute path - check both content and vault directories
  // Depending on how content mapping is set up, 'content' might be a symlink to 'vault'
  // or they might be separate. We'll try finding the file in typical locations.
  
  // Try finding file in content directory first (standard Nuxt Content location)
  // useRuntimeConfig().content?.sources? 
  // We'll trust the process.cwd() structure for now based on project exploration
  
  const runtimeConfig = useRuntimeConfig()
  const customVaultPath = runtimeConfig.vaultPath
  const rootDir = process.cwd()
  
  // Candidate paths to check
  const candidateParams = [
    customVaultPath ? join(customVaultPath, safePath) : null,
    join(rootDir, 'content', safePath),
    join(rootDir, 'vault', safePath),
    join(rootDir, safePath)
  ].filter(Boolean) as string[]
  
  let filePath = ''
  let fileFound = false

  // Also resolve the custom vault path for validation
  const resolvedVaultPath = customVaultPath ? resolve(customVaultPath) : null
  const resolvedContentDir = resolve(rootDir, 'content')
  const resolvedVaultDir = resolve(rootDir, 'vault')

  for (const candidate of candidateParams) {
    try {
      // Resolve to actual path (follows symlinks)
      const resolved = resolve(candidate)
      
      // Security: Check if resolved path is within allowed directories
      // Allow: customVaultPath, content/, vault/, or rootDir
      const isAllowed = (
        (resolvedVaultPath && resolved.startsWith(resolvedVaultPath)) ||
        resolved.startsWith(resolvedContentDir) ||
        resolved.startsWith(resolvedVaultDir) ||
        resolved.startsWith(rootDir)
      )
      
      if (!isAllowed) {
        continue
      }
      
      const stats = await stat(resolved)
      if (stats.isFile()) {
        filePath = resolved
        fileFound = true
        break
      }
    } catch (e) {
      // Ignore errors, verify next candidate
    }
  }


  if (!fileFound) {
    throw createError({
      statusCode: 404,
      statusMessage: `File not found: ${safePath}`
    })
  }

  try {
    const content = await readFile(filePath, 'utf-8')
    return { content }
  } catch (error) {
    console.error('Failed to read file:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to read file content'
    })
  }
})
