import { defineNuxtModule } from '@nuxt/kit'
import yaml from 'js-yaml'

/**
 * Obsidian Bases Module
 *
 * Processes `.base` files (YAML) as special content types that define
 * structured views (table, cards, calendar) over filtered notes.
 */

export interface BaseConfig {
  title?: string
  order?: number
  source?: string
  filters?: Record<string, any>
  views?: BaseView[]
  properties?: Record<string, PropertyConfig>
  formulas?: Formula[]
}

export interface BaseView {
  type: 'table' | 'cards' | 'list' | 'calendar'
  name: string
  sort?: { property: string; direction: 'ASC' | 'DESC' }[]
  columns?: string[]
  order?: string[]
  groupBy?: string
  image?: string
  columnSize?: Record<string, number>
}

export interface PropertyConfig {
  type: 'text' | 'number' | 'date' | 'checkbox' | 'select' | 'multiselect' | 'url'
  displayName?: string
  options?: string[]
  formula?: string
}

export interface Formula {
  name: string
  formula: string
  type?: 'text' | 'number' | 'date'
}

// Store parsed bases globally for runtime access
export const parsedBases = new Map<string, BaseConfig>()

export default defineNuxtModule({
  meta: {
    name: 'obsidian-bases',
    configKey: 'obsidianBases'
  },

  defaults: {
    enabled: true
  },

  setup(options, nuxt) {
    if (!options.enabled) return

    // Process .base files before parsing
    nuxt.hook('content:file:beforeParse', (ctx: any) => {
      const file = ctx.file
      const ext = file.extension || file._extension || ''
      const filePath = file.path || file._file || ''

      // Only process .base files
      if (ext !== '.base' && !filePath.endsWith('.base')) return

      try {
        // Parse YAML content
        const baseConfig = yaml.load(file.body) as BaseConfig

        // Derive title from filename if not provided
        const filename = filePath.split('/').pop()?.replace('.base', '') || 'Untitled'
        if (!baseConfig.title) {
          baseConfig.title = filename
        }

        // Store by multiple keys for lookup
        const baseName = filename.toLowerCase()
        parsedBases.set(baseName, baseConfig)
        parsedBases.set(filePath.toLowerCase(), baseConfig)
        
        // Also store without Bases/ prefix
        const shortPath = filePath.replace(/^\/?(bases\/)?/i, '').toLowerCase()
        parsedBases.set(shortPath, baseConfig)

        console.log(`[obsidian-bases] Parsed: ${filename} (${baseConfig.views?.length || 0} views)`)

        // Transform to markdown with MDC component
        file.body = generateBaseMarkdown(baseConfig, filename)
        // Keep track of original extension for isBaseFile detection
        file._originalExtension = file.extension
        file.extension = '.md'

      } catch (error) {
        console.error(`[obsidian-bases] Error parsing ${filePath}:`, error)
      }
    })

    // Make bases available at runtime via virtual module
    nuxt.hook('nitro:config', (config) => {
      config.virtual = config.virtual || {}
      config.virtual['#obsidian-bases'] = () => {
        const basesObj: Record<string, BaseConfig> = {}
        for (const [key, value] of parsedBases) {
          basesObj[key] = value
        }
        return `export const bases = ${JSON.stringify(basesObj)}`
      }
    })

    // Log summary
    nuxt.hook('ready', () => {
      console.log(`[obsidian-bases] Loaded ${parsedBases.size} base configurations`)
    })
  }
})

/**
 * Generate markdown content from base config
 */
function generateBaseMarkdown(config: BaseConfig, filename: string): string {
  const title = config.title || filename

  // Serialize config for the component - use base64 to avoid quote escaping issues
  const configObj = {
    source: config.source || '',
    filters: config.filters || {},
    views: config.views || [{ type: 'table', name: 'Table' }],
    properties: config.properties || {},
    formulas: config.formulas || []
  }
  
  // Base64 encode the JSON to avoid any quote/escape issues in YAML
  const configBase64 = Buffer.from(JSON.stringify(configObj)).toString('base64')

  const orderStr = config.order !== undefined ? `\norder: ${config.order}` : ''

  // Note: We don't include an H1 here because:
  // 1. The page template already renders the title from frontmatter
  // 2. The ObsidianBase component has its own collapsible header
  return `---
title: ${title}${orderStr}
---

::obsidian-base
---
configBase64: ${configBase64}
---
::
`
}
