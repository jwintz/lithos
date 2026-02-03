/**
 * Base Config API
 * 
 * Returns parsed base configuration by name
 * Supports fetching raw YAML from Bases/ folder
 */
import { defineEventHandler, createError } from 'h3'
import { readFile } from 'fs/promises'
import { join, resolve } from 'path'
import yaml from 'js-yaml'

export default defineEventHandler(async (event) => {
  const name = event.context.params?.name
  
  if (!name) {
    throw createError({ statusCode: 400, message: 'Base name required' })
  }

  // Clean up the name
  const baseName = name.replace(/\.base$/i, '')
  
  // Try to find the base file
  const vaultPath = resolve(process.cwd(), 'content')
  const possiblePaths = [
    join(vaultPath, 'Bases', `${baseName}.base`),
    join(vaultPath, 'bases', `${baseName}.base`),
    join(vaultPath, `${baseName}.base`),
  ]

  for (const basePath of possiblePaths) {
    try {
      const content = await readFile(basePath, 'utf-8')
      const config = yaml.load(content)
      
      // Add derived fields
      if (typeof config === 'object' && config !== null) {
        const baseConfig = config as Record<string, any>
        if (!baseConfig.title) {
          baseConfig.title = baseName
        }
        return baseConfig
      }
    } catch (e) {
      // Try next path
      continue
    }
  }

  throw createError({ 
    statusCode: 404, 
    message: `Base file not found: ${baseName}` 
  })
})
